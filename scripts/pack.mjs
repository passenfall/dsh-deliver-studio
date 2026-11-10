// 打包发布：node scripts/pack.mjs
// 产物（dist/）：
//   dsh-deliver-studio-<版本>.tgz   npm pack 产物（内容 = package.json 的 files）
//   dsh-deliver-studio.tgz          同一个包的不带版本号副本（插件市场 tarball 字段用 releases/latest/download/ 指向它）
//   dsh-deliver-studio-<版本>.zip   同样内容，放在 dsh-deliver-studio/ 目录下，解压即可在 DSH 中按文件夹安装
//   RELEASE_NOTES.md                CHANGELOG.md 中当前版本的段落，用作 GitHub Release 说明
//   SHA256SUMS.txt                  各个包的校验和
// 只用 Node 内置模块（zip 用 zlib 的 deflateRaw + crc32 自行写出）。
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync, existsSync } from 'node:fs'
import { join, dirname, posix } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { deflateRawSync, crc32 } from 'node:zlib'
import { createHash } from 'node:crypto'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const dist = join(root, 'dist')
const base = `${pkg.name}-${pkg.version}`

// 1) 重新构建 client.js，保证与 client.src.js / runtime.js 一致
execFileSync(process.execPath, [join(root, 'build.mjs')], { stdio: 'inherit' })
for (const f of ['index.js', 'browser.js', 'runtime.js', 'viewer.js', 'client.js']) execFileSync(process.execPath, ['--check', join(root, f)])

// 2) 按 package.json 的 files 列出文件（支持 dir/*.ext 这种单层通配）
const files = new Set(['package.json'])
for (const entry of pkg.files) {
  if (entry.includes('*')) {
    const dir = posix.dirname(entry)
    const re = new RegExp('^' + posix.basename(entry).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$')
    for (const name of readdirSync(join(root, dir))) if (re.test(name)) files.add(posix.join(dir, name))
  } else {
    if (!existsSync(join(root, entry))) throw new Error(`files 中的 ${entry} 不存在`)
    files.add(entry)
  }
}
const list = [...files].sort()

rmSync(dist, { recursive: true, force: true })
mkdirSync(dist, { recursive: true })

// 3) tgz：npm pack（内容由 files 决定，与 zip 一致）
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
execFileSync(npm, ['pack', '--pack-destination', dist, '--silent'], { cwd: root, stdio: ['ignore', 'ignore', 'inherit'], shell: process.platform === 'win32' })

// 4) zip：dsh-deliver-studio/<文件>
function zip(entries) {
  const locals = []
  const centrals = []
  let offset = 0
  const dosTime = (d) => ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xffff
  const dosDate = (d) => (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xffff
  for (const { name, data, mtime } of entries) {
    const nameBuf = Buffer.from(name, 'utf8')
    const deflated = deflateRawSync(data, { level: 9 })
    const useDeflate = deflated.length < data.length
    const body = useDeflate ? deflated : data
    const crc = crc32(data)
    const head = Buffer.alloc(30)
    head.writeUInt32LE(0x04034b50, 0); head.writeUInt16LE(20, 4); head.writeUInt16LE(0x0800, 6) // UTF-8 文件名
    head.writeUInt16LE(useDeflate ? 8 : 0, 8); head.writeUInt16LE(dosTime(mtime), 10); head.writeUInt16LE(dosDate(mtime), 12)
    head.writeUInt32LE(crc, 14); head.writeUInt32LE(body.length, 18); head.writeUInt32LE(data.length, 22)
    head.writeUInt16LE(nameBuf.length, 26); head.writeUInt16LE(0, 28)
    locals.push(head, nameBuf, body)
    const cen = Buffer.alloc(46)
    cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6); cen.writeUInt16LE(0x0800, 8)
    cen.writeUInt16LE(useDeflate ? 8 : 0, 10); cen.writeUInt16LE(dosTime(mtime), 12); cen.writeUInt16LE(dosDate(mtime), 14)
    cen.writeUInt32LE(crc, 16); cen.writeUInt32LE(body.length, 20); cen.writeUInt32LE(data.length, 24)
    cen.writeUInt16LE(nameBuf.length, 28); cen.writeUInt32LE(offset, 42)
    centrals.push(cen, nameBuf)
    offset += head.length + nameBuf.length + body.length
  }
  const cenBuf = Buffer.concat(centrals)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(cenBuf.length, 12); end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, cenBuf, end])
}
const zipPath = join(dist, `${base}.zip`)
writeFileSync(zipPath, zip(list.map((f) => ({ name: `${pkg.name}/${f}`, data: readFileSync(join(root, f)), mtime: statSync(join(root, f)).mtime }))))

// 5) Release 说明：CHANGELOG 中当前版本的段落
const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8')
const m = new RegExp(`## \\[${pkg.version.replace(/\./g, '\\.')}\\][^\\n]*\\n([\\s\\S]*?)(?=\\n## \\[|\\n\\[\\d)`).exec(changelog)
if (!m) throw new Error(`CHANGELOG.md 里没有 ${pkg.version} 的段落`)
const notes = `${m[1].trim()}\n\n## 安装\n\n- DSH Web →「插件 → 添加插件」，输入 \`https://github.com/passenfall/dsh-deliver-studio\`；\n- 或下载 \`${base}.zip\` 解压，在「添加插件」里输入解压后的 \`${pkg.name}\` 文件夹的绝对路径。\n\n完整说明见 [README](https://github.com/passenfall/dsh-deliver-studio#readme)。\n`
writeFileSync(join(dist, 'RELEASE_NOTES.md'), notes, 'utf8')

// 6) 不带版本号的 tgz：供 releases/latest/download/<名字>.tgz 使用（链接里写死版本号的文件名会在下次发版后 404）
const tgzName = readdirSync(dist).find((n) => n.endsWith('.tgz'))
writeFileSync(join(dist, `${pkg.name}.tgz`), readFileSync(join(dist, tgzName)))

// 7) 校验和
const sums = [tgzName, `${pkg.name}.tgz`, `${base}.zip`].map((n) => `${createHash('sha256').update(readFileSync(join(dist, n))).digest('hex')}  ${n}`).join('\n') + '\n'
writeFileSync(join(dist, 'SHA256SUMS.txt'), sums, 'utf8')

console.log(`\n打包完成：${pkg.name} ${pkg.version}（${list.length} 个文件）`)
for (const n of readdirSync(dist)) console.log(`  dist/${n}  ${(statSync(join(dist, n)).size / 1024).toFixed(1)} KB`)
console.log('\n包含：\n  ' + list.join('\n  '))
