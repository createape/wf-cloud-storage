/* eslint-disable @typescript-eslint/no-empty-interface */
/// <reference path="../worker-configuration.d.ts" />
import type { SessionPayload } from './lib/auth/config'

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    session?: SessionPayload
  }
}
