import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema';

/**
 * La base de datos es opcional a proposito: sin `DATABASE_URL` el
 * proyecto arranca igual en modo demo (ver lib/db/repository.ts), para
 * que clonar el repo y correr `pnpm dev` alcance para probarlo todo.
 */
const url = process.env.DATABASE_URL;

export const isDatabaseEnabled = Boolean(url);

export const db = url ? drizzle(neon(url), { schema }) : null;
