import { createSignal, Show } from "solid-js"
import { Button } from "@opencode-ai/ui/button"

export function AccountSignIn(props: { onSignedIn(): void }) {
  const [busy, setBusy] = createSignal(false)
  const [error, setError] = createSignal("")
  const [key, setKey] = createSignal("")
  const [manual, setManual] = createSignal(false)
  async function submit(apiKey = false) {
    setBusy(true)
    setError("")
    try {
      if (apiKey) await window.api.accountSaveKey(key())
      if (!apiKey) await window.api.accountSignIn()
      setKey("")
      props.onSignedIn()
    } catch {
      setError("Sign-in could not be completed. Check your browser and unlock your system key store, then retry.")
    } finally {
      setBusy(false)
    }
  }
  return (
    <main class="trcc-sign-in">
      <div class="trcc-account-content">
        <div class="trcc-wordmark" aria-hidden="true">
          TrustedRouter
        </div>
        <h1>Trusted Cowork</h1>
        <Button size="large" onClick={() => void submit()} disabled={busy()}>
          {busy() ? "Waiting for sign-in" : "Sign in with TrustedRouter"}
        </Button>
        <Show when={busy()}>
          <Button variant="ghost" onClick={() => void window.api.accountCancel()}>
            Cancel
          </Button>
        </Show>
        <Show when={error()}>
          <p role="alert">{error()}</p>
        </Show>
        <Button variant="ghost" disabled={busy()} onClick={() => setManual(!manual())}>
          Use an API key
        </Button>
        <Show when={manual()}>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void submit(true)
            }}
          >
            <label for="trcc-key">TrustedRouter API key</label>
            <input
              id="trcc-key"
              type="password"
              autocomplete="off"
              spellcheck={false}
              value={key()}
              onInput={(event) => setKey(event.currentTarget.value)}
              disabled={busy()}
            />
            <Button type="submit" disabled={busy() || !key().trim()}>
              Connect
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => void window.api.openExternal("https://trustedrouter.com/console/api-keys")}
            >
              Get an API key
            </Button>
          </form>
        </Show>
      </div>
    </main>
  )
}
