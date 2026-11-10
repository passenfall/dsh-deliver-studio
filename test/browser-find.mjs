// findBrowser 查找规则单测（纯函数、可注入 platform / env / exists，不依赖本机装了什么）：
//   node test/browser-find.mjs
import assert from 'node:assert/strict'
import { findBrowser, pickBrowserPath, browserName, BROWSER_MISSING } from '../browser.js'

let passed = 0
const test = (name, fn) => { fn(); passed++; console.log('✓ ' + name) }
/** 只有 present 里的路径“存在” */
const fs = (...present) => { const set = new Set(present); return (p) => set.has(p) }

// ── Windows ──────────────────────────────────────────────
const WIN_ENV = { PROGRAMFILES: 'X:\\PF', 'PROGRAMFILES(X86)': 'X:\\PF86', LOCALAPPDATA: 'X:\\Home\\AppData\\Local' }
const win = (env, exists) => findBrowser(undefined, { platform: 'win32', env, exists })
const W = {
  edge64: 'X:\\PF\\Microsoft\\Edge\\Application\\msedge.exe',
  edge86: 'X:\\PF86\\Microsoft\\Edge\\Application\\msedge.exe',
  edgeUser: 'X:\\Home\\AppData\\Local\\Microsoft\\Edge\\Application\\msedge.exe',
  chrome64: 'X:\\PF\\Google\\Chrome\\Application\\chrome.exe',
  chromeUser: 'X:\\Home\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
  chromium: 'X:\\Home\\AppData\\Local\\Chromium\\Application\\chrome.exe',
  brave: 'X:\\PF\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
}

test('win32：根目录取自 PROGRAMFILES / PROGRAMFILES(X86) / LOCALAPPDATA', () => {
  assert.deepEqual(win(WIN_ENV, fs(W.edge86)), { path: W.edge86, name: 'Microsoft Edge' })
  assert.deepEqual(win(WIN_ENV, fs(W.edgeUser)), { path: W.edgeUser, name: 'Microsoft Edge' })
  assert.deepEqual(win(WIN_ENV, fs(W.chromeUser)), { path: W.chromeUser, name: 'Google Chrome' })
})
test('win32：顺序 Edge → Chrome → Chromium → Brave', () => {
  assert.equal(win(WIN_ENV, fs(W.brave, W.chromium, W.chrome64, W.edge86)).name, 'Microsoft Edge')
  assert.equal(win(WIN_ENV, fs(W.brave, W.chromium, W.chrome64)).name, 'Google Chrome')
  assert.equal(win(WIN_ENV, fs(W.brave, W.chromium)).name, 'Chromium')
  assert.equal(win(WIN_ENV, fs(W.brave)).name, 'Brave')
})
test('win32：同一浏览器按 PROGRAMFILES → PROGRAMFILES(X86) → LOCALAPPDATA', () => {
  assert.equal(win(WIN_ENV, fs(W.edgeUser, W.edge86, W.edge64)).path, W.edge64)
  assert.equal(win(WIN_ENV, fs(W.edgeUser, W.edge86)).path, W.edge86)
})
test('win32：环境变量名不区分大小写（ProgramFiles / ProgramFiles(x86) / LocalAppData）', () => {
  const env = { ProgramFiles: 'X:\\PF', 'ProgramFiles(x86)': 'X:\\PF86', LocalAppData: 'X:\\Home\\AppData\\Local' }
  assert.equal(win(env, fs(W.edge86)).path, W.edge86)
})
test('win32：不写死盘符——环境变量缺失时不查任何默认位置', () => {
  assert.equal(win({}, () => true), undefined)
})

// ── macOS ────────────────────────────────────────────────
const MAC_ENV = { HOME: '/Users/someone' }
const mac = (exists, env = MAC_ENV, override) => findBrowser(override, { platform: 'darwin', env, exists })
const M = {
  edge: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  chrome: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  chromeUser: '/Users/someone/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  chromium: '/Applications/Chromium.app/Contents/MacOS/Chromium',
  brave: '/Users/someone/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
}
test('darwin：/Applications 与 ~/Applications 下的 .app', () => {
  assert.deepEqual(mac(fs(M.chromeUser)), { path: M.chromeUser, name: 'Google Chrome' })
  assert.deepEqual(mac(fs(M.brave)), { path: M.brave, name: 'Brave' })
})
test('darwin：顺序 Edge → Chrome → Chromium → Brave，/Applications 优先于 ~/Applications', () => {
  assert.equal(mac(fs(M.brave, M.chromium, M.chrome, M.edge)).name, 'Microsoft Edge')
  assert.equal(mac(fs(M.brave, M.chromium, M.chrome)).name, 'Google Chrome')
  assert.equal(mac(fs(M.brave, M.chromium)).name, 'Chromium')
  assert.equal(mac(fs(M.chromeUser, M.chrome)).path, M.chrome)
})
test('darwin：显式路径可以直接填 .app 包', () => {
  assert.deepEqual(mac(fs(M.chrome), {}, '/Applications/Google Chrome.app'), { path: M.chrome, name: 'Google Chrome' })
})

// ── Linux ────────────────────────────────────────────────
const LINUX_ENV = { PATH: '/usr/local/bin:/usr/bin:/snap/bin' }
const linux = (exists, env = LINUX_ENV) => findBrowser(undefined, { platform: 'linux', env, exists })
test('linux：在 PATH 里按名字查找', () => {
  assert.deepEqual(linux(fs('/snap/bin/chromium')), { path: '/snap/bin/chromium', name: 'Chromium' })
  assert.deepEqual(linux(fs('/usr/bin/google-chrome-stable')), { path: '/usr/bin/google-chrome-stable', name: 'Google Chrome' })
  assert.deepEqual(linux(fs('/usr/bin/brave-browser')), { path: '/usr/bin/brave-browser', name: 'Brave' })
})
test('linux：顺序 microsoft-edge → microsoft-edge-stable → google-chrome → google-chrome-stable → chromium → chromium-browser → brave-browser', () => {
  const all = ['/usr/bin/brave-browser', '/usr/bin/chromium-browser', '/usr/bin/chromium', '/usr/bin/google-chrome-stable', '/usr/bin/google-chrome', '/usr/bin/microsoft-edge-stable', '/usr/bin/microsoft-edge']
  const order = []
  const present = new Set(all)
  while (present.size) {
    const hit = linux((p) => present.has(p))
    order.push(hit.path.split('/').pop())
    present.delete(hit.path)
  }
  assert.deepEqual(order, ['microsoft-edge', 'microsoft-edge-stable', 'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'brave-browser'])
})
test('linux：PATH 为空时找不到', () => {
  assert.equal(linux(() => true, {}), undefined)
})

// ── 显式路径 / 环境变量 / 找不到 ───────────────────────────
test('显式路径优先于环境变量和自动查找', () => {
  const custom = 'X:\\Tools\\chrome-win\\chrome.exe'
  const env = { ...WIN_ENV, DELIVER_STUDIO_BROWSER: W.chrome64, CHROME_PATH: W.chromium }
  assert.deepEqual(findBrowser(custom, { platform: 'win32', env, exists: fs(custom, W.chrome64, W.chromium, W.edge64) }), { path: custom, name: 'Google Chrome' })
  assert.deepEqual(findBrowser('"' + custom + '"', { platform: 'win32', env, exists: fs(custom) }).path, custom, '两端引号会去掉')
})
test('显式路径不存在时回落到环境变量 / 自动查找', () => {
  assert.equal(findBrowser('X:\\nope\\chrome.exe', { platform: 'win32', env: WIN_ENV, exists: fs(W.edge64) }).path, W.edge64)
})
test('环境变量：DELIVER_STUDIO_BROWSER 优先于 CHROME_PATH，二者都优先于自动查找', () => {
  const env = { ...LINUX_ENV, DELIVER_STUDIO_BROWSER: '/opt/brave/brave', CHROME_PATH: '/opt/chrome/chrome' }
  assert.deepEqual(findBrowser(undefined, { platform: 'linux', env, exists: fs('/opt/brave/brave', '/opt/chrome/chrome', '/usr/bin/google-chrome') }), { path: '/opt/brave/brave', name: 'Brave' })
  assert.deepEqual(findBrowser(undefined, { platform: 'linux', env, exists: fs('/opt/chrome/chrome', '/usr/bin/google-chrome') }), { path: '/opt/chrome/chrome', name: 'Google Chrome' })
  assert.equal(findBrowser(undefined, { platform: 'linux', env, exists: fs('/usr/bin/google-chrome') }).path, '/usr/bin/google-chrome')
})
test('什么都找不到时返回 undefined', () => {
  assert.equal(findBrowser(undefined, { platform: 'win32', env: WIN_ENV, exists: () => false }), undefined)
  assert.equal(findBrowser(undefined, { platform: 'darwin', env: MAC_ENV, exists: () => false }), undefined)
  assert.equal(findBrowser(undefined, { platform: 'linux', env: LINUX_ENV, exists: () => false }), undefined)
  assert.equal(findBrowser('', { platform: 'linux', env: {}, exists: () => false }), undefined)
  assert.match(BROWSER_MISSING, /^未找到 Chromium 内核浏览器（Edge \/ Chrome \/ Chromium \/ Brave）。/u)
})

// ── 旧配置 edgePath 兼容 ─────────────────────────────────
test('旧 edgePath：browserPath 为空时读取 edgePath，browserPath 有值时以它为准', () => {
  const legacy = 'X:\\Old\\msedge.exe'
  assert.equal(pickBrowserPath('', legacy), legacy)
  assert.equal(pickBrowserPath('   ', legacy), legacy)
  assert.equal(pickBrowserPath(undefined, legacy), legacy)
  assert.equal(pickBrowserPath(W.chrome64, legacy), W.chrome64)
  assert.equal(pickBrowserPath('', ''), undefined)
  assert.deepEqual(findBrowser(pickBrowserPath('', legacy), { platform: 'win32', env: WIN_ENV, exists: fs(legacy, W.chrome64) }), { path: legacy, name: 'Microsoft Edge' })
})
test('browserName 由路径识别浏览器', () => {
  assert.equal(browserName('X:\\a\\msedge.exe'), 'Microsoft Edge')
  assert.equal(browserName('/usr/bin/chromium-browser'), 'Chromium')
  assert.equal(browserName('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), 'Google Chrome')
  assert.equal(browserName('/opt/vivaldi/vivaldi'), 'vivaldi')
})

console.log(`\n${passed} 项全部通过 ✓`)
