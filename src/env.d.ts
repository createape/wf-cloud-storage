/* eslint-disable @typescript-eslint/no-empty-interface */
/// <reference path="../.astro/types.d.ts" />

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    user: import("better-auth").User | null;
    session: import("better-auth").Session | null;
  }
}
