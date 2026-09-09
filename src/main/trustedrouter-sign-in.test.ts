import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import test from 'node:test'
import { TrustedRouterSignIn } from './trustedrouter-sign-in'

const key = 'sk-tr-v1-test_only_not_a_real_credential'

test('PKCE browser sign-in exchanges once and never returns the key', async () => {
  let authorize: URL | undefined
  let saved: unknown
  let exchanges = 0
  const flow = new TrustedRouterSignIn({
    port: 0,
    openBrowser: async (url) => {
      authorize = new URL(url)
      assert.equal(authorize.origin + authorize.pathname, 'https://trustedrouter.com/auth')
      assert.equal(authorize.searchParams.get('code_challenge_method'), 'S256')
      assert.equal(authorize.searchParams.has('code_verifier'), false)
      const callback = new URL(authorize.searchParams.get('callback_url')!)
      callback.searchParams.set('code', 'one-time-code')
      assert.equal((await fetch(callback)).status, 200)
      assert.equal((await fetch(callback)).status, 400)
    },
    fetch: async (url, options) => {
      exchanges++
      assert.equal(url, 'https://trustedrouter.com/v1/auth/keys')
      assert.equal(options?.redirect, 'error')
      const body = JSON.parse(String(options?.body))
      assert.equal(body.code, 'one-time-code')
      assert.equal(createHash('sha256').update(body.code_verifier).digest('base64url'), authorize?.searchParams.get('code_challenge'))
      // Keep the callback server alive long enough to check replay rejection.
      await new Promise(resolve => setTimeout(resolve, 30))
      return Response.json({ key })
    },
    saveKey: async value => { saved = value },
  })
  const first = flow.start()
  assert.equal(flow.start(), first)
  assert.equal(await first, undefined)
  assert.equal(saved, key)
  assert.equal(exchanges, 1)
})

test('rejects malformed, wrong-state and cross-origin callbacks without consuming the valid flow', async () => {
  let saves = 0
  const flow = new TrustedRouterSignIn({
    port: 0,
    openBrowser: async (url) => {
      const valid = new URL(new URL(url).searchParams.get('callback_url')!)
      valid.searchParams.set('code', 'valid-code')
      for (const state of ['wrong', 'é'.repeat(43)]) {
        const invalid = new URL(valid)
        invalid.searchParams.set('state', state)
        assert.equal((await fetch(invalid)).status, 400)
      }
      const duplicate = new URL(valid)
      duplicate.searchParams.append('state', duplicate.searchParams.get('state')!)
      assert.equal((await fetch(duplicate)).status, 400)
      assert.equal((await fetch(valid, { method: 'POST' })).status, 400)
      assert.equal((await fetch(new URL('/wrong', valid))).status, 400)
      assert.equal((await fetch(valid, { headers: { Host: 'attacker.invalid' } })).status, 400)
      const result = await fetch(valid)
      assert.equal(result.status, 200)
      assert.equal(result.headers.get('cache-control'), 'no-store')
      assert.equal((await result.text()).includes('valid-code'), false)
    },
    fetch: async () => Response.json({ key }),
    saveKey: async () => { saves++ },
  })
  await flow.start()
  assert.equal(saves, 1)
})

for (const kind of ['denied', 'duplicate-code', 'missing-code'] as const) {
  test(`does not exchange ${kind} callback`, async () => {
    const flow = new TrustedRouterSignIn({
      port: 0,
      openBrowser: async url => {
        const callback = new URL(new URL(url).searchParams.get('callback_url')!)
        if (kind === 'denied') callback.searchParams.set('error', 'access_denied')
        if (kind === 'duplicate-code') { callback.searchParams.append('code', 'a'); callback.searchParams.append('code', 'b') }
        await fetch(callback).catch(() => {})
      },
      fetch: async () => { throw new Error('must not exchange') },
      saveKey: async () => assert.fail('must not save'),
    })
    await assert.rejects(flow.start(), /not approved/)
  })
}

for (const kind of ['http-error', 'network-error', 'bad-json', 'no-key'] as const) {
  test(`sanitizes ${kind} and leaves existing credentials unchanged`, async () => {
    const flow = new TrustedRouterSignIn({
      port: 0,
      openBrowser: async url => {
        const callback = new URL(new URL(url).searchParams.get('callback_url')!)
        callback.searchParams.set('code', 'valid-code')
        await fetch(callback).catch(() => {})
      },
      fetch: async () => {
        if (kind === 'network-error') throw new Error('SECRET upstream details')
        if (kind === 'http-error') return new Response('SECRET upstream details', { status: 500 })
        if (kind === 'bad-json') return new Response('SECRET upstream details')
        return Response.json({ wrong: key })
      },
      saveKey: async () => assert.fail('must not save'),
    })
    await assert.rejects(flow.start(), error => error instanceof Error && !error.message.includes('SECRET'))
  })
}

test('cancels a pending browser flow and permits a fresh attempt', async () => {
  let opened!: () => void
  let ready = new Promise<void>(resolve => { opened = resolve })
  const flow = new TrustedRouterSignIn({ port: 0, openBrowser: async () => opened(), saveKey: async () => assert.fail('must not save') })
  const first = flow.start()
  const rejection = assert.rejects(first, /cancelled/)
  await ready
  await flow.cancel()
  await rejection
  ready = new Promise<void>(resolve => { opened = resolve })
  const second = flow.start()
  const secondRejection = assert.rejects(second, /cancelled/)
  await ready
  await flow.cancel()
  await secondRejection
})

test('times out and closes the callback listener', async () => {
  const flow = new TrustedRouterSignIn({ port: 0, timeoutMs: 20, openBrowser: async () => {}, saveKey: async () => assert.fail('must not save') })
  await assert.rejects(flow.start(), /timed out/)
})

test('reports browser failures without exposing their details', async () => {
  const flow = new TrustedRouterSignIn({ port: 0, openBrowser: async () => { throw new Error('SECRET') }, saveKey: async () => assert.fail('must not save') })
  await assert.rejects(flow.start(), /Could not open your browser/)
})

test('does not take over another service using the callback port', async () => {
  const server = createServer()
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  try {
    const flow = new TrustedRouterSignIn({ port: address.port, openBrowser: async () => assert.fail('must not open'), saveKey: async () => assert.fail('must not save') })
    await assert.rejects(flow.start(), /Could not start sign-in/)
  } finally { server.close() }
})
