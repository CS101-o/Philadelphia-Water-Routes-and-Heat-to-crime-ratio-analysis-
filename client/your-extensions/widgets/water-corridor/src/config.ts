import type { ImmutableObject } from 'seamless-immutable'

export interface Config {
  /** Starting width of the creek corridor buffer, in feet. */
  defaultBufferFt: number
}

export type IMConfig = ImmutableObject<Config>

export const DEFAULT_BUFFER_FT = 300
