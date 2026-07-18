import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';
dotenv.config();

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error('DATABASE_URL is not set');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url,
  },
});
