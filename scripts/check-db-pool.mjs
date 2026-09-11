// scripts/check-db-pool.mjs
// Print current mariadb pool stats directly from the DB. Useful when
// /api/health looks fine but something on the DB side still feels slow
// (you want to know how many of YOUR connections are sitting idle vs
// active, vs the server's @@max_connections / @@wait_timeout).
//
// Run: pnpm db:pool-stats
//
// Output:
//   active:  <n>   connections currently in use by this probe pool
//   idle:    <n>   connections sitting idle
//   total:   <n>   total opened (= active + idle)
//   waiting: <n>   requests queued waiting for a free connection
//
// Then drops the pool (no lingering connection to the DB).

import 'dotenv/config';
import mariadb from 'mariadb';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const pool = mariadb.createPool(url);

console.log('active:', pool.activeConnections());
console.log('idle:', pool.idleConnections());
console.log('total:', pool.totalConnections());
console.log('waiting:', pool.taskQueueSize());

await pool.end();
