// 端到端：导出带批注的 HTML → 浏览器里打开 → 标记 / 气泡 / 回答 / 全部批注 / 改名改色 / 路由 / 保存副本
//   PLAYWRIGHT_CORE=<playwright-core 目录> node test/viewer-e2e.mjs [file.html]
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'
import { annotationBlock, inject, stripAnnotations, readAnnotations, findBrowser } from '../browser.js'
const here = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core')
const src = resolve(process.argv[2] || join(here, 'fixtures', 'sample.html'))
const work = mkdtempSync(join(tmpdir(), 'deliver-viewer-'))
const SOURCE = readFileSync(src, 'utf8')
const page0 = join(work, 'page.html')
writeFileSync(page0, SOURCE, 'utf8')
const found = findBrowser(process.env.DELIVER_STUDIO_BROWSER)
if (!found) { console.error('跳过：本机没有找到 Chromium 内核浏览器（可用 DELIVER_STUDIO_BROWSER 指定）'); process.exit(2) }
const exe = found.path
const browser = await chromium.launch({ executablePath: exe, headless: true })
const errors = []
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(e.message))
  // 1) 在原页面上取两个目标：首屏标题、另一路由（如有）上的标题
  await page.goto(pathToFileURL(page0).href)
  await page.waitForTimeout(600)
  const pick = () => page.evaluate(() => {
    const el = [...document.querySelectorAll('h1,h2,h3')].find((e) => e.getBoundingClientRect().width > 0 && e.innerText.trim())
    return el ? { tag: el.localName, text: el.innerText.replace(/\s+/g, ' ').trim().slice(0, 200), selector: '', route: location.hash } : null
  })
  const t1 = await pick()
  assert.ok(t1, '页面上应能找到标题')
  const hasRoutes = await page.evaluate(() => !!document.querySelector('[data-nav]'))
  let t2 = null
  if (hasRoutes) {
    await page.evaluate(() => { location.hash = '#/eval' })
    await page.waitForTimeout(700)
    t2 = await pick()
    t2.route = '#/eval'
  }
  // 2) 生成带批注的 HTML（与 Host runAnnotated 相同的拼装方式）
  const notes = [{ id: 'n1', name: '1', color: '#e5484d', comment: '标题再精简', author: { id: 'ua', name: '' }, time: Date.parse('2026-11-10T10:00:00+08:00'), updated: 1, targets: [t1], replies: [] }]
  if (t2) notes.push({ id: 'n2', name: '2', color: '#0d74ce', comment: '评测页标题对齐', author: { id: 'ub', name: '王五' }, time: Date.parse('2026-11-10T10:05:00+08:00'), updated: 1, targets: [t2], replies: [] })
  const data = { format: 'deliver-studio-annotations', version: 1, docId: 'dtest' + Date.now(), file: 'page.html', title: '', exportedAt: 1, savedAt: 1, people: {}, notes, source: gzipSync(Buffer.from(SOURCE, 'utf8')).toString('base64') }
  const annotatedPath = join(work, 'page.annotated.html')
  writeFileSync(annotatedPath, inject(SOURCE, { bodyEnd: annotationBlock(data) }), 'utf8')

  // 3) 打开带批注的 HTML
  await page.goto(pathToFileURL(annotatedPath).href)
  await page.waitForTimeout(800)
  const pins = () => page.evaluate(() => [...document.getElementById('deliver-studio-root').shadowRoot.querySelectorAll('.pin')].map((p) => p.textContent))
  assert.deepEqual(await pins(), ['1'], '首屏只显示当前路由上的标记')
  const sr = (sel) => page.locator('#deliver-studio-root').locator(sel)
  await sr('.pin').first().click()
  const bubbleText = await sr('.bubble').innerText()
  for (const b of ['展开全部批注', '回答批注', '关闭']) assert.ok(bubbleText.includes(b), '气泡应有按钮：' + b)
  assert.ok(bubbleText.includes('标题再精简'))
  assert.ok(!/用户\d|2026-11-10/.test(bubbleText.replace(/以\s*用户\d/, '')), '气泡不显示用户名和时间')
  assert.ok(await sr('.bubble .me input').count(), '第一次回答时显示昵称输入框')
  // 改色、改名
  await sr('.bubble .dot').nth(3).click()
  await sr('.bubble .tag').click()
  await sr('.bubble .name-in').fill('标题')
  await sr('.bubble .name-in').press('Enter')
  assert.deepEqual(await pins(), ['标题'], '标记改名生效')
  await page.waitForTimeout(250); await page.screenshot({ path: join(here, '..', '.e2e-bubble.png') })
  // 回答（昵称留空 → 用户N）
  await sr('.bubble').locator('textarea').fill('已改成一行')
  await sr('.bubble').getByText('回答批注').click()
  assert.equal(await sr('.bubble').count(), 1)
  const local = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), 'deliverStudio:doc:' + data.docId)
  assert.equal(local.notes[0].replies.length, 1)
  assert.equal(local.notes[0].color, '#30a46c')
  assert.equal(local.notes[0].name, '标题')
  // 展开全部批注：显示用户名和时间
  await sr('.bubble').getByText('展开全部批注').click()
  const drawerText = await sr('.drawer').innerText()
  assert.match(drawerText, /用户1 · 2026-11-10 10:00/u, '批注作者匿名时显示 用户1')
  assert.match(drawerText, /用户2 · \d{4}-\d\d-\d\d \d\d:\d\d/u, '我的匿名回答显示 用户2')
  assert.match(drawerText, /已改成一行/u)
  if (t2) assert.match(drawerText, /王五 · 2026-11-10 10:05/u)
  // 改昵称后，回答者显示为新名字
  await sr('.drawer .me .chip').click()
  await sr('.drawer .me input').fill('李四')
  await sr('.drawer .me input').press('Enter')
  assert.match(await sr('.drawer').innerText(), /李四 · /u)
  // 页面自身的路由切换仍可用；另一路由上的批注可以定位过去
  if (t2) {
    await sr('.drawer .card').nth(1).getByText('定位').click()
    await page.waitForTimeout(1200)
    assert.equal(await page.evaluate(() => location.hash), '#/eval')
    assert.ok((await pins()).includes('2'), '切到评测页后显示 2 号标记')
    assert.equal(await sr('.bubble').count(), 1, '定位后打开该批注的气泡')
  }
  // Esc 关闭
  await page.keyboard.press('Escape')
  assert.equal(await sr('.bubble').count(), 0)
  // 保存副本
  if (!(await sr('.drawer').count())) await sr('.launch').click()
  const [dl] = await Promise.all([page.waitForEvent('download'), sr('.drawer').getByRole('button', { name: '保存副本' }).click()])
  assert.equal(dl.suggestedFilename(), 'page.annotated.html')
  const saved = readFileSync(await dl.path(), 'utf8')
  assert.equal(stripAnnotations(saved), SOURCE, '副本去掉嵌入块后应等于原页面')
  const sd = readAnnotations(saved)
  assert.equal(sd.notes[0].replies[0].text, '已改成一行')
  assert.equal(Object.values(sd.people)[0], '李四')
  // 副本在新浏览器（无本地记录）里打开，内容齐全
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const p2 = await ctx2.newPage()
  p2.on('pageerror', (e) => errors.push('copy: ' + e.message))
  const copyPath = join(work, 'copy.annotated.html')
  writeFileSync(copyPath, saved, 'utf8')
  await p2.goto(pathToFileURL(copyPath).href)
  await p2.waitForTimeout(800)
  await p2.locator('#deliver-studio-root').locator('.launch').click()
  assert.match(await p2.locator('#deliver-studio-root').locator('.drawer').innerText(), /李四 · .*\n?已改成一行/su)
  await p2.waitForTimeout(400); await p2.screenshot({ path: join(here, '..', '.e2e-viewer.png') })
  assert.deepEqual(errors, [], '不应有页面错误：' + errors.join('; '))
  console.log(`viewer e2e 通过 ✓（${t2 ? '含路由切换' : '单页'}，副本 ${(saved.length / 1024).toFixed(0)} KB）`)
} finally {
  await browser.close()
  rmSync(work, { recursive: true, force: true })
}
