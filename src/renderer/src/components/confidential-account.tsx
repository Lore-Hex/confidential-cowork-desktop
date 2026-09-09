import { useEffect, useState } from 'react'
import { KeyRound, LockKeyhole, X } from 'lucide-react'
import { useAppStore } from '../store'

export function ConfidentialAccount(): React.JSX.Element {
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    void window.piDesktop.account.status().then((status) => setConfigured(status.configured))
      .catch(() => { setConfigured(false); setError('Could not open secure key storage.') })
  }, [])

  async function save(event: React.FormEvent): Promise<void> {
    event.preventDefault()
    setBusy(true); setError('')
    try {
      await window.piDesktop.account.save(key)
      setKey(''); setConfigured(true); setOpen(false)
      if (useAppStore.getState().activeWorkspace) await useAppStore.getState().restartPi()
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save the key.') }
    finally { setBusy(false) }
  }

  async function remove(): Promise<void> {
    setBusy(true); setError('')
    try { await window.piDesktop.account.remove(); setKey(''); setConfigured(false) }
    catch { setError('Could not remove the key. Please retry.') }
    finally { setBusy(false) }
  }

  return <>
    <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2 text-sm">
      <span className="flex items-center gap-2"><LockKeyhole size={16} /> TR Confidential Cowork <span className="text-dim">Alpha</span></span>
      <button className="flex items-center gap-2 rounded px-3 py-2 hover:bg-surface-hover" onClick={() => setOpen(true)}><KeyRound size={16} /> Account</button>
    </div>
    {(open || configured === false) && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-5">
      <form onSubmit={(event) => void save(event)} className="relative w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-xl" aria-label="TrustedRouter account">
        {configured && <button type="button" aria-label="Close account" className="absolute right-3 top-3 p-2" onClick={() => { setOpen(false); setKey('') }}><X size={18} /></button>}
        <LockKeyhole size={28} className="mb-4 text-accent" />
        <h1 className="mb-2 text-xl font-semibold">Your confidential workspace</h1>
        <p className="mb-5 text-sm text-muted">Inference uses TrustedRouter confidential routes. Conversation history is saved locally. Local tools can access your files and network, subject to your approvals.</p>
        <label className="mb-2 block text-sm" htmlFor="trustedrouter-key">TrustedRouter API key</label>
        <input id="trustedrouter-key" type="password" autoComplete="off" spellCheck={false} value={key} onChange={(event) => setKey(event.target.value)} placeholder={configured ? 'Enter a replacement key' : 'sk-tr-v1-...'} className="mb-3 w-full rounded border border-border-strong bg-app px-3 py-3" />
        <p className="mb-4 text-xs text-dim">Stored encrypted with your operating system key store. Never included in conversation exports.</p>
        {error && <p role="alert" className="mb-3 text-sm text-error">{error}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={busy || !key.trim()} className="rounded bg-accent px-4 py-2 text-white disabled:opacity-50">{busy ? 'Saving...' : configured ? 'Replace key' : 'Save key and continue'}</button>
          {configured && <button type="button" disabled={busy} className="rounded px-3 py-2 text-error hover:bg-surface-hover" onClick={() => void remove()}>Remove key</button>}
        </div>
        <div className="mt-5 flex gap-4 text-sm">
          <button type="button" className="text-accent" onClick={() => void window.piDesktop.system.openExternal('https://trustedrouter.com/console/api-keys')}>Get an API key</button>
          <button type="button" className="text-accent" onClick={() => void window.piDesktop.system.openExternal('https://trustedrouter.com/trust')}>Verify attestation</button>
        </div>
      </form>
    </div>}
  </>
}
