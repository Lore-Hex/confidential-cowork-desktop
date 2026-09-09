import process from 'node:process'
import console from 'node:console'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, cp, rm } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

if (process.platform !== 'darwin') throw new Error('This alpha runtime is macOS only')
const url = 'https://github.com/Lore-Hex/trpi/releases/download/v0.84.5/TR-Confidential-Cowork-macOS-universal.dmg'
const checksum = 'c5b8fe72ef021941eccb1157cb8ace48fb299b729bf34c23a36c215b2b40ceeb'
const temp = await mkdtemp(join(tmpdir(), 'cowork-runtime-'))
const mount = join(temp, 'mount')
let mounted = false
try {
  const dmg = join(temp, 'runtime.dmg')
  execFileSync('curl', ['--fail', '--location', '--retry', '3', '--output', dmg, url], { stdio: 'inherit' })
  if (createHash('sha256').update(await readFile(dmg)).digest('hex') !== checksum) throw new Error('Runtime checksum mismatch')
  execFileSync('hdiutil', ['attach', '-readonly', '-nobrowse', '-mountpoint', mount, dmg])
  mounted = true
  const app = join(mount, 'TR Confidential Cowork.app')
  execFileSync('codesign', ['--verify', '--deep', '--strict', app])
  const target = resolve('resources/runtime')
  await rm(target, { recursive: true, force: true })
  await cp(join(app, 'Contents/Resources'), target, { recursive: true })
  console.log('Verified and installed pinned TRPi v0.84.5 runtime')
} finally {
  if (mounted) execFileSync('hdiutil', ['detach', mount])
  await rm(temp, { recursive: true, force: true })
}
