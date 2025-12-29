import { handle, type AppEnv } from './app';

type Env = AppEnv;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    return handle(req, env);
  }
} satisfies ExportedHandler<Env>;
