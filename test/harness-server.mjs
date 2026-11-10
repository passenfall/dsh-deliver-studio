// 本地 HTTP harness：模拟 DSH 页面（http 源）加载 client.js，验证打包 → 沙箱 iframe → runtime → QA 往返
//   node test/harness-server.mjs [port]
//   浏览器打开 http://127.0.0.1:<port>/harness.html                       → 用内置样例 test/fixtures/sample.html
//   或          http://127.0.0.1:<port>/harness.html?t=/target/<URL 编码的绝对路径>  → 检查任意本地 HTML
// 只监听 127.0.0.1。
// 用无头浏览器自动跑时（--dump-dom --virtual-time-budget=60000），需加 --disable-features=IsolateSandboxedIframes：
// 新版 Chromium 把沙箱 iframe 放进独立进程，虚拟时间不覆盖它，iframe 的 ready / qa-result 消息会收不到（真实浏览器不受影响）。
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, dirname, extname, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
const here = dirname(fileURLToPath(import.meta.url))
const fixtures = join(here, 'fixtures')
const port = Number(process.argv[2] || 18931)
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.css': 'text/css' }
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x')
    let file
    if (url.pathname === '/harness.html') file = join(fixtures, 'harness-http.html')
    else if (url.pathname === '/client.js') file = join(here, '..', 'client.js')
    else if (url.pathname.startsWith('/fixture/')) {
      file = normalize(join(fixtures, decodeURIComponent(url.pathname.slice(9))))
      if (!file.startsWith(fixtures + sep)) { res.writeHead(403); res.end(); return }
    } else if (url.pathname.startsWith('/target/')) file = decodeURIComponent(url.pathname.slice(8))
    else { res.writeHead(404); res.end(); return }
    const data = await readFile(file)
    res.writeHead(200, { 'content-type': MIME[extname(file).toLowerCase()] || 'application/octet-stream' })
    res.end(data)
  } catch (e) { res.writeHead(404); res.end(String(e)) }
}).listen(port, '127.0.0.1', () => console.log(`harness on http://127.0.0.1:${port}/harness.html`))
