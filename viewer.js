/* Deliver Studio · 带批注 HTML 的查看器（由交付工作台导出时嵌入）
 * - 点击批注标记：气泡里看批注原文、写回答、改颜色和名称
 * - 「展开全部批注」：抽屉里列出全部批注与回答（含用户名和时间）
 * - 回答保存在本浏览器；「保存副本」把批注和回答写进一份新的 HTML
 * 纯浏览器脚本，无依赖；界面在 Shadow DOM 里，不影响页面样式。 */
(function () {
  'use strict'
  if (window.__deliverViewer) return
  window.__deliverViewer = true
  var dataEl = document.getElementById('deliver-studio-data')
  var selfEl = document.getElementById('deliver-studio-viewer')
  if (!dataEl) return
  var DATA
  try { DATA = JSON.parse(dataEl.textContent) } catch (e) { return }
  var VIEWER_SRC = selfEl ? selfEl.textContent : ''
  var COLORS = ['#e5484d', '#f76b15', '#ffc53d', '#30a46c', '#0d74ce', '#8e4ec6']
  var STORE = 'deliverStudio:doc:' + DATA.docId
  var ME_KEY = 'deliverStudio:me'

  // ── 存储 ───────────────────────────────────────────
  function load(key) { try { return JSON.parse(localStorage.getItem(key) || 'null') } catch (e) { return null } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)) } catch (e) {} }
  function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7) }
  var me = load(ME_KEY)
  if (!me || !me.id) { me = { id: uid('u'), name: '', named: false }; save(ME_KEY, me) }

  function mergeNotes(a, b) {
    var map = {}
    var order = []
    ;[a || [], b || []].forEach(function (list) {
      list.forEach(function (n) {
        var cur = map[n.id]
        if (!cur) { map[n.id] = JSON.parse(JSON.stringify(n)); order.push(n.id); return }
        if ((n.updated || 0) > (cur.updated || 0)) { cur.name = n.name; cur.color = n.color; cur.comment = n.comment; cur.updated = n.updated }
        var seen = {}
        cur.replies = (cur.replies || []).concat(n.replies || []).filter(function (r) { if (seen[r.id]) return false; seen[r.id] = true; return true }).sort(function (x, y) { return x.time - y.time })
      })
    })
    return order.map(function (id) { return map[id] })
  }
  var local = load(STORE)
  var state = {
    notes: mergeNotes(DATA.notes, local && local.notes),
    people: Object.assign({}, DATA.people || {}, (local && local.people) || {}),
    dirty: !!(local && local.dirty),
  }
  function persist(dirty) {
    if (dirty) state.dirty = true
    save(STORE, { notes: state.notes, people: state.people, dirty: state.dirty })
  }

  // ── 名称与时间 ───────────────────────────────────────
  function displayNames() {
    var names = {}
    var anon = 0
    var events = []
    state.notes.forEach(function (n) { if (n.author) events.push({ a: n.author, t: n.time || 0 }); (n.replies || []).forEach(function (r) { if (r.author) events.push({ a: r.author, t: r.time || 0 }) }) })
    if (!events.some(function (e) { return e.a.id === me.id })) events.push({ a: { id: me.id, name: me.name }, t: Infinity })
    events.sort(function (x, y) { return x.t - y.t })
    events.forEach(function (e) {
      var id = e.a.id
      if (names[id]) return
      var nm = (id === me.id && me.name) || state.people[id] || e.a.name
      names[id] = nm || ('用户' + (++anon))
    })
    return names
  }
  function who(author, names) { return author ? (names[author.id] || author.name || '用户') : '用户' }
  function pad(n) { return (n < 10 ? '0' : '') + n }
  function when(t) { var d = new Date(t); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) }
  function onColor(hex) {
    var c = /^#?([0-9a-f]{6})$/i.exec(hex || '')
    if (!c) return '#fff'
    var n = parseInt(c[1], 16)
    var ch = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
    return 0.2126 * ch(n >> 16) + 0.7152 * ch((n >> 8) & 255) + 0.0722 * ch(n & 255) > 0.42 ? '#1c1917' : '#fff'
  }

  // ── 目标查找（与工作台 runtime.js 规则一致）───────────────
  function normText(s) { return String(s || '').replace(/\s+/g, ' ').trim().slice(0, 40) }
  function findTarget(t) {
    if (!t) return null
    var el = null
    try { el = t.selector ? document.querySelector(t.selector) : null } catch (e) { el = null }
    var fp = normText(t.text)
    if (el && (!fp || normText(el.innerText || el.textContent) === fp)) return el
    if (!fp || !t.tag) return el && !fp ? el : null
    var list = document.getElementsByTagName(t.tag)
    for (var i = 0; i < list.length && i < 4000; i++) if (normText(list[i].innerText || list[i].textContent) === fp && list[i] !== host) return list[i]
    return null
  }
  // 标记贴在文字末尾的右上角（整行宽的块元素不会把标记甩到最右边）
  function anchorRect(el) {
    var r = el.getBoundingClientRect()
    var right = r.right
    try { var rg = document.createRange(); rg.selectNodeContents(el); var tr = rg.getBoundingClientRect(); if (tr.width > 0 && tr.right < right) right = Math.max(r.left + 24, tr.right + 6) } catch (e) {}
    return { top: r.top, right: right }
  }
  function shown(el) { var r = el.getBoundingClientRect(); var cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' }

  // ── 界面 ───────────────────────────────────────────
  var host = document.createElement('div')
  host.id = 'deliver-studio-root'
  host.setAttribute('data-deliver-overlay', '')
  host.style.cssText = 'all:initial;position:absolute;left:0;top:0;width:0;height:0;z-index:2147483646'
  var root = host.attachShadow({ mode: 'open' })
  var CSS = [
    ':host{all:initial}',
    '*{box-sizing:border-box}',
    '.ui{--paper:#fffdf8;--paper-2:#f6f2ea;--line:#e6dfd3;--line-2:#d4cbbb;--ink:#1f1b16;--ink-2:#5f564b;--ink-3:#8a8073;--accent:#1f1b16;--on-accent:#fffdf8;--focus:#8e4ec6;font:13px/1.55 "PingFang SC","Microsoft YaHei",system-ui,sans-serif;color:var(--ink)}',
    'button{font:inherit;color:inherit;cursor:pointer}',
    'button:focus-visible,textarea:focus-visible,input:focus-visible{outline:2px solid var(--focus);outline-offset:1px}',
    '.pin{position:absolute;min-width:22px;height:22px;padding:0 7px;border:0;border-radius:11px 11px 11px 2px;font:700 11px/22px system-ui,sans-serif;white-space:nowrap;max-width:160px;overflow:hidden;text-overflow:ellipsis;box-shadow:0 0 0 2px #fff,0 2px 6px rgba(0,0,0,.25);transition:transform .12s}',
    '.pin:hover,.pin[aria-expanded=true]{transform:scale(1.12)}',
    '.ring{position:absolute;pointer-events:none;border-radius:3px;border:2px solid;transition:opacity .12s}',
    '.bubble{position:absolute;width:300px;background:var(--paper);border:1px solid var(--line-2);border-radius:10px;box-shadow:0 12px 32px rgba(31,27,22,.18);padding:12px;display:flex;flex-direction:column;gap:10px;animation:in .14s ease-out}',
    '@keyframes in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}',
    '@media (prefers-reduced-motion:reduce){.bubble,.drawer{animation:none!important}.pin{transition:none}}',
    '.head{display:flex;align-items:center;gap:8px;min-height:24px}',
    '.tag{display:inline-flex;align-items:center;max-width:200px;height:22px;padding:0 8px;border-radius:11px 11px 11px 2px;font-weight:700;font-size:12px;border:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.tag:hover{box-shadow:0 0 0 2px var(--line-2)}',
    '.name-in{height:24px;width:160px;border:1px solid var(--line-2);border-radius:6px;padding:0 6px;font:inherit;background:#fff;color:var(--ink)}',
    '.comment{white-space:pre-wrap;word-break:break-word}',
    '.muted{color:var(--ink-3);font-size:12px}',
    '.link{border:0;background:none;padding:0;color:var(--ink-2);text-decoration:underline;text-underline-offset:2px;font-size:12px}',
    '.link:hover{color:var(--ink)}',
    'textarea{width:100%;min-height:64px;resize:vertical;border:1px solid var(--line-2);border-radius:8px;padding:7px 9px;font:inherit;background:#fff;color:var(--ink)}',
    '.me{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--ink-2)}',
    '.me input{flex:1;height:26px;border:1px solid var(--line-2);border-radius:6px;padding:0 7px;font:inherit;background:#fff;color:var(--ink)}',
    '.chip{border:1px solid var(--line);background:var(--paper-2);border-radius:12px;height:22px;padding:0 8px;font-size:12px;color:var(--ink-2)}',
    '.chip:hover{border-color:var(--line-2);color:var(--ink)}',
    '.colors{display:flex;gap:6px;align-items:center}',
    '.dot{width:18px;height:18px;border-radius:9px;border:2px solid #fff;box-shadow:0 0 0 1px var(--line-2);padding:0}',
    '.dot[aria-checked=true]{box-shadow:0 0 0 2px var(--ink)}',
    '.row{display:flex;gap:8px;align-items:center}',
    '.sp{flex:1}',
    '.btn{height:30px;padding:0 12px;border-radius:7px;border:1px solid var(--line-2);background:var(--paper);white-space:nowrap}',
    '.btn:hover{background:var(--paper-2)}',
    '.btn:active{transform:translateY(1px)}',
    '.btn.primary{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}',
    '.btn.primary:hover{background:#3a332b}',
    '.btn:disabled{opacity:.45;cursor:default}',
    '.launch{position:fixed;right:20px;bottom:20px;height:36px;padding:0 14px 0 10px;border-radius:18px;border:1px solid var(--line-2);background:var(--paper);box-shadow:0 6px 18px rgba(31,27,22,.16);display:flex;align-items:center;gap:8px;font-weight:600}',
    '.launch:hover{background:var(--paper-2)}',
    '.launch .n{min-width:20px;height:20px;border-radius:10px;background:var(--accent);color:var(--on-accent);font-size:12px;line-height:20px;text-align:center;padding:0 5px}',
    '.drawer{position:fixed;top:0;right:0;bottom:0;width:380px;max-width:92vw;background:var(--paper);border-left:1px solid var(--line-2);box-shadow:-12px 0 32px rgba(31,27,22,.12);display:flex;flex-direction:column;animation:slide .16s ease-out}',
    '@keyframes slide{from{transform:translateX(24px);opacity:0}to{transform:none;opacity:1}}',
    '.dh{padding:14px 16px 10px;border-bottom:1px solid var(--line);display:flex;flex-direction:column;gap:8px}',
    '.dh h2{margin:0;font-size:15px;font-weight:700}',
    '.list{flex:1;overflow:auto;padding:8px 12px 16px;display:flex;flex-direction:column;gap:10px}',
    '.card{border:1px solid var(--line);border-radius:10px;background:#fff;padding:10px 12px;display:flex;flex-direction:column;gap:6px}',
    '.card[data-focus]{border-color:var(--ink-2);box-shadow:0 0 0 3px var(--paper-2)}',
    '.meta{font-size:12px;color:var(--ink-3)}',
    '.reply{border-left:2px solid var(--line-2);padding:2px 0 2px 10px;display:flex;flex-direction:column;gap:2px}',
    '.empty{padding:32px 8px;text-align:center;color:var(--ink-3)}',
    '.toast{position:fixed;left:50%;bottom:72px;transform:translateX(-50%);background:var(--ink);color:var(--on-accent);padding:8px 14px;border-radius:8px;font-size:12px;box-shadow:0 6px 18px rgba(0,0,0,.2)}',
  ].join('\n')
  var style = document.createElement('style')
  style.textContent = CSS
  root.appendChild(style)
  var ui = document.createElement('div')
  ui.className = 'ui'
  root.appendChild(ui)
  var pinsEl = document.createElement('div')
  var ringsEl = document.createElement('div')
  var layerEl = document.createElement('div')
  ui.appendChild(ringsEl); ui.appendChild(pinsEl); ui.appendChild(layerEl)

  function h(tag, attrs) {
    var el = document.createElement(tag)
    if (attrs) for (var k in attrs) {
      var v = attrs[k]
      if (v === undefined || v === null || v === false) continue
      if (k === 'text') el.textContent = v
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v)
      else if (k === 'style') el.style.cssText = v
      else el.setAttribute(k, v === true ? '' : v)
    }
    for (var i = 2; i < arguments.length; i++) { var c = arguments[i]; if (c == null || c === false) continue; if (Array.isArray(c)) c.forEach(function (x) { if (x) el.appendChild(x) }); else el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c) }
    return el
  }

  var open = null // { id } 气泡
  var drawer = false
  var focus = null
  var meEditing = false

  function noteById(id) { for (var i = 0; i < state.notes.length; i++) if (state.notes[i].id === id) return state.notes[i]; return null }
  function touch(n) { n.updated = Date.now(); persist(true) }
  function rings(n) {
    ringsEl.textContent = ''
    if (!n) return
    ;(n.targets || []).forEach(function (t) {
      var el = findTarget(t)
      if (!el) return
      var r = el.getBoundingClientRect()
      ringsEl.appendChild(h('div', { class: 'ring', style: 'left:' + (r.left + scrollX) + 'px;top:' + (r.top + scrollY) + 'px;width:' + r.width + 'px;height:' + r.height + 'px;border-color:' + n.color + ';background:' + n.color + '14' }))
    })
  }
  var pinPos = {}
  function renderPins() {
    pinsEl.textContent = ''
    pinPos = {}
    state.notes.forEach(function (n) {
      var el = findTarget(n.targets && n.targets[0])
      if (!el || !shown(el)) return
      var r = anchorRect(el)
      var x = Math.max(0, r.right + scrollX - 15), y = Math.max(0, r.top + scrollY - 15)
      // 气泡放在目标元素下方，不遮住被批注的内容
      pinPos[n.id] = { x: x, y: y, below: el.getBoundingClientRect().bottom + scrollY + 8 }
      pinsEl.appendChild(h('button', {
        class: 'pin', type: 'button', title: n.comment || '', 'aria-expanded': open && open.id === n.id ? 'true' : 'false',
        style: 'left:' + x + 'px;top:' + y + 'px;background:' + n.color + ';color:' + onColor(n.color),
        onmouseenter: function () { rings(n) }, onmouseleave: function () { if (!(open && open.id === n.id)) rings(null) },
        onclick: function (e) { e.stopPropagation(); openBubble(n.id) },
      }, n.name || '·'))
    })
  }

  function meRow(onDone) {
    if (!me.named || meEditing) {
      var input = h('input', { type: 'text', placeholder: '昵称，可留空', value: me.name || '', 'aria-label': '昵称' })
      input.value = me.name || ''
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commitMe(input.value); onDone && onDone() } })
      input.addEventListener('change', function () { commitMe(input.value, true) })
      return h('label', { class: 'me' }, '昵称', input)
    }
    var names = displayNames()
    return h('div', { class: 'me' }, '以', h('button', { class: 'chip', type: 'button', title: '修改昵称', onclick: function () { meEditing = true; render() } }, names[me.id] + ' ✎'), '回答')
  }
  function commitMe(v, silent) {
    me.name = String(v || '').trim().slice(0, 24); me.named = true; save(ME_KEY, me)
    if (me.name) { state.people[me.id] = me.name; persist(false) }
    meEditing = false
    if (!silent) render()
  }
  function addReply(n, text) {
    text = String(text || '').trim()
    if (!text) return false
    if (!me.named) { me.named = true; save(ME_KEY, me) }
    n.replies = (n.replies || []).concat([{ id: uid('r'), author: { id: me.id, name: me.name }, time: Date.now(), text: text }])
    touch(n)
    return true
  }
  function colorRow(n) {
    return h('div', { class: 'colors', role: 'radiogroup', 'aria-label': '标记颜色' }, COLORS.map(function (c) {
      return h('button', { class: 'dot', type: 'button', role: 'radio', 'aria-checked': n.color === c ? 'true' : 'false', 'aria-label': c, style: 'background:' + c, onclick: function () { n.color = c; touch(n); render() } })
    }))
  }
  function nameTag(n, editing, onEdit) {
    if (editing) {
      var input = h('input', { class: 'name-in', type: 'text', 'aria-label': '标记名称', maxlength: '24' })
      input.value = n.name || ''
      var done = function () { var v = input.value.trim(); if (v && v !== n.name) { n.name = v; touch(n) } onEdit(false) }
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') done(); if (e.key === 'Escape') onEdit(false) })
      input.addEventListener('blur', done)
      setTimeout(function () { input.focus(); input.select() }, 0)
      return input
    }
    return h('button', { class: 'tag', type: 'button', title: '修改名称', style: 'background:' + n.color + ';color:' + onColor(n.color), onclick: function (e) { e.stopPropagation(); onEdit(true) } }, (n.name || '·') + ' ✎')
  }

  var bubbleNameEdit = false
  var draft = {}
  function bubble() {
    var n = noteById(open.id)
    if (!n) { open = null; return null }
    var p = pinPos[n.id] || { x: scrollX + 40, y: scrollY + 40 }
    var x = Math.min(Math.max(scrollX + 8, p.x - 8), scrollX + document.documentElement.clientWidth - 308)
    var y = Math.max(p.y + 30, p.below || 0)
    var ta = h('textarea', { placeholder: '写回答…', 'aria-label': '回答' })
    ta.value = draft[n.id] || ''
    ta.addEventListener('input', function () { draft[n.id] = ta.value })
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit() })
    function submit() { if (addReply(n, ta.value)) { draft[n.id] = ''; toast('已回答'); render() } }
    var count = (n.replies || []).length
    var b = h('div', { class: 'bubble', role: 'dialog', 'aria-label': '批注', style: 'left:' + x + 'px;top:' + y + 'px', onclick: function (e) { e.stopPropagation() } },
      h('div', { class: 'head' }, nameTag(n, bubbleNameEdit, function (v) { bubbleNameEdit = v; render() }), h('span', { class: 'sp' }), colorRow(n)),
      h('div', { class: 'comment' }, n.comment || ''),
      count ? h('div', { class: 'muted' }, count + ' 条回答 · ', h('button', { class: 'link', type: 'button', onclick: function () { focus = n.id; drawer = true; render() } }, '查看')) : null,
      ta,
      meRow(function () { ta.focus() }),
      h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', onclick: function () { focus = n.id; drawer = true; open = null; render() } }, '展开全部批注'),
        h('span', { class: 'sp' }),
        h('button', { class: 'btn', type: 'button', onclick: function () { open = null; render() } }, '关闭'),
        h('button', { class: 'btn primary', type: 'button', onclick: submit }, '回答批注')))
    setTimeout(function () { if (document.activeElement === document.body || !document.activeElement) ta.focus({ preventScroll: true }) }, 0)
    return b
  }

  var cardEdit = null
  var replyOpen = {}
  function drawerEl() {
    var names = displayNames()
    var list = h('div', { class: 'list' })
    if (!state.notes.length) list.appendChild(h('div', { class: 'empty' }, '没有批注'))
    state.notes.forEach(function (n) {
      var replies = (n.replies || []).map(function (r) {
        return h('div', { class: 'reply' }, h('span', { class: 'meta' }, who(r.author, names) + ' · ' + when(r.time)), h('span', { class: 'comment' }, r.text))
      })
      var box = null
      if (replyOpen[n.id]) {
        var ta = h('textarea', { placeholder: '写回答…', 'aria-label': '回答' })
        ta.value = draft[n.id] || ''
        ta.addEventListener('input', function () { draft[n.id] = ta.value })
        var send = function () { if (addReply(n, ta.value)) { draft[n.id] = ''; replyOpen[n.id] = false; render() } }
        ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send() })
        box = h('div', { style: 'display:flex;flex-direction:column;gap:6px' }, ta, meRow(), h('div', { class: 'row' }, h('span', { class: 'sp' }), h('button', { class: 'btn', type: 'button', onclick: function () { replyOpen[n.id] = false; render() } }, '取消'), h('button', { class: 'btn primary', type: 'button', onclick: send }, '回答批注')))
        setTimeout(function () { ta.focus() }, 0)
      }
      list.appendChild(h('div', { class: 'card', 'data-focus': focus === n.id ? '' : null, 'data-id': n.id },
        h('div', { class: 'head' }, nameTag(n, cardEdit === n.id, function (v) { cardEdit = v ? n.id : null; render() }), h('span', { class: 'sp' }),
          h('button', { class: 'link', type: 'button', onclick: function () { locate(n) } }, '定位')),
        h('span', { class: 'meta' }, who(n.author, names) + ' · ' + when(n.time || 0)),
        h('div', { class: 'comment' }, n.comment || ''),
        replies,
        box || h('div', { class: 'row' }, h('button', { class: 'link', type: 'button', onclick: function () { replyOpen[n.id] = true; render() } }, '回答'))))
    })
    var d = h('aside', { class: 'drawer', role: 'dialog', 'aria-label': '全部批注', onclick: function (e) { e.stopPropagation() } },
      h('div', { class: 'dh' },
        h('div', { class: 'row' }, h('h2', null, '全部批注 · ' + state.notes.length), h('span', { class: 'sp' }),
          h('button', { class: 'btn primary', type: 'button', onclick: saveCopy, title: '把批注和回答写进一份新的 HTML' }, '保存副本'),
          h('button', { class: 'btn', type: 'button', 'aria-label': '关闭', onclick: function () { drawer = false; focus = null; render() } }, '关闭')),
        h('div', { class: 'me' }, '我：', h('button', { class: 'chip', type: 'button', title: '修改昵称', onclick: function () { meEditing = true; render() } }, names[me.id] + ' ✎'),
          state.dirty ? h('span', { class: 'muted', style: 'margin-left:auto' }, '回答只存在本浏览器，保存副本后才写入文件') : null),
        meEditing ? meRow() : null),
      list)
    if (focus) setTimeout(function () { var c = d.querySelector('[data-id="' + focus + '"]'); if (c) c.scrollIntoView({ block: 'nearest' }) }, 0)
    return d
  }

  var toastTimer = 0
  var toastMsg = ''
  function toast(s) { toastMsg = s; clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastMsg = ''; render() }, 2400); render() }

  function render() {
    renderPins()
    layerEl.textContent = ''
    if (open) { var b = bubble(); if (b) layerEl.appendChild(b) }
    rings(open ? noteById(open.id) : null)
    if (drawer) layerEl.appendChild(drawerEl())
    else if (state.notes.length) layerEl.appendChild(h('button', { class: 'launch', type: 'button', onclick: function () { drawer = true; render() } }, h('span', { class: 'n' }, String(state.notes.length)), '批注'))
    if (toastMsg) layerEl.appendChild(h('div', { class: 'toast', role: 'status' }, toastMsg))
  }
  function openBubble(id) { open = { id: id }; bubbleNameEdit = false; render() }
  function locate(n, retried) {
    var t = n.targets && n.targets[0]
    var el = findTarget(t)
    if (!el && !retried && t && typeof t.route === 'string' && t.route !== location.hash) {
      location.hash = t.route
      setTimeout(function () { locate(n, true) }, 500)
      return
    }
    if (!el) { toast('这条批注对应的元素已不在页面上'); return }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setTimeout(function () { open = { id: n.id }; render() }, 420)
  }

  // ── 保存副本 ─────────────────────────────────────────
  function b64ToBytes(s) { var bin = atob(s); var out = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out }
  function source() {
    if (typeof DecompressionStream === 'undefined') return Promise.reject(new Error('当前浏览器不支持保存副本，请用新版 Chrome / Edge / Safari / Firefox'))
    var stream = new Blob([b64ToBytes(DATA.source)]).stream().pipeThrough(new DecompressionStream('gzip'))
    return new Response(stream).text()
  }
  function saveCopy() {
    source().then(function (src) {
      var data = Object.assign({}, DATA, { notes: state.notes, people: state.people, savedAt: Date.now() })
      var json = JSON.stringify(data).replace(/</g, '\\u003c')
      var end = '<' + '/script>'
      // 标记拆开拼接：viewer 源码里不能出现完整的起止标记，否则 Host 剥离嵌入块时会提前截断
      var mk = '<!--deliver-studio:annotations:'
      var block = mk + 'start-->\n<script type="application/json" id="deliver-studio-data">' + json + end + '\n<script id="deliver-studio-viewer">' + VIEWER_SRC + end + '\n' + mk + 'end-->'
      var i = src.search(/<\/body\s*>(?![\s\S]*<\/body\s*>)/i)
      var html = i >= 0 ? src.slice(0, i) + block + src.slice(i) : src + block
      var name = decodeURIComponent((location.pathname.split('/').pop() || '')) || (DATA.file || 'document') + '.annotated.html'
      if (!/\.annotated\.html?$/i.test(name)) name = name.replace(/\.html?$/i, '') + '.annotated.html'
      var a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
      a.download = name
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(function () { URL.revokeObjectURL(a.href) }, 4000)
      state.dirty = false; persist(false)
      toast('已保存副本：' + name)
    }, function (e) { toast(String(e && e.message || e)) })
  }

  // ── 事件 ───────────────────────────────────────────
  document.addEventListener('click', function (e) { if (open && e.composedPath().indexOf(host) < 0) { open = null; render() } }, true)
  function escapeAll() { if (open) { open = null; render() } else if (drawer) { drawer = false; focus = null; render() } }
  // 批注界面内的按键不传给页面（避免触发页面快捷键）；Esc 统一在这里处理（改名输入框的 Esc 只取消改名）
  ui.addEventListener('keydown', function (e) {
    e.stopPropagation()
    if (e.key === 'Escape' && !(e.target && e.target.classList && e.target.classList.contains('name-in'))) escapeAll()
  })
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') escapeAll() })
  var raf = false
  function schedule() { if (raf) return; raf = true; requestAnimationFrame(function () { raf = false; renderPins(); if (open) { var b = layerEl.querySelector('.bubble'); var p = pinPos[open.id]; if (b && p) { b.style.top = Math.max(p.y + 30, p.below || 0) + 'px' } rings(noteById(open.id)) } }) }
  window.addEventListener('scroll', schedule, true)
  window.addEventListener('resize', schedule)
  window.addEventListener('hashchange', function () { open = null; setTimeout(render, 260) })
  var mtimer = 0
  if (window.MutationObserver) new MutationObserver(function (list) {
    for (var i = 0; i < list.length; i++) if (list[i].target !== host && !host.contains(list[i].target)) { clearTimeout(mtimer); mtimer = setTimeout(schedule, 150); return }
  }).observe(document.body || document.documentElement, { childList: true, subtree: true, characterData: true })
  function mount() { document.documentElement.appendChild(host); render() }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount)
  else mount()
  window.addEventListener('load', schedule)
})()
