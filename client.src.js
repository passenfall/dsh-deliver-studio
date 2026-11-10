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
    const CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'

    const zh = {
      title: '交付工作台', vp_desktop: '桌面 1440', vp_laptop: '笔记本 1280', vp_tablet: '平板 768', vp_mobile: '手机 390', vp_a4: 'A4 794',
      browse: '浏览', select: '选择 · Ask AI', qa: 'QA 检查', qaRunning: '检查中…', export: '导出 PDF', exporting: '导出中…', zoom: '缩放 {n}%',
      loading: '正在渲染交付物…', failed: '无法渲染这份 HTML：{e}', assets: '已打包 {n} 个本地资源',
      selected: '已选 {n} 个元素', pickHint: '在页面上点击元素；按住 Shift 可多选，再次点击取消', selector: '选择器', text: '文字', styles: '样式',
      comment: '修改意见', commentPh: '例如：标题再精简，改成一行', addNote: '加入批注', tray: '批注托盘', trayEmpty: '还没有批注。切到「选择 · Ask AI」，点页面元素写意见。',
      sendAll: '一起发给 Agent（{n} 条）', sent: '已放进输入框，确认后发送', clearAll: '清空', remove: '删除',
      qaTitle: '交付 QA', qaEmpty: '没有发现问题', qaStats: '中文 {cjk} 字 · 英文 {words} 词 · 图 {fig} · 表 {tab} · {pages} 页',
      must: '必改', hint: '建议', locate: '定位', toAgent: '发给 Agent 修', ignore: '忽略', allToAgent: '把全部问题发给 Agent',
      cat_numbering: '编号', cat_layout: '版式', cat_text: '文本', cat_visual: '视觉', cat_asset: '资源', cat_delivery: '交付规范',
      confirmTitle: '导出前 QA 发现 {n} 处必改', confirmBody: '建议先修复再导出；也可以确认后直接导出。', viewIssues: '查看问题', exportAnyway: '仍然导出', cancel: '取消',
      exported: '已导出 {name}（{pages} 页）', openPdf: '打开 PDF', exportFail: '导出失败：{e}',
      msgHead: '请按编号逐条修改交付物 {file}，每条改完回执编号；只改列出的元素，不要重排其它部分：', msgQaHead: '交付 QA 发现以下问题，请按编号逐条修复 {file}，改完回执编号：',
      summary: 'HTML 交付物：视口切换、选择·Ask AI、QA、导出 PDF', sBanned: '禁用字样（每行一个）', sTarget: '目标字数（0 = 只统计）', sViewport: '默认视口', sQaBefore: '导出前强制 QA', sBrowser: '浏览器路径（Edge / Chrome / Chromium / Brave，留空自动查找）', save: '保存', saved: '已保存', browserOk: '已找到：{name}', browserMissing: '未找到 Chromium 内核浏览器', browserMissingHint: '请安装 Edge / Chrome / Chromium / Brave 中的一个，或在上方填写浏览器可执行文件的完整路径。',
    }
    const en = {
      title: 'Deliver Studio', vp_desktop: 'Desktop 1440', vp_laptop: 'Laptop 1280', vp_tablet: 'Tablet 768', vp_mobile: 'Mobile 390', vp_a4: 'A4 794',
      browse: 'Browse', select: 'Select · Ask AI', qa: 'QA', qaRunning: 'Checking…', export: 'Export PDF', exporting: 'Exporting…', zoom: 'Zoom {n}%',
      loading: 'Rendering…', failed: 'Could not render this HTML: {e}', assets: '{n} local assets packed',
      selected: '{n} selected', pickHint: 'Click elements; Shift for multi-select, click again to drop', selector: 'Selector', text: 'Text', styles: 'Styles',
      comment: 'Comment', commentPh: 'e.g. shorten the title to one line', addNote: 'Add note', tray: 'Notes', trayEmpty: 'No notes yet. Switch to Select · Ask AI and click an element.',
      sendAll: 'Send to agent ({n})', sent: 'Placed in the composer — review and send', clearAll: 'Clear', remove: 'Remove',
      qaTitle: 'Delivery QA', qaEmpty: 'No issues found', qaStats: '{cjk} CJK chars · {words} words · {fig} figures · {tab} tables · {pages} pages',
      must: 'Must', hint: 'Hint', locate: 'Locate', toAgent: 'Ask agent', ignore: 'Ignore', allToAgent: 'Send all issues to agent',
      cat_numbering: 'Numbering', cat_layout: 'Layout', cat_text: 'Text', cat_visual: 'Visual', cat_asset: 'Assets', cat_delivery: 'Delivery rules',
      confirmTitle: 'QA found {n} must-fix issues', confirmBody: 'Fix them first, or export anyway.', viewIssues: 'View issues', exportAnyway: 'Export anyway', cancel: 'Cancel',
      exported: 'Exported {name} ({pages} pages)', openPdf: 'Open PDF', exportFail: 'Export failed: {e}',
      msgHead: 'Please revise {file} item by item and confirm each number; only change the listed elements:', msgQaHead: 'Delivery QA found these issues in {file}; fix them by number:',
      summary: 'HTML deliverables: viewports, Select · Ask AI, QA, PDF export', sBanned: 'Banned words (one per line)', sTarget: 'Target length (0 = count only)', sViewport: 'Default viewport', sQaBefore: 'QA before export', sBrowser: 'Browser path (Edge / Chrome / Chromium / Brave; blank = auto-detect)', save: 'Save', saved: 'Saved', browserOk: 'Found: {name}', browserMissing: 'No Chromium-based browser found', browserMissingHint: 'Install Edge, Chrome, Chromium or Brave, or enter the full path to the browser executable above.',
    }
    function fmt(s, p) { return String(s).replace(/\{(\w+)\}/g, (_, k) => (p && p[k] !== undefined ? p[k] : '')) }
    let tr = (k, p) => fmt(zh[k] ?? k, p)

    async function bridge(path, body) {
      const r = await fetch(BRIDGE + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body ?? {}) })
      const j = await r.json().catch(() => ({ ok: false, error: 'HTTP ' + r.status }))
      if (!r.ok && j.ok !== false) throw new Error(j.error || 'HTTP ' + r.status)
      return j
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

    async function packDocument(data, readRelated, address, signal) {
      const html = decoder().decode(data)
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
      return { html, assets }
    }

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
        'const rt="<scr"+"ipt>"+b.runtime+"</scr"+"ipt>";' +
        'const i=html.search(/<\\/body\\s*>(?![\\s\\S]*<\\/body\\s*>)/i);html=i>=0?html.slice(0,i)+rt+html.slice(i):html+rt;' +
        'document.open();document.write(html);document.close();' +
        '})()<\/script>'
    }

    // ── 样式 ───────────────────────────────────────────
    const CSS = `
.ds-root{display:flex;flex-direction:column;height:100%;min-height:360px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:12px}
.ds-bar{display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap;background:var(--dsw-alias-bg-layer-1)}
.ds-seg{display:inline-flex;padding:2px;border-radius:8px;background:var(--dsw-alias-bg-layer-2);gap:2px}
.ds-seg button{height:24px;padding:0 9px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}
.ds-seg button:hover{color:var(--dsw-alias-label-primary)}
.ds-seg button[aria-checked=true]{background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);box-shadow:0 0 0 1px var(--dsw-alias-border-l1)}
.ds-sp{flex:1}
.ds-zoom{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;white-space:nowrap}
.ds-btn{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 11px;border-radius:7px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}
.ds-btn:hover:not(:disabled){border-color:var(--dsw-alias-border-l2)}
.ds-btn:disabled{opacity:.5;cursor:default}
.ds-btn[data-primary]{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base)}
.ds-badge{min-width:16px;height:16px;padding:0 4px;border-radius:8px;font-size:11px;line-height:16px;text-align:center;font-variant-numeric:tabular-nums;background:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-bg-base)}
.ds-badge[data-ok]{background:var(--dsw-alias-state-success-primary)}
.ds-main{flex:1;min-height:0;display:flex}
.ds-main[data-narrow]{flex-direction:column}
.ds-stage{flex:1;min-width:0;min-height:0;position:relative;overflow:auto;background:var(--dsw-alias-bg-layer-2)}
.ds-canvas{position:relative;margin:0 auto;transform-origin:top left}
.ds-frame{display:block;border:0;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.12),0 8px 24px rgba(0,0,0,.08)}
.ds-status{padding:16px;color:var(--dsw-alias-label-secondary)}
.ds-status[data-bad]{color:var(--dsw-alias-state-error-primary)}
.ds-side{width:300px;flex:none;border-left:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);overflow:auto;display:flex;flex-direction:column}
.ds-main[data-narrow] .ds-side{width:auto;border-left:0;border-top:1px solid var(--dsw-alias-border-l1);max-height:45%}
.ds-sec{padding:12px;border-bottom:1px solid var(--dsw-alias-border-l1);display:flex;flex-direction:column;gap:8px}
.ds-sec h4{margin:0;font-size:12px;font-weight:600;display:flex;align-items:center;gap:6px}
.ds-muted{color:var(--dsw-alias-label-secondary)}
.ds-kv{display:grid;grid-template-columns:auto 1fr;gap:4px 10px;align-items:baseline}
.ds-kv span:nth-child(odd){color:var(--dsw-alias-label-secondary)}
.ds-code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px;word-break:break-all;color:var(--dsw-alias-label-primary)}
.ds-swatch{display:inline-block;width:10px;height:10px;border-radius:3px;border:1px solid var(--dsw-alias-border-l2);vertical-align:-1px;margin-right:4px}
.ds-input{width:100%;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;padding:6px 8px;resize:vertical}
.ds-input:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
.ds-tray{border-top:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);padding:8px 10px;display:flex;flex-direction:column;gap:6px;max-height:34%;overflow:auto}
.ds-tray-head{display:flex;align-items:center;gap:8px}
.ds-note{display:flex;gap:8px;align-items:flex-start;padding:6px 8px;border-radius:7px;background:var(--dsw-alias-bg-layer-2)}
.ds-num{flex:none;font-weight:600;color:var(--dsw-alias-brand-primary)}
.ds-note-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.ds-link{border:0;background:none;padding:0 4px;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}
.ds-link:hover{color:var(--dsw-alias-brand-primary)}
.ds-issue{display:grid;grid-template-columns:auto 1fr;gap:2px 8px;padding:8px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}
.ds-issue:last-child{border-bottom:0}
.ds-dot{width:7px;height:7px;border-radius:4px;margin-top:4px;background:var(--dsw-alias-state-warn-primary)}
.ds-dot[data-level=must]{background:var(--dsw-alias-state-error-primary)}
.ds-issue-title{font-weight:600;line-height:1.5}
.ds-issue-actions{grid-column:2;display:flex;gap:2px;margin-left:-4px}
.ds-chip{display:inline-block;padding:0 6px;border-radius:9px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:11px;line-height:18px}
.ds-banner{margin:8px 10px 0;padding:10px 12px;border-radius:9px;border:1px solid var(--dsw-alias-state-error-primary);background:var(--dsw-alias-bg-layer-1);display:flex;flex-direction:column;gap:8px}
.ds-banner[data-ok]{border-color:var(--dsw-alias-state-success-primary)}
.ds-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.ds-page{display:grid;grid-template-columns:minmax(0,560px);gap:14px;font-size:13px}
.ds-card{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:14px 16px;display:flex;flex-direction:column;gap:10px}
.ds-field{display:flex;flex-direction:column;gap:6px}
.ds-field>span{font-size:12px;color:var(--dsw-alias-label-secondary)}
`

    // ── 工作台 ─────────────────────────────────────────
    function makeWorkbench(ctx, describeOnce) {
      return function Workbench(props) {
        const { content, resourceAddress, readRelated, inputActions } = props
        const file = useMemo(() => parseAddress(resourceAddress), [resourceAddress])
        const sessionId = props.sessionId || (file && file.sessionId)
        const fileName = file ? file.path.split('/').pop() : ''
        const [config, setConfig] = useState(null)
        const [vp, setVp] = useState(null)
        const [mode, setMode] = useState('browse')
        const [frame, setFrame] = useState(null)
        const [stageW, setStageW] = useState(0)
        const [narrow, setNarrow] = useState(false)
        const [selection, setSelection] = useState([])
        const [comment, setComment] = useState('')
        const [notes, setNotes] = useState([])
        const [qa, setQa] = useState(null)
        const [qaBusy, setQaBusy] = useState(false)
        const [panel, setPanel] = useState('none')
        const [ignored, setIgnored] = useState([])
        const [exportState, setExportState] = useState(null)
        const [toast, setToast] = useState('')
        const frameRef = useRef(null)
        const stageRef = useRef(null)
        const rootRef = useRef(null)
        const pending = useRef(new Map())

        useEffect(() => { let alive = true; describeOnce().then((d) => { if (alive && d && d.ok) { setConfig(d); setVp((v) => v || d.config.defaultViewport || 'desktop') } }, () => { if (alive) setVp((v) => v || 'desktop') }); return () => { alive = false } }, [])
        const viewport = VIEWPORTS.find((v) => v.id === (vp || 'desktop')) || VIEWPORTS[0]

        // 打包并生成 iframe 文档
        const data = content && content.kind === 'bytes' ? content.data : null
        useEffect(() => {
          if (!data) return undefined
          const controller = new AbortController()
          setFrame(null)
          ;(async () => {
            try {
              const bundle = await packDocument(data, readRelated, resourceAddress, controller.signal)
              if (controller.signal.aborted) return
              const url = URL.createObjectURL(new Blob([frameDocument(bundle)], { type: 'text/html' }))
              setFrame({ url, assets: bundle.assets.length })
            } catch (e) {
              if (!controller.signal.aborted) setFrame({ error: String(e && e.message || e) })
            }
          })()
          return () => controller.abort()
        }, [data, resourceAddress, readRelated])
        useEffect(() => () => { if (frame && frame.url) URL.revokeObjectURL(frame.url) }, [frame])
        useEffect(() => { setQa(null); setSelection([]) }, [data, vp])

        // 舞台尺寸 → 缩放
        useEffect(() => {
          const el = stageRef.current
          const root = rootRef.current
          if (!el || !root || typeof ResizeObserver === 'undefined') return undefined
          const ro = new ResizeObserver(() => { setStageW(el.clientWidth); setNarrow(root.clientWidth < 760) })
          ro.observe(el); ro.observe(root)
          setStageW(el.clientWidth); setNarrow(root.clientWidth < 760)
          return () => ro.disconnect()
        }, [frame])
        const scale = stageW > 0 ? Math.min(1, (stageW - 24) / viewport.w) : 1
        const frameH = Math.max(viewport.h, 600)

        // iframe 消息
        const send = useCallback((msg) => { const w = frameRef.current && frameRef.current.contentWindow; if (w) { msg[TAG] = true; w.postMessage(msg, '*') } }, [])
        useEffect(() => {
          const onMsg = (e) => {
            const d = e.data
            if (!d || d[TAG] !== true || !frameRef.current || e.source !== frameRef.current.contentWindow) return
            if (d.type === 'ready') send({ type: 'mode', mode })
            else if (d.type === 'select') setSelection((cur) => (d.additive ? cur.filter((x) => x.selector !== d.item.selector).concat([d.item]) : [d.item]))
            else if (d.type === 'unselect') setSelection((cur) => cur.filter((x) => x.selector !== d.selector))
            else if (d.type === 'qa-result') { const p = pending.current.get(d.id); if (p) { pending.current.delete(d.id); p(d.result) } }
          }
          window.addEventListener('message', onMsg)
          return () => window.removeEventListener('message', onMsg)
        }, [send, mode])
        useEffect(() => { send({ type: 'mode', mode }); if (mode !== 'select') setSelection([]) }, [mode, send])

        const runQa = useCallback(() => new Promise((resolve) => {
          const id = 'qa' + Date.now() + Math.random().toString(36).slice(2, 6)
          const timer = setTimeout(() => { pending.current.delete(id); resolve({ error: 'timeout', issues: [], stats: {} }) }, 20000)
          pending.current.set(id, (r) => { clearTimeout(timer); resolve(r) })
          send({ type: 'qa', id, options: { bannedWords: config && config.config.bannedWords, targetChars: config && config.config.targetChars } })
        }), [send, config])
        const doQa = async () => { setQaBusy(true); setPanel('qa'); const r = await runQa(); setQa(r); setIgnored([]); setQaBusy(false); return r }

        const setDraft = (text) => {
          try { if (inputActions && typeof inputActions.setDraft === 'function') { inputActions.setDraft(text); return true } } catch (e) {}
          try {
            const conv = ctx.get('conversation')
            const scope = ctx.sessions && ctx.sessions.scope ? ctx.sessions.scope(sessionId) : undefined
            if (conv && conv.input && scope) { const f = conv.input.for(scope); f.setDraft(text); try { f.focus && f.focus() } catch (e) {} return true }
          } catch (e) {}
          try { navigator.clipboard.writeText(text) } catch (e) {}
          return false
        }
        const flash = (s) => { setToast(s); setTimeout(() => setToast(''), 3200) }

        const addNote = () => {
          if (!selection.length || !comment.trim()) return
          setNotes((n) => n.concat([{ id: Date.now(), targets: selection, comment: comment.trim() }]))
          setComment('')
          setSelection([])
          send({ type: 'clear' })
        }
        const describeTarget = (t) => {
          const s = t.styles || {}
          return '[' + t.selector + '] 「' + (t.text || '').slice(0, 80) + '」 字号 ' + s.fontSize + ' · 字重 ' + s.fontWeight + ' · 颜色 ' + s.color + (s.background && s.background !== 'rgba(0, 0, 0, 0)' ? ' · 背景 ' + s.background : '') + '\n   HTML：' + (t.html || '').replace(/\s+/g, ' ').slice(0, 240)
        }
        const filePath = file ? file.path : fileName
        const sendNotes = () => {
          const lines = [fmt(tr('msgHead'), { file: filePath })]
          notes.forEach((n, i) => {
            lines.push(CIRCLED[i] + ' ' + n.comment)
            n.targets.forEach((t) => lines.push('   ' + describeTarget(t)))
          })
          lines.push('（视口 ' + viewport.w + 'px）')
          flash(setDraft(lines.join('\n')) ? tr('sent') : tr('sent') + '（已复制到剪贴板）')
        }
        const issueText = (i, k) => (CIRCLED[k] || (k + 1) + '.') + ' [' + (i.level === 'must' ? '必改' : '建议') + '·' + tr('cat_' + i.cat) + '] ' + i.title + (i.detail ? '｜' + i.detail : '') + (i.selector ? '｜位置 ' + i.selector : '') + (i.fix ? ' → ' + i.fix : '')
        const visibleIssues = qa && qa.issues ? qa.issues.filter((i) => !ignored.includes(i.id)).sort((a, b) => (a.level === b.level ? 0 : a.level === 'must' ? -1 : 1)) : []
        const issueToNote = (i) => setNotes((n) => n.concat([{ id: Date.now(), targets: i.selector ? [{ selector: i.selector, text: i.detail, styles: {}, html: '' }] : [], comment: '[QA] ' + i.title + (i.fix ? '，' + i.fix : '') }]))
        const sendAllIssues = () => {
          const lines = [fmt(tr('msgQaHead'), { file: filePath })].concat(visibleIssues.map(issueText))
          flash(setDraft(lines.join('\n')) ? tr('sent') : tr('sent') + '（已复制到剪贴板）')
        }

        const doExport = async (force) => {
          setExportState({ busy: true })
          try {
            if (!force && (!config || config.config.qaBeforeExport !== false)) {
              const r = await runQa()
              setQa(r)
              const must = (r.issues || []).filter((i) => i.level === 'must').length
              if (must > 0) { setExportState({ confirm: must }); return }
            }
            const r = await bridge('/export', { sessionId, path: file ? file.path : '', force: true })
            if (!r.ok) throw new Error(r.error || 'export failed')
            setExportState({ done: r })
            try { const sr = ctx.get('sidebarRight'); if (sr && sr.openResource && sessionId) sr.openResource(sessionFileAddress(sessionId, r.pdfPath)) } catch (e) {}
          } catch (e) { setExportState({ error: String(e && e.message || e) }) }
        }
        const openPdf = (p) => { try { const sr = ctx.get('sidebarRight'); if (sr && sr.openResource) sr.openResource(sessionFileAddress(sessionId, p)) } catch (e) {} }

        if (!data) return null
        const mustCount = qa && qa.issues ? qa.issues.filter((i) => i.level === 'must' && !ignored.includes(i.id)).length : null
        const sideOpen = mode === 'select' || panel === 'qa'

        const toolbar = h('div', { className: 'ds-bar' },
          h('div', { className: 'ds-seg', role: 'radiogroup', 'aria-label': 'viewport' }, VIEWPORTS.map((v) => h('button', { key: v.id, type: 'button', role: 'radio', 'aria-checked': viewport.id === v.id, onClick: () => setVp(v.id) }, tr('vp_' + v.id)))),
          h('span', { className: 'ds-zoom' }, fmt(tr('zoom'), { n: Math.round(scale * 100) })),
          h('span', { className: 'ds-sp' }),
          h('div', { className: 'ds-seg', role: 'radiogroup', 'aria-label': 'mode' },
            h('button', { type: 'button', role: 'radio', 'aria-checked': mode === 'browse', onClick: () => setMode('browse') }, tr('browse')),
            h('button', { type: 'button', role: 'radio', 'aria-checked': mode === 'select', onClick: () => { setMode('select'); setPanel('none') } }, tr('select'))),
          h('button', { type: 'button', className: 'ds-btn', disabled: qaBusy || !frame || !frame.url, onClick: () => (panel === 'qa' && qa && !qaBusy ? setPanel('none') : doQa()) },
            qaBusy ? tr('qaRunning') : tr('qa'), mustCount !== null ? h('span', { className: 'ds-badge', 'data-ok': mustCount === 0 ? '' : undefined }, String(mustCount)) : null),
          h('button', { type: 'button', className: 'ds-btn', 'data-primary': '', disabled: (exportState && exportState.busy) || !frame || !frame.url, onClick: () => doExport(false) }, exportState && exportState.busy ? tr('exporting') : tr('export')))

        const banner = exportState && (exportState.confirm || exportState.done || exportState.error) ? h('div', { className: 'ds-banner', 'data-ok': exportState.done ? '' : undefined },
          exportState.confirm ? [
            h('b', { key: 't' }, fmt(tr('confirmTitle'), { n: exportState.confirm })), h('span', { key: 'b', className: 'ds-muted' }, tr('confirmBody')),
            h('div', { key: 'r', className: 'ds-row' },
              h('button', { type: 'button', className: 'ds-btn', onClick: () => { setPanel('qa'); setMode('browse') } }, tr('viewIssues')),
              h('button', { type: 'button', className: 'ds-btn', 'data-primary': '', onClick: () => doExport(true) }, tr('exportAnyway')),
              h('button', { type: 'button', className: 'ds-link', onClick: () => setExportState(null) }, tr('cancel')))] : null,
          exportState.done ? h('div', { className: 'ds-row' }, h('span', null, fmt(tr('exported'), { name: exportState.done.pdfPath.split(/[\\/]/).pop(), pages: exportState.done.pages })), h('button', { type: 'button', className: 'ds-btn', onClick: () => openPdf(exportState.done.pdfPath) }, tr('openPdf')), h('button', { type: 'button', className: 'ds-link', onClick: () => setExportState(null) }, '×')) : null,
          exportState.error ? h('div', { className: 'ds-row' }, h('span', { className: 'ds-status', 'data-bad': '', style: { padding: 0 } }, fmt(tr('exportFail'), { e: exportState.error })), h('button', { type: 'button', className: 'ds-link', onClick: () => setExportState(null) }, '×')) : null) : null

        const stage = h('div', { className: 'ds-stage', ref: stageRef },
          !frame ? h('div', { className: 'ds-status' }, tr('loading')) :
            frame.error ? h('div', { className: 'ds-status', 'data-bad': '' }, fmt(tr('failed'), { e: frame.error })) :
              h('div', { style: { width: viewport.w * scale, height: frameH * scale, margin: '12px auto' } },
                h('div', { className: 'ds-canvas', style: { width: viewport.w, height: frameH, transform: 'scale(' + scale + ')' } },
                  h('iframe', { ref: frameRef, key: frame.url + viewport.id, className: 'ds-frame', src: frame.url, sandbox: 'allow-scripts', title: tr('title'), style: { width: viewport.w, height: frameH } }))))

        const selectPanel = mode === 'select' ? h('div', { className: 'ds-sec' },
          h('h4', null, selection.length ? fmt(tr('selected'), { n: selection.length }) : tr('select')),
          !selection.length ? h('div', { className: 'ds-muted' }, tr('pickHint')) : selection.map((s) => h('div', { key: s.selector, className: 'ds-kv' },
            h('span', null, tr('selector')), h('span', { className: 'ds-code' }, s.selector),
            h('span', null, tr('text')), h('span', null, (s.text || '').slice(0, 120)),
            h('span', null, tr('styles')), h('span', null,
              h('span', { className: 'ds-swatch', style: { background: s.styles.color } }), s.styles.fontSize + ' · ' + s.styles.fontWeight + ' · ' + s.styles.fontFamily,
              s.styles.background && s.styles.background !== 'rgba(0, 0, 0, 0)' ? h('span', null, ' · ', h('span', { className: 'ds-swatch', style: { background: s.styles.background } }), s.styles.background) : null),
            h('span', null, '尺寸'), h('span', null, s.rect.w + '×' + s.rect.h + ' · 内边距 ' + s.styles.padding))),
          selection.length ? h('textarea', { className: 'ds-input', rows: 3, value: comment, placeholder: tr('commentPh'), onChange: (e) => setComment(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addNote() } }) : null,
          selection.length ? h('div', { className: 'ds-row' }, h('button', { type: 'button', className: 'ds-btn', 'data-primary': '', disabled: !comment.trim(), onClick: addNote }, tr('addNote'))) : null) : null

        const qaPanel = panel === 'qa' ? h('div', { className: 'ds-sec' },
          h('h4', null, tr('qaTitle'), qa && qa.stats ? h('span', { className: 'ds-chip' }, fmt(tr('qaStats'), { cjk: qa.stats.cjk || 0, words: qa.stats.words || 0, fig: qa.stats.figures || 0, tab: qa.stats.tables || 0, pages: qa.stats.pages || 0 })) : null),
          qaBusy ? h('div', { className: 'ds-muted' }, tr('qaRunning')) : qa && qa.error ? h('div', { className: 'ds-status', 'data-bad': '' }, qa.error) :
            !visibleIssues.length ? h('div', { className: 'ds-muted' }, tr('qaEmpty')) :
              h('div', null, visibleIssues.map((i) => h('div', { key: i.id, className: 'ds-issue' },
                h('span', { className: 'ds-dot', 'data-level': i.level }),
                h('div', null, h('div', { className: 'ds-issue-title' }, i.title), h('div', { className: 'ds-muted' }, h('span', { className: 'ds-chip' }, tr('cat_' + i.cat)), ' ', i.detail), i.fix ? h('div', { className: 'ds-muted' }, '→ ' + i.fix) : null),
                h('div', { className: 'ds-issue-actions' },
                  i.selector ? h('button', { type: 'button', className: 'ds-link', onClick: () => send({ type: 'locate', selector: i.selector }) }, tr('locate')) : null,
                  h('button', { type: 'button', className: 'ds-link', onClick: () => issueToNote(i) }, tr('toAgent')),
                  h('button', { type: 'button', className: 'ds-link', onClick: () => setIgnored((x) => x.concat([i.id])) }, tr('ignore')))))),
          visibleIssues.length ? h('div', { className: 'ds-row' }, h('button', { type: 'button', className: 'ds-btn', onClick: sendAllIssues }, tr('allToAgent'))) : null) : null

        const tray = h('div', { className: 'ds-tray' },
          h('div', { className: 'ds-tray-head' }, h('b', null, tr('tray')), h('span', { className: 'ds-sp' }),
            toast ? h('span', { className: 'ds-muted' }, toast) : null,
            notes.length ? h('button', { type: 'button', className: 'ds-link', onClick: () => setNotes([]) }, tr('clearAll')) : null,
            h('button', { type: 'button', className: 'ds-btn', 'data-primary': '', disabled: !notes.length, onClick: sendNotes }, fmt(tr('sendAll'), { n: notes.length }))),
          notes.length ? notes.map((n, i) => h('div', { key: n.id, className: 'ds-note' },
            h('span', { className: 'ds-num' }, CIRCLED[i] || String(i + 1)),
            h('div', { className: 'ds-note-body' }, h('span', null, n.comment), h('span', { className: 'ds-code ds-muted' }, n.targets.map((t) => t.selector).join('  ·  '))),
            n.targets[0] ? h('button', { type: 'button', className: 'ds-link', onClick: () => send({ type: 'locate', selector: n.targets[0].selector }) }, tr('locate')) : null,
            h('button', { type: 'button', className: 'ds-link', onClick: () => setNotes((x) => x.filter((y) => y.id !== n.id)) }, tr('remove')))) :
            h('div', { className: 'ds-muted' }, tr('trayEmpty')))

        return h('div', { className: 'ds-root', ref: rootRef, 'data-deliver-studio': '' },
          toolbar, banner,
          h('div', { className: 'ds-main', 'data-narrow': narrow ? '' : undefined }, stage, sideOpen ? h('div', { className: 'ds-side' }, selectPanel, qaPanel) : null),
          tray)
      }
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
      return h('div', { className: 'ds-page' }, h('div', { className: 'ds-card' },
        field(tr('sViewport'), h('select', { className: 'ds-input', value: draft.defaultViewport, onChange: set('defaultViewport') }, VIEWPORTS.map((v) => h('option', { key: v.id, value: v.id }, tr('vp_' + v.id))))),
        h('label', { className: 'ds-row' }, h('input', { type: 'checkbox', role: 'switch', 'aria-checked': !!draft.qaBeforeExport, checked: !!draft.qaBeforeExport, onChange: set('qaBeforeExport') }), h('span', null, tr('sQaBefore'))),
        field(tr('sBanned'), h('textarea', { className: 'ds-input', rows: 6, value: draft.bannedWords, onChange: set('bannedWords') })),
        field(tr('sTarget'), h('input', { className: 'ds-input', type: 'number', min: 0, value: draft.targetChars, onChange: set('targetChars') })),
        field(tr('sBrowser'), h('input', { className: 'ds-input', value: draft.browserPath || '', onChange: set('browserPath') })),
        browser.found
          ? h('div', { className: 'ds-field' }, h('span', { className: 'ds-muted' }, tr('browserOk', { name: browser.name })), h('span', { className: 'ds-code ds-muted' }, browser.path))
          : h('div', { className: 'ds-field' }, h('span', { className: 'ds-status', 'data-bad': '', style: { padding: 0 } }, tr('browserMissing')), h('span', { className: 'ds-muted' }, tr('browserMissingHint'))),
        h('div', { className: 'ds-row' }, h('button', { type: 'button', className: 'ds-btn', 'data-primary': '', disabled: status === 'saving', onClick: save }, tr('save')),
          status === 'saved' ? h('span', { className: 'ds-muted' }, tr('saved')) : status.startsWith('fail:') ? h('span', { className: 'ds-status', 'data-bad': '', style: { padding: 0 } }, status.slice(5)) : null)))
    }
    function RowConfig(props) { return props && props.view === 'summary' ? tr('summary') : h(SettingsPage) }

    return {
      __test: { packDocument, frameDocument, parseAddress, sessionFileAddress },
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


