import path from 'node:path';
import { defineConfig, env } from 'prisma/config';

for (const fileName of ['.env', '.env.local']) {
  try {
    process.loadEnvFile(path.resolve(process.cwd(), fileName));
  } catch {
    // Ignore missing env files so Prisma can still use shell-provided vars.
  }
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
