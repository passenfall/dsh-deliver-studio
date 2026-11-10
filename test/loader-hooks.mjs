// 让 node 能解析 Host 半边的裸导入：schemastery / zod / js-yaml 取 DSH profile 里已装的副本，dsh-tools 用最小桩。
// profile 的 node_modules 位置：环境变量 DSH_PROFILE_NODE_MODULES，否则 ~/.dsh/profiles/<DSH_PROFILE 或 desktop>/node_modules。
import { pathToFileURL } from 'node:url'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'

const PROFILE_NM = process.env.DSH_PROFILE_NODE_MODULES
  || join(homedir(), '.dsh', 'profiles', process.env.DSH_PROFILE || 'desktop', 'node_modules')
const STUB_TOOLS = new URL('./stub-dsh-tools.mjs', import.meta.url).href

function entryOf(pkg, prefer) {
  const dir = join(PROFILE_NM, ...pkg.split('/'))
  for (const rel of prefer) if (existsSync(join(dir, rel))) return pathToFileURL(join(dir, rel)).href
  const meta = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  return pathToFileURL(join(dir, meta.module || meta.main || 'index.js')).href
}

const MAP = {
  '@deepseek-ai/schemastery': () => ({ url: entryOf('@deepseek-ai/schemastery', ['lib/index.mjs']), format: 'module' }),
  zod: () => ({ url: entryOf('zod', ['index.js']), format: 'module' }),
  'js-yaml': () => ({ url: entryOf('js-yaml', ['dist/js-yaml.mjs']), format: 'module' }),
}

export async function resolve(specifier, context, next) {
  if (specifier === '@deepseek-ai/dsh-tools') return { url: STUB_TOOLS, shortCircuit: true }
  const hit = MAP[specifier]
  if (hit) {
    if (!existsSync(PROFILE_NM)) throw new Error(`找不到 DSH profile 的 node_modules：${PROFILE_NM}（可用环境变量 DSH_PROFILE_NODE_MODULES 指定）`)
    return { ...hit(), shortCircuit: true }
  }
  return next(specifier, context)
}
