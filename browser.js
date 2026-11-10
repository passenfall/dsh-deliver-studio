/**
 * Deliver Studio · 本机 Chromium 内核浏览器无头驱动（Host 侧，只用 Node 内置模块）
 * - findBrowser：按「显式路径 → 环境变量 → 平台常见安装位置」查找 Edge / Chrome / Chromium / Brave
 * - qaFile：把 runtime.js 注入临时副本，--dump-dom 取回 window.__deliverQA 的结果
 * - exportPdf：注入打印样式（保留背景色、A4），--print-to-pdf 导出
 * 临时副本写在原文件同目录（保证相对资源可用），结束后删除；浏览器使用独立的临时 profile。
 */
import { spawn } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { writeFile, rm, mkdtemp, mkdir, readFile } from 'node:fs/promises'
import { tmpdir, homedir } from 'node:os'
import { dirname, join, basename, extname, posix, win32 } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'

const here = dirname(fileURLToPath(import.meta.url))
export const RUNTIME_SOURCE = readFileSync(join(here, 'runtime.js'), 'utf8')
export const VIEWER_SOURCE = readFileSync(join(here, 'viewer.js'), 'utf8')

/** 带批注 HTML 的嵌入块（工作台导出、viewer「保存副本」两边格式一致） */
export const ANNOT_START = '<!--deliver-studio:annotations:start-->'
export const ANNOT_END = '<!--deliver-studio:annotations:end-->'
const ANNOT_RE = /<!--deliver-studio:annotations:start-->[\s\S]*?<!--deliver-studio:annotations:end-->/gu

/** 去掉嵌入的批注块，得到原始页面 */
export function stripAnnotations(src) { return String(src).replace(ANNOT_RE, '') }

/** 读取嵌入的批注数据；没有时返回 undefined */
export function readAnnotations(src) {
  const m = /<script type="application\/json" id="deliver-studio-data">([\s\S]*?)<\/script>/u.exec(String(src))
  if (!m) return undefined
  try { return JSON.parse(m[1]) } catch { return undefined }
}

/** 生成嵌入块：数据（含 gzip 压缩的原始页面，供 viewer 保存副本）+ viewer 脚本 */
export function annotationBlock(data) {
  if (/<\/script/iu.test(VIEWER_SOURCE)) throw new Error('viewer.js must not contain </script')
  if (VIEWER_SOURCE.includes(ANNOT_START) || VIEWER_SOURCE.includes(ANNOT_END)) throw new Error('viewer.js must not contain the annotation markers')
  const json = JSON.stringify(data).replace(/</gu, '\\u003c')
  return `${ANNOT_START}\n<script type="application/json" id="deliver-studio-data">${json}</script>\n<script id="deliver-studio-viewer">${VIEWER_SOURCE}</script>\n${ANNOT_END}`
}

export const BROWSER_MISSING = '未找到 Chromium 内核浏览器（Edge / Chrome / Chromium / Brave）。请安装其中一个，或在插件设置里填写浏览器路径。'

/** 用于覆盖自动查找的环境变量，按优先级排列 */
export const BROWSER_ENV_VARS = ['DELIVER_STUDIO_BROWSER', 'CHROME_PATH']

// Windows：<根目录>\<相对路径>，根目录取自环境变量（不写死盘符）
const WIN_ROOTS = ['PROGRAMFILES', 'PROGRAMFILES(X86)', 'LOCALAPPDATA']
const WIN_BROWSERS = [
  { name: 'Microsoft Edge', rel: ['Microsoft', 'Edge', 'Application', 'msedge.exe'] },
  { name: 'Google Chrome', rel: ['Google', 'Chrome', 'Application', 'chrome.exe'] },
  { name: 'Chromium', rel: ['Chromium', 'Application', 'chrome.exe'] },
  { name: 'Brave', rel: ['BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'] },
]
// macOS：/Applications 与 ~/Applications 下的 .app 包
const MAC_BROWSERS = [
  { name: 'Microsoft Edge', app: 'Microsoft Edge.app', exe: 'Microsoft Edge' },
  { name: 'Google Chrome', app: 'Google Chrome.app', exe: 'Google Chrome' },
  { name: 'Chromium', app: 'Chromium.app', exe: 'Chromium' },
  { name: 'Brave', app: 'Brave Browser.app', exe: 'Brave Browser' },
]
// Linux：在 PATH 里按名字查找
const LINUX_BROWSERS = [
  { name: 'Microsoft Edge', bin: 'microsoft-edge' },
  { name: 'Microsoft Edge', bin: 'microsoft-edge-stable' },
  { name: 'Google Chrome', bin: 'google-chrome' },
  { name: 'Google Chrome', bin: 'google-chrome-stable' },
  { name: 'Chromium', bin: 'chromium' },
  { name: 'Chromium', bin: 'chromium-browser' },
  { name: 'Brave', bin: 'brave-browser' },
]

/** 读取环境变量；Windows 上环境变量名不区分大小写（注入的普通对象也按此处理） */
function envGet(env, key, platform) {
  if (!env) return undefined
  const direct = env[key]
  if (direct) return direct
  if (platform !== 'win32') return undefined
  const lower = key.toLowerCase()
  const hit = Object.keys(env).find((k) => k.toLowerCase() === lower)
  return hit ? env[hit] : undefined
}

/** 由可执行文件路径猜浏览器名称（用于显式路径 / 环境变量） */
export function browserName(p) {
  const s = String(p).replace(/\\/gu, '/').toLowerCase()
  if (/msedge|microsoft[ -]edge/u.test(s)) return 'Microsoft Edge'
  if (/brave/u.test(s)) return 'Brave'
  if (/chromium/u.test(s)) return 'Chromium'
  if (/chrome/u.test(s)) return 'Google Chrome'
  return basename(String(p).replace(/\\/gu, '/')).replace(/\.exe$/iu, '') || 'Chromium'
}

/**
 * 查找本机 Chromium 内核浏览器。
 * 顺序：override（插件配置的浏览器路径）→ 环境变量 DELIVER_STUDIO_BROWSER、CHROME_PATH → 平台常见位置。
 * 显式路径不存在时继续自动查找（不会因为一条失效的配置而完全不可用）。
 * @param {string} [override] 显式指定的可执行文件路径；macOS 上也可以是 .app 包路径
 * @param {{ platform?: string, env?: Record<string, string|undefined>, exists?: (p: string) => boolean }} [deps] 可注入，便于测试
 * @returns {{ path: string, name: string } | undefined}
 */
export function findBrowser(override, { platform = process.platform, env = process.env, exists = existsSync } = {}) {
  const P = platform === 'win32' ? win32 : posix
  const check = (p) => {
    if (typeof p !== 'string' || !p.trim()) return undefined
    let s = p.trim().replace(/^["']|["']$/gu, '')
    // macOS：允许直接填 .app 包，自动指向 Contents/MacOS/<同名可执行文件>
    if (platform === 'darwin' && /\.app\/?$/iu.test(s)) {
      const app = s.replace(/\/+$/u, '')
      s = P.join(app, 'Contents', 'MacOS', P.basename(app).replace(/\.app$/iu, ''))
    }
    return exists(s) ? s : undefined
  }

  const explicit = check(override)
  if (explicit) return { path: explicit, name: browserName(explicit) }
  for (const key of BROWSER_ENV_VARS) {
    const p = check(envGet(env, key, platform))
    if (p) return { path: p, name: browserName(p) }
  }

  if (platform === 'win32') {
    const roots = WIN_ROOTS.map((k) => envGet(env, k, platform)).filter(Boolean)
    for (const b of WIN_BROWSERS) {
      for (const root of roots) {
        const p = P.join(root, ...b.rel)
        if (exists(p)) return { path: p, name: b.name }
      }
    }
    return undefined
  }

  if (platform === 'darwin') {
    const home = envGet(env, 'HOME', platform) || (env === process.env ? homedir() : '')
    const dirs = ['/Applications', home ? P.join(home, 'Applications') : ''].filter(Boolean)
    for (const b of MAC_BROWSERS) {
      for (const dir of dirs) {
        const p = P.join(dir, b.app, 'Contents', 'MacOS', b.exe)
        if (exists(p)) return { path: p, name: b.name }
      }
    }
    return undefined
  }

  // linux 及其它类 Unix：在 PATH 中查找
  const dirs = String(envGet(env, 'PATH', platform) ?? '').split(':').filter(Boolean)
  for (const b of LINUX_BROWSERS) {
    for (const dir of dirs) {
      const p = P.join(dir, b.bin)
      if (exists(p)) return { path: p, name: b.name }
    }
  }
  return undefined
}

/**
 * 配置里的浏览器路径：新键 browserPath 优先；为空时读取已弃用的 edgePath（兼容旧配置）。
 * @returns {string | undefined}
 */
export function pickBrowserPath(browserPath, edgePath) {
  const s = (v) => (typeof v === 'string' ? v.trim() : '')
  return s(browserPath) || s(edgePath) || undefined
}

function requireBrowser(browserPath) {
  const b = findBrowser(browserPath)
  if (!b) throw new Error(BROWSER_MISSING)
  return b
}

function runBrowser(exe, args, { timeoutMs = 60_000, signal } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (d) => { if (out.length < 40_000_000) out += d })
    child.stderr.on('data', (d) => { if (err.length < 200_000) err += d })
    const timer = setTimeout(() => { child.kill(); reject(new Error(`浏览器超时（${Math.round(timeoutMs / 1000)}s）`)) }, timeoutMs)
    const onAbort = () => { child.kill(); reject(new Error('已取消')) }
    signal?.addEventListener('abort', onAbort, { once: true })
    child.on('error', (e) => { clearTimeout(timer); signal?.removeEventListener('abort', onAbort); reject(new Error(`无法启动浏览器 ${exe}：${e.message}`)) })
    child.on('close', (code) => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      resolve({ code, out, err })
    })
  })
}

export function inject(html, { head = '', bodyEnd = '' }) {
  let s = html
  if (head) {
    if (/<head[^>]*>/iu.test(s)) s = s.replace(/<head[^>]*>/iu, (m) => m + head)
    else if (/<html[^>]*>/iu.test(s)) s = s.replace(/<html[^>]*>/iu, (m) => m + '<head>' + head + '</head>')
    else s = head + s
  }
  if (bodyEnd !== undefined && bodyEnd !== '') {
    const idx = s.search(/<\/body\s*>(?![\s\S]*<\/body\s*>)/iu)
    s = idx >= 0 ? s.slice(0, idx) + bodyEnd + s.slice(idx) : s + bodyEnd
  }
  return s
}

async function withTemp(htmlPath, transform, fn) {
  const src = await readFile(htmlPath, 'utf8')
  const tmp = join(dirname(htmlPath), `.deliver-studio-${randomBytes(4).toString('hex')}${extname(htmlPath) || '.html'}`)
  const profile = await mkdtemp(join(tmpdir(), 'deliver-studio-browser-'))
  // 带批注的 HTML：QA / 导出 PDF 只看原始页面，不带批注查看器
  await writeFile(tmp, transform(stripAnnotations(src)), 'utf8')
  try {
    return await fn(tmp, profile)
  } finally {
    await rm(tmp, { force: true }).catch(() => {})
    await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }).catch(() => {})
  }
}

/** Edge 与 Chrome（及 Chromium / Brave）通用的无头参数 */
const BASE_ARGS = (profile) => {
  const args = [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--disable-sync', '--disable-background-networking', '--hide-scrollbars', '--mute-audio',
    `--user-data-dir=${profile}`,
  ]
  // Linux 下以 root 运行（容器等）时 Chromium 要求关闭沙箱
  if (process.platform === 'linux' && typeof process.getuid === 'function' && process.getuid() === 0) args.push('--no-sandbox')
  return args
}

const tail = (err) => (err ? '：' + err.split('\n').filter(Boolean).slice(-2).join(' ') : '')

/**
 * 在无头浏览器中对 HTML 文件跑 QA（与工作台 iframe 内的检查同一份脚本）。
 * @returns {Promise<{version:number, stats:object, issues:object[], must:number, hint:number}>}
 */
export async function qaFile(htmlPath, { width = 1440, height = 900, bannedWords, targetChars, browserPath, edgePath, timeoutMs = 60_000, signal } = {}) {
  const browser = requireBrowser(pickBrowserPath(browserPath, edgePath))
  const opts = JSON.stringify({ bannedWords, targetChars }).replace(/</gu, '\\u003c')
  const runner = `<script>${RUNTIME_SOURCE}</script><script>(function(){function done(){var r;try{r=window.__deliverQA(${opts})}catch(e){r={error:String(e&&e.message||e),issues:[],stats:{}}}var s=document.createElement('script');s.type='application/json';s.id='__deliver_qa_result';s.textContent=JSON.stringify(r).replace(/</g,'\\\\u003c');document.documentElement.appendChild(s)}function go(){var f=document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve();f.then(function(){setTimeout(done,400)})}if(document.readyState==='complete')go();else window.addEventListener('load',go)})()</script>`
  return withTemp(htmlPath, (src) => inject(src, { bodyEnd: runner }), async (tmp, profile) => {
    const args = [...BASE_ARGS(profile), `--window-size=${width},${height}`, '--virtual-time-budget=8000', '--run-all-compositor-stages-before-draw', '--dump-dom', pathToFileURL(tmp).href]
    const { code, out, err } = await runBrowser(browser.path, args, { timeoutMs, signal })
    const m = /<script type="application\/json" id="__deliver_qa_result">([\s\S]*?)<\/script>/u.exec(out)
    if (!m) throw new Error(`浏览器未返回 QA 结果（${browser.name}，exit ${code}）${tail(err)}`)
    const raw = m[1].replace(/&lt;/gu, '<').replace(/&gt;/gu, '>').replace(/&amp;/gu, '&')
    return { ...JSON.parse(raw), browser: browser.name }
  })
}

/**
 * 导出 PDF：A4、保留背景色、去掉浏览器页眉页脚。
 * @returns {Promise<{pdfPath:string, bytes:number, pages:number, ms:number, browser:string}>}
 */
export async function exportPdf(htmlPath, { out, browserPath, edgePath, timeoutMs = 120_000, signal } = {}) {
  const browser = requireBrowser(pickBrowserPath(browserPath, edgePath))
  const pdfPath = out ?? join(dirname(htmlPath), basename(htmlPath, extname(htmlPath)) + '.pdf')
  const started = Date.now()
  await withTemp(htmlPath, (src) => {
    const hasPage = /@page\b/iu.test(src)
    const paged = /210mm|297mm|794px|1123px/u.test(src)
    const css = `<style data-deliver-print>@media print{html,body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}${hasPage ? '' : `@page{size:A4;margin:${paged ? '0' : '12mm'}}`}</style>`
    return inject(src, { head: css })
  }, async (tmp, profile) => {
    await rm(pdfPath, { force: true }).catch(() => {})
    await mkdir(dirname(pdfPath), { recursive: true }) // 输出目录不存在时浏览器会直接写失败
    const args = [...BASE_ARGS(profile), '--no-pdf-header-footer', '--print-to-pdf-no-header', `--print-to-pdf=${pdfPath}`, '--virtual-time-budget=10000', '--run-all-compositor-stages-before-draw', pathToFileURL(tmp).href]
    const { code, err } = await runBrowser(browser.path, args, { timeoutMs, signal })
    if (!existsSync(pdfPath) || statSync(pdfPath).size === 0) throw new Error(`浏览器导出失败（${browser.name}，exit ${code}）${tail(err)}`)
  })
  const buf = await readFile(pdfPath)
  const pages = (buf.toString('latin1').match(/\/Type\s*\/Page(?!s)/gu) || []).length
  return { pdfPath, bytes: buf.length, pages, ms: Date.now() - started, browser: browser.name }
}
