import { resolveChannel } from "./utils"

const arg = process.argv[2]
const channel = arg === "dev" || arg === "beta" || arg === "prod" ? arg : resolveChannel()

const appId = `com.trustedrouter.cowork.${channel === "prod" ? "opencodedesktop" : `opencode${channel}`}`
const productName = channel === "prod" ? "Trusted Cowork" : `Trusted Cowork ${channel.charAt(0).toUpperCase() + channel.slice(1)}`
const summary = "Desktop agent with confidential inference through TrustedRouter"

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<component type="desktop-application">
  <id>${appId}</id>

  <metadata_license>CC0-1.0</metadata_license>
  <project_license>MIT</project_license>

  <name>${productName}</name>
  <summary>${summary}</summary>

  <developer id="com.trustedrouter">
    <name>Lore Hex Corp</name>
  </developer>

  <description>
    <p>
      Trusted Cowork is an open source desktop agent based on OpenCode, with confidential model routing through TrustedRouter.
    </p>
  </description>

  <launchable type="desktop-id">${appId}.desktop</launchable>

  <content_rating type="oars-1.1" />

  <url type="bugtracker">https://github.com/Lore-Hex/confidential-cowork-desktop/issues</url>
  <url type="homepage">https://trustedrouter.com</url>
  <url type="vcs-browser">https://github.com/Lore-Hex/confidential-cowork-desktop</url>

</component>
`

await Bun.write(`resources/${appId}.metainfo.xml`, xml)
console.log(`Generated metainfo for ${channel} at resources/${appId}.metainfo.xml`)
