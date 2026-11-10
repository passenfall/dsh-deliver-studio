/**
 * dsh-deliver-studio · Host half
 * 同一组 Host 方法（runQa / runExport）被三处调用：
 *   - 模型工具 deliver_qa / deliver_export_pdf
 *   - 人工命令 /deliver qa|export <文件>
 *   - 工作台界面（经 /api/dsh-deliver-studio/* bridge）
 */
import Schema from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { existsSync, statSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve, isAbsolute, extname, basename, dirname, join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { randomBytes } from 'node:crypto'
import { qaFile, exportPdf, findBrowser, pickBrowserPath, stripAnnotations, readAnnotations, annotationBlock, inject as injectHtml } from './browser.js'

export const name = 'dsh-deliver-studio'
export const inject = ['tools', 'agents']

const NS = 'deliver-studio'
const BRIDGE = '/api/dsh-deliver-studio'
export const VIEWPORTS = { desktop: [1440, 900], laptop: [1280, 800], tablet: [768, 1024], mobile: [390, 844], a4: [794, 1123] }
export const DEFAULT_BANNED = ['TODO', 'TBD', 'FIXME', '待补充', '此处替换', 'Lorem ipsum']

const deprecated = (s) => (typeof s.deprecated === 'function' ? s.deprecated() : s)

export const Config = Schema.object({
  bannedWords: Schema.array(Schema.string()).default(DEFAULT_BANNED).description('交付规范：禁用字样').volatile(),
  targetChars: Schema.number().min(0).default(0).description('目标字数（0 表示只统计不比较）').volatile(),
  defaultViewport: Schema.union(Object.keys(VIEWPORTS)).default('desktop').description('工作台默认视口').volatile(),
  qaBeforeExport: Schema.boolean().default(true).description('导出 PDF 前强制 QA，有必改项先确认').volatile(),
  browserPath: Schema.string().default('').description('浏览器可执行文件路径（Edge / Chrome / Chromium / Brave；留空自动查找）').volatile(),
  edgePath: deprecated(Schema.string().default('').description('（已弃用，请改用 browserPath）旧版 Edge 路径；browserPath 为空时仍会读取').volatile()),
})

const unref = (v) => (v !== null && typeof v === 'object' && typeof v.get === 'function' ? v.get() : v)

// ── 批注数据清洗（只保留导出 HTML 需要的字段） ─────────────
const cleanStr = (v, n) => (typeof v === 'string' ? v.slice(0, n) : '')
const cleanNum = (v) => (Number.isFinite(v) ? v : 0)
const cleanAuthor = (a) => ({ id: cleanStr(a?.id, 64), name: cleanStr(a?.name, 40) })
const cleanColor = (c) => (/^#[0-9a-f]{6}$/iu.test(c ?? '') ? c : '#e5484d')
export function cleanNotes(notes) {
  if (!Array.isArray(notes)) return []
  return notes.slice(0, 500).filter((n) => n && typeof n.id === 'string').map((n) => ({
    id: cleanStr(n.id, 64), name: cleanStr(n.name, 40), color: cleanColor(n.color), comment: cleanStr(n.comment, 4000),
    author: cleanAuthor(n.author), time: cleanNum(n.time), updated: cleanNum(n.updated),
    targets: (Array.isArray(n.targets) ? n.targets : []).slice(0, 20).map((t) => ({ selector: cleanStr(t?.selector, 1000), tag: cleanStr(t?.tag, 40), text: cleanStr(t?.text, 200), route: cleanStr(t?.route, 400) })),
    replies: (Array.isArray(n.replies) ? n.replies : []).slice(0, 200).map((r) => ({ id: cleanStr(r?.id, 64), author: cleanAuthor(r?.author), time: cleanNum(r?.time), text: cleanStr(r?.text, 4000) })),
  }))
}
function cleanPeople(p) {
  const out = {}
  if (p && typeof p === 'object') for (const [k, v] of Object.entries(p).slice(0, 200)) if (typeof v === 'string') out[k.slice(0, 64)] = v.slice(0, 40)
  return out
}

export function apply(ctx, config = {}) {
  const cfg = () => ({
    bannedWords: (unref(config.bannedWords) ?? DEFAULT_BANNED).map(unref).filter(Boolean),
    targetChars: Number(unref(config.targetChars) ?? 0),
    defaultViewport: unref(config.defaultViewport) ?? 'desktop',
    qaBeforeExport: unref(config.qaBeforeExport) !== false,
    // 兼容旧配置：browserPath 为空时读取已弃用的 edgePath
    browserPath: pickBrowserPath(unref(config.browserPath), unref(config.edgePath)) ?? '',
  })
  const browserInfo = (c = cfg()) => {
    const b = findBrowser(c.browserPath || undefined)
    return { found: Boolean(b), path: b?.path ?? '', name: b?.name ?? '' }
  }

  const cwdOf = (agent) => agent?.session?.header?.cwd ?? process.cwd()
  function resolveHtml(agent, p) {
    if (typeof p !== 'string' || !p.trim()) throw new Error('需要 HTML 文件路径')
    const raw = p.trim().replace(/^["']|["']$/gu, '')
    const abs = isAbsolute(raw) ? raw : resolve(cwdOf(agent), raw)
    if (!/\.html?$/iu.test(abs)) throw new Error(`不是 HTML 文件：${abs}`)
    if (!existsSync(abs) || !statSync(abs).isFile()) throw new Error(`文件不存在：${abs}`)
    return abs
  }

  /** Host 方法：QA（无头浏览器跑与工作台相同的检查脚本） */
  async function runQa(path, { viewport, signal } = {}) {
    const c = cfg()
    const [width, height] = VIEWPORTS[viewport] ?? VIEWPORTS[c.defaultViewport] ?? VIEWPORTS.desktop
    const result = await qaFile(path, { width, height, bannedWords: c.bannedWords, targetChars: c.targetChars, browserPath: c.browserPath || undefined, signal })
    return { path, viewport: viewport ?? c.defaultViewport, ...result }
  }

  /** Host 方法：导出 PDF（默认先 QA；有必改项且未确认时返回待确认，不导出） */
  async function runExport(path, { out, force = false, signal } = {}) {
    const c = cfg()
    let qa
    if (c.qaBeforeExport && !force) {
      qa = await runQa(path, { viewport: 'a4', signal })
      if (qa.must > 0) return { ok: false, needsConfirm: true, path, qa }
    }
    const pdf = await exportPdf(path, { out, browserPath: c.browserPath || undefined, signal })
    return { ok: true, path, ...pdf, qa }
  }

  /** Host 方法：导出带批注的 HTML（同目录 <原名>.annotated.html；源文件已带批注时写回它自己） */
  async function runAnnotated(path, { notes, people, docId, title } = {}) {
    const raw = await readFile(path, 'utf8')
    const prev = readAnnotations(raw)
    const src = stripAnnotations(raw)
    const ext = extname(path) || '.html'
    const base = basename(path, ext).replace(/\.annotated$/iu, '')
    const out = join(dirname(path), `${base}.annotated${ext}`)
    const now = Date.now()
    const data = {
      format: 'deliver-studio-annotations', version: 1,
      docId: cleanStr(docId, 64) || prev?.docId || 'd' + randomBytes(6).toString('hex'),
      file: base + ext, title: cleanStr(title, 200),
      exportedAt: now, savedAt: now,
      people: cleanPeople(people),
      notes: cleanNotes(notes),
      source: gzipSync(Buffer.from(src, 'utf8')).toString('base64'),
    }
    const html = injectHtml(src, { bodyEnd: annotationBlock(data) })
    await writeFile(out, html, 'utf8')
    return { ok: true, path: out, notes: data.notes.length, bytes: Buffer.byteLength(html), docId: data.docId }
  }

  function renderQa(r, max = 40) {
    const lines = [`交付 QA：${basename(r.path)}（视口 ${r.viewport}）必改 ${r.must}、建议 ${r.hint}；中文 ${r.stats?.cjk ?? 0} 字、英文 ${r.stats?.words ?? 0} 词${r.stats?.pages ? `、${r.stats.pages} 页` : ''}${r.stats?.figures ? `、图 ${r.stats.figures}` : ''}${r.stats?.tables ? `、表 ${r.stats.tables}` : ''}`]
    const items = [...(r.issues ?? [])].sort((a, b) => (a.level === b.level ? 0 : a.level === 'must' ? -1 : 1))
    items.slice(0, max).forEach((i, k) => lines.push(`${k + 1}) [${i.level === 'must' ? '必改' : '建议'}·${CAT[i.cat] ?? i.cat}] ${i.title}${i.detail ? '｜' + i.detail : ''}${i.selector ? `｜位置 ${i.selector}` : ''}${i.fix ? ` → ${i.fix}` : ''}`))
    if (items.length > max) lines.push(`……另有 ${items.length - max} 条`)
    return lines.join('\n')
  }
  const CAT = { numbering: '编号', layout: '版式', text: '文本', visual: '视觉', asset: '资源', delivery: '交付规范' }
  function renderExport(r) {
    if (r.needsConfirm) return `导出前 QA 发现 ${r.qa.must} 处必改，未导出。修复后重试，或确认无误后带 force 再导出。\n\n${renderQa(r.qa, 20)}`
    return `已导出 PDF：${r.pdfPath}（${r.pages} 页，${(r.bytes / 1024 / 1024).toFixed(2)} MB，用时 ${(r.ms / 1000).toFixed(1)}s）${r.qa ? `；导出前 QA 必改 0、建议 ${r.qa.hint}` : ''}`
  }

  // ── 模型工具 ────────────────────────────────────────
  const safeRegister = (make, label) => ctx.effect(() => {
    try { return ctx.tools.register(make()) } catch (error) { ctx.logger?.warn?.(`deliver-studio: ${label} registration failed: ${error instanceof Error ? error.message : String(error)}`); return () => {} }
  }, label)
  safeRegister(() => defineTool({
    name: 'deliver_qa',
    description: '交付 QA：用本机 Chromium 内核浏览器（Edge / Chrome 等）渲染 HTML 交付物并检查编号连续性（图/表/引用）、孤字（末行一两个字）、文字截断与横向溢出、A4/页面留白与溢出、文字对比度（WCAG AA）、字体字号种类、图片加载失败/拉伸/分辨率、页内死链、禁用字样和字数。返回带级别、CSS 选择器和修复建议的清单。写完或改完 HTML 交付物后用它自查。',
    parameters: {
      path: { type: 'string', description: 'HTML 文件路径（绝对路径或相对当前工作目录）', required: true },
      viewport: { type: 'string', description: '视口：desktop(1440)、laptop(1280)、tablet(768)、mobile(390)、a4(794)；默认 desktop', enum: Object.keys(VIEWPORTS) },
    },
    output: {
      schema: { type: 'object', additionalProperties: false, properties: { report: { type: 'string' }, must: { type: 'number' }, hint: { type: 'number' } } },
      render: (_a, v) => [{ type: 'text', text: v.report }],
    },
    timeoutMs: 120_000,
    async execute(args, exec) {
      const r = await runQa(resolveHtml(exec?.agent, args.path), { viewport: args.viewport, signal: exec?.signal })
      return { report: renderQa(r), must: r.must, hint: r.hint }
    },
  }), 'deliver-studio: deliver_qa')

  safeRegister(() => defineTool({
    name: 'deliver_export_pdf',
    description: '用本机 Chromium 内核浏览器（Edge / Chrome 等）把 HTML 交付物导出为 PDF（A4、保留背景色、无浏览器页眉页脚）。默认先跑交付 QA：有必改项时不导出并返回问题清单；修完再导出，或在用户确认后传 force=true。',
    parameters: {
      path: { type: 'string', description: 'HTML 文件路径', required: true },
      out: { type: 'string', description: '输出 PDF 路径（默认与 HTML 同目录同名 .pdf）' },
      force: { type: 'boolean', description: '跳过导出前 QA 拦截（仅在用户确认后使用）' },
    },
    output: {
      schema: { type: 'object', additionalProperties: false, properties: { report: { type: 'string' }, ok: { type: 'boolean' }, pdfPath: { type: 'string' } } },
      render: (_a, v) => [{ type: 'text', text: v.report }],
    },
    timeoutMs: 240_000,
    async execute(args, exec) {
      const path = resolveHtml(exec?.agent, args.path)
      const out = typeof args.out === 'string' && args.out.trim() ? (isAbsolute(args.out) ? args.out : resolve(cwdOf(exec?.agent), args.out)) : undefined
      const r = await runExport(path, { out, force: args.force === true, signal: exec?.signal })
      return { report: renderExport(r), ok: r.ok === true, pdfPath: r.pdfPath ?? '' }
    },
  }), 'deliver-studio: deliver_export_pdf')

  // ── 人工命令 /deliver ───────────────────────────────
  ctx.inject(['commands'], (c) => {
    c.effect(() => c.commands.register({
      name: 'deliver',
      description: '交付工作台：/deliver qa <文件> 跑交付 QA；/deliver export <文件> [--force] 用本机 Chromium 内核浏览器（Edge / Chrome 等）导出 PDF；/deliver <文件> 在右侧打开后选「交付工作台」',
      input: { hint: 'qa|export <HTML 文件> [--force]' },
      handler: async (invocation) => {
        const raw = String(invocation.rawInput ?? '').trim()
        const m = /^(qa|export|导出|检查)?\s*([\s\S]*)$/u.exec(raw)
        const verb = m?.[1] ?? ''
        let rest = (m?.[2] ?? '').trim()
        const force = /\s--force\s*$/u.test(' ' + rest)
        rest = rest.replace(/\s*--force\s*$/u, '')
        if (!rest) return { kind: 'error', text: '用法：/deliver qa <HTML 文件>，或 /deliver export <HTML 文件> [--force]' }
        try {
          const path = resolveHtml(invocation.agent, rest)
          if (verb === 'export' || verb === '导出') return { kind: 'success', text: renderExport(await runExport(path, { force, signal: invocation.signal })) }
          if (verb === 'qa' || verb === '检查') return { kind: 'success', text: renderQa(await runQa(path, { signal: invocation.signal })) }
          return { kind: 'success', text: `在右侧文件预览中打开 ${path}，渲染器选择「交付工作台」即可使用视口切换、选择·Ask AI、QA 和导出。` }
        } catch (error) {
          return { kind: 'error', text: error instanceof Error ? error.message : String(error) }
        }
      },
    }), 'deliver-studio: /deliver')
  })

  // ── 工作台 bridge ───────────────────────────────────
  ctx.inject(['webServer'], (c) => {
    const isLoopback = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket?.remoteAddress ?? '')
    const writeJson = (res, status, body) => {
      res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
      res.end(JSON.stringify(body))
    }
    const readJson = async (req, limit = 256 * 1024) => {
      const chunks = []
      let size = 0
      for await (const chunk of req) { size += chunk.length; if (size > limit) return undefined; chunks.push(chunk) }
      try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') } catch { return undefined }
    }
    const guard = (req, res) => {
      if (!isLoopback(req)) { writeJson(res, 403, { ok: false, error: 'loopback only' }); return false }
      if (req.method !== 'POST') { writeJson(res, 405, { ok: false, error: 'POST only' }); return false }
      if (!String(req.headers['content-type'] ?? '').includes('application/json')) { writeJson(res, 415, { ok: false, error: 'json only' }); return false }
      const origin = req.headers.origin
      if (origin && !/^https?:\/\/(?:127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/u.test(origin)) { writeJson(res, 403, { ok: false, error: 'bad origin' }); return false }
      return true
    }
    const agentOf = (sessionId) => (sessionId ? ctx.agents.get(sessionId) : undefined)
    const routes = [
      {
        kind: 'exact', path: `${BRIDGE}/describe`, handler: async (req, res) => {
          if (!guard(req, res)) return
          const conf = cfg()
          writeJson(res, 200, { ok: true, config: conf, viewports: VIEWPORTS, browser: browserInfo(conf) })
        },
      },
      {
        kind: 'exact', path: `${BRIDGE}/qa`, handler: async (req, res) => {
          if (!guard(req, res)) return
          const body = await readJson(req)
          try {
            const r = await runQa(resolveHtml(agentOf(body?.sessionId), body?.path), { viewport: body?.viewport })
            writeJson(res, 200, { ok: true, ...r })
          } catch (error) { writeJson(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) }) }
        },
      },
      {
        kind: 'exact', path: `${BRIDGE}/export`, handler: async (req, res) => {
          if (!guard(req, res)) return
          const body = await readJson(req)
          try {
            const r = await runExport(resolveHtml(agentOf(body?.sessionId), body?.path), { force: body?.force === true })
            writeJson(res, 200, { ...r, ok: r.ok === true })
          } catch (error) { writeJson(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) }) }
        },
      },
      {
        kind: 'exact', path: `${BRIDGE}/annotated`, handler: async (req, res) => {
          if (!guard(req, res)) return
          const body = await readJson(req, 4 * 1024 * 1024)
          if (!body) { writeJson(res, 413, { ok: false, error: '批注数据过大或格式错误' }); return }
          try {
            const r = await runAnnotated(resolveHtml(agentOf(body.sessionId), body.path), { notes: body.notes, people: body.people, docId: body.docId, title: body.title })
            writeJson(res, 200, r)
          } catch (error) { writeJson(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) }) }
        },
      },
      {
        kind: 'exact', path: `${BRIDGE}/update`, handler: async (req, res) => {
          if (!guard(req, res)) return
          const body = await readJson(req)
          const settings = ctx.get('settings')
          if (!settings || !body || typeof body.patch !== 'object') { writeJson(res, 400, { ok: false, error: 'settings unavailable or patch missing' }); return }
          // edgePath 已弃用：只允许设置页把它清空（迁移到 browserPath）
          const allowed = ['bannedWords', 'targetChars', 'defaultViewport', 'qaBeforeExport', 'browserPath', 'edgePath']
          const patch = Object.fromEntries(Object.entries(body.patch).filter(([k, v]) => allowed.includes(k) && (k !== 'edgePath' || v === '')))
          try {
            const d = settings.describe({ redactSecrets: true }).find((x) => String(x.ns) === NS)
            await settings.update(NS, patch, d?.revision)
            const conf = cfg()
            writeJson(res, 200, { ok: true, config: conf, browser: browserInfo(conf) })
          } catch (error) { writeJson(res, 409, { ok: false, error: error instanceof Error ? error.message : String(error) }) }
        },
      },
    ]
    c.effect(() => {
      const disposers = routes.map((r) => c.webServer.register(r))
      return () => { for (const d of disposers) d() }
    }, 'deliver-studio: bridge')
  })

  ctx.inject(['settings'], (c) => {
    c.effect(() => c.settings.configure({ auto: false }, ctx.fiber), 'deliver-studio: own settings page')
  })
}

