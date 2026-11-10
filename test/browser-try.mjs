// 对任意 HTML 跑一次无头浏览器 QA / 导出：
//   node test/browser-try.mjs <html> [--pdf <out.pdf>]
// 浏览器自动查找；可用环境变量 DELIVER_STUDIO_BROWSER（或 CHROME_PATH）指定；W=视口宽度（默认 1440）。
import { qaFile, exportPdf, findBrowser } from '../browser.js'
const [file, flag, out] = process.argv.slice(2)
if (!file) { console.error('用法：node test/browser-try.mjs <html> [--pdf <out.pdf>]'); process.exit(2) }
const browser = findBrowser()
console.log('浏览器', browser ? `${browser.name} · ${browser.path}` : '未找到')
const t0 = Date.now()
const r = await qaFile(file, { width: Number(process.env.W || 1440) })
console.log(`QA ${Date.now() - t0}ms  must=${r.must} hint=${r.hint}  stats=${JSON.stringify(r.stats)}`)
for (const i of r.issues) console.log(`  [${i.level}] ${i.cat} ${i.title} ｜ ${i.detail} ｜ ${i.selector.slice(0, 80)}`)
if (flag === '--pdf') {
  const p = await exportPdf(file, { out })
  console.log('PDF', JSON.stringify(p))
}
