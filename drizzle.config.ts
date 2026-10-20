import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export default {
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Migrations may use a separate admin connection; defaults to the app's DATABASE_URL.
    url: (process.env.DATABASE_URL_MIGRATIONS ?? process.env.DATABASE_URL)!,
  },
} satisfies Config;
