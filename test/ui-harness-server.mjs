// UI harness：用真实 React 19 渲染工作台组件，bridge 走真实 Host 代码（index.js），目标文件复制到临时目录
//   node --import ./test/register.mjs test/ui-harness-server.mjs <file.html> [port]
//   环境变量 REACT_NODE_MODULES：含 react / react-dom / scheduler 的 node_modules 目录
// 只监听 127.0.0.1；退出时删除临时目录。
import { createServer } from 'node:http'
import { readFile, copyFile, mkdtemp, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname, basename, extname, resolve, normalize, sep } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import * as plugin from '../index.js'
const here = dirname(fileURLToPath(import.meta.url))
const target = resolve(process.argv[2] || join(here, 'fixtures', 'sample.html'))
const port = Number(process.argv[3] || 18940)
const NM = process.env.REACT_NODE_MODULES
if (!NM || !existsSync(join(NM, 'react'))) { console.error('需要 REACT_NODE_MODULES'); process.exit(2) }
const work = await mkdtemp(join(tmpdir(), 'deliver-ui-'))
await copyFile(target, join(work, basename(target)))
// 同目录的相对资源一并可读（只读，按需从原目录取）
const srcDir = dirname(target)

const routes = []
const ctx = {
  logger: { warn() {} }, fiber: {},
  effect(fn) { return fn() }, inject(names, cb) { if (names.every((n) => ctx[n])) cb(ctx) }, get(n) { return ctx[n] },
  tools: { register() { return () => {} } }, commands: { register() { return () => {} } },
  webServer: { register(r) { routes.push(r); return () => {} } },
  settings: { configure() { return () => {} }, describe() { return [] }, async update() {} },
  agents: { get: () => ({ session: { header: { cwd: work } } }) },
}
plugin.apply(ctx, plugin.Config({}))

const VENDOR = {
  react: 'react/cjs/react.development.js', scheduler: 'scheduler/cjs/scheduler.development.js',
  'react-dom': 'react-dom/cjs/react-dom.development.js', 'react-dom-client': 'react-dom/cjs/react-dom-client.development.js',
}
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x')
    const route = routes.find((r) => r.path === url.pathname)
    if (route) { req.socket.remoteAddress === '127.0.0.1'; return route.handler(req, res) }
    let file, type = 'application/octet-stream'
    if (url.pathname === '/' || url.pathname === '/ui.html') { file = join(here, 'fixtures', 'ui-harness.html'); type = 'text/html; charset=utf-8' }
    else if (url.pathname === '/client.js') { file = join(here, '..', 'client.js'); type = 'application/javascript' }
    else if (url.pathname.startsWith('/vendor/')) { file = join(NM, VENDOR[url.pathname.slice(8)] || 'x'); type = 'application/javascript' }
    else if (url.pathname.startsWith('/work/')) {
      const rel = decodeURIComponent(url.pathname.slice(6))
      file = normalize(join(work, rel))
      if (!file.startsWith(work + sep)) { res.writeHead(403); res.end(); return }
      if (!existsSync(file)) file = normalize(join(srcDir, rel))
    } else if (url.pathname === '/info') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ work, name: basename(target) })); return }
    else { res.writeHead(404); res.end(); return }
    const data = await readFile(file)
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' })
    res.end(data)
  } catch (e) { res.writeHead(404); res.end(String(e)) }
})
server.listen(port, '127.0.0.1', () => console.log(`ui harness on http://127.0.0.1:${port}/ui.html  work=${work}`))
const cleanup = async () => { server.close(); await rm(work, { recursive: true, force: true }); process.exit(0) }
process.on('SIGINT', cleanup); process.on('SIGTERM', cleanup)
process.stdin.on('end', cleanup); process.stdin.resume()
void extname
