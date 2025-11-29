/* eslint-disable @typescript-eslint/no-empty-interface */
type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
}

interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
}

declare namespace App {
  interface Locals extends Runtime {
    user: User | null;
    session: Session | null;
  }
}
