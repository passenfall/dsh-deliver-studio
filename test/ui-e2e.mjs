// UI 端到端：真实 React 渲染工作台 + 真实 Host bridge
//   PLAYWRIGHT_CORE=… REACT_NODE_MODULES=… node --import ./test/register.mjs test/ui-e2e.mjs <file.html> [--shots <dir>]
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
import { existsSync, readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { readAnnotations, findBrowser } from '../browser.js'
const here = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core')
const args = process.argv.slice(2)
const file = resolve(args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--shots') || join(here, 'fixtures', 'sample.html'))
const shotsAt = args.includes('--shots') ? resolve(args[args.indexOf('--shots') + 1]) : join(here, '..', '.e2e-shots')
mkdirSync(shotsAt, { recursive: true })
const port = 18940 + Math.floor(Math.random() * 50)
const srv = spawn(process.execPath, ['--import', './test/register.mjs', join(here, 'ui-harness-server.mjs'), file, String(port)], { cwd: join(here, '..'), stdio: ['pipe', 'pipe', 'inherit'] })
const info = await new Promise((r) => srv.stdout.once('data', (d) => r(String(d))))
const work = /work=(.+)$/m.exec(info)[1].trim()
const found = findBrowser(process.env.DELIVER_STUDIO_BROWSER)
if (!found) { console.error('跳过：本机没有找到 Chromium 内核浏览器（可用 DELIVER_STUDIO_BROWSER 指定）'); process.exit(2) }
const exe = found.path
const browser = await chromium.launch({ executablePath: exe, headless: true })
const errors = []
const warnings = []
const step = (s) => console.log('· ' + s)
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') warnings.push(m.type() + ': ' + m.text().slice(0, 300)) })
  const base = `http://127.0.0.1:${port}/ui.html`
  await page.goto(base + '?w=' + (process.env.PANEL_W || 760))
  await page.waitForFunction(() => window.__harnessReady === true, null, { timeout: 30000 })
  const qaBtn = page.locator('.ds-bar button[title="交付 QA"]')
  await qaBtn.waitFor()
  await page.waitForFunction(() => !document.querySelector('.ds-bar button[title="交付 QA"]').disabled, null, { timeout: 20000 })
  const inner = () => page.frames().find((f) => f !== page.mainFrame())
  // iframe 在工作台里被 CSS 缩放；Playwright 对缩放 iframe 的点击坐标不换算，这里按真实屏幕坐标点击
  const clickIn = async (loc, { shift = false } = {}) => {
    const r = await loc.evaluate((el) => { el.scrollIntoView({ block: 'center' }); const b = el.getBoundingClientRect(); return { x: b.left + Math.min(b.width / 2, 40), y: b.top + Math.min(b.height / 2, 12) } })
    const fr = await page.locator('iframe.ds-frame').boundingBox()
    const s = await page.evaluate(() => { const f = document.querySelector('.ds-frame'); return f.getBoundingClientRect().width / f.offsetWidth })
    if (shift) await page.keyboard.down('Shift')
    await page.mouse.click(fr.x + r.x * s, fr.y + r.y * s)
    if (shift) await page.keyboard.up('Shift')
  }
  await page.screenshot({ path: join(shotsAt, '01-initial.png') })
  step('初始渲染 OK，面板默认收起：' + ((await page.locator('.ds-panel').count()) === 0))
  assert.equal(await page.locator('.ds-panel').count(), 0, '默认不展开面板')
  await inner().evaluate(() => { window.__marker = 'alive' })

  // 需求 5：页面内导航（hash 路由）
  const hasNav = await inner().evaluate(() => !!document.querySelector('[data-nav]'))
  if (hasNav) {
    await clickIn(inner().locator('[data-nav="#/eval"]').first())
    await page.waitForTimeout(700)
    assert.equal(await inner().evaluate(() => location.hash), '#/eval', '点击导航后 hash 应切换')
    const title = await inner().evaluate(() => (document.querySelector('#view h1, #view h2') || {}).textContent || '')
    step('页内导航 OK → ' + title.trim().slice(0, 20))
  }

  // 需求 3：进入批注模式不展开面板；点选元素就地弹出输入气泡
  await page.locator('.ds-seg button[aria-label="批注"]').click()
  assert.equal(await page.locator('.ds-panel').count(), 0, '进入批注模式不应展开面板')
  const target = inner().locator('#view h1, #view h2, body h1, body h2').first()
  await clickIn(target)
  await page.locator('.ds-composer').waitFor({ timeout: 5000 })
  assert.ok(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('ds-input')), '气泡输入框应获得焦点')
  await page.waitForTimeout(300); await page.screenshot({ path: join(shotsAt, '02-composer.png') })
  await page.keyboard.type('标题再精简一些')
  await page.locator('.ds-composer .ds-dot').nth(4).click()
  await page.locator('.ds-composer .ds-btn.ds-primary').click()
  assert.equal(await page.locator('.ds-composer').count(), 0, '添加后气泡关闭')
  await page.waitForTimeout(300)
  assert.equal(await inner().locator('[data-note]').count(), 1, '页面上出现批注标记')
  assert.equal(await page.locator('.ds-panel').count(), 0, '添加批注后仍不强制展开面板')
  step('批注气泡 + 标记 OK')
  // 第二条：Shift 多选
  const ps = inner().locator('#view td, #view li, body > p, body li')
  if (await ps.count() > 2) {
    await clickIn(ps.nth(0)); await clickIn(ps.nth(1), { shift: true })
    await page.locator('.ds-composer').waitFor()
    assert.match(await page.locator('.ds-composer .ds-target').innerText(), /\+1/u)
    await page.locator('.ds-composer textarea').fill('两段合并')
    await page.locator('.ds-composer textarea').press('Control+Enter')
    step('Shift 多选 OK')
  }
  // 添加后焦点回到预览：直接按 Esc 退出批注模式
  assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.tagName), 'IFRAME', '添加批注后焦点应回到预览')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)
  assert.equal(await page.locator('.ds-seg button[aria-checked=true]').getAttribute('aria-label'), '浏览', 'Esc 退出批注模式')
  step('Esc 退出批注模式 OK')

  // 面板：打开 → 批注列表；改名、回复
  await page.locator('.ds-bar button[aria-label="面板"]').click()
  await page.locator('.ds-panel').waitFor()
  assert.ok(await page.locator('.ds-card').count() >= 1)
  await page.locator('.ds-card .ds-pin').first().dblclick()
  await page.locator('.ds-pin-in').fill('标题')
  await page.locator('.ds-pin-in').press('Enter')
  await page.waitForTimeout(200)
  assert.equal(await inner().locator('[data-note]').first().innerText(), '标题', '面板改名同步到页面标记')
  await page.locator('.ds-card').first().hover()
  await page.locator('.ds-card').first().locator('button[aria-label="回复"]').click()
  await page.locator('.ds-card textarea').fill('收到')
  await page.locator('.ds-card textarea').press('Control+Enter')
  assert.match(await page.locator('.ds-card').first().innerText(), /收到/u)
  await page.screenshot({ path: join(shotsAt, '03-panel-bottom.png') })
  step('面板（底部）批注列表、改名、回复 OK')

  // 停靠：菜单切到左侧；拖动标题栏到中间 → 浮动；iframe 不重载
  await page.locator('.ds-ph .ds-menu-wrap > button').click()
  await page.locator('.ds-menu-item', { hasText: '停靠左侧' }).click()
  assert.equal(await page.locator('.ds-panel').getAttribute('data-dock'), 'left')
  await page.screenshot({ path: join(shotsAt, '04-panel-left.png') })
  const ph = await page.locator('.ds-ph').boundingBox()
  const body = await page.locator('.ds-body').boundingBox()
  await page.mouse.move(ph.x + 10, ph.y + ph.height / 2)
  await page.mouse.down()
  await page.mouse.move(body.x + body.width / 2, body.y + body.height / 2, { steps: 8 })
  await page.screenshot({ path: join(shotsAt, '05-dragging.png') })
  await page.mouse.up()
  assert.equal(await page.locator('.ds-panel').getAttribute('data-dock'), 'float', '拖到中间变浮动')
  await page.screenshot({ path: join(shotsAt, '06-panel-float.png') })
  // 再拖到底边停靠
  const ph2 = await page.locator('.ds-ph').boundingBox()
  await page.mouse.move(ph2.x + 10, ph2.y + ph2.height / 2)
  await page.mouse.down()
  await page.mouse.move(body.x + body.width / 2, body.y + body.height - 10, { steps: 8 })
  await page.mouse.up()
  assert.equal(await page.locator('.ds-panel').getAttribute('data-dock'), 'bottom', '拖到底边停靠')
  assert.equal(await inner().evaluate(() => window.__marker), 'alive', '切换停靠位置不应重载预览')
  step('停靠：菜单 / 拖动 / 浮动 OK，预览未重载')

  // 需求 4：QA 分类
  await qaBtn.click()
  await page.locator('.ds-group').first().waitFor({ timeout: 25000 })
  const groups = await page.locator('.ds-group-h b').allInnerTexts()
  const chips = await page.locator('.ds-tools[role=toolbar] .ds-chip').allInnerTexts()
  step('QA 分组：' + groups.join(' / ') + '｜筛选：' + chips.join(' / ').replace(/\n/g, ''))
  await page.waitForTimeout(200); await page.screenshot({ path: join(shotsAt, '07-qa.png') })
  await page.locator('.ds-chip', { hasText: '只看必改' }).click()
  const pills = await page.locator('.ds-issue .ds-pill').allInnerTexts()
  assert.ok(pills.every((p) => p === '必改'), '只看必改')
  await page.locator('.ds-chip', { hasText: '只看必改' }).click()

  // 需求 2：导出带批注 HTML
  await page.locator('.ds-bar .ds-menu-wrap', { hasText: '导出' }).locator('> button').click()
  await page.locator('.ds-menu-item', { hasText: '导出带批注的 HTML' }).click()
  await page.locator('.ds-banner').waitFor({ timeout: 15000 })
  const bannerText = await page.locator('.ds-banner').innerText()
  assert.match(bannerText, /已导出 .*\.annotated\.html/u, bannerText)
  const name = JSON.parse(await (await fetch(`http://127.0.0.1:${port}/info`)).text()).name
  const outPath = join(work, name.replace(/\.html?$/i, '') + '.annotated.html')
  assert.ok(existsSync(outPath))
  const data = readAnnotations(readFileSync(outPath, 'utf8'))
  assert.ok(data.notes.length >= 1)
  assert.equal(data.notes[0].name, '标题')
  assert.equal(data.notes[0].replies[0].text, '收到')
  step(`导出带批注 HTML OK（${data.notes.length} 条）`)
  // 发给 Agent
  await page.locator('.ds-tab', { hasText: '批注' }).click()
  await page.locator('.ds-tools .ds-btn.ds-primary', { hasText: '发给 Agent' }).click()
  const draft = await page.evaluate(() => window.__draft)
  assert.match(draft, /【标题】标题再精简一些/u)
  step('发给 Agent OK')

  // 打开导出的带批注 HTML：预览不带 viewer，批注从文件里读出
  const p2 = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  p2.on('pageerror', (e) => errors.push('annotated: ' + e.message))
  await p2.goto(base + '?f=' + encodeURIComponent(outPath.split(/[\\/]/).pop()))
  await p2.waitForFunction(() => window.__harnessReady === true)
  await p2.waitForFunction(() => document.querySelector('.ds-bar button[title="交付 QA"]') && !document.querySelector('.ds-bar button[title="交付 QA"]').disabled, null, { timeout: 20000 })
  const f2 = p2.frames().find((f) => f !== p2.mainFrame())
  assert.equal(await f2.evaluate(() => !!document.getElementById('deliver-studio-root') || !!window.__deliverViewer), false, '工作台预览不应运行 viewer')
  if (!(await p2.locator('.ds-panel').count())) await p2.locator('.ds-bar button[aria-label="面板"]').click()
  await p2.locator('.ds-tab', { hasText: '批注' }).click()
  assert.ok(await p2.locator('.ds-card').count() >= 2, '带批注文件的批注应出现在面板里')
  await p2.locator('.ds-card').first().locator('button[aria-label="定位"]').click()
  await p2.waitForTimeout(1400)
  if (hasNav) assert.equal(await f2.evaluate(() => location.hash), '#/eval', '定位到其它路由上的批注时自动切换路由')
  assert.ok(await f2.locator('[data-note]').count() >= 1, '定位后显示标记')
  await p2.screenshot({ path: join(shotsAt, '09-reopen-annotated.png') })
  step('重新打开带批注 HTML OK')

  // 窄面板
  const p3 = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await p3.goto(base + '?w=480')
  await p3.waitForFunction(() => window.__harnessReady === true)
  await p3.waitForTimeout(1200)
  await p3.screenshot({ path: join(shotsAt, '08-narrow.png') })

  if (warnings.length) console.log('控制台告警：\n  ' + [...new Set(warnings)].slice(0, 12).join('\n  '))
  assert.deepEqual(errors, [], '页面错误：' + errors.join('; '))
  console.log('ui e2e 通过 ✓  截图：' + shotsAt)
} finally {
  await browser.close()
  srv.stdin.end(); srv.kill()
}
