import type { ImmutableObject } from 'seamless-immutable'

export interface Config {
  title: string
  body: string
}

export type IMConfig = ImmutableObject<Config>
