import { expect, test } from "bun:test"
import type { Configuration } from "electron-builder"

const channels = [
  { channel: "dev", appId: "com.trustedrouter.cowork.opencodedev" },
  { channel: "beta", appId: "com.trustedrouter.cowork.opencodebeta" },
  { channel: "prod", appId: "com.trustedrouter.cowork.opencodedesktop" },
] as const

for (const channel of channels) {
  test(`isolates Trusted Cowork identity and signed packaging for ${channel.channel}`, async () => {
    const previous = process.env.OPENCODE_CHANNEL
    process.env.OPENCODE_CHANNEL = channel.channel
    try {
      const module = await import(`./electron-builder.config.ts?channel=${channel.channel}`)
      const config = module.default as Configuration
      expect(config.appId).toBe(channel.appId)
      expect(config.productName).toStartWith("Trusted Cowork")
      expect(config.extraMetadata?.desktopName).toBe(`${channel.appId}.desktop`)
      expect(config.linux?.executableName).toBe(channel.appId)
      expect(config.linux?.desktop?.entry?.StartupWMClass).toBe(channel.appId)
      expect(config.deb?.fpm).toEqual([expect.stringContaining(`/usr/share/metainfo/${channel.appId}.metainfo.xml`)])
      expect(config.rpm?.packageName).toStartWith("trusted-cowork")
      expect(config.files).toContain("!resources/opencode-cli*")
      expect(config.extraResources).toBeUndefined()
      expect(config.mac?.hardenedRuntime).toBe(true)
      expect(config.mac?.notarize).toBe(true)
      expect(config.protocols).toEqual({ name: "Trusted Cowork", schemes: ["trcc"] })
      if (channel.channel !== "dev") expect(config.publish).toMatchObject({
        owner: "Lore-Hex", repo: "confidential-cowork-desktop",
      })
    } finally {
      if (previous === undefined) delete process.env.OPENCODE_CHANNEL
      else process.env.OPENCODE_CHANNEL = previous
    }
  })
}
