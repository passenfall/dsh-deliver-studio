// Host 半边模拟（自包含，不依赖本机任何固定路径）：
//   node --import ./test/register.mjs test/host-sim.mjs
// 在 os.tmpdir() 下建临时工作区，生成一份已知有问题的样例 HTML，跑工具 / 命令 / bridge，结束后清理。
// 需要：本机任一 Chromium 内核浏览器（Edge / Chrome / Chromium / Brave，或 DELIVER_STUDIO_BROWSER 指定）；
//      DSH profile 的 node_modules（见 test/loader-hooks.mjs）。
import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PassThrough } from 'node:stream'
import * as plugin from '../index.js'
import { findBrowser } from '../browser.js'

const browser = findBrowser()
if (!browser) {
  console.error('跳过：本机没有找到 Chromium 内核浏览器（可用 DELIVER_STUDIO_BROWSER 指定）')
  process.exit(2)
}
console.log(`浏览器：${browser.name}`)

const work = mkdtempSync(join(tmpdir(), 'deliver-studio-sim-'))
const SAMPLE = `<!doctype html>
<html lang="zh"><head><meta charset="utf-8"><title>样例交付物</title>
<style>body{font:16px/1.7 system-ui,sans-serif;max-width:720px;margin:24px auto;color:#222}figure{margin:16px 0}.box{width:240px;height:90px;background:#e5e7eb}</style></head>
<body>
<h1>样例交付物</h1>
<p>这份页面用于自动化测试，故意包含几处已知问题。如图1所示，流程分为三个阶段。</p>
<figure id="f1"><div class="box"></div><figcaption>图1 流程示意</figcaption></figure>
<figure id="f3"><div class="box"></div><figcaption>图3 结果对比</figcaption></figure>
<p>TODO：这里还缺一段结论。</p>
<p><img src="missing-image.png" alt="缺失的图片" width="240" height="120"></p>
<p>English references: see Figure 7 for the full pipeline; the numbers are summarised below (Table 1).</p>
<table><caption>Table 1 Summary</caption><tr><td>alpha</td><td>beta</td></tr></table>
<p>Inline link reference: see <a href="#f1">Fig. 1</a> above.</p>
</body></html>
`
writeFileSync(join(work, 'sample.html'), SAMPLE, 'utf8')
writeFileSync(join(work, 'clean.html'), '<!doctype html><meta charset=utf-8><title>t</title><h1>交付样例</h1><p>正文。</p>', 'utf8')

try {
  const tools = []
  const commands = []
  const routes = []
  let lastPatch
  const ctx = {
    logger: { warn: console.warn }, fiber: {},
    on() { return () => {} }, effect(fn) { return fn() }, inject(names, cb) { if (names.every((n) => ctx[n])) cb(ctx) }, get(n) { return ctx[n] },
    tools: { register(d) { tools.push(d); return () => {} } },
    commands: { register(d) { commands.push(d); return () => {} } },
    webServer: { register(r) { routes.push(r); return () => {} } },
    settings: {
      configure() { return () => {} },
      describe() { return [{ ns: 'deliver-studio', revision: 1 }] },
      async update(ns, patch) { lastPatch = { ns, patch } },
    },
    agents: { get: () => agent },
  }
  const agent = { id: 's', session: { header: { cwd: work } } }
  plugin.apply(ctx, plugin.Config({}))
  assert.deepEqual(tools.map((t) => t.name).sort(), ['deliver_export_pdf', 'deliver_qa'])
  const tool = (n) => tools.find((t) => t.name === n)
  const exec = () => ({ agent, signal: new AbortController().signal })

  // 工具：相对路径按会话 cwd 解析；样例里的已知问题都要被发现
  const qa = await tool('deliver_qa').execute({ path: 'sample.html' }, exec())
  console.log('deliver_qa →\n' + qa.report)
  assert.ok(qa.must >= 1, 'QA 必改项应 ≥ 1')
  assert.match(qa.report, /图编号不连续：应为图2，实际是图3/u)
  assert.match(qa.report, /出现禁用字样「TODO」/u)
  assert.match(qa.report, /图片加载失败/u)
  assert.match(qa.report, /正文引用了图7/u, '英文引用 see Figure 7 应被检查')
  assert.doesNotMatch(qa.report, /正文引用了表1/u, '(Table 1) 有对应表格，不应报错')
  assert.doesNotMatch(qa.report, /重复编号/u, '行内引用 see <a>Fig. 1</a> 不应被当成图注')

  // 导出：有必改项 → 不导出，返回清单
  const out = join(work, 'out', 'sample.pdf')
  const ex1 = await tool('deliver_export_pdf').execute({ path: 'sample.html', out }, exec())
  assert.equal(ex1.ok, false)
  assert.ok(!existsSync(out), '未 force 时不应生成 PDF')
  console.log('\ndeliver_export_pdf（未确认）→', ex1.report.split('\n')[0])
  const ex2 = await tool('deliver_export_pdf').execute({ path: 'sample.html', out, force: true }, exec())
  assert.equal(ex2.ok, true)
  assert.ok(existsSync(out), 'force 后应生成 PDF')
  console.log('deliver_export_pdf（force）→', ex2.report.replace(work, '<tmp>'))

  // 命令
  const cmd = commands[0]
  const c1 = await cmd.handler({ agent, rawInput: ' qa sample.html', signal: new AbortController().signal })
  assert.equal(c1.kind, 'success')
  const c2 = await cmd.handler({ agent, rawInput: ' export nope.html', signal: new AbortController().signal })
  assert.equal(c2.kind, 'error')
  console.log('/deliver qa → success；/deliver export 不存在的文件 → error')

  // bridge：describe + 来源 / 地址 / content-type 校验
  const call = (path, body, { origin, addr = '127.0.0.1', type = 'application/json' } = {}) => new Promise((resolve) => {
    const req = new PassThrough()
    req.method = 'POST'; req.headers = { 'content-type': type, ...(origin ? { origin } : {}) }; req.socket = { remoteAddress: addr }
    const res = { status: 0, body: '', writeHead(s) { this.status = s }, end(b) { this.body = b; resolve(this) } }
    routes.find((r) => r.path === path).handler(req, res)
    req.end(JSON.stringify(body))
  })
  const B = '/api/dsh-deliver-studio'
  const d = await call(`${B}/describe`, {}, { origin: 'http://127.0.0.1:19387' })
  assert.equal(d.status, 200)
  const desc = JSON.parse(d.body)
  assert.equal(desc.browser.found, true)
  assert.ok(desc.browser.name && desc.browser.path)
  assert.deepEqual(desc.config.bannedWords, plugin.DEFAULT_BANNED)
  console.log(`bridge /describe → browser.found=${desc.browser.found}（${desc.browser.name}）`)
  const s1 = (await call(`${B}/describe`, {}, { origin: 'https://evil.example' })).status
  const s2 = (await call(`${B}/describe`, {}, { addr: '10.0.0.2' })).status
  const s3 = (await call(`${B}/describe`, {}, { type: 'text/plain' })).status
  assert.deepEqual([s1, s2, s3], [403, 403, 415])
  console.log(`bridge 校验 → 外部来源 ${s1}、非 loopback ${s2}、非 JSON ${s3}`)

  // bridge：/qa、/export
  const bq = JSON.parse((await call(`${B}/qa`, { sessionId: 's', path: 'sample.html' })).body)
  assert.equal(bq.ok, true)
  assert.ok(bq.must >= 1)
  const bx = JSON.parse((await call(`${B}/export`, { sessionId: 's', path: join(work, 'clean.html') })).body)
  assert.equal(bx.ok, true, '无问题的页面应直接导出')
  assert.ok(existsSync(bx.pdfPath))
  console.log(`bridge /qa → must ${bq.must}；/export（clean.html）→ ${bx.pages} 页`)

  // bridge：/update 只放行白名单键；已弃用的 edgePath 只允许清空
  const up = JSON.parse((await call(`${B}/update`, { patch: { browserPath: '', edgePath: 'legacy.exe', evil: 1, targetChars: 100 } })).body)
  assert.equal(up.ok, true)
  assert.ok(up.browser && typeof up.browser.found === 'boolean')
  assert.deepEqual(lastPatch, { ns: 'deliver-studio', patch: { browserPath: '', targetChars: 100 } })
  await call(`${B}/update`, { patch: { edgePath: '' } })
  assert.deepEqual(lastPatch.patch, { edgePath: '' })
  console.log('bridge /update → 白名单过滤正确')

  // 旧配置兼容：只有 edgePath 时也能用
  const routes2 = []
  const ctx2 = { ...ctx, webServer: { register(r) { routes2.push(r); return () => {} } }, tools: { register() { return () => {} } }, commands: { register() { return () => {} } } }
  ctx2.inject = (names, cb) => { if (names.every((n) => ctx2[n])) cb(ctx2) }
  ctx2.get = (n) => ctx2[n]
  plugin.apply(ctx2, plugin.Config({ edgePath: browser.path }))
  const legacy = await new Promise((resolve) => {
    const req = new PassThrough()
    req.method = 'POST'; req.headers = { 'content-type': 'application/json' }; req.socket = { remoteAddress: '::1' }
    const res = { writeHead() {}, end(b) { resolve(JSON.parse(b)) } }
    routes2.find((r) => r.path === `${B}/describe`).handler(req, res)
    req.end('{}')
  })
  assert.equal(legacy.config.browserPath, browser.path)
  assert.equal(legacy.browser.path, browser.path)
  console.log('旧配置 edgePath → 作为 browserPath 生效')

  console.log('\n全部断言通过 ✓')
} finally {
  rmSync(work, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 })
  console.log(existsSync(work) ? `临时目录未能删除：${work}` : '临时工作区已清理')
}
