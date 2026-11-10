// 真实 HTML 交付物批量验证：QA（无头浏览器）+ 导出 PDF，结果写到输出目录（不写原目录、不写插件目录）。
//
//   node test/real-deliverables.mjs [--out <目录>] [--no-pdf] [a.html b.html ...]
//
// 文件清单：命令行参数优先；否则读环境变量 DELIVER_STUDIO_SAMPLES 指向的文本文件（每行一个路径，# 开头为注释）。
// 输出目录：--out，默认 <系统临时目录>/deliver-studio-real；报告为其中的 real-deliverables.md / .json。
// 浏览器：自动查找，或用环境变量 DELIVER_STUDIO_BROWSER 指定。
import { qaFile, exportPdf, findBrowser } from '../browser.js'
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, basename, resolve } from 'node:path'

const argv = process.argv.slice(2)
let outDir = join(tmpdir(), 'deliver-studio-real')
let withPdf = true
const files = []
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--out') outDir = resolve(argv[++i] ?? outDir)
  else if (argv[i] === '--no-pdf') withPdf = false
  else files.push(resolve(argv[i]))
}
if (!files.length && process.env.DELIVER_STUDIO_SAMPLES) {
  const list = readFileSync(process.env.DELIVER_STUDIO_SAMPLES, 'utf8')
  for (const line of list.split(/\r?\n/u)) {
    const p = line.trim().replace(/^["']|["']$/gu, '')
    if (p && !p.startsWith('#')) files.push(resolve(p))
  }
}
if (!files.length) {
  console.error('用法：node test/real-deliverables.mjs [--out <目录>] [--no-pdf] <a.html> [b.html ...]\n或设置 DELIVER_STUDIO_SAMPLES=<每行一个 HTML 路径的文本文件>')
  process.exit(2)
}
const browser = findBrowser()
if (!browser) { console.error('未找到 Chromium 内核浏览器（可用 DELIVER_STUDIO_BROWSER 指定）'); process.exit(2) }
mkdirSync(outDir, { recursive: true })

const label = (f) => basename(dirname(f)) + '/' + basename(f)
const lines = ['# 交付工作台 · 真实 HTML 交付物验证', '', `生成：${new Date().toLocaleString('zh-CN')}；浏览器 ${browser.name}；QA 视口 1440；PDF 输出到 --out 目录（不写原目录）`, '', '| 交付物 | QA 用时 | 必改 | 建议 | 页面 | 中文字 | PDF 页数 | 导出用时 |', '|---|---|---|---|---|---|---|---|']
const details = []
const json = []
for (const f of files) {
  const name = label(f)
  if (!existsSync(f)) { lines.push(`| ${name} | 文件不存在 | | | | | | |`); json.push({ name, error: 'missing' }); console.log(name, 'missing'); continue }
  try {
    const t0 = Date.now()
    const r = await qaFile(f)
    const qaMs = Date.now() - t0
    const pdf = withPdf ? await exportPdf(f, { out: join(outDir, basename(dirname(f)) + '-' + basename(f).replace(/\.html?$/iu, '.pdf')) }) : undefined
    lines.push(`| ${name} | ${(qaMs / 1000).toFixed(1)}s | ${r.must} | ${r.hint} | ${r.stats.pages} | ${r.stats.cjk} | ${pdf ? pdf.pages : '-'} | ${pdf ? (pdf.ms / 1000).toFixed(1) + 's' : '-'} |`)
    details.push('', `## ${name}`, ...r.issues.map((i) => `- [${i.level === 'must' ? '必改' : '建议'}·${i.cat}] ${i.title}｜${i.detail}`))
    json.push({ name, must: r.must, hint: r.hint, stats: r.stats, pdfPages: pdf?.pages, issues: r.issues.map((i) => ({ level: i.level, cat: i.cat, title: i.title, detail: i.detail })) })
    console.log(name, 'must', r.must, 'hint', r.hint, 'pdf pages', pdf ? pdf.pages : '-')
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    lines.push(`| ${name} | 失败：${msg.slice(0, 80)} | | | | | | |`)
    json.push({ name, error: msg })
    console.log(name, 'failed', msg)
  }
}
writeFileSync(join(outDir, 'real-deliverables.md'), lines.concat(details).join('\n') + '\n', 'utf8')
writeFileSync(join(outDir, 'real-deliverables.json'), JSON.stringify(json, null, 2) + '\n', 'utf8')
console.log('报告已写入', join(outDir, 'real-deliverables.md'))
