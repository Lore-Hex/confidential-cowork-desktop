/* global window, setTimeout, clearTimeout */
import process from 'node:process'
import console from 'node:console'
import { _electron as electron } from 'playwright'
import { mkdtemp, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'

const data = await mkdtemp(join(tmpdir(), 'cowork-gui-smoke-'))
let app
try {
  app = await electron.launch({ args: [process.env.COWORK_SMOKE_APP_PATH || '.', `--user-data-dir=${data}`], env: { ...process.env, PI_DESKTOP_USER_DATA_DIR: data }, timeout: 30000 })
  const page = await app.firstWindow()
  await page.getByRole('heading', { name: 'Your confidential workspace' }).waitFor()
  await app.evaluate(({ shell }) => {
    globalThis.coworkSmokeOpenedUrls = []
    shell.openExternal = async (url) => { globalThis.coworkSmokeOpenedUrls.push(url) }
  })
  await page.getByRole('button', { name: 'Get an API key', exact: true }).click()
  await page.waitForTimeout(100)
  assert.deepEqual(await app.evaluate(() => globalThis.coworkSmokeOpenedUrls), ['https://trustedrouter.com/console/api-keys'])
  assert.equal(await page.locator('#trustedrouter-key').getAttribute('type'), 'password')
  assert.equal(await page.getByRole('button', { name: 'Save key and continue' }).isDisabled(), true)
  const status = await page.evaluate(() => window.piDesktop.account.status())
  assert.equal(status.configured, false)
  await page.locator('#trustedrouter-key').fill('not-a-valid-key')
  await page.getByRole('button', { name: 'Save key and continue' }).click()
  await page.getByRole('alert').waitFor()
  assert.equal((await page.evaluate(() => window.piDesktop.account.status())).configured, false)
  await page.setViewportSize({ width: 1100, height: 800 })
  await page.screenshot({ path: '/tmp/tr-confidential-cowork-desktop.png' })
  console.log('PASS: graphical first-run setup, masked key, invalid-key rejection, isolated credentials')
  if (process.env.COWORK_SMOKE_KEY_FILE) {
    const key = (await readFile(process.env.COWORK_SMOKE_KEY_FILE, 'utf8')).trim()
    await page.locator('#trustedrouter-key').fill(key)
    await page.getByRole('button', { name: 'Save key and continue' }).click()
    await page.getByRole('heading', { name: 'Your confidential workspace' }).waitFor({ state: 'hidden' })
    assert.equal((await page.evaluate(() => window.piDesktop.account.status())).configured, true)
    const selectedModel = process.env.COWORK_SMOKE_MODEL || 'trustedrouter/confidential'
    const result = await page.evaluate(async ({ path, model }) => {
      const api = window.piDesktop
      const workspace = await api.workspace.create('Smoke', path)
      await api.workspace.setActive(workspace.id)
      await api.pi.start()
      const catalog = await api.model.listAvailable()
      assertModelPresent(catalog, model)
      function assertModelPresent(catalog, model) {
        if (!catalog.data.models.some((entry) => entry.id === model && entry.provider === 'trustedrouter')) throw new Error('Selected confidential model absent')
      }
      await api.model.set('trustedrouter', model)
      await api.settings.save({ defaultProvider: 'trustedrouter', defaultModel: model })
      await api.pi.restart()
      const state = await api.session.getState()
      const response = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => { unsubscribe(); reject(new Error('Live smoke timed out')) }, 90000)
        const unsubscribe = api.onEvent((event) => {
          if (event.type === 'agent_end') { clearTimeout(timer); unsubscribe(); resolve(event) }
        })
        api.commands.prompt('Reply with exactly PONG. Do not use tools.').catch(reject)
      })
      return { state, response }
    }, { path: data, model: selectedModel })
    assert.equal(result.state.data.model.provider, 'trustedrouter')
    assert.equal(result.state.data.model.id, selectedModel)
    assert.equal(result.state.data.model.samplingParams.provider.min_privacy, 'confidential')
    assert.equal(result.state.data.model.samplingParams.provider.data_collection, 'deny')
    const messages = result.response.messages ?? []
    const assistant = messages.findLast((message) => message.role === 'assistant')
    assert.ok(assistant && assistant.stopReason !== 'error', JSON.stringify(assistant))
    assert.equal(assistant.content.filter((part) => part.type === 'text').map((part) => part.text).join('').trim(), 'PONG')
    const toolResult = await page.evaluate(async () => {
      const api = window.piDesktop
      let approvals = 0
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { unsubscribe(); reject(new Error('Tool smoke timed out')) }, 90000)
        const unsubscribe = api.onEvent((event) => {
          if (event.type === 'extension_ui_request' && event.method === 'confirm') {
            approvals++
            api.ui.respondConfirm(event.id, true)
          }
          if (event.type === 'agent_end') { clearTimeout(timer); unsubscribe(); resolve({ approvals }) }
        })
        api.commands.prompt('Use the write tool to create smoke.txt in the current directory containing exactly COWORK_OK. Then stop.').catch(reject)
      })
    })
    assert.ok(toolResult.approvals > 0, 'A write must require explicit approval')
    assert.equal((await readFile(join(data, 'smoke.txt'), 'utf8')).trim(), 'COWORK_OK')
    await page.screenshot({ path: '/tmp/tr-confidential-cowork-live.png' })
    await page.evaluate(() => window.piDesktop.account.remove())
    assert.equal((await page.evaluate(() => window.piDesktop.account.status())).configured, false)
    console.log('PASS: live confidential PONG, explicit write approval, exact route, credential removal')
  }
} finally {
  await app?.close()
  await rm(data, { recursive: true, force: true })
}
