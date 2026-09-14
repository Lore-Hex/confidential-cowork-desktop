import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createDesktopDraftStore } from "../src/main/draft-store.ts"

const root = mkdtempSync(join(tmpdir(), "trusted-cowork-drafts-"))
try {
  const file = join(root, "drafts.sqlite")
  const store = createDesktopDraftStore(file)
  const bytes = new TextEncoder().encode("fixture")
  const id = store.putBlob(bytes)
  const latest = JSON.stringify({ text: "latest", blob: { id } })
  store.set("prompt", JSON.stringify({ text: "first" }))
  store.set("prompt", latest)
  assert.equal(store.get("prompt"), latest)
  store.flush()
  store.close()
  const reopened = createDesktopDraftStore(file)
  assert.equal(reopened.get("prompt"), latest)
  assert.deepEqual(Buffer.from(reopened.getBlob(id)), Buffer.from(bytes))
  reopened.close()
  console.log("draft persistence and blob smoke passed")
} finally {
  rmSync(root, { recursive: true, force: true })
}
