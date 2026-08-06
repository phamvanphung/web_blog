// lib/redirects.ts
// Lookup a 301 redirect row by `fromPath`. Called by public detail routes
// (post slug, page slug) before render.

import { db } from './db';

export type RedirectRow = {
  fromPath: string;
  toPath: string;
  statusCode: number;
};

export async function findRedirectForPath(path: string): Promise<RedirectRow | null> {
  const row = await db.redirect.findUnique({
    where: { fromPath: path },
    select: { fromPath: true, toPath: true, statusCode: true }
  });
  return row;
}
