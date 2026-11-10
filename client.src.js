window.__ModuleLoader__.load({
  id: 'dsh-deliver-studio',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useMemo, useRef, useCallback } = React

    const RUNTIME = /*__RUNTIME_SOURCE__*/''
    const BODY_ID = 'dsh-deliver-studio/workbench'
    const ROW_KEY = 'dsh-deliver-studio#deliver-studio'
    const BRIDGE = '/api/dsh-deliver-studio'
    const NS = 'deliverStudio'
    const TAG = '__deliverStudio'
    const VIEWPORTS = [
      { id: 'desktop', w: 1440, h: 900 }, { id: 'laptop', w: 1280, h: 800 }, { id: 'tablet', w: 768, h: 1024 },
      { id: 'mobile', w: 390, h: 844 }, { id: 'a4', w: 794, h: 1123 },
    ]
    const COLORS = ['#e5484d', '#f76b15', '#ffc53d', '#30a46c', '#0d74ce', '#8e4ec6']
    const DOCKS = ['bottom', 'top', 'left', 'right', 'float']
    const CATS = ['visual', 'text', 'layout', 'numbering', 'asset', 'delivery']
    const CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'

    const zh = {
      title: '交付工作台', vp_desktop: '桌面', vp_laptop: '笔记本', vp_tablet: '平板', vp_mobile: '手机', vp_a4: 'A4',
      viewport: '视口', browse: '浏览', annotate: '批注', browseTip: '浏览：页面可正常点击和切换', annotateTip: '批注：点选元素写意见 · Shift 多选 · Esc 退出',
      qa: 'QA', qaTip: '交付 QA', exportBtn: '导出', exportPdf: '导出 PDF', exportHtml: '导出带批注的 HTML', exporting: '导出中…', panel: '面板', panelTip: '显示 / 收起面板',
      tab_notes: '批注', tab_qa: 'QA', tab_el: '元素', dockMenu: '面板位置', hidePanel: '收起',
      dock_bottom: '停靠底部', dock_top: '停靠顶部', dock_left: '停靠左侧', dock_right: '停靠右侧', dock_float: '浮动', dragHint: '拖到边缘停靠，放在中间浮动',
      loading: '正在渲染…', failed: '无法渲染：{e}',
      commentPh: '写修改意见', multiHint: 'Shift 多选', renameShort: '改名', add: '添加', cancel: '取消', nickPh: '昵称，可留空', nick: '昵称', nickEdit: '修改昵称', more: '+{n}',
      notesEmpty: '还没有批注', notesEmptyHint: '切到「批注」，点选页面元素即可添加', startAnnotate: '开始批注',
      sendAll: '发给 Agent', sent: '已放进输入框', copied: '已复制到剪贴板', clear: '清空', clearConfirm: '确认清空',
      locate: '定位', remove: '删除', reply: '回复', replyPh: '写回复', save: '保存', rename: '双击改名', editComment: '双击编辑',
      qaNotRun: '尚未检查', qaStart: '开始检查', qaRerun: '重新检查', qaRunning: '检查中…', qaEmpty: '未发现问题', qaError: '检查失败：{e}',
      mustOnly: '只看必改', all: '全部', allToAgent: '全部发给 Agent', toNote: '加入批注', ignore: '忽略', ignored: '已忽略 {n} 条', restore: '恢复',
      must: '必改', hint: '建议', mustN: '必改 {n}', hintN: '建议 {n}',
      cat_numbering: '编号', cat_layout: '版式', cat_text: '文本', cat_visual: '视觉', cat_asset: '资源', cat_delivery: '交付规范',
      catd_numbering: '图表编号与引用', catd_layout: '溢出、留白、分页', catd_text: '孤字、截断、行宽', catd_visual: '对比度、字体字号', catd_asset: '图片、锚点', catd_delivery: '禁用字样、字数',
      stats: '{cjk} 字 · {words} 词 · 图 {fig} · 表 {tab}', statsPages: ' · {pages} 页',
      elEmpty: '未选择元素', elHint: '批注模式下点选元素后显示样式', selector: '选择器', text: '文字', font: '字体', color: '颜色', size: '尺寸', padding: '内边距',
      confirmTitle: '有 {n} 处必改', exportAnyway: '仍然导出', viewIssues: '查看', exported: '已导出 {name} · {pages} 页', open: '打开', exportFail: '导出失败：{e}',
      htmlExported: '已导出 {name} · {n} 条批注', locateMiss: '页面上找不到这个元素', fileOpened: '已在预览中打开 {name}',
      msgHead: '请按编号逐条修改交付物 {file}，每条改完回执编号；只改列出的元素，不要重排其它部分：', msgQaHead: '交付 QA 发现以下问题，请按编号逐条修复 {file}，改完回执编号：',
      msgReply: '回复', msgViewport: '（视口 {w}px）', anon: '用户{n}',
      summary: 'HTML 交付物：视口预览、批注、QA、导出 PDF / 带批注 HTML', sBanned: '禁用字样（每行一个）', sTarget: '目标字数（0 = 只统计）', sViewport: '默认视口', sQaBefore: '导出前强制 QA', sBrowser: '浏览器路径（Edge / Chrome / Chromium / Brave，留空自动查找）', saved: '已保存', browserOk: '已找到：{name}', browserMissing: '未找到 Chromium 内核浏览器', browserMissingHint: '请安装 Edge / Chrome / Chromium / Brave 中的一个，或在上方填写浏览器可执行文件的完整路径。',
    }
    const en = {
      title: 'Deliver Studio', vp_desktop: 'Desktop', vp_laptop: 'Laptop', vp_tablet: 'Tablet', vp_mobile: 'Mobile', vp_a4: 'A4',
      viewport: 'Viewport', browse: 'Browse', annotate: 'Annotate', browseTip: 'Browse: the page stays interactive', annotateTip: 'Annotate: click elements to comment · Shift multi-select · Esc to exit',
      qa: 'QA', qaTip: 'Delivery QA', exportBtn: 'Export', exportPdf: 'Export PDF', exportHtml: 'Export annotated HTML', exporting: 'Exporting…', panel: 'Panel', panelTip: 'Show / hide panel',
      tab_notes: 'Notes', tab_qa: 'QA', tab_el: 'Element', dockMenu: 'Panel position', hidePanel: 'Hide',
      dock_bottom: 'Dock bottom', dock_top: 'Dock top', dock_left: 'Dock left', dock_right: 'Dock right', dock_float: 'Float', dragHint: 'Drop on an edge to dock, in the middle to float',
      loading: 'Rendering…', failed: 'Could not render: {e}',
      commentPh: 'Write a comment', multiHint: 'Shift: multi-select', renameShort: 'Rename', add: 'Add', cancel: 'Cancel', nickPh: 'Nickname (optional)', nick: 'Name', nickEdit: 'Change nickname', more: '+{n}',
      notesEmpty: 'No notes yet', notesEmptyHint: 'Switch to Annotate and click an element', startAnnotate: 'Start annotating',
      sendAll: 'Send to agent', sent: 'Placed in the composer', copied: 'Copied to clipboard', clear: 'Clear', clearConfirm: 'Confirm clear',
      locate: 'Locate', remove: 'Delete', reply: 'Reply', replyPh: 'Write a reply', save: 'Save', rename: 'Double-click to rename', editComment: 'Double-click to edit',
      qaNotRun: 'Not checked yet', qaStart: 'Run QA', qaRerun: 'Run again', qaRunning: 'Checking…', qaEmpty: 'No issues found', qaError: 'QA failed: {e}',
      mustOnly: 'Must-fix only', all: 'All', allToAgent: 'Send all to agent', toNote: 'Add as note', ignore: 'Ignore', ignored: '{n} ignored', restore: 'Restore',
      must: 'Must', hint: 'Hint', mustN: '{n} must', hintN: '{n} hints',
      cat_numbering: 'Numbering', cat_layout: 'Layout', cat_text: 'Text', cat_visual: 'Visual', cat_asset: 'Assets', cat_delivery: 'Delivery',
      catd_numbering: 'Figure/table numbers and references', catd_layout: 'Overflow, whitespace, pages', catd_text: 'Orphans, clipping, line length', catd_visual: 'Contrast, fonts, sizes', catd_asset: 'Images, anchors', catd_delivery: 'Banned words, length',
      stats: '{cjk} CJK · {words} words · {fig} fig · {tab} tab', statsPages: ' · {pages} pages',
      elEmpty: 'Nothing selected', elHint: 'Select an element in Annotate mode to see its styles', selector: 'Selector', text: 'Text', font: 'Font', color: 'Color', size: 'Size', padding: 'Padding',
      confirmTitle: '{n} must-fix issues', exportAnyway: 'Export anyway', viewIssues: 'View', exported: 'Exported {name} · {pages} pages', open: 'Open', exportFail: 'Export failed: {e}',
      htmlExported: 'Exported {name} · {n} notes', locateMiss: 'Element not found on the page', fileOpened: 'Opened {name} in preview',
      msgHead: 'Please revise {file} item by item and confirm each number; only change the listed elements:', msgQaHead: 'Delivery QA found these issues in {file}; fix them by number:',
      msgReply: 'Reply', msgViewport: '(viewport {w}px)', anon: 'User {n}',
      summary: 'HTML deliverables: viewports, annotations, QA, PDF / annotated HTML export', sBanned: 'Banned words (one per line)', sTarget: 'Target length (0 = count only)', sViewport: 'Default viewport', sQaBefore: 'QA before export', sBrowser: 'Browser path (Edge / Chrome / Chromium / Brave; blank = auto-detect)', saved: 'Saved', browserOk: 'Found: {name}', browserMissing: 'No Chromium-based browser found', browserMissingHint: 'Install Edge, Chrome, Chromium or Brave, or enter the full path to the browser executable above.',
    }
    function fmt(s, p) { return p ? String(s).replace(/\{(\w+)\}/g, (_, k) => (p[k] !== undefined ? p[k] : '')) : String(s) }
    let tr = (k, p) => fmt(zh[k] ?? k, p)

    async function bridge(path, body) {
      const r = await fetch(BRIDGE + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body ?? {}) })
      const j = await r.json().catch(() => ({ ok: false, error: 'HTTP ' + r.status }))
      if (!r.ok && j.ok !== false) throw new Error(j.error || 'HTTP ' + r.status)
      return j
    }

    // ── 本地存储 ─────────────────────────────────────────
    const store = {
      get(k, d) { try { const v = JSON.parse(localStorage.getItem('deliverStudio:' + k) || 'null'); return v == null ? d : v } catch (e) { return d } },
      set(k, v) { try { localStorage.setItem('deliverStudio:' + k, JSON.stringify(v)) } catch (e) {} },
    }
    const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
    function getMe() { let me = store.get('me', null); if (!me || !me.id) { me = { id: uid('u'), name: '', named: false }; store.set('me', me) } return me }

    // 批注合并：按 id 合并，名称/颜色/内容取较新的 updated，回复按 id 取并集
    function mergeNotes(a, b, removed) {
      const map = new Map()
      const gone = new Set(removed || [])
      for (const list of [a || [], b || []]) for (const n of list) {
        if (!n || !n.id || gone.has(n.id)) continue
        const cur = map.get(n.id)
        if (!cur) { map.set(n.id, Object.assign({}, n, { replies: (n.replies || []).slice(), targets: (n.targets || []).slice() })); continue }
        if ((n.updated || 0) > (cur.updated || 0)) Object.assign(cur, { name: n.name, color: n.color, comment: n.comment, updated: n.updated })
        const seen = new Set(cur.replies.map((r) => r.id))
        for (const r of n.replies || []) if (!seen.has(r.id)) { cur.replies.push(r); seen.add(r.id) }
        cur.replies.sort((x, y) => x.time - y.time)
      }
      return Array.from(map.values())
    }
    function displayNames(notes, people, me) {
      const events = []
      for (const n of notes) { if (n.author) events.push({ a: n.author, t: n.time || 0 }); for (const r of n.replies || []) if (r.author) events.push({ a: r.author, t: r.time || 0 }) }
      if (!events.some((e) => e.a.id === me.id)) events.push({ a: { id: me.id, name: me.name }, t: Infinity })
      events.sort((x, y) => x.t - y.t)
      const names = {}
      let anon = 0
      for (const e of events) {
        const id = e.a.id
        if (names[id]) continue
        names[id] = (id === me.id && me.name) || people[id] || e.a.name || tr('anon', { n: ++anon })
      }
      return names
    }
    const pad = (n) => (n < 10 ? '0' : '') + n
    const when = (t) => { const d = new Date(t); return (d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) }
    function onColor(hex) {
      const c = /^#?([0-9a-f]{6})$/i.exec(hex || '')
      if (!c) return '#fff'
      const n = parseInt(c[1], 16)
      const ch = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
      return 0.2126 * ch(n >> 16) + 0.7152 * ch((n >> 8) & 255) + 0.0722 * ch(n & 255) > 0.42 ? '#1c1917' : '#fff'
    }

    // ── 地址与打包 ───────────────────────────────────────
    const PREFIX = 'dsh-resource://file/'
    function parseAddress(address) {
      try {
        if (!address || !address.startsWith(PREFIX)) return undefined
        const end = address.search(/[?#]/)
        const [scope, ...rest] = address.slice(PREFIX.length, end === -1 ? undefined : end).split('/')
        if (scope !== 'session') return undefined
        const [id, ...segs] = rest
        return { sessionId: decodeURIComponent(id), path: segs.map(decodeURIComponent).join('/') }
      } catch { return undefined }
    }
    function sessionFileAddress(sessionId, path) {
      const enc = (s) => encodeURIComponent(s).replace(/%3A/gi, ':')
      const norm = String(path).replace(/\\/g, '/').replace(/^(?:\.\/)+/, '')
      return PREFIX + 'session/' + enc(sessionId) + '/' + norm.split('/').map(enc).join('/')
    }
    // 相对链接按当前文件所在目录解析（处理 ./ 与 ../）
    function resolveRelative(basePath, href) {
      const clean = decodeURIComponent(String(href).replace(/[?#].*$/, ''))
      const parts = String(basePath).replace(/\\/g, '/').split('/')
      parts.pop()
      for (const seg of clean.split('/')) { if (!seg || seg === '.') continue; if (seg === '..') { if (parts.length > 1) parts.pop() } else parts.push(seg) }
      return parts.join('/')
    }
    const decoder = () => new TextDecoder('utf-8')
    function b64(bytes) {
      let s = ''
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
      return btoa(s)
    }
    function b64Text(text) { return b64(new TextEncoder().encode(text)) }
    const IMG_EXT = /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i
    const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp', ico: 'image/x-icon', avif: 'image/avif' }
    function isRelative(ref) { return !!ref && !/^(?:[a-z][a-z\d+.-]*:|[/\\#?])/i.test(ref) && !ref.includes('\0') }
    // 带批注 HTML 的嵌入块（与 browser.js / viewer.js 同格式）：预览时剥掉，数据交给工作台
    const ANNOT_RE = /<!--deliver-studio:annotations:start-->[\s\S]*?<!--deliver-studio:annotations:end-->/g
    function splitAnnotations(html) {
      const m = /<script type="application\/json" id="deliver-studio-data">([\s\S]*?)<\/script>/.exec(html)
      let data = null
      if (m) { try { data = JSON.parse(m[1]) } catch (e) { data = null } }
      return { html: html.replace(ANNOT_RE, ''), annotations: data }
    }

    async function packDocument(data, readRelated, address, signal) {
      const split = splitAnnotations(decoder().decode(data))
      const html = split.html
      const tpl = document.createElement('template')
      tpl.innerHTML = html
      const assets = []
      let total = data.byteLength
      if (!tpl.content.querySelector('base[href]')) {
        const seen = new Set()
        const els = tpl.content.querySelectorAll('script[src],link[href],img[src],source[src],video[poster],image[href]')
        for (const el of els) {
          if (assets.length >= 80) break
          const tag = el.localName
          let kind, attr
          if (tag === 'script') { kind = 'script'; attr = 'src'; const ty = (el.getAttribute('type') || '').trim().toLowerCase(); if (ty && ty !== 'text/javascript' && ty !== 'application/javascript') continue }
          else if (tag === 'link') { if (!(el.getAttribute('rel') || '').toLowerCase().split(/\s+/).includes('stylesheet')) continue; kind = 'stylesheet'; attr = 'href' }
          else if (tag === 'video') { kind = 'image'; attr = 'poster' }
          else if (tag === 'image') { kind = 'image'; attr = 'href' }
          else { kind = 'image'; attr = 'src' }
          const ref = el.getAttribute(attr)
          if (!isRelative(ref)) continue
          const clean = ref.replace(/[?#].*$/, '')
          if (kind === 'script' && !/\.js$/i.test(clean)) continue
          if (kind === 'stylesheet' && !/\.css$/i.test(clean)) continue
          if (kind === 'image' && !IMG_EXT.test(clean)) continue
          const key = kind + ':' + ref
          if (seen.has(key)) continue
          seen.add(key)
          try {
            const r = await readRelated(address, decodeURIComponent(clean), signal)
            if (!r || !r.ok) continue
            const bytes = r.value.data
            if (bytes.byteLength > (kind === 'image' ? 12 : 4) * 1024 * 1024) continue
            total += bytes.byteLength
            if (total > 48 * 1024 * 1024) break
            if (kind === 'image') assets.push({ kind, ref, b64: b64(bytes), mime: MIME[(clean.split('.').pop() || '').toLowerCase()] || 'application/octet-stream' })
            else assets.push({ kind, ref, text: decoder().decode(bytes) })
          } catch (e) { if (signal.aborted) throw e }
        }
      }
      return { html, assets, annotations: split.annotations }
    }

    // iframe 文档：用 srcdoc 装载（blob: 地址在沙箱里不允许 hash 导航，页面内的 #/路由 切换会失效），
    // 并补 <base href="about:srcdoc">，让 <a href="#x"> 解析为本文档内的锚点而不是宿主页面地址。
    function frameDocument(bundle) {
      const payload = b64Text(JSON.stringify({ html: bundle.html, assets: bundle.assets, runtime: RUNTIME }))
      return '<!doctype html><meta charset="utf-8"><script>(()=>{' +
        'const bin=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));' +
        'const b=JSON.parse(new TextDecoder("utf-8").decode(bin("' + payload + '")));' +
        'let html=b.html;' +
        'if(b.assets.length){const d=new DOMParser().parseFromString(html,"text/html");' +
        'for(const a of b.assets){const blob=a.kind==="image"?new Blob([bin(a.b64)],{type:a.mime}):new Blob([a.text],{type:a.kind==="script"?"application/javascript":"text/css"});const u=URL.createObjectURL(blob);' +
        'const sel=a.kind==="script"?"script[src]":a.kind==="stylesheet"?"link[href]":"img[src],source[src],video[poster],image[href]";' +
        'for(const el of d.querySelectorAll(sel)){for(const at of ["src","href","poster"]){if(el.getAttribute(at)===a.ref)el.setAttribute(at,u)}}}' +
        'html="<!doctype html>"+d.documentElement.outerHTML}' +
        'if(!/<base\\s[^>]*href/i.test(html)){const bt=\'<base href="about:srcdoc">\';const m=/<head(\\s[^>]*)?>/i.exec(html);' +
        'if(m){const k=m.index+m[0].length;html=html.slice(0,k)+bt+html.slice(k)}else{const d=/^\\s*<!doctype[^>]*>/i.exec(html);html=d?d[0]+bt+html.slice(d[0].length):bt+html}}' +
        'const rt="<scr"+"ipt>"+b.runtime+"</scr"+"ipt>";' +
        'const i=html.search(/<\\/body\\s*>(?![\\s\\S]*<\\/body\\s*>)/i);html=i>=0?html.slice(0,i)+rt+html.slice(i):html+rt;' +
        'document.open();document.write(html);document.close();' +
        '})()<\/script>'
    }

    // ── 图标 ───────────────────────────────────────────
    const ICONS = {
      monitor: 'M3 4h18v12H3z M8 20h8 M12 16v4', cursor: 'M5 3l14 7-6 2-2 6z', note: 'M4 4h16v12H9l-5 4z', shield: 'M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z M9 12l2 2 4-4',
      panel: 'M3 4h18v16H3z M3 14h18', download: 'M12 4v11 M7 10l5 5 5-5 M5 20h14', chevron: 'M6 9l6 6 6-6', close: 'M6 6l12 12 M18 6L6 18',
      grip: 'M9 6h.01 M15 6h.01 M9 12h.01 M15 12h.01 M9 18h.01 M15 18h.01', send: 'M4 12l16-8-6 16-2-7z', locate: 'M12 2v4 M12 18v4 M2 12h4 M18 12h4 M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8',
      trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13', check: 'M5 12l5 5 9-10', refresh: 'M20 11a8 8 0 1 0-2.3 5.7 M20 4v7h-7', minus: 'M5 12h14', reply: 'M9 14L4 9l5-5 M4 9h10a6 6 0 0 1 6 6v4',
      dock_bottom: 'M3 4h18v16H3z M3 14h18', dock_top: 'M3 4h18v16H3z M3 10h18', dock_left: 'M3 4h18v16H3z M9 4v16', dock_right: 'M3 4h18v16H3z M15 4v16', dock_float: 'M3 4h18v16H3z M11 11h7v6h-7z',
    }
    function Icon({ name, size }) {
      const s = size || 15
      return h('svg', { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: name === 'grip' ? 3 : 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, className: 'ds-ic' },
        ICONS[name].split(' M').map((d, i) => h('path', { key: i, d: (i ? 'M' : '') + d })))
    }

    // ── 下拉菜单（收纳选择 / 切换类功能）────────────────────
    function Menu({ label, icon, items, title, primary, align, disabled, className }) {
      const [open, setOpen] = useState(false)
      const ref = useRef(null)
      const btnRef = useRef(null)
      useEffect(() => {
        if (!open) return undefined
        const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setOpen(false); try { btnRef.current && btnRef.current.focus() } catch (x) {} } }
        const onBlur = () => setOpen(false) // 点进 iframe 时父窗口失焦
        document.addEventListener('pointerdown', onDown, true)
        document.addEventListener('keydown', onKey, true)
        window.addEventListener('blur', onBlur)
        const first = ref.current && ref.current.querySelector('[role=menuitem]:not([disabled]),[role=menuitemradio]')
        if (first) first.focus()
        return () => { document.removeEventListener('pointerdown', onDown, true); document.removeEventListener('keydown', onKey, true); window.removeEventListener('blur', onBlur) }
      }, [open])
      const onMenuKey = (e) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
        e.preventDefault()
        const list = Array.from(ref.current.querySelectorAll('[role^=menuitem]:not([disabled])'))
        const i = list.indexOf(document.activeElement)
        const next = list[(i + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length]
        if (next) next.focus()
      }
      return h('div', { className: 'ds-menu-wrap ' + (className || ''), ref },
        h('button', { ref: btnRef, type: 'button', className: 'ds-btn' + (primary ? ' ds-primary' : ''), title, disabled, 'aria-haspopup': 'menu', 'aria-expanded': open, onClick: () => setOpen((o) => !o) },
          icon ? h(Icon, { name: icon }) : null, label, h(Icon, { name: 'chevron', size: 13 })),
        open ? h('div', { className: 'ds-menu', role: 'menu', 'data-align': align || 'left', onKeyDown: onMenuKey },
          items.map((it) => it.sep ? h('div', { key: it.key, className: 'ds-menu-sep', role: 'separator' }) : h('button', {
            key: it.key, type: 'button', role: it.checked !== undefined ? 'menuitemradio' : 'menuitem', 'aria-checked': it.checked, disabled: it.disabled,
            className: 'ds-menu-item', onClick: () => { setOpen(false); it.onSelect() },
          }, h('span', { className: 'ds-menu-check' }, it.checked ? h(Icon, { name: 'check', size: 13 }) : it.icon ? h(Icon, { name: it.icon, size: 14 }) : null),
            h('span', { className: 'ds-menu-label' }, it.label), it.hint ? h('span', { className: 'ds-menu-hint' }, it.hint) : null))) : null)
    }

    // ── 样式（取 DSH 主题 token，跟随明暗主题）──────────────────
    const CSS = `
.ds-root{container-type:inline-size;position:relative;display:flex;flex-direction:column;height:100%;min-height:360px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:12px;line-height:1.5}
.ds-root *{box-sizing:border-box}
.ds-ic{flex:none;display:block}
.ds-bar{display:flex;align-items:center;gap:6px;padding:6px 8px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);min-height:42px}
.ds-sp{flex:1;min-width:4px}
.ds-btn{flex:none;display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 9px;border-radius:7px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap;transition:background-color .12s,border-color .12s,color .12s}
.ds-btn:hover:not(:disabled){border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2)}
.ds-btn:active:not(:disabled){transform:translateY(1px)}
.ds-btn:disabled{opacity:.45;cursor:default}
.ds-btn.ds-primary{background:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-base)}
.ds-btn.ds-primary:hover:not(:disabled){background:var(--dsw-alias-label-primary);opacity:.88}
.ds-btn.ds-ghost{border-color:transparent;background:transparent;color:var(--dsw-alias-label-secondary)}
.ds-btn.ds-ghost:hover:not(:disabled){color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}
.ds-btn.ds-icon{width:28px;padding:0;justify-content:center}
.ds-btn[aria-pressed=true]{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l2)}
.ds-root button:focus-visible,.ds-root textarea:focus-visible,.ds-root input:focus-visible,.ds-root select:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.ds-seg{display:inline-flex;padding:2px;border-radius:8px;background:var(--dsw-alias-bg-layer-2);gap:2px}
.ds-seg button{display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 9px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}
.ds-seg button:hover{color:var(--dsw-alias-label-primary)}
.ds-seg button[aria-checked=true]{background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);box-shadow:0 0 0 1px var(--dsw-alias-border-l1),0 1px 2px rgba(0,0,0,.06)}
.ds-seg button[data-annot][aria-checked=true]{color:var(--dsw-alias-brand-primary)}
.ds-zoom{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.ds-badge{min-width:16px;height:16px;padding:0 4px;border-radius:8px;font-size:10.5px;line-height:16px;text-align:center;font-variant-numeric:tabular-nums;background:var(--dsw-alias-state-error-primary);color:#fff;font-weight:600}
.ds-badge[data-ok]{background:var(--dsw-alias-state-success-primary)}
.ds-badge[data-neutral]{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l1)}
.ds-menu-wrap{position:relative;display:inline-flex}
.ds-menu{position:absolute;top:calc(100% + 4px);left:0;z-index:30;min-width:190px;padding:4px;border-radius:9px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-overlay);box-shadow:0 10px 28px rgba(0,0,0,.16);display:flex;flex-direction:column;animation:ds-pop .12s ease-out}
.ds-menu[data-align=right]{left:auto;right:0}
.ds-menu-item{display:flex;align-items:center;gap:8px;height:30px;padding:0 8px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer;text-align:left}
.ds-menu-item:hover:not(:disabled),.ds-menu-item:focus-visible{background:var(--dsw-alias-bg-layer-2);outline:none}
.ds-menu-item:disabled{opacity:.45;cursor:default}
.ds-menu-check{width:16px;display:inline-flex;justify-content:center;color:var(--dsw-alias-label-secondary)}
.ds-menu-label{flex:1}
.ds-menu-hint{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.ds-menu-sep{height:1px;margin:4px 6px;background:var(--dsw-alias-border-l1)}
@keyframes ds-pop{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}
.ds-banner{display:flex;align-items:center;gap:8px;padding:6px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);flex-wrap:wrap}
.ds-banner[data-tone=bad]{box-shadow:inset 3px 0 0 var(--dsw-alias-state-error-primary)}
.ds-banner[data-tone=ok]{box-shadow:inset 3px 0 0 var(--dsw-alias-state-success-primary)}
.ds-banner[data-tone=warn]{box-shadow:inset 3px 0 0 var(--dsw-alias-state-warn-primary)}
.ds-body{flex:1;min-height:0;display:flex;position:relative}
.ds-body[data-dock=bottom]{flex-direction:column}
.ds-body[data-dock=top]{flex-direction:column-reverse}
.ds-body[data-dock=right]{flex-direction:row}
.ds-body[data-dock=left]{flex-direction:row-reverse}
.ds-stage{flex:1;min-width:0;min-height:0;position:relative;overflow:auto;background:var(--dsw-alias-bg-layer-2)}
.ds-canvas{position:relative;transform-origin:top left}
.ds-frame{display:block;border:0;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.12),0 8px 24px rgba(0,0,0,.08)}
.ds-root[data-dragging] .ds-frame,.ds-root[data-dragging] .ds-stage{pointer-events:none}
.ds-root[data-dragging]{user-select:none}
.ds-status{padding:16px;color:var(--dsw-alias-label-secondary)}
.ds-status[data-bad]{color:var(--dsw-alias-state-error-primary)}
.ds-split{flex:none;background:var(--dsw-alias-border-l1);position:relative;z-index:2}
.ds-body[data-dock=bottom] .ds-split,.ds-body[data-dock=top] .ds-split{height:1px;cursor:row-resize}
.ds-body[data-dock=left] .ds-split,.ds-body[data-dock=right] .ds-split{width:1px;cursor:col-resize}
.ds-split::after{content:'';position:absolute;inset:-4px}
.ds-split:hover,.ds-split[data-active]{background:var(--dsw-alias-brand-primary)}
.ds-panel{flex:none;display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--dsw-alias-bg-layer-1);overflow:hidden}
.ds-panel[data-dock=float]{position:absolute;z-index:20;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;box-shadow:0 14px 36px rgba(0,0,0,.2);resize:both;min-width:280px;min-height:180px;max-width:100%;max-height:100%}
.ds-ph{display:flex;align-items:center;gap:4px;padding:4px 6px 4px 4px;border-bottom:1px solid var(--dsw-alias-border-l1);cursor:grab;flex:none;min-height:36px;user-select:none;touch-action:none}
.ds-ph:active{cursor:grabbing}
.ds-grip{display:inline-flex;align-items:center;justify-content:center;width:22px;height:28px;color:var(--dsw-alias-label-secondary);opacity:.6;border-radius:6px}
.ds-ph:hover .ds-grip{opacity:1;background:var(--dsw-alias-bg-layer-2)}
.ds-tabs{display:flex;gap:2px}
.ds-tab{display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 9px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer}
.ds-tab:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}
.ds-tab[aria-selected=true]{color:var(--dsw-alias-label-primary);font-weight:600;background:var(--dsw-alias-bg-layer-2)}
.ds-pb{flex:1;min-height:0;overflow:auto;padding:8px 10px 12px}
.ds-tools{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.ds-muted{color:var(--dsw-alias-label-secondary)}
.ds-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:18px 8px;text-align:center;color:var(--dsw-alias-label-secondary);height:100%;min-height:96px}
.ds-empty b{color:var(--dsw-alias-label-primary);font-weight:600;font-size:13px}
.ds-grid{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));align-items:start}
.ds-card{border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-base);padding:8px 10px;display:flex;flex-direction:column;gap:5px;transition:border-color .15s,box-shadow .15s}
.ds-card:hover{border-color:var(--dsw-alias-border-l2)}
.ds-card[data-focus]{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 18%,transparent)}
.ds-card-h{display:flex;align-items:center;gap:6px;min-height:22px}
.ds-pin{display:inline-flex;align-items:center;max-width:150px;height:20px;padding:0 7px;border:0;border-radius:10px 10px 10px 2px;font:700 11px/20px system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:text}
.ds-pin-in{height:22px;width:120px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;padding:0 6px;font:inherit;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary)}
.ds-meta{color:var(--dsw-alias-label-secondary);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ds-acts{display:flex;gap:0;margin-left:auto;opacity:.55;transition:opacity .12s}
.ds-card:hover .ds-acts,.ds-card:focus-within .ds-acts,.ds-issue:hover .ds-acts,.ds-issue:focus-within .ds-acts{opacity:1}
@media (hover:none){.ds-acts{opacity:1}}
.ds-act{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.ds-act:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.ds-act[data-danger]:hover{color:var(--dsw-alias-state-error-primary)}
.ds-comment{white-space:pre-wrap;word-break:break-word;font-size:12.5px}
.ds-reply{border-left:2px solid var(--dsw-alias-border-l2);padding:1px 0 1px 8px;display:flex;flex-direction:column}
.ds-link{border:0;background:none;padding:0;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:4px}
.ds-link:hover{color:var(--dsw-alias-label-primary)}
.ds-input{width:100%;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;padding:6px 8px;resize:vertical}
.ds-input:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
.ds-dots{display:flex;gap:5px;align-items:center}
.ds-dot{width:16px;height:16px;border-radius:8px;border:2px solid var(--dsw-alias-bg-base);box-shadow:0 0 0 1px var(--dsw-alias-border-l2);padding:0;cursor:pointer}
.ds-dot[aria-checked=true]{box-shadow:0 0 0 2px var(--dsw-alias-label-primary)}
.ds-chip{display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 8px;border-radius:11px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font:inherit;font-size:11.5px;cursor:pointer;white-space:nowrap}
.ds-chip:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2)}
.ds-chip[aria-pressed=true]{background:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-base)}
.ds-chip .ds-cnt{font-variant-numeric:tabular-nums;opacity:.75}
.ds-chip .ds-mdot{width:6px;height:6px;border-radius:3px;background:var(--dsw-alias-state-error-primary)}
.ds-composer{position:absolute;z-index:25;width:288px;max-width:calc(100% - 16px);padding:10px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-overlay);box-shadow:0 14px 36px rgba(0,0,0,.2);display:flex;flex-direction:column;gap:8px;animation:ds-pop .12s ease-out}
.ds-composer[data-pass]{opacity:.3;pointer-events:none}
.ds-composer-h{display:flex;align-items:center;gap:6px;min-width:0}
.ds-target{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--dsw-alias-label-secondary)}
.ds-target code{font-family:ui-monospace,Consolas,monospace;font-size:11px;color:var(--dsw-alias-label-primary)}
.ds-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.ds-nick{display:flex;align-items:center;gap:6px;color:var(--dsw-alias-label-secondary);font-size:12px}
.ds-nick input{height:24px;width:120px;padding:0 7px}
.ds-group{border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-base);margin-bottom:8px;overflow:hidden}
.ds-group-h{display:flex;align-items:center;gap:8px;width:100%;height:34px;padding:0 10px;border:0;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer;text-align:left}
.ds-group-h:hover{background:var(--dsw-alias-bg-layer-2)}
.ds-group-h .ds-ic{transition:transform .15s;color:var(--dsw-alias-label-secondary)}
.ds-group-h[aria-expanded=false] .ds-ic{transform:rotate(-90deg)}
.ds-group-h b{font-weight:600}
.ds-pill{display:inline-flex;align-items:center;height:18px;padding:0 6px;border-radius:9px;font-size:11px;font-weight:600;white-space:nowrap;flex:none}
.ds-pill[data-level=must]{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 14%,transparent);color:var(--dsw-alias-state-error-primary)}
.ds-pill[data-level=hint]{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 16%,transparent);color:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 70%,var(--dsw-alias-label-primary))}
.ds-issue{display:flex;align-items:flex-start;gap:8px;padding:7px 10px;border-top:1px solid var(--dsw-alias-border-l1)}
.ds-issue-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;cursor:pointer}
.ds-issue-t{font-weight:500;line-height:1.45}
.ds-issue-d{color:var(--dsw-alias-label-secondary);font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ds-issue[data-open] .ds-issue-d{white-space:normal}
.ds-kv{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;align-items:baseline;padding:8px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-base);margin-bottom:8px}
.ds-kv>span:nth-child(odd){color:var(--dsw-alias-label-secondary)}
.ds-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px;word-break:break-all}
.ds-swatch{display:inline-block;width:10px;height:10px;border-radius:3px;border:1px solid var(--dsw-alias-border-l2);vertical-align:-1px;margin-right:4px}
.ds-zone{position:absolute;z-index:40;pointer-events:none;background:color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent);border:2px dashed var(--dsw-alias-brand-primary);border-radius:8px;transition:all .1s}
.ds-dragbox{position:absolute;z-index:41;pointer-events:none;border:2px solid var(--dsw-alias-brand-primary);border-radius:10px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 70%,transparent)}
.ds-draghint{position:absolute;z-index:42;left:50%;top:10px;transform:translateX(-50%);padding:4px 10px;border-radius:12px;background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-base);font-size:12px;pointer-events:none}
.ds-toast{position:absolute;z-index:50;left:50%;bottom:16px;transform:translateX(-50%);padding:7px 12px;border-radius:8px;background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-base);font-size:12px;box-shadow:0 6px 18px rgba(0,0,0,.2);pointer-events:none;animation:ds-pop .12s ease-out}
.ds-page{display:grid;grid-template-columns:minmax(0,560px);gap:14px;font-size:13px}
.ds-scard{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:14px 16px;display:flex;flex-direction:column;gap:10px}
.ds-field{display:flex;flex-direction:column;gap:6px}
.ds-field>span{font-size:12px;color:var(--dsw-alias-label-secondary)}
@container (max-width:560px){.ds-lbl,.ds-zoom{display:none}.ds-seg button{padding:0 7px}.ds-bar{gap:4px;padding:6px}}
@container (max-width:400px){.ds-vp-w{display:none}}
@media (prefers-reduced-motion:reduce){.ds-root *,.ds-menu,.ds-composer,.ds-toast{animation:none!important;transition:none!important}}
`

    // ── 工作台 ─────────────────────────────────────────
    const PANEL_DEFAULT = { open: false, tab: 'notes', dock: 'bottom', size: { bottom: 240, top: 240, left: 320, right: 320 }, float: { x: null, y: null, w: 420, h: 320 } }
    function loadPanel() {
      const p = store.get('panel', null)
      if (!p || typeof p !== 'object') return PANEL_DEFAULT
      return Object.assign({}, PANEL_DEFAULT, p, { size: Object.assign({}, PANEL_DEFAULT.size, p.size), float: Object.assign({}, PANEL_DEFAULT.float, p.float), dock: DOCKS.includes(p.dock) ? p.dock : 'bottom' })
    }

    function makeWorkbench(ctx, describeOnce) {
      return function Workbench(props) {
        const { content, resourceAddress, readRelated, inputActions } = props
        const file = useMemo(() => parseAddress(resourceAddress), [resourceAddress])
        const sessionId = props.sessionId || (file && file.sessionId)
        const filePath = file ? file.path : ''
        const fileName = filePath.split('/').pop() || ''
        const storeKey = 'notes:' + filePath.replace(/\\/g, '/').toLowerCase().replace(/\.annotated(\.html?)$/, '$1')
        const [config, setConfig] = useState(null)
        const [vp, setVp] = useState(null)
        const [mode, setMode] = useState('browse')
        const [frame, setFrame] = useState(null)
        const [ready, setReady] = useState(false)
        const [stageW, setStageW] = useState(0)
        const [selection, setSelection] = useState([])
        const [anchor, setAnchor] = useState(null)
        const [draft, setDraftText] = useState('')
        const [draftColor, setDraftColor] = useState(() => store.get('color', COLORS[0]))
        const [me, setMe] = useState(getMe)
        const [nickEdit, setNickEdit] = useState(false)
        const [doc, setDoc] = useState({ docId: '', notes: [], people: {}, removed: [] })
        const [focusNote, setFocusNote] = useState(null)
        const [qa, setQa] = useState(null)
        const [qaBusy, setQaBusy] = useState(false)
        const [qaCat, setQaCat] = useState('all')
        const [mustOnly, setMustOnly] = useState(false)
        const [collapsed, setCollapsed] = useState({})
        const [openIssue, setOpenIssue] = useState(null)
        const [ignored, setIgnored] = useState([])
        const [panel, setPanelState] = useState(loadPanel)
        const [drag, setDrag] = useState(null)
        const [exportState, setExportState] = useState(null)
        const [toast, setToast] = useState('')
        const [, setTick] = useState(0)
        const [shiftHeld, setShiftHeld] = useState(false)
        const frameRef = useRef(null)
        const stageRef = useRef(null)
        const rootRef = useRef(null)
        const bodyRef = useRef(null)
        const panelRef = useRef(null)
        const pending = useRef(new Map())
        const routeRef = useRef('')
        const frameSeq = useRef(0)
        const live = useRef({})
        const composerRef = useRef(null)

        const setPanel = useCallback((patch) => setPanelState((p) => { const n = Object.assign({}, p, typeof patch === 'function' ? patch(p) : patch); store.set('panel', n); return n }), [])
        const flash = useCallback((s) => { setToast(s); clearTimeout(live.current.toastTimer); live.current.toastTimer = setTimeout(() => setToast(''), 2600) }, [])

        useEffect(() => { let alive = true; describeOnce().then((d) => { if (alive && d && d.ok) { setConfig(d); setVp((v) => v || d.config.defaultViewport || 'desktop') } }, () => { if (alive) setVp((v) => v || 'desktop') }); return () => { alive = false } }, [])
        const viewport = VIEWPORTS.find((v) => v.id === (vp || 'desktop')) || VIEWPORTS[0]

        // 打包并生成 iframe 文档
        const data = content && content.kind === 'bytes' ? content.data : null
        useEffect(() => {
          if (!data) return undefined
          const controller = new AbortController()
          setFrame(null)
          routeRef.current = ''
          ;(async () => {
            try {
              const bundle = await packDocument(data, readRelated, resourceAddress, controller.signal)
              if (controller.signal.aborted) return
              setFrame({ id: ++frameSeq.current, srcdoc: frameDocument(bundle), assets: bundle.assets.length, annotations: bundle.annotations })
            } catch (e) {
              if (!controller.signal.aborted) setFrame({ error: String(e && e.message || e) })
            }
          })()
          return () => controller.abort()
        }, [data, resourceAddress, readRelated])
        useEffect(() => { setQa(null); setSelection([]); setAnchor(null); setReady(false) }, [data, vp])

        // 批注数据：本地存储 + 文件里嵌入的批注合并
        useEffect(() => {
          const local = store.get(storeKey, null) || { docId: '', notes: [], people: {}, removed: [] }
          const emb = frame && frame.annotations
          setDoc({
            docId: (emb && emb.docId) || local.docId || uid('d'),
            notes: mergeNotes(local.notes, emb && emb.notes, local.removed),
            people: Object.assign({}, emb && emb.people, local.people),
            removed: local.removed || [],
          })
        }, [storeKey, frame && frame.annotations])
        useEffect(() => { if (doc.docId) store.set(storeKey, doc) }, [doc])
        const notes = doc.notes
        const names = useMemo(() => displayNames(notes, doc.people, me), [notes, doc.people, me])
        const updateNotes = (fn) => setDoc((d) => Object.assign({}, d, { notes: fn(d.notes) }))
        const patchNote = (id, patch) => updateNotes((list) => list.map((n) => (n.id === id ? Object.assign({}, n, patch, { updated: Date.now() }) : n)))

        // 舞台尺寸 → 缩放
        useEffect(() => {
          const el = stageRef.current
          if (!el || typeof ResizeObserver === 'undefined') return undefined
          const ro = new ResizeObserver(() => { setStageW(el.clientWidth); setTick((t) => t + 1) })
          ro.observe(el)
          setStageW(el.clientWidth)
          const onScroll = () => setTick((t) => t + 1)
          el.addEventListener('scroll', onScroll, { passive: true })
          return () => { ro.disconnect(); el.removeEventListener('scroll', onScroll) }
        }, [frame, panel.dock, panel.open])
        const scale = stageW > 0 ? Math.min(1, (stageW - 24) / viewport.w) : 1
        const frameH = Math.max(viewport.h, 600)

        // iframe 消息
        const send = useCallback((msg) => { const w = frameRef.current && frameRef.current.contentWindow; if (w) { msg[TAG] = true; w.postMessage(msg, '*') } }, [])
        const pinPayload = useMemo(() => notes.map((n) => ({ id: n.id, label: n.name || '·', color: n.color, comment: n.comment, targets: n.targets })), [notes])
        live.current.mode = mode
        live.current.selection = selection
        useEffect(() => {
          const onMsg = (e) => {
            const d = e.data
            if (!d || d[TAG] !== true || !frameRef.current || e.source !== frameRef.current.contentWindow) return
            if (d.type === 'ready') {
              setReady(true)
              send({ type: 'mode', mode: live.current.mode })
              if (routeRef.current && routeRef.current !== d.hash) send({ type: 'route', hash: routeRef.current })
            } else if (d.type === 'select') {
              setSelection((cur) => (d.additive ? cur.filter((x) => x.selector !== d.item.selector).concat([d.item]) : [d.item]))
              setAnchor(d.item.vrect)
              // Shift 追加选择时焦点留在预览里，方便继续多选；单选时把光标放进输入框
              if (!d.additive) setTimeout(() => { try { composerRef.current && composerRef.current.focus({ preventScroll: true }) } catch (x) {} }, 0)
            } else if (d.type === 'unselect') {
              setSelection((cur) => { const next = cur.filter((x) => x.selector !== d.selector); if (!next.length) setAnchor(null); return next })
            } else if (d.type === 'sel-rect') setAnchor(d.vrect)
            else if (d.type === 'shift') setShiftHeld(!!d.down)
            else if (d.type === 'qa-result') { const p = pending.current.get(d.id); if (p) { pending.current.delete(d.id); p(d.result) } }
            else if (d.type === 'route') routeRef.current = d.hash || ''
            else if (d.type === 'pin') { setFocusNote(d.id); setPanel({ open: true, tab: 'notes' }) }
            else if (d.type === 'esc') {
              if (live.current.selection.length) { setSelection([]); setAnchor(null); send({ type: 'clear' }) } else if (live.current.mode === 'select') setMode('browse')
            } else if (d.type === 'locate-miss') flash(tr('locateMiss'))
            else if (d.type === 'open-url') { try { window.open(d.href, '_blank', 'noopener,noreferrer') } catch (x) {} }
            else if (d.type === 'open-file') {
              const target = resolveRelative(filePath, d.href)
              try { const sr = ctx.get('sidebarRight'); if (sr && sr.openResource && sessionId) { sr.openResource(sessionFileAddress(sessionId, target)); flash(tr('fileOpened', { name: target.split('/').pop() })) } } catch (x) {}
            }
          }
          window.addEventListener('message', onMsg)
          return () => window.removeEventListener('message', onMsg)
        }, [send, filePath, sessionId, flash, setPanel])
        useEffect(() => { send({ type: 'mode', mode }); if (mode !== 'select') { setSelection([]); setAnchor(null) } }, [mode, send])
        useEffect(() => { if (ready) send({ type: 'scale', scale }) }, [scale, ready, send])
        useEffect(() => { if (ready) send({ type: 'notes', notes: pinPayload, focus: focusNote }) }, [pinPayload, focusNote, ready, send])

        const runQa = useCallback(() => new Promise((resolve) => {
          const id = 'qa' + Date.now() + Math.random().toString(36).slice(2, 6)
          const timer = setTimeout(() => { pending.current.delete(id); resolve({ error: 'timeout', issues: [], stats: {} }) }, 20000)
          pending.current.set(id, (r) => { clearTimeout(timer); resolve(r) })
          send({ type: 'qa', id, options: { bannedWords: config && config.config.bannedWords, targetChars: config && config.config.targetChars } })
        }), [send, config])
        const doQa = async () => { setQaBusy(true); setPanel({ open: true, tab: 'qa' }); const r = await runQa(); setQa(r); setIgnored([]); setQaBusy(false); return r }

        const setComposerDraft = (text) => {
          try { if (inputActions && typeof inputActions.setDraft === 'function') { inputActions.setDraft(text); return true } } catch (e) {}
          try {
            const conv = ctx.get('conversation')
            const scope = ctx.sessions && ctx.sessions.scope ? ctx.sessions.scope(sessionId) : undefined
            if (conv && conv.input && scope) { const f = conv.input.for(scope); f.setDraft(text); try { f.focus && f.focus() } catch (e) {} return true }
          } catch (e) {}
          try { navigator.clipboard.writeText(text) } catch (e) {}
          return false
        }
        const deliver = (text) => flash(setComposerDraft(text) ? tr('sent') : tr('copied'))

        // ── 批注操作 ──
        const commitNick = (value) => { const next = Object.assign({}, me, { name: String(value || '').trim().slice(0, 24), named: true }); store.set('me', next); setMe(next); if (next.name) setDoc((d) => Object.assign({}, d, { people: Object.assign({}, d.people, { [next.id]: next.name }) })); setNickEdit(false) }
        const ensureNamed = () => { if (!me.named) { const next = Object.assign({}, me, { named: true }); store.set('me', next); setMe(next) } }
        const nextName = () => String(1 + notes.reduce((m, n) => Math.max(m, /^\d+$/.test(n.name || '') ? Number(n.name) : 0), 0))
        const addNote = () => {
          if (!selection.length || !draft.trim()) return
          ensureNamed()
          const now = Date.now()
          const note = { id: uid('n'), name: nextName(), color: draftColor, comment: draft.trim(), author: { id: me.id, name: me.name }, time: now, updated: now, targets: selection.map((s) => ({ selector: s.selector, tag: s.tag, text: s.text, route: s.route || '', styles: s.styles, html: s.html, rect: s.rect })), replies: [] }
          updateNotes((list) => list.concat([note]))
          store.set('color', draftColor)
          setDraftText(''); closeComposer()
        }
        // 关闭批注气泡并把焦点还给预览：可以接着点选下一个元素，Esc 也能直接退出批注模式
        function closeComposer() { setSelection([]); setAnchor(null); send({ type: 'clear' }); try { frameRef.current && frameRef.current.focus() } catch (x) {} }
        const removeNote = (id) => setDoc((d) => Object.assign({}, d, { notes: d.notes.filter((n) => n.id !== id), removed: d.removed.concat([id]) }))
        const clearNotes = () => setDoc((d) => Object.assign({}, d, { notes: [], removed: d.removed.concat(d.notes.map((n) => n.id)) }))
        const addReply = (id, text) => { if (!text.trim()) return false; ensureNamed(); updateNotes((list) => list.map((n) => (n.id === id ? Object.assign({}, n, { replies: n.replies.concat([{ id: uid('r'), author: { id: me.id, name: me.name }, time: Date.now(), text: text.trim() }]) }) : n))); return true }
        const locateNote = (n) => { setFocusNote(n.id); if (n.targets[0]) send({ type: 'locate', target: n.targets[0] }) }

        const describeTarget = (t) => {
          const s = t.styles || {}
          const style = s.fontSize ? ' 字号 ' + s.fontSize + ' · 字重 ' + s.fontWeight + ' · 颜色 ' + s.color + (s.background && s.background !== 'rgba(0, 0, 0, 0)' ? ' · 背景 ' + s.background : '') : ''
          return '[' + t.selector + ']' + (t.route ? ' 路由 ' + t.route : '') + ' 「' + (t.text || '').slice(0, 80) + '」' + style + (t.html ? '\n   HTML：' + t.html.replace(/\s+/g, ' ').slice(0, 240) : '')
        }
        const sendNotes = () => {
          const lines = [tr('msgHead', { file: filePath })]
          notes.forEach((n, i) => {
            lines.push((CIRCLED[i] || (i + 1) + '.') + ' 【' + (n.name || i + 1) + '】' + n.comment)
            n.targets.forEach((t) => lines.push('   ' + describeTarget(t)))
            n.replies.forEach((r) => lines.push('   ' + tr('msgReply') + '（' + names[r.author && r.author.id] + '）：' + r.text))
          })
          lines.push(tr('msgViewport', { w: viewport.w }))
          deliver(lines.join('\n'))
        }

        // ── QA ──
        const issueText = (i, k) => (CIRCLED[k] || (k + 1) + '.') + ' [' + (i.level === 'must' ? '必改' : '建议') + '·' + tr('cat_' + i.cat) + '] ' + i.title + (i.detail ? '｜' + i.detail : '') + (i.selector ? '｜位置 ' + i.selector : '') + (i.fix ? ' → ' + i.fix : '')
        const liveIssues = qa && qa.issues ? qa.issues.filter((i) => !ignored.includes(i.id)) : []
        const shownIssues = liveIssues.filter((i) => (qaCat === 'all' || i.cat === qaCat) && (!mustOnly || i.level === 'must'))
        const issueToNote = (i) => {
          const now = Date.now()
          updateNotes((list) => list.concat([{ id: uid('n'), name: nextName(), color: i.level === 'must' ? COLORS[0] : COLORS[1], comment: '[QA] ' + i.title + (i.fix ? '，' + i.fix : ''), author: { id: me.id, name: me.name }, time: now, updated: now, targets: i.selector ? [{ selector: i.selector, tag: '', text: '', route: routeRef.current }] : [], replies: [] }]))
          flash(tr('toNote') + ' ✓')
        }
        const sendAllIssues = () => deliver([tr('msgQaHead', { file: filePath })].concat(shownIssues.map(issueText)).join('\n'))

        // ── 导出 ──
        const doExport = async (force) => {
          setExportState({ busy: true })
          try {
            if (!force && (!config || config.config.qaBeforeExport !== false)) {
              const r = await runQa()
              setQa(r)
              const must = (r.issues || []).filter((i) => i.level === 'must').length
              if (must > 0) { setExportState({ confirm: must }); return }
            }
            const r = await bridge('/export', { sessionId, path: filePath, force: true })
            if (!r.ok) throw new Error(r.error || 'export failed')
            setExportState({ done: r, kind: 'pdf' })
          } catch (e) { setExportState({ error: String(e && e.message || e) }) }
        }
        const doExportHtml = async () => {
          setExportState({ busy: true })
          try {
            const clean = notes.map((n) => Object.assign({}, n, { targets: n.targets.map((t) => ({ selector: t.selector, tag: t.tag, text: t.text, route: t.route || '' })) }))
            const r = await bridge('/annotated', { sessionId, path: filePath, notes: clean, people: doc.people, docId: doc.docId, title: fileName })
            if (!r.ok) throw new Error(r.error || 'export failed')
            setExportState({ done: r, kind: 'html' })
          } catch (e) { setExportState({ error: String(e && e.message || e) }) }
        }
        const openFile = (p) => { try { const sr = ctx.get('sidebarRight'); if (sr && sr.openResource) sr.openResource(sessionFileAddress(sessionId, p)) } catch (e) {} }

        // ── 面板拖动停靠 / 调整大小 ──
        const zoneOf = (x, y) => {
          const b = bodyRef.current.getBoundingClientRect()
          const m = Math.min(64, b.width * 0.18, b.height * 0.22)
          if (y - b.top < m) return 'top'
          if (b.bottom - y < m) return 'bottom'
          if (x - b.left < m) return 'left'
          if (b.right - x < m) return 'right'
          return 'float'
        }
        const onHeadDown = (e) => {
          if (e.button !== 0 || e.target.closest('button,input,textarea,select')) return
          e.preventDefault()
          const pr = panelRef.current.getBoundingClientRect()
          const b = bodyRef.current.getBoundingClientRect()
          const start = { x: e.clientX, y: e.clientY, dx: e.clientX - pr.left, dy: e.clientY - pr.top, w: Math.min(panel.float.w, b.width - 16), h: Math.min(panel.float.h, b.height - 16) }
          const el = e.currentTarget
          el.setPointerCapture(e.pointerId)
          let moved = false
          const move = (ev) => {
            if (!moved && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 5) return
            moved = true
            const x = Math.min(Math.max(ev.clientX - b.left - Math.min(start.dx, start.w - 40), 0), b.width - start.w)
            const y = Math.min(Math.max(ev.clientY - b.top - Math.min(start.dy, 18), 0), b.height - 40)
            setDrag({ x, y, w: start.w, h: start.h, zone: zoneOf(ev.clientX, ev.clientY) })
          }
          const up = (ev) => {
            el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up)
            if (!moved) return
            setDrag((dr) => {
              if (dr) {
                if (dr.zone === 'float') setPanel((p) => ({ dock: 'float', float: Object.assign({}, p.float, { x: Math.round(dr.x), y: Math.round(dr.y) }) }))
                else setPanel({ dock: dr.zone })
              }
              return null
            })
          }
          el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up)
        }
        const onSplitDown = (e) => {
          if (e.button !== 0) return
          const el = e.currentTarget
          el.setPointerCapture(e.pointerId)
          el.setAttribute('data-active', '')
          const dock = panel.dock
          const b = bodyRef.current.getBoundingClientRect()
          const start = { x: e.clientX, y: e.clientY, size: panel.size[dock] }
          const vertical = dock === 'bottom' || dock === 'top'
          const max = (vertical ? b.height : b.width) - 160
          const move = (ev) => {
            const delta = vertical ? ev.clientY - start.y : ev.clientX - start.x
            const sign = dock === 'bottom' || dock === 'right' ? -1 : 1
            const size = Math.round(Math.min(Math.max(start.size + sign * delta, 120), Math.max(160, max)))
            setPanelState((p) => Object.assign({}, p, { size: Object.assign({}, p.size, { [dock]: size }) }))
          }
          const up = () => { el.removeAttribute('data-active'); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); setPanelState((p) => { store.set('panel', p); return p }) }
          el.addEventListener('pointermove', move); el.addEventListener('pointerup', up)
        }
        // 浮动面板：记住用户拖出来的尺寸
        useEffect(() => {
          const el = panelRef.current
          if (!el || panel.dock !== 'float' || !panel.open || typeof ResizeObserver === 'undefined') return undefined
          let t = 0
          const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => { const w = el.offsetWidth, hh = el.offsetHeight; setPanel((p) => (Math.abs(p.float.w - w) > 2 || Math.abs(p.float.h - hh) > 2 ? { float: Object.assign({}, p.float, { w, h: hh }) } : {})) }, 200) })
          ro.observe(el)
          return () => { clearTimeout(t); ro.disconnect() }
        }, [panel.dock, panel.open, setPanel])

        if (!data) return null
        const mustCount = qa && qa.issues ? liveIssues.filter((i) => i.level === 'must').length : null
        const busy = exportState && exportState.busy
        const frameOk = frame && frame.srcdoc

        // ── 工具栏 ──
        const toolbar = h('div', { className: 'ds-bar' },
          h(Menu, {
            icon: 'monitor', title: tr('viewport'),
            label: h('span', null, h('span', { className: 'ds-lbl' }, tr('vp_' + viewport.id) + ' '), h('span', { className: 'ds-vp-w' }, viewport.w), h('span', { className: 'ds-zoom' }, ' · ' + Math.round(scale * 100) + '%')),
            items: VIEWPORTS.map((v) => ({ key: v.id, label: tr('vp_' + v.id), hint: v.w + ' px', checked: v.id === viewport.id, onSelect: () => setVp(v.id) })),
          }),
          h('div', { className: 'ds-seg', role: 'radiogroup', 'aria-label': tr('annotate') },
            h('button', { type: 'button', role: 'radio', 'aria-checked': mode === 'browse', title: tr('browseTip'), 'aria-label': tr('browse'), onClick: () => setMode('browse') }, h(Icon, { name: 'cursor', size: 14 }), h('span', { className: 'ds-lbl' }, tr('browse'))),
            h('button', { type: 'button', role: 'radio', 'data-annot': '', 'aria-checked': mode === 'select', title: tr('annotateTip'), 'aria-label': tr('annotate'), onClick: () => setMode('select') }, h(Icon, { name: 'note', size: 14 }), h('span', { className: 'ds-lbl' }, tr('annotate')))),
          h('span', { className: 'ds-sp' }),
          h('button', { type: 'button', className: 'ds-btn', title: tr('qaTip'), 'aria-pressed': panel.open && panel.tab === 'qa', disabled: qaBusy || !frameOk || !ready, onClick: () => (qa && !qaBusy ? setPanel((p) => (p.open && p.tab === 'qa' ? { open: false } : { open: true, tab: 'qa' })) : doQa()) },
            h(Icon, { name: 'shield' }), qaBusy ? tr('qaRunning') : tr('qa'), mustCount !== null ? h('span', { className: 'ds-badge', 'data-ok': mustCount === 0 ? '' : undefined }, mustCount === 0 ? '✓' : String(mustCount)) : null),
          h('button', { type: 'button', className: 'ds-btn ds-icon', title: tr('panelTip'), 'aria-label': tr('panel'), 'aria-pressed': panel.open, onClick: () => setPanel((p) => ({ open: !p.open })), style: notes.length ? { width: 'auto', padding: '0 7px' } : undefined },
            h(Icon, { name: 'dock_' + panel.dock }), notes.length ? h('span', { className: 'ds-badge', 'data-neutral': '' }, String(notes.length)) : null),
          h(Menu, {
            primary: true, align: 'right', icon: 'download', label: busy ? tr('exporting') : tr('exportBtn'), disabled: busy || !frameOk,
            items: [
              { key: 'pdf', icon: 'download', label: tr('exportPdf'), onSelect: () => doExport(false) },
              { key: 'html', icon: 'note', label: tr('exportHtml'), hint: String(notes.length), disabled: !notes.length, onSelect: doExportHtml },
            ],
          }))

        const es = exportState
        const banner = es && (es.confirm || es.done || es.error) ? h('div', { className: 'ds-banner', 'data-tone': es.error ? 'bad' : es.confirm ? 'warn' : 'ok', role: 'status' },
          es.confirm ? [
            h('b', { key: 't' }, tr('confirmTitle', { n: es.confirm })), h('span', { key: 's', className: 'ds-sp' }),
            h('button', { key: 'v', type: 'button', className: 'ds-btn', onClick: () => { setPanel({ open: true, tab: 'qa' }); setMustOnly(true); setExportState(null) } }, tr('viewIssues')),
            h('button', { key: 'a', type: 'button', className: 'ds-btn ds-primary', onClick: () => doExport(true) }, tr('exportAnyway'))] : null,
          es.done ? [
            h('span', { key: 't' }, es.kind === 'html' ? tr('htmlExported', { name: es.done.path.split(/[\\/]/).pop(), n: es.done.notes }) : tr('exported', { name: es.done.pdfPath.split(/[\\/]/).pop(), pages: es.done.pages })), h('span', { key: 's', className: 'ds-sp' }),
            h('button', { key: 'o', type: 'button', className: 'ds-btn', onClick: () => openFile(es.kind === 'html' ? es.done.path : es.done.pdfPath) }, tr('open'))] : null,
          es.error ? [h('span', { key: 't', className: 'ds-status', 'data-bad': '', style: { padding: 0 } }, tr('exportFail', { e: es.error })), h('span', { key: 's', className: 'ds-sp' })] : null,
          h('button', { type: 'button', className: 'ds-btn ds-ghost ds-icon', 'aria-label': tr('cancel'), onClick: () => setExportState(null) }, h(Icon, { name: 'close', size: 14 }))) : null

        // ── 预览舞台 ──
        const stage = h('div', { className: 'ds-stage', ref: stageRef, key: 'stage' },
          !frame ? h('div', { className: 'ds-status' }, tr('loading')) :
            frame.error ? h('div', { className: 'ds-status', 'data-bad': '' }, tr('failed', { e: frame.error })) :
              h('div', { style: { width: viewport.w * scale, height: frameH * scale, margin: '12px auto' } },
                h('div', { className: 'ds-canvas', style: { width: viewport.w, height: frameH, transform: 'scale(' + scale + ')' } },
                  h('iframe', { ref: frameRef, key: frame.id + ':' + viewport.id, className: 'ds-frame', srcDoc: frame.srcdoc, sandbox: 'allow-scripts', title: tr('title'), style: { width: viewport.w, height: frameH } }))))

        // ── 批注气泡（就地输入，不占用面板）──
        let composer = null
        if (mode === 'select' && selection.length && anchor && frameRef.current && bodyRef.current) {
          const fr = frameRef.current.getBoundingClientRect()
          const br = bodyRef.current.getBoundingClientRect()
          const ax = fr.left - br.left + anchor.x * scale
          const ay = fr.top - br.top + anchor.y * scale
          const ah = anchor.h * scale
          const W = Math.min(288, br.width - 16), H = 196
          // 优先放在所选元素上方：紧随其后的内容（下一段、下一行）保持可点，方便 Shift 连选
          let top = ay - H - 8
          if (top < 8) top = ay + ah + 8
          top = Math.min(Math.max(8, top), Math.max(8, br.height - H - 8))
          const left = Math.min(Math.max(8, ax), Math.max(8, br.width - W - 8))
          const s0 = selection[selection.length - 1]
          composer = h('div', { className: 'ds-composer', role: 'dialog', 'aria-label': tr('annotate'), 'data-pass': shiftHeld ? '' : undefined, style: { left, top, width: W } },
            h('div', { className: 'ds-composer-h' },
              h('span', { className: 'ds-target', title: s0.selector }, h('code', null, s0.tag), ' ', (s0.text || '').slice(0, 40), selection.length > 1 ? ' ' + tr('more', { n: selection.length - 1 }) : ''),
              h('button', { type: 'button', className: 'ds-act', 'aria-label': tr('cancel'), onClick: closeComposer }, h(Icon, { name: 'close', size: 14 }))),
            h('textarea', {
              className: 'ds-input', rows: 3, value: draft, placeholder: tr('commentPh') + ' · Ctrl+Enter', autoFocus: true, ref: composerRef,
              onChange: (e) => setDraftText(e.target.value),
              // 输入框为空时按住 Shift = 准备多选：气泡变半透明并让点击穿透到预览
              onKeyUp: (e) => { if (e.key === 'Shift') setShiftHeld(false) },
              onBlur: () => setShiftHeld(false),
              onKeyDown: (e) => { if (e.key === 'Shift' && !e.repeat && !draft.trim()) setShiftHeld(true); if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); addNote() } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeComposer() } },
            }),
            h('div', { className: 'ds-row' },
              h('div', { className: 'ds-dots', role: 'radiogroup', 'aria-label': tr('color') }, COLORS.map((c) => h('button', { key: c, type: 'button', role: 'radio', className: 'ds-dot', 'aria-checked': draftColor === c, 'aria-label': c, style: { background: c }, onClick: () => setDraftColor(c) }))),
              h('span', { className: 'ds-sp' }),
              !me.named || nickEdit
                ? h('label', { className: 'ds-nick' }, h('input', { className: 'ds-input', placeholder: tr('nickPh'), defaultValue: me.name, 'aria-label': tr('nick'), onBlur: (e) => commitNick(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur() } } }))
                : h('button', { type: 'button', className: 'ds-chip', title: tr('nickEdit'), onClick: () => setNickEdit(true) }, names[me.id], ' ✎')),
            h('div', { className: 'ds-row' },
              h('span', { className: 'ds-muted' }, tr('multiHint')),
              h('span', { className: 'ds-sp' }),
              h('button', { type: 'button', className: 'ds-btn ds-primary', disabled: !draft.trim(), onClick: addNote }, tr('add'))))
        }

        // ── 面板：批注 ──
        const notesTab = () => {
          if (!notes.length) return h('div', { className: 'ds-empty' }, h('b', null, tr('notesEmpty')), h('span', null, tr('notesEmptyHint')),
            mode !== 'select' ? h('button', { type: 'button', className: 'ds-btn', onClick: () => setMode('select') }, h(Icon, { name: 'note' }), tr('startAnnotate')) : null)
          return h(React.Fragment, null,
            h('div', { className: 'ds-tools' },
              h('button', { type: 'button', className: 'ds-btn ds-primary', onClick: sendNotes }, h(Icon, { name: 'send', size: 14 }), tr('sendAll'), h('span', { className: 'ds-zoom', style: { color: 'inherit', opacity: 0.7 } }, String(notes.length))),
              h('button', { type: 'button', className: 'ds-btn', onClick: doExportHtml, disabled: busy }, h(Icon, { name: 'download', size: 14 }), tr('exportHtml')),
              h('span', { className: 'ds-sp' }),
              h(ConfirmButton, { label: tr('clear'), confirm: tr('clearConfirm'), onConfirm: clearNotes })),
            h('div', { className: 'ds-grid', style: panel.dock === 'left' || panel.dock === 'right' ? { gridTemplateColumns: '1fr' } : undefined },
              notes.map((n) => h(NoteCard, { key: n.id, n, names, focused: focusNote === n.id, onFocus: () => setFocusNote(n.id), onLocate: () => locateNote(n), onRemove: () => removeNote(n.id), onPatch: (p) => patchNote(n.id, p), onReply: (t) => addReply(n.id, t) }))))
        }

        // ── 面板：QA（按类别分组，可筛选）──
        const qaTab = () => {
          if (qaBusy) return h('div', { className: 'ds-empty' }, h('b', null, tr('qaRunning')))
          if (!qa) return h('div', { className: 'ds-empty' }, h('b', null, tr('qaNotRun')), h('button', { type: 'button', className: 'ds-btn ds-primary', disabled: !ready, onClick: doQa }, h(Icon, { name: 'shield' }), tr('qaStart')))
          if (qa.error) return h('div', { className: 'ds-empty' }, h('span', { className: 'ds-status', 'data-bad': '' }, tr('qaError', { e: qa.error })), h('button', { type: 'button', className: 'ds-btn', onClick: doQa }, tr('qaRerun')))
          const st = qa.stats || {}
          const counts = {}
          for (const i of liveIssues) { const c = counts[i.cat] || (counts[i.cat] = { n: 0, must: 0 }); c.n++; if (i.level === 'must') c.must++ }
          const cats = CATS.filter((c) => counts[c]).concat(Object.keys(counts).filter((c) => !CATS.includes(c)))
          const must = liveIssues.filter((i) => i.level === 'must').length
          const head = h('div', { className: 'ds-tools' },
            must ? h('span', { className: 'ds-pill', 'data-level': 'must' }, tr('mustN', { n: must })) : null,
            liveIssues.length - must ? h('span', { className: 'ds-pill', 'data-level': 'hint' }, tr('hintN', { n: liveIssues.length - must })) : null,
            h('span', { className: 'ds-muted' }, tr('stats', { cjk: st.cjk || 0, words: st.words || 0, fig: st.figures || 0, tab: st.tables || 0 }) + (st.pages ? tr('statsPages', { pages: st.pages }) : '')),
            h('span', { className: 'ds-sp' }),
            h('button', { type: 'button', className: 'ds-btn ds-ghost', onClick: doQa }, h(Icon, { name: 'refresh', size: 14 }), tr('qaRerun')),
            shownIssues.length ? h('button', { type: 'button', className: 'ds-btn', onClick: sendAllIssues }, h(Icon, { name: 'send', size: 14 }), tr('allToAgent')) : null)
          if (!liveIssues.length) return h(React.Fragment, null, head, h('div', { className: 'ds-empty' }, h('b', null, '✓ ' + tr('qaEmpty')), ignored.length ? h('button', { type: 'button', className: 'ds-link', onClick: () => setIgnored([]) }, tr('ignored', { n: ignored.length }) + ' · ' + tr('restore')) : null))
          const filters = h('div', { className: 'ds-tools', role: 'toolbar' },
            h('button', { type: 'button', className: 'ds-chip', 'aria-pressed': qaCat === 'all', onClick: () => setQaCat('all') }, tr('all'), h('span', { className: 'ds-cnt' }, String(liveIssues.length))),
            cats.map((c) => h('button', { key: c, type: 'button', className: 'ds-chip', 'aria-pressed': qaCat === c, title: tr('catd_' + c), onClick: () => setQaCat(qaCat === c ? 'all' : c) }, counts[c].must ? h('span', { className: 'ds-mdot' }) : null, tr('cat_' + c), h('span', { className: 'ds-cnt' }, String(counts[c].n)))),
            h('span', { className: 'ds-sp' }),
            h('button', { type: 'button', className: 'ds-chip', 'aria-pressed': mustOnly, onClick: () => setMustOnly((v) => !v) }, tr('mustOnly')))
          const groups = (qaCat === 'all' ? cats : [qaCat]).map((c) => {
            const items = shownIssues.filter((i) => i.cat === c).sort((a, b) => (a.level === b.level ? 0 : a.level === 'must' ? -1 : 1))
            if (!items.length) return null
            const isOpen = !collapsed[c]
            const m = items.filter((i) => i.level === 'must').length
            return h('div', { key: c, className: 'ds-group' },
              h('button', { type: 'button', className: 'ds-group-h', 'aria-expanded': isOpen, onClick: () => setCollapsed((x) => Object.assign({}, x, { [c]: isOpen })) },
                h(Icon, { name: 'chevron', size: 14 }), h('b', null, tr('cat_' + c)), h('span', { className: 'ds-muted' }, tr('catd_' + c)), h('span', { className: 'ds-sp' }),
                m ? h('span', { className: 'ds-pill', 'data-level': 'must' }, String(m)) : null,
                items.length - m ? h('span', { className: 'ds-pill', 'data-level': 'hint' }, String(items.length - m)) : null),
              isOpen ? items.map((i) => h('div', { key: i.id, className: 'ds-issue', 'data-open': openIssue === i.id ? '' : undefined },
                h('span', { className: 'ds-pill', 'data-level': i.level }, i.level === 'must' ? tr('must') : tr('hint')),
                h('div', { className: 'ds-issue-main', onClick: () => setOpenIssue(openIssue === i.id ? null : i.id), title: i.fix ? '→ ' + i.fix : '' },
                  h('span', { className: 'ds-issue-t' }, i.title),
                  i.detail ? h('span', { className: 'ds-issue-d' }, i.detail) : null,
                  openIssue === i.id && i.fix ? h('span', { className: 'ds-issue-d' }, '→ ' + i.fix) : null),
                h('div', { className: 'ds-acts' },
                  i.selector ? h('button', { type: 'button', className: 'ds-act', title: tr('locate'), 'aria-label': tr('locate'), onClick: () => send({ type: 'locate', selector: i.selector }) }, h(Icon, { name: 'locate', size: 14 })) : null,
                  h('button', { type: 'button', className: 'ds-act', title: tr('toNote'), 'aria-label': tr('toNote'), onClick: () => issueToNote(i) }, h(Icon, { name: 'note', size: 14 })),
                  h('button', { type: 'button', className: 'ds-act', title: tr('ignore'), 'aria-label': tr('ignore'), onClick: () => setIgnored((x) => x.concat([i.id])) }, h(Icon, { name: 'minus', size: 14 }))))) : null)
          })
          return h(React.Fragment, null, head, filters, groups,
            ignored.length ? h('button', { type: 'button', className: 'ds-link', onClick: () => setIgnored([]) }, tr('ignored', { n: ignored.length }) + ' · ' + tr('restore')) : null)
        }

        // ── 面板：元素 ──
        const elTab = () => {
          if (!selection.length) return h('div', { className: 'ds-empty' }, h('b', null, tr('elEmpty')), h('span', null, tr('elHint')))
          return selection.map((s) => h('div', { key: s.selector, className: 'ds-kv' },
            h('span', null, tr('selector')), h('span', { className: 'ds-code' }, s.selector),
            h('span', null, tr('text')), h('span', null, (s.text || '').slice(0, 160)),
            h('span', null, tr('font')), h('span', null, s.styles.fontSize + ' · ' + s.styles.fontWeight + ' · ' + s.styles.fontFamily + ' · ' + s.styles.lineHeight),
            h('span', null, tr('color')), h('span', null, h('span', { className: 'ds-swatch', style: { background: s.styles.color } }), s.styles.color,
              s.styles.background && s.styles.background !== 'rgba(0, 0, 0, 0)' ? h('span', null, '  ', h('span', { className: 'ds-swatch', style: { background: s.styles.background } }), s.styles.background) : null),
            h('span', null, tr('size')), h('span', null, s.rect.w + ' × ' + s.rect.h),
            h('span', null, tr('padding')), h('span', null, s.styles.padding)))
        }

        const tabs = [['notes', tr('tab_notes'), notes.length ? h('span', { className: 'ds-badge', 'data-neutral': '' }, String(notes.length)) : null],
          ['qa', tr('tab_qa'), mustCount ? h('span', { className: 'ds-badge' }, String(mustCount)) : null],
          ['el', tr('tab_el'), selection.length ? h('span', { className: 'ds-badge', 'data-neutral': '' }, String(selection.length)) : null]]
        const dock = panel.dock
        const bw = bodyRef.current ? bodyRef.current.clientWidth : 800
        const bh = bodyRef.current ? bodyRef.current.clientHeight : 600
        const panelStyle = dock === 'float'
          ? { left: panel.float.x == null ? Math.max(8, bw - Math.min(panel.float.w, bw - 16) - 12) : Math.min(panel.float.x, Math.max(0, bw - 120)), top: panel.float.y == null ? Math.max(8, bh - Math.min(panel.float.h, bh - 16) - 12) : Math.min(panel.float.y, Math.max(0, bh - 40)), width: Math.min(panel.float.w, bw - 8), height: Math.min(panel.float.h, bh - 8) }
          : dock === 'bottom' || dock === 'top' ? { height: Math.min(panel.size[dock], Math.max(140, bh - 140)) } : { width: Math.min(panel.size[dock], Math.max(220, bw * 0.6)) }
        const panelEl = panel.open ? h('section', { key: 'panel', ref: panelRef, className: 'ds-panel', 'data-dock': dock, style: panelStyle, 'aria-label': tr('panel') },
          h('div', { className: 'ds-ph', onPointerDown: onHeadDown, title: tr('dragHint') },
            h('span', { className: 'ds-grip' }, h(Icon, { name: 'grip', size: 14 })),
            h('div', { className: 'ds-tabs', role: 'tablist' }, tabs.map(([id, label, badge]) => h('button', { key: id, type: 'button', role: 'tab', className: 'ds-tab', 'aria-selected': panel.tab === id, onClick: () => { setPanel({ tab: id }); if (id === 'qa' && !qa && !qaBusy && ready) doQa() } }, label, badge))),
            h('span', { className: 'ds-sp' }),
            h(Menu, { align: 'right', icon: 'dock_' + dock, label: null, title: tr('dockMenu'), className: 'ds-dockmenu', items: DOCKS.map((d) => ({ key: d, label: tr('dock_' + d), icon: 'dock_' + d, checked: d === dock ? true : undefined, onSelect: () => setPanel({ dock: d }) })) }),
            h('button', { type: 'button', className: 'ds-btn ds-ghost ds-icon', title: tr('hidePanel'), 'aria-label': tr('hidePanel'), onClick: () => setPanel({ open: false }) }, h(Icon, { name: 'close', size: 14 }))),
          h('div', { className: 'ds-pb', role: 'tabpanel' }, panel.tab === 'qa' ? qaTab() : panel.tab === 'el' ? elTab() : notesTab())) : null

        // 拖动中的停靠预览
        let dragLayer = null
        if (drag) {
          const z = drag.zone
          const zs = z === 'bottom' ? { left: 6, right: 6, bottom: 6, height: Math.min(panel.size.bottom, bh * 0.45) } : z === 'top' ? { left: 6, right: 6, top: 6, height: Math.min(panel.size.top, bh * 0.45) } : z === 'left' ? { left: 6, top: 6, bottom: 6, width: Math.min(panel.size.left, bw * 0.5) } : z === 'right' ? { right: 6, top: 6, bottom: 6, width: Math.min(panel.size.right, bw * 0.5) } : null
          dragLayer = [zs ? h('div', { key: 'z', className: 'ds-zone', style: zs }) : h('div', { key: 'g', className: 'ds-dragbox', style: { left: drag.x, top: drag.y, width: drag.w, height: drag.h } }), h('div', { key: 'h', className: 'ds-draghint' }, tr('dragHint'))]
        }

        return h('div', { className: 'ds-root', ref: rootRef, 'data-deliver-studio': '', 'data-dragging': drag ? '' : undefined, onKeyDown: (e) => { if (e.key !== 'Escape' || e.defaultPrevented || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return; if (selection.length) { setSelection([]); setAnchor(null); send({ type: 'clear' }) } else if (mode === 'select') setMode('browse') } },
          toolbar, banner,
          h('div', { className: 'ds-body', ref: bodyRef, 'data-dock': dock === 'float' ? 'bottom' : dock },
            stage,
            panel.open && dock !== 'float' ? h('div', { key: 'split', className: 'ds-split', role: 'separator', 'aria-orientation': dock === 'left' || dock === 'right' ? 'vertical' : 'horizontal', onPointerDown: onSplitDown }) : null,
            panelEl, composer, dragLayer,
            toast ? h('div', { className: 'ds-toast', role: 'status' }, toast) : null))
      }
    }

    // 二次确认按钮（清空等破坏性操作）
    function ConfirmButton({ label, confirm, onConfirm }) {
      const [armed, setArmed] = useState(false)
      useEffect(() => { if (!armed) return undefined; const t = setTimeout(() => setArmed(false), 3000); return () => clearTimeout(t) }, [armed])
      return h('button', { type: 'button', className: 'ds-btn ds-ghost', style: armed ? { color: 'var(--dsw-alias-state-error-primary)' } : undefined, onClick: () => { if (armed) { setArmed(false); onConfirm() } else setArmed(true) } }, h(Icon, { name: 'trash', size: 14 }), armed ? confirm : label)
    }

    // 批注卡片：双击改名 / 编辑内容，改颜色、回复、定位、删除
    function NoteCard({ n, names, focused, onFocus, onLocate, onRemove, onPatch, onReply }) {
      const [renaming, setRenaming] = useState(false)
      const [editing, setEditing] = useState(false)
      const [colors, setColors] = useState(false)
      const [replying, setReplying] = useState(false)
      const [text, setText] = useState('')
      const ref = useRef(null)
      useEffect(() => { if (focused && ref.current) ref.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [focused])
      return h('div', { ref, className: 'ds-card', 'data-focus': focused ? '' : undefined, onClick: onFocus },
        h('div', { className: 'ds-card-h' },
          renaming
            ? h('input', { className: 'ds-pin-in', autoFocus: true, defaultValue: n.name, maxLength: 24, 'aria-label': tr('rename'), onBlur: (e) => { const v = e.target.value.trim(); if (v && v !== n.name) onPatch({ name: v }); setRenaming(false) }, onKeyDown: (e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setRenaming(false) } })
            : h('button', { type: 'button', className: 'ds-pin', title: tr('rename'), style: { background: n.color, color: onColor(n.color) }, onDoubleClick: () => setRenaming(true), onClick: () => setColors((v) => !v) }, n.name || '·'),
          h('span', { className: 'ds-meta' }, (names[n.author && n.author.id] || '') + ' · ' + when(n.time)),
          h('div', { className: 'ds-acts' },
            n.targets[0] ? h('button', { type: 'button', className: 'ds-act', title: tr('locate'), 'aria-label': tr('locate'), onClick: (e) => { e.stopPropagation(); onLocate() } }, h(Icon, { name: 'locate', size: 14 })) : null,
            h('button', { type: 'button', className: 'ds-act', title: tr('reply'), 'aria-label': tr('reply'), onClick: () => setReplying(true) }, h(Icon, { name: 'reply', size: 14 })),
            h('button', { type: 'button', className: 'ds-act', 'data-danger': '', title: tr('remove'), 'aria-label': tr('remove'), onClick: (e) => { e.stopPropagation(); onRemove() } }, h(Icon, { name: 'trash', size: 14 })))),
        colors ? h('div', { className: 'ds-dots', role: 'radiogroup', 'aria-label': tr('color') }, COLORS.map((c) => h('button', { key: c, type: 'button', role: 'radio', className: 'ds-dot', 'aria-checked': n.color === c, 'aria-label': c, style: { background: c }, onClick: () => { onPatch({ color: c }); setColors(false) } })), h('button', { type: 'button', className: 'ds-link', style: { marginLeft: 6 }, onClick: () => { setColors(false); setRenaming(true) } }, tr('renameShort'))) : null,
        editing
          ? h('textarea', { className: 'ds-input', rows: 3, autoFocus: true, defaultValue: n.comment, onBlur: (e) => { const v = e.target.value.trim(); if (v && v !== n.comment) onPatch({ comment: v }); setEditing(false) }, onKeyDown: (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) e.target.blur(); if (e.key === 'Escape') setEditing(false) } })
          : h('div', { className: 'ds-comment', title: tr('editComment'), onDoubleClick: () => setEditing(true) }, n.comment),
        n.replies.map((r) => h('div', { key: r.id, className: 'ds-reply' }, h('span', { className: 'ds-meta' }, (names[r.author && r.author.id] || '') + ' · ' + when(r.time)), h('span', { className: 'ds-comment' }, r.text))),
        replying ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
          h('textarea', { className: 'ds-input', rows: 2, autoFocus: true, value: text, placeholder: tr('replyPh') + ' · Ctrl+Enter', onChange: (e) => setText(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { if (onReply(text)) { setText(''); setReplying(false) } } if (e.key === 'Escape') setReplying(false) } }),
          h('div', { className: 'ds-row' }, h('span', { className: 'ds-sp' }), h('button', { type: 'button', className: 'ds-btn ds-ghost', onClick: () => setReplying(false) }, tr('cancel')), h('button', { type: 'button', className: 'ds-btn ds-primary', disabled: !text.trim(), onClick: () => { if (onReply(text)) { setText(''); setReplying(false) } } }, tr('reply')))) : null)
    }

    // ── 设置页 ─────────────────────────────────────────
    function SettingsPage() {
      const [d, setD] = useState(null)
      const [draft, setDraft] = useState(null)
      const [status, setStatus] = useState('')
      useEffect(() => { bridge('/describe', {}).then((r) => { setD(r); setDraft(Object.assign({}, r.config, { bannedWords: (r.config.bannedWords || []).join('\n') })) }, (e) => setStatus('fail:' + e.message)) }, [])
      if (!d || !draft) return h('div', { className: 'ds-muted' }, status ? status.slice(5) : '…')
      const set = (k) => (e) => { setDraft(Object.assign({}, draft, { [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })); setStatus('') }
      const save = async () => {
        setStatus('saving')
        // browserPath 为新键；同时清空已弃用的 edgePath，避免清空浏览器路径后又回落到旧值
        const patch = { bannedWords: draft.bannedWords.split(/\r?\n/).map((s) => s.trim()).filter(Boolean), targetChars: Number(draft.targetChars) || 0, defaultViewport: draft.defaultViewport, qaBeforeExport: !!draft.qaBeforeExport, browserPath: String(draft.browserPath || '').trim(), edgePath: '' }
        try { const r = await bridge('/update', { patch }); if (!r.ok) throw new Error(r.error); if (r.browser) setD(Object.assign({}, d, { browser: r.browser })); setStatus('saved') } catch (e) { setStatus('fail:' + e.message) }
      }
      const field = (label, input) => h('label', { className: 'ds-field' }, h('span', null, label), input)
      const browser = d.browser || {}
      return h('div', { className: 'ds-page ds-root', style: { height: 'auto', minHeight: 0, background: 'transparent' } }, h('div', { className: 'ds-scard' },
        field(tr('sViewport'), h('select', { className: 'ds-input', value: draft.defaultViewport, onChange: set('defaultViewport') }, VIEWPORTS.map((v) => h('option', { key: v.id, value: v.id }, tr('vp_' + v.id) + ' ' + v.w)))),
        h('label', { className: 'ds-row' }, h('input', { type: 'checkbox', role: 'switch', 'aria-checked': !!draft.qaBeforeExport, checked: !!draft.qaBeforeExport, onChange: set('qaBeforeExport') }), h('span', null, tr('sQaBefore'))),
        field(tr('sBanned'), h('textarea', { className: 'ds-input', rows: 6, value: draft.bannedWords, onChange: set('bannedWords') })),
        field(tr('sTarget'), h('input', { className: 'ds-input', type: 'number', min: 0, value: draft.targetChars, onChange: set('targetChars') })),
        field(tr('sBrowser'), h('input', { className: 'ds-input', value: draft.browserPath || '', onChange: set('browserPath') })),
        browser.found
          ? h('div', { className: 'ds-field' }, h('span', { className: 'ds-muted' }, tr('browserOk', { name: browser.name })), h('span', { className: 'ds-code ds-muted' }, browser.path))
          : h('div', { className: 'ds-field' }, h('span', { className: 'ds-status', 'data-bad': '', style: { padding: 0 } }, tr('browserMissing')), h('span', { className: 'ds-muted' }, tr('browserMissingHint'))),
        h('div', { className: 'ds-row' }, h('button', { type: 'button', className: 'ds-btn ds-primary', disabled: status === 'saving', onClick: save }, tr('save')),
          status === 'saved' ? h('span', { className: 'ds-muted' }, tr('saved')) : status.startsWith('fail:') ? h('span', { className: 'ds-status', 'data-bad': '', style: { padding: 0 } }, status.slice(5)) : null)))
    }
    function RowConfig(props) { return props && props.view === 'summary' ? tr('summary') : h(SettingsPage) }

    return {
      __test: { packDocument, frameDocument, parseAddress, sessionFileAddress, resolveRelative, mergeNotes, displayNames, splitAnnotations, makeWorkbench, RowConfig },
      name: 'dsh-deliver-studio-client',
      inject: ['slots', 'sessions', 'locale', 'documentPreviews'],
      apply(ctx) {
        ctx.effect(() => {
          const style = document.createElement('style')
          style.dataset.plugin = 'dsh-deliver-studio'
          style.textContent = CSS
          document.head.appendChild(style)
          return () => style.remove()
        })
        try {
          ctx.effect(() => ctx.locale.register(NS, { zh, en }))
          const t = ctx.locale.bind(NS)
          tr = (k, p) => { try { const s = t(k, p); return s && s !== k ? fmt(s, p) : fmt(zh[k] ?? k, p) } catch (e) { return fmt(zh[k] ?? k, p) } }
        } catch (e) { /* 退回中文 */ }
        let describing
        const describeOnce = () => (describing = describing || bridge('/describe', {}).catch((e) => { describing = undefined; throw e }))
        ctx.effect(() => ctx.documentPreviews.register({ id: BODY_ID, extensions: ['html', 'htm'], priority: 'extension', title: () => tr('title'), loading: 'bytes-complete', wrap: false }))
        const Workbench = makeWorkbench(ctx, describeOnce)
        let remoteRef
        ctx.inject(['remote'], (c) => { remoteRef = c.remote; c.effect(() => () => { remoteRef = undefined }) })
        const readRelated = (address, relativePath, signal) => {
          const file = parseAddress(address)
          const remote = remoteRef || ctx.get('remote')
          if (!file || !remote || !remote.workspaceFiles) return Promise.resolve({ ok: false, error: { message: 'remote unavailable', details: {} } })
          return remote.workspaceFiles.readBytes(file.sessionId, relativePath, { baseFile: file.path }, signal)
        }
        ctx.effect(() => ctx.slots.inject('sidebar.right.tab.document', () => ctx.slots.register({ name: 'sidebar.right.tab.document', key: BODY_ID, inject: () => ({ readRelated }) }, Workbench)))
        ctx.slots.inject('plugins.row.config', () => ctx.slots.register({ name: 'plugins.row.config', key: ROW_KEY }, RowConfig))
      },
    }
  },
})
