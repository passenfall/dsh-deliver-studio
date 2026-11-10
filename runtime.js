/* Deliver Studio · 页面内运行时（iframe 与无头浏览器共用）
 * - window.__deliverQA(options) → { version, stats, issues }
 * - 在 iframe 中：与父窗口用 postMessage 通信（选择 · Ask AI、定位、QA）
 * 纯浏览器脚本，无依赖；不访问父页面，只发送结构化数据。 */
(function () {
  'use strict'
  if (window.__deliverRuntime) return
  window.__deliverRuntime = true
  var VERSION = 1
  var TAG = '__deliverStudio'
  var CJK = /[\u3400-\u9fff\uf900-\ufaff]/
  var CJK_G = /[\u3400-\u9fff\uf900-\ufaff]/g

  // ── 工具 ────────────────────────────────────────────
  function cssEscape(s) { return (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&') }
  function cssPath(el) {
    if (!el || el.nodeType !== 1) return ''
    if (el.id && document.querySelectorAll('#' + cssEscape(el.id)).length === 1) return '#' + cssEscape(el.id)
    var parts = []
    var cur = el
    while (cur && cur.nodeType === 1 && cur !== document.documentElement) {
      if (cur.id && document.querySelectorAll('#' + cssEscape(cur.id)).length === 1) { parts.unshift('#' + cssEscape(cur.id)); break }
      var name = cur.localName
      var cls = Array.prototype.filter.call(cur.classList || [], function (c) { return !/^__ds/.test(c) && /^[a-zA-Z_-][\w-]*$/.test(c) }).slice(0, 2)
      var part = name + (cls.length ? '.' + cls.map(cssEscape).join('.') : '')
      var parent = cur.parentElement
      if (parent) {
        var same = Array.prototype.filter.call(parent.children, function (c) { return c.localName === name })
        if (same.length > 1) part += ':nth-of-type(' + (same.indexOf(cur) + 1) + ')'
      }
      parts.unshift(part)
      if (name === 'body') break
      cur = parent
    }
    return parts.join(' > ')
  }
  function visible(el) {
    var cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false
    var r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  }
  function ownText(el) {
    var s = ''
    for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3) s += n.nodeValue
    return s.replace(/\s+/g, ' ').trim()
  }
  function clip(s, n) { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s }
  function parseColor(c) {
    var m = /rgba?\(([^)]+)\)/.exec(c || '')
    if (!m) return null
    var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number)
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }
  }
  function lum(c) {
    function ch(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
    return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b)
  }
  function blend(top, bottom) {
    var a = top.a
    return { r: top.r * a + bottom.r * (1 - a), g: top.g * a + bottom.g * (1 - a), b: top.b * a + bottom.b * (1 - a), a: 1 }
  }
  function effectiveBg(el) {
    var layers = []
    for (var cur = el; cur && cur.nodeType === 1; cur = cur.parentElement) {
      var cs = getComputedStyle(cur)
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null
      var c = parseColor(cs.backgroundColor)
      if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break }
    }
    var base = { r: 255, g: 255, b: 255, a: 1 }
    for (var i = layers.length - 1; i >= 0; i--) base = blend(layers[i], base)
    return base
  }
  function hex(c) { return '#' + [c.r, c.g, c.b].map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2) }).join('') }

  // ── QA ─────────────────────────────────────────────
  var DEFAULT_BANNED = ['TODO', 'TBD', 'FIXME', '待补充', '此处替换', 'Lorem ipsum']
  // 正文引用：中文「如/见/参见/详见/参考/据 图|表 N」；英文「see / in / cf. / refer to / according to Figure|Fig.|Table N」与「(Figure N)」「(see Table N)」
  // 每处引用只匹配一次（同一位置的「(see …)」走括号分支，不会再被 see 分支重复匹配）
  var REF_RES = [
    /(?:如|见|参见|详见|参考|据)\s*(图|表)\s*([0-9]+)/g,
    /(?:\b(?:see|in|cf\.?|refer\s+to|according\s+to)\s+|\(\s*(?:see\s+)?)(Figures?|Figs?\.?|Tables?)\s*([0-9]+)/gi,
  ]
  // 行内元素前面紧跟这些引导词时，它是引用（「见<a>图2</a>」「see <a>Fig. 2</a>」），不是图注
  var REF_LEAD = /(?:如|见|参见|详见|参考|据|\bsee|\bin|\bcf\.?|\brefer\s+to|\baccording\s+to|\(\s*(?:see)?)\s*$/i
  function refKind(word) { return /^(表|tab)/i.test(word) ? '表' : '图' }
  function textBefore(el) {
    var s = ''
    for (var n = el.previousSibling; n && s.length < 40; n = n.previousSibling) s = (n.textContent || '') + s
    return s.slice(-40)
  }

  function qa(options) {
    options = options || {}
    var issues = []
    var seq = 0
    function add(cat, level, title, detail, el, fix, extra) {
      var it = { id: 'q' + (++seq), cat: cat, level: level, title: title, detail: detail || '', selector: el ? cssPath(el) : '', fix: fix || '' }
      if (extra) for (var k in extra) it[k] = extra[k]
      issues.push(it)
      return it
    }
    var body = document.body
    if (!body) return { version: VERSION, stats: {}, issues: [] }
    var all = Array.prototype.slice.call(body.querySelectorAll('*'), 0, 8000).filter(function (el) { return !(el.className && String(el.className).indexOf('__ds') === 0) && !el.closest('[data-deliver-overlay]') })
    var textEls = all.filter(function (el) { return !/^(script|style|noscript|template|svg|path|defs)$/.test(el.localName) && ownText(el).length > 0 && visible(el) })

    // 1) 编号：图 / 表 连续、正文引用存在
    var capRe = /^\s*(图|表|Figure|Fig\.?|Table)\s*([0-9]+)/i
    var caps = { 图: [], 表: [] }
    var capEls = []
    var inlineRefs = []
    all.forEach(function (el) {
      if (!visible(el)) return
      var t = (el.innerText || '').trim()
      if (!t || t.length > 140) return
      var m = capRe.exec(t)
      if (!m) return
      if (el.querySelector && Array.prototype.some.call(el.children, function (c) { return capRe.test((c.innerText || '').trim()) })) return
      var kind = refKind(m[1])
      // 行内引用不算图注，交给下面的引用检查（避免同一处既算图注又算引用）
      if (getComputedStyle(el).display === 'inline' && REF_LEAD.test(textBefore(el))) { inlineRefs.push({ kind: kind, n: Number(m[2]), el: el, text: (el.parentElement && el.parentElement.innerText) || t }); return }
      caps[kind].push({ n: Number(m[2]), el: el, text: t })
      capEls.push(el)
    })
    ;['图', '表'].forEach(function (kind) {
      // 角标「Fig. 3」与图注「Fig. 3 — …」相邻出现时只算一次
      var list = caps[kind].filter(function (c, i, arr) { return !(i > 0 && arr[i - 1].n === c.n && (c.text.length <= 10 || arr[i - 1].text.length <= 10)) })
      caps[kind] = list
      var seen = {}
      list.forEach(function (c, i) {
        var expect = i === 0 ? 1 : list[i - 1].n + 1
        if (seen[c.n]) add('numbering', 'must', kind + c.n + ' 重复编号', '「' + clip(c.text, 40) + '」与前面的' + kind + c.n + '重复', c.el, '按出现顺序重新编号')
        else if (c.n !== expect) add('numbering', 'must', kind + '编号不连续：应为' + kind + expect + '，实际是' + kind + c.n, '「' + clip(c.text, 40) + '」', c.el, '按出现顺序从' + kind + '1 开始连续编号，并同步正文里的引用')
        seen[c.n] = true
      })
    })
    var refSeen = {}
    function checkRef(kind, n, el, t) {
      if (caps[kind].some(function (c) { return c.n === n }) || refSeen[kind + n]) return
      refSeen[kind + n] = true
      add('numbering', 'must', '正文引用了' + kind + n + '，但页面里没有' + kind + n, '「' + clip(t, 50) + '」', el, '核对引用编号，或补上对应的' + kind)
    }
    textEls.forEach(function (el) {
      if (capEls.indexOf(el) >= 0) return
      var t = ownText(el)
      REF_RES.forEach(function (re) {
        var m
        re.lastIndex = 0
        while ((m = re.exec(t))) checkRef(refKind(m[1]), Number(m[2]), el, t)
      })
    })
    inlineRefs.forEach(function (r) { checkRef(r.kind, r.n, r.el, r.text) })

    // 2) 文本：孤字、截断、横向溢出、超长行
    var orphanCount = 0
    var blockSel = /^(p|li|h[1-6]|td|th|figcaption|dd|dt|blockquote|div|span|a|label|caption)$/
    textEls.forEach(function (el) {
      if (orphanCount >= 40 || !blockSel.test(el.localName)) return
      var cs = getComputedStyle(el)
      if (cs.display === 'inline' || cs.whiteSpace === 'nowrap') return
      var txt = (el.innerText || '').replace(/\s+/g, '')
      if (txt.length < 6) return
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      var nodes = []
      for (var n = walker.nextNode(); n; n = walker.nextNode()) if (n.nodeValue.trim()) nodes.push(n)
      if (!nodes.length) return
      var range = document.createRange()
      var lastTop = null, firstTop = null, count = 0, done = false
      try {
        range.setStart(nodes[0], 0); range.setEnd(nodes[0], 1)
        var fr = range.getClientRects()[0]; firstTop = fr ? fr.top : null
        for (var i = nodes.length - 1; i >= 0 && !done; i--) {
          var v = nodes[i].nodeValue
          for (var j = v.length - 1; j >= 0; j--) {
            if (/\s/.test(v[j])) continue
            range.setStart(nodes[i], j); range.setEnd(nodes[i], j + 1)
            var r = range.getClientRects()[0]
            if (!r) continue
            if (lastTop === null) { lastTop = r.top; count = 1; continue }
            if (Math.abs(r.top - lastTop) < Math.max(2, r.height * 0.4)) { count++; if (count > 3) { done = true; break } } else { done = true; break }
          }
        }
      } catch (e) { return }
      if (lastTop === null || firstTop === null || count > 2 || Math.abs(lastTop - firstTop) < 2) return
      orphanCount++
      var tail = txt.slice(-count)
      add('text', /^h[1-6]$/.test(el.localName) ? 'must' : 'must', (/^h[1-6]$/.test(el.localName) ? '标题' : '段落') + '末行只剩「' + tail + '」', '「…' + clip(txt.slice(-24), 26) + '」最后一行只有 ' + count + ' 个字', el, '精简几个字、调整字号/字距，或给该元素加 text-wrap: pretty')
    })
    var docW = document.documentElement.scrollWidth, winW = window.innerWidth
    if (docW > winW + 2) {
      var offenders = all.filter(function (el) { var r = el.getBoundingClientRect(); return r.right > winW + 2 && r.width > 0 && visible(el) })
      var outer = offenders.filter(function (el) { return offenders.indexOf(el.parentElement) < 0 })
      var canvas = outer.find(function (el) { return (el.parentElement === body || el === body) && el.getBoundingClientRect().width > winW && /px$/.test(getComputedStyle(el).width) && (el.style.width || /^\d/.test(getComputedStyle(el).minWidth) || el.getBoundingClientRect().width >= winW * 1.05) })
      if (canvas) add('layout', 'hint', '固定宽度画布 ' + Math.round(canvas.getBoundingClientRect().width) + 'px', '页面按固定宽度设计（海报/长图），当前视口 ' + winW + 'px 需要横向滚动', canvas, '确认这是预期的画布尺寸；导出 PDF 时会按纸张缩放')
      else add('text', 'must', '页面横向溢出 ' + (docW - winW) + 'px', '视口宽 ' + winW + 'px，内容宽 ' + docW + 'px', outer[0] || null, '检查固定宽度、长单词和图片的 max-width')
    }
    var clipCount = 0
    all.forEach(function (el) {
      if (clipCount >= 15 || !visible(el)) return
      var cs = getComputedStyle(el)
      var clipX = cs.overflowX === 'hidden' || cs.overflowX === 'clip'
      var clipY = cs.overflowY === 'hidden' || cs.overflowY === 'clip'
      var ellipsis = cs.textOverflow === 'ellipsis' || Number(cs.webkitLineClamp) > 0
      if (!clipX && !clipY && !ellipsis) return
      // 只看自身直接承载文字的元素（容器里装饰性大字溢出不算）
      if (!ownText(el)) return
      if ((clipX || ellipsis) && el.scrollWidth > el.clientWidth + 2 || (clipY || ellipsis) && el.scrollHeight > el.clientHeight + 3) {
        clipCount++
        add('text', 'must', '文字被截断', '「' + clip(el.innerText, 40) + '」容器 ' + el.clientWidth + '×' + el.clientHeight + '，内容 ' + el.scrollWidth + '×' + el.scrollHeight, el, '放宽容器或精简文字，避免 overflow:hidden 吞字')
      }
    })
    var longCount = 0
    textEls.forEach(function (el) {
      if (longCount >= 5 || el.localName !== 'p') return
      var fs = parseFloat(getComputedStyle(el).fontSize) || 16
      var w = el.getBoundingClientRect().width
      if (w / fs > 48 && (el.innerText || '').length > 120) { longCount++; add('text', 'hint', '行宽过长（约 ' + Math.round(w / fs) + ' 字/行）', '正文每行超过 48 个字，阅读吃力', el, '给正文容器设置 max-width（约 36–42em）') }
    })

    // 3) 版式：A4/幻灯片页面的留白与溢出
    var pages = all.filter(function (el) {
      if (!visible(el)) return false
      var r = el.getBoundingClientRect()
      if (r.width < 280 || r.height < 300) return false
      var ratio = r.height / r.width
      var cs = getComputedStyle(el)
      var named = /(^|[\s_-])(page|sheet|slide|a4|paper|poster)([\s_-]|$)/i.test(el.className && typeof el.className === 'string' ? el.className : '')
      var fixed = cs.overflow === 'hidden' || cs.overflowY === 'hidden' || cs.overflow === 'clip'
      var breaks = cs.breakAfter === 'page' || cs.pageBreakAfter === 'always' || cs.breakBefore === 'page' || cs.pageBreakBefore === 'always'
      var a4 = Math.abs(ratio - 1.4142) < 0.06
      var slide = Math.abs(ratio - 0.5625) < 0.03 && named
      return (named && (fixed || breaks || a4)) || (a4 && r.width >= 700 && r.width <= 900) || slide || (breaks && r.height > 400)
    })
    pages = pages.filter(function (p) { return !pages.some(function (q) { return q !== p && q.contains(p) }) })
    pages.forEach(function (p, i) {
      var pr = p.getBoundingClientRect()
      var cs = getComputedStyle(p)
      var padT = parseFloat(cs.paddingTop) || 0, padB = parseFloat(cs.paddingBottom) || 0
      var bottom = pr.top + padT, overflow = 0
      Array.prototype.forEach.call(p.querySelectorAll('*'), function (d) {
        if (!visible(d)) return
        var hasContent = ownText(d) || /^(img|svg|canvas|video|table)$/.test(d.localName)
        if (!hasContent) return
        var r = d.getBoundingClientRect()
        if (r.bottom > bottom) bottom = r.bottom
        if (r.bottom > pr.bottom + 2) overflow = Math.max(overflow, r.bottom - pr.bottom)
      })
      var usable = pr.height - padT - padB
      var fill = usable > 0 ? (bottom - pr.top - padT) / usable : 1
      var label = '第' + (i + 1) + '页'
      if (overflow > 0) add('layout', 'must', label + '内容溢出页面 ' + Math.round(overflow) + 'px', '导出 PDF 时会被裁掉或挤到下一页', p, '精简内容、缩小图表或拆页', { page: i + 1 })
      else if (fill < 0.65) add('layout', fill < 0.5 ? 'must' : 'hint', label + '留白 ' + Math.round((1 - fill) * 100) + '%', '内容只占可用高度的 ' + Math.round(fill * 100) + '%', p, '补充内容、放大图表，或与相邻页合并', { page: i + 1 })
      var heads = p.querySelectorAll('h1,h2,h3,h4')
      if (heads.length) {
        var last = heads[heads.length - 1], lr = last.getBoundingClientRect()
        if (lr.top > pr.bottom - usable * 0.15 && lr.bottom <= pr.bottom && Math.abs(lr.bottom - bottom) < 4) add('layout', 'hint', label + '标题落在页底', '「' + clip(last.innerText, 30) + '」后面没有正文', last, '把标题移到下一页或在前面压缩内容', { page: i + 1 })
      }
    })

    // 4) 视觉：对比度、字体与字号种类
    var pairs = {}
    textEls.forEach(function (el) {
      var cs = getComputedStyle(el)
      var fg = parseColor(cs.color)
      if (!fg) return
      var bg = effectiveBg(el)
      if (!bg) return
      var f = fg.a < 1 ? blend(fg, bg) : fg
      var l1 = lum(f), l2 = lum(bg)
      var ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
      var size = parseFloat(cs.fontSize) || 16
      var bold = Number(cs.fontWeight) >= 700
      var large = size >= 24 || (bold && size >= 18.66)
      var need = large ? 3 : 4.5
      if (ratio >= need) return
      var key = hex(f) + '/' + hex(bg) + '/' + (large ? 'L' : 'N')
      if (!pairs[key]) pairs[key] = { ratio: ratio, need: need, el: el, n: 0, fg: hex(f), bg: hex(bg) }
      pairs[key].n++
    })
    Object.keys(pairs).slice(0, 15).forEach(function (k) {
      var p = pairs[k]
      add('visual', p.ratio < 3 ? 'must' : 'hint', '对比度不足 ' + p.ratio.toFixed(2) + ':1（需 ≥' + p.need + '）', '文字 ' + p.fg + ' 在背景 ' + p.bg + ' 上，共 ' + p.n + ' 处，如「' + clip(p.el.innerText, 24) + '」', p.el, '加深文字或调浅背景，使对比度达到 WCAG AA')
    })
    var fams = {}, sizes = {}
    textEls.forEach(function (el) {
      var cs = getComputedStyle(el)
      var fam = (cs.fontFamily || '').split(',')[0].replace(/["']/g, '').trim().toLowerCase()
      fams[fam] = (fams[fam] || 0) + 1
      sizes[Math.round(parseFloat(cs.fontSize))] = (sizes[Math.round(parseFloat(cs.fontSize))] || 0) + 1
    })
    var famList = Object.keys(fams)
    if (famList.length > 3) add('visual', 'hint', '字体种类过多（' + famList.length + ' 种）', famList.slice(0, 6).join('、'), null, '正文、标题、数字各用一种字体即可')
    var sizeList = Object.keys(sizes).map(Number).sort(function (a, b) { return a - b })
    if (sizeList.length > 8) add('visual', 'hint', '字号种类过多（' + sizeList.length + ' 种）', sizeList.join(' / ') + ' px', null, '收敛到 5–6 级字号')

    // 5) 资源：图片失败、拉伸、分辨率；页内锚点
    Array.prototype.forEach.call(document.images, function (img) {
      if (!visible(img)) return
      if (img.complete && img.naturalWidth === 0) { add('asset', 'must', '图片加载失败', img.getAttribute('src') ? clip(img.getAttribute('src'), 60) : '(无 src)', img, '检查图片路径；导出 PDF 前必须能加载'); return }
      if (!img.naturalWidth) return
      var r = img.getBoundingClientRect()
      var fit = getComputedStyle(img).objectFit
      var dr = r.width / r.height, nr = img.naturalWidth / img.naturalHeight
      if ((fit === 'fill' || !fit) && Math.abs(dr - nr) / nr > 0.05) add('asset', 'must', '图片被拉伸 ' + Math.round(Math.abs(dr - nr) / nr * 100) + '%', '显示 ' + Math.round(r.width) + '×' + Math.round(r.height) + '，原图 ' + img.naturalWidth + '×' + img.naturalHeight, img, '只固定宽或高，另一边用 auto，或用 object-fit: contain')
      else if (img.naturalWidth < r.width * 1.5 && r.width > 240) add('asset', 'hint', '图片分辨率偏低', '显示宽 ' + Math.round(r.width) + 'px，原图仅 ' + img.naturalWidth + 'px，打印会发糊', img, '换用至少 2 倍尺寸的图片')
    })
    var deadSeen = {}
    Array.prototype.forEach.call(document.querySelectorAll('a[href^="#"]'), function (a) {
      var id = decodeURIComponent(a.getAttribute('href').slice(1))
      if (!id || deadSeen[id]) return
      if (!document.getElementById(id) && !document.getElementsByName(id).length) { deadSeen[id] = true; add('asset', 'hint', '页内链接指向不存在的位置 #' + clip(id, 30), '「' + clip(a.innerText, 30) + '」', a, '核对目录锚点与标题 id') }
    })

    // 6) 交付规范：禁用字样、字数
    var banned = (options.bannedWords && options.bannedWords.length ? options.bannedWords : DEFAULT_BANNED).filter(Boolean)
    var bannedHit = {}
    textEls.forEach(function (el) {
      var t = ownText(el)
      banned.forEach(function (w) {
        if (!bannedHit[w] && t.indexOf(w) >= 0) { bannedHit[w] = true; add('delivery', 'must', '出现禁用字样「' + w + '」', '「' + clip(t, 50) + '」', el, '交付稿不应出现过程性字样，删掉这一段') }
      })
    })
    var text = body.innerText || ''
    var cjk = (text.match(CJK_G) || []).length
    var words = (text.replace(CJK_G, ' ').match(/[A-Za-z][A-Za-z'’-]*/g) || []).length
    var stats = {
      cjk: cjk, words: words, chars: cjk + words,
      figures: caps['图'].length, tables: caps['表'].length, images: document.images.length,
      pages: pages.length, fonts: famList.length, fontSizes: sizeList.length,
      viewport: winW + '×' + window.innerHeight, title: document.title || '',
    }
    if (options.targetChars > 0) {
      var dev = (stats.chars - options.targetChars) / options.targetChars
      if (Math.abs(dev) > 0.1) add('delivery', 'hint', '字数 ' + stats.chars + '，与目标 ' + options.targetChars + ' 相差 ' + Math.round(dev * 100) + '%', '中文字 ' + cjk + '、英文词 ' + words, null, dev > 0 ? '精简内容' : '补充内容')
    }
    var must = issues.filter(function (i) { return i.level === 'must' }).length
    return { version: VERSION, stats: stats, issues: issues, must: must, hint: issues.length - must }
  }
  window.__deliverQA = qa

  // ── 批注目标查找（与导出 HTML 的 viewer.js 规则一致）──────
  function normText(s) { return String(s || '').replace(/\s+/g, ' ').trim().slice(0, 40) }
  function findTarget(t) {
    if (!t) return null
    var el = null
    try { el = t.selector ? document.querySelector(t.selector) : null } catch (e) { el = null }
    var fp = normText(t.text)
    if (el && (!fp || normText(el.innerText || el.textContent) === fp)) return el
    if (!fp || !t.tag) return el && !fp ? el : null
    var list = document.getElementsByTagName(t.tag)
    for (var i = 0; i < list.length && i < 4000; i++) if (normText(list[i].innerText || list[i].textContent) === fp && !list[i].closest('[data-deliver-overlay]')) return list[i]
    return null
  }
  window.__deliverFindTarget = findTarget

  // ── iframe 交互：批注、定位、页内导航 ──────────────────
  if (window.parent === window) return
  var mode = 'browse'
  var hover = null
  var marks = []
  var scale = 1
  var SEL = '109,94,252'
  function post(msg) { msg[TAG] = true; try { window.parent.postMessage(msg, '*') } catch (e) {} }
  function box(rgb, dashed) {
    var d = document.createElement('div')
    d.setAttribute('data-deliver-overlay', '')
    d.className = '__ds-box'
    d.style.cssText = 'position:absolute;pointer-events:none;z-index:2147483645;box-sizing:border-box;border:' + Math.max(1.5, 2 / scale) + 'px ' + (dashed ? 'dashed' : 'solid') + ' rgb(' + rgb + ');background:rgba(' + rgb + ',0.07);border-radius:3px'
    document.documentElement.appendChild(d)
    return d
  }
  function place(d, el) {
    var r = el.getBoundingClientRect()
    d.style.left = (r.left + window.scrollX) + 'px'; d.style.top = (r.top + window.scrollY) + 'px'
    d.style.width = r.width + 'px'; d.style.height = r.height + 'px'; d.style.display = 'block'
  }
  function label(d, text) {
    var t = d.firstChild || d.appendChild(document.createElement('span'))
    var fs = Math.round(11 / scale)
    t.style.cssText = 'position:absolute;left:-2px;top:' + (-fs - 9) + 'px;font:600 ' + fs + 'px/' + (fs + 6) + 'px system-ui,sans-serif;color:#fff;background:rgb(' + SEL + ');padding:0 ' + Math.round(6 / scale) + 'px;border-radius:' + fs + 'px;white-space:nowrap'
    t.textContent = text
  }
  function vrect(el) { var r = el.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) } }
  function describe(el) {
    var cs = getComputedStyle(el)
    var r = el.getBoundingClientRect()
    var html = el.outerHTML
    return {
      selector: cssPath(el), tag: el.localName, route: location.hash || '',
      text: clip(el.innerText || el.textContent, 200),
      html: html.length > 600 ? html.slice(0, 599) + '…' : html,
      rect: { x: Math.round(r.left + window.scrollX), y: Math.round(r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) },
      vrect: vrect(el),
      styles: {
        fontSize: cs.fontSize, fontWeight: cs.fontWeight, fontFamily: cs.fontFamily.split(',')[0].replace(/["']/g, ''), lineHeight: cs.lineHeight,
        color: cs.color, background: cs.backgroundColor, margin: cs.margin, padding: cs.padding, borderRadius: cs.borderRadius, textAlign: cs.textAlign,
      },
    }
  }
  function clearMarks() { marks.forEach(function (m) { m.box.remove() }); marks = [] }
  function renumber() { marks.forEach(function (m, i) { label(m.box, String(i + 1)) }) }
  function sendSelRect() { if (marks.length) post({ type: 'sel-rect', vrect: vrect(marks[marks.length - 1].el) }) }

  // 批注标记层
  var notes = []
  var pinLayer = null
  var pinOutlines = []
  var focusId = null
  function pinHost() {
    if (pinLayer && pinLayer.isConnected) return pinLayer
    pinLayer = document.createElement('div')
    pinLayer.setAttribute('data-deliver-overlay', '')
    pinLayer.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;z-index:2147483646'
    document.documentElement.appendChild(pinLayer)
    return pinLayer
  }
  function onColor(hex) {
    var c = /^#?([0-9a-f]{6})$/i.exec(hex || '')
    if (!c) return '#fff'
    var n = parseInt(c[1], 16)
    return lum({ r: n >> 16, g: (n >> 8) & 255, b: n & 255 }) > 0.42 ? '#1c1917' : '#fff'
  }
  function clearOutlines() { pinOutlines.forEach(function (o) { o.remove() }); pinOutlines = [] }
  function outline(note) {
    clearOutlines()
    ;(note.targets || []).forEach(function (t) {
      var el = findTarget(t)
      if (!el) return
      var o = document.createElement('div')
      o.setAttribute('data-deliver-overlay', '')
      o.style.cssText = 'position:absolute;pointer-events:none;z-index:2147483644;box-sizing:border-box;border-radius:3px;border:' + Math.max(1.5, 2 / scale) + 'px solid ' + note.color + ';background:' + note.color + '14'
      document.documentElement.appendChild(o)
      place(o, el)
      pinOutlines.push(o)
    })
  }
  function renderPins() {
    var host = pinHost()
    host.textContent = ''
    var fs = Math.round(11 / scale)
    var placed = 0
    notes.forEach(function (n) {
      var el = findTarget(n.targets && n.targets[0])
      if (!el || !visible(el)) return
      var r = el.getBoundingClientRect()
      var right = r.right
      // 标记贴在文字末尾的右上角（与 viewer.js 一致）
      try { var rg = document.createRange(); rg.selectNodeContents(el); var tr = rg.getBoundingClientRect(); if (tr.width > 0 && tr.right < right) right = Math.max(r.left + 24, tr.right + 6) } catch (e) {}
      var p = document.createElement('button')
      p.type = 'button'
      p.setAttribute('data-note', n.id)
      p.title = n.comment || ''
      p.textContent = n.label
      var focused = n.id === focusId
      p.style.cssText = 'all:initial;position:absolute;box-sizing:border-box;cursor:pointer;font:700 ' + fs + 'px/' + (fs + 8) + 'px system-ui,-apple-system,sans-serif;min-width:' + (fs + 8) + 'px;height:' + (fs + 8) + 'px;padding:0 ' + Math.round(6 / scale) + 'px;border-radius:' + (fs + 8) + 'px ' + (fs + 8) + 'px ' + (fs + 8) + 'px 2px;text-align:center;white-space:nowrap;max-width:' + Math.round(160 / scale) + 'px;overflow:hidden;text-overflow:ellipsis;background:' + n.color + ';color:' + onColor(n.color) + ';box-shadow:0 0 0 ' + Math.max(1.5, 2 / scale) + 'px #fff,0 2px 6px rgba(0,0,0,.25)' + (focused ? ',0 0 0 ' + Math.round(5 / scale) + 'px ' + n.color + '66' : '')
      p.style.left = Math.max(0, right + window.scrollX - fs - 4) + 'px'
      p.style.top = Math.max(0, r.top + window.scrollY - fs - 4) + 'px'
      p.addEventListener('mouseenter', function () { outline(n) })
      p.addEventListener('mouseleave', clearOutlines)
      p.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); post({ type: 'pin', id: n.id }) }, true)
      host.appendChild(p)
      placed++
    })
    post({ type: 'pins', shown: placed })
  }
  var pinTimer = 0
  function schedulePins() { if (!notes.length && !(pinLayer && pinLayer.firstChild)) return; clearTimeout(pinTimer); pinTimer = setTimeout(function () { renderPins(); marks.forEach(function (m) { place(m.box, m.el) }) }, 120) }
  if (window.MutationObserver) new MutationObserver(function (list) {
    for (var i = 0; i < list.length; i++) { var t = list[i].target; if (!(t.closest && t.closest('[data-deliver-overlay]')) && t !== document.documentElement) { schedulePins(); return } }
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true })

  function isOverlay(el) { return !el || el === document.documentElement || (el.closest && el.closest('[data-deliver-overlay]')) }
  document.addEventListener('mousemove', function (e) {
    if (mode !== 'select') return
    var el = e.target
    if (isOverlay(el) || el === document.body) { if (hover) hover.style.display = 'none'; return }
    if (!hover) hover = box(SEL, true)
    place(hover, el)
  }, true)
  // 批注模式下吞掉页面自身的按下/点击，避免误触发页面逻辑
  ;['pointerdown', 'mousedown', 'mouseup', 'pointerup', 'dblclick', 'submit'].forEach(function (type) {
    document.addEventListener(type, function (e) { if (mode === 'select' && !isOverlay(e.target)) { e.preventDefault(); e.stopPropagation() } }, true)
  })
  document.addEventListener('click', function (e) {
    if (mode !== 'select') return
    var el = e.target
    if (isOverlay(el)) return
    e.preventDefault(); e.stopPropagation()
    var existing = marks.findIndex(function (m) { return m.el === el })
    if (existing >= 0) { marks[existing].box.remove(); marks.splice(existing, 1); renumber(); post({ type: 'unselect', selector: cssPath(el) }); sendSelRect(); return }
    if (!e.shiftKey) clearMarks()
    var b = box(SEL, false)
    place(b, el)
    marks.push({ el: el, box: b })
    renumber()
    post({ type: 'select', additive: !!e.shiftKey, item: describe(el) })
  }, true)
  // 浏览模式：页内锚点交给页面自己处理；站外链接和相对路径的其它文件交给工作台打开
  document.addEventListener('click', function (e) {
    if (mode !== 'browse' || e.defaultPrevented) return
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null
    if (!a || isOverlay(a)) return
    var href = (a.getAttribute('href') || '').trim()
    if (!href || href[0] === '#' || /^javascript:/i.test(href)) return
    e.preventDefault()
    if (/^https?:\/\//i.test(href)) post({ type: 'open-url', href: href })
    else if (!/^[a-z][a-z\d+.-]*:/i.test(href)) post({ type: 'open-file', href: href })
  }, false)
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') post({ type: 'esc' }); else if (e.key === 'Shift' && mode === 'select' && !e.repeat) post({ type: 'shift', down: true }) }, true)
  document.addEventListener('keyup', function (e) { if (e.key === 'Shift') post({ type: 'shift', down: false }) }, true)
  window.addEventListener('blur', function () { post({ type: 'shift', down: false }) })
  var rafPending = false
  function onScroll() {
    if (rafPending) return
    rafPending = true
    requestAnimationFrame(function () { rafPending = false; marks.forEach(function (m) { place(m.box, m.el) }); sendSelRect(); if (pinLayer && pinLayer.firstChild) renderPins(); if (pinOutlines.length) clearOutlines() })
  }
  window.addEventListener('scroll', onScroll, true)
  window.addEventListener('resize', onScroll)
  window.addEventListener('hashchange', function () { post({ type: 'route', hash: location.hash }); schedulePins() })
  window.addEventListener('message', function (e) {
    var d = e.data
    if (!d || d[TAG] !== true || e.source !== window.parent) return
    if (d.type === 'mode') {
      mode = d.mode
      if (hover) hover.style.display = 'none'
      if (mode !== 'select') clearMarks()
      document.documentElement.style.cursor = mode === 'select' ? 'crosshair' : ''
    } else if (d.type === 'scale') {
      scale = Math.max(0.25, Math.min(1, Number(d.scale) || 1)); renumber(); if (notes.length) renderPins()
    } else if (d.type === 'clear') {
      clearMarks()
    } else if (d.type === 'notes') {
      notes = d.notes || []; focusId = d.focus || null; renderPins()
    } else if (d.type === 'route') {
      if (typeof d.hash === 'string' && d.hash !== location.hash) location.hash = d.hash
    } else if (d.type === 'qa') {
      whenLaidOut(function () {
        var result
        try { result = qa(d.options || {}) } catch (err) { result = { version: VERSION, error: String(err && err.message || err), issues: [], stats: {} } }
        post({ type: 'qa-result', id: d.id, result: result })
      })
    } else if (d.type === 'locate') {
      locate(d, false)
    }
  })
  function locate(d, retried) {
    var el = null
    if (d.target) el = findTarget(d.target)
    else { try { el = d.selector ? document.querySelector(d.selector) : null } catch (err) { el = null } }
    // 目标在 SPA 的其它路由上：先切过去再找一次
    if (!el && !retried && d.target && typeof d.target.route === 'string' && d.target.route !== location.hash) {
      location.hash = d.target.route
      setTimeout(function () { locate(d, true) }, 500)
      return
    }
    if (!el) { post({ type: 'locate-miss', selector: d.selector || (d.target && d.target.selector) }); return }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    var flash = box('220,38,38', false)
    setTimeout(function () { place(flash, el) }, 350)
    setTimeout(function () { flash.remove() }, 2200)
  }
  // 页面加载完且完成首次布局后才算就绪：布局前 innerText 会退化成 textContent、尺寸全为 0，QA 结果不可信
  function whenLaidOut(fn) {
    function go() { requestAnimationFrame(function () { requestAnimationFrame(function () { if (window.innerWidth > 0) fn(); else setTimeout(go, 50) }) }) }
    if (document.readyState === 'complete') go()
    else window.addEventListener('load', go, { once: true })
  }
  whenLaidOut(function () { post({ type: 'ready', title: document.title || '', url: location.href, hash: location.hash }) })
})()
