import { existsSync } from 'fs'
import { join } from 'path'
import type { PiStartOptions } from '../shared/ipc-contracts'
import { COWORK_MODEL, COWORK_PROVIDER, requireConfidentialModel } from '../shared/confidential'
import { loadConfidentialModelIds } from './confidential-models'

interface RuntimePolicy {
  executable: string
  agentDir: string
  permissionExtension: string
  readKey: () => Promise<string>
  loadModelIds?: () => Promise<Set<string>>
  readPreferredModel?: () => Promise<string | undefined>
}

let policy: RuntimePolicy | undefined

/** Installed once by the main process, never by renderer IPC or workspace configuration. */
export function configureConfidentialRuntime(value: RuntimePolicy): void {
  policy = value
}

export function bundledRuntime(): string | undefined {
  return policy?.executable
}

export function confidentialRuntimeActive(): boolean {
  return policy !== undefined
}

/** Pin every session start, including resume/restart/background tasks, to the shipped runtime. */
export async function confidentialStart(options: PiStartOptions): Promise<PiStartOptions> {
  if (!policy) return options
  if (!existsSync(policy.executable) || !existsSync(policy.permissionExtension)) {
    throw new Error('The bundled agent is missing. Reinstall TR Confidential Cowork.')
  }
  const model = options.model || await policy.readPreferredModel?.() || COWORK_MODEL
  requireConfidentialModel(options.provider || COWORK_PROVIDER, model,
    model === COWORK_MODEL ? undefined : await (policy.loadModelIds ?? loadConfidentialModelIds)())
  const args = ['--no-extensions', '--no-skills', '--no-prompt-templates', '-e', policy.permissionExtension]
  // Permission mode may narrow tools, but cannot add an executable extension or override routing.
  const supplied = options.args ?? []
  for (let i = 0; i < supplied.length; i++) {
    if (supplied[i] === '--tools' && supplied[i + 1]) args.push('--tools', supplied[++i])
  }
  const env: Record<string, string> = {}
  for (const [name, value] of Object.entries(options.env ?? {})) {
    if (name.startsWith('PI_DESKTOP_PERMISSION_') || name === 'PI_DESKTOP_WORKSPACE_TRUSTED' || name === 'PI_DESKTOP_AGENT_LABEL') env[name] = value
  }
  return {
    ...options,
    engine: 'pi',
    provider: COWORK_PROVIDER,
    model,
    args,
    env: {
      ...env,
      TR_COWORK_CODING_AGENT_DIR: policy.agentDir,
      PI_CODING_AGENT_DIR: policy.agentDir,
      TRUSTEDROUTER_API_KEY: await policy.readKey(),
    },
  }
}

/** RPC model switching cannot silently escape the confidential product policy. */
export async function confidentialCommand(command: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (!policy) return command
  if (command.type === 'set_model') requireConfidentialModel(command.provider, command.modelId,
    command.modelId === COWORK_MODEL ? undefined : await (policy.loadModelIds ?? loadConfidentialModelIds)())
  if (command.type === 'cycle_model') return { type: 'set_model', provider: COWORK_PROVIDER, modelId: COWORK_MODEL }
  if (command.type === 'switch_session') throw new Error('Open the session from the session list instead.')
  return command
}

export function runtimeLocation(resourceRoot: string): string {
  return join(resourceRoot, 'runtime', 'tr-cowork')
}
