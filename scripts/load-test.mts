/**
 * A small load test: N concurrent virtual users requesting a set of pages for
 * a fixed time, reporting throughput and latency percentiles per page.
 *
 *   npx tsx scripts/load-test.mts --url http://localhost:3000 --users 25 --seconds 30
 *
 * Point it at a production build (`next build && next start`), not `next dev`,
 * and not at the live site without agreeing a time: it is meant to find the
 * limit, which means reaching it. Public pages only — no credentials are used.
 */
const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? (process.argv[i + 1] ?? fallback) : fallback;
};

const base = arg("url", "http://localhost:3000").replace(/\/+$/, "");
const users = Number(arg("users", "25"));
const seconds = Number(arg("seconds", "30"));
const paths = arg("paths", "/api/health,/login,/verify/UNKNOWN-CODE").split(",");

type Stat = { ms: number[]; errors: number; statuses: Record<number, number> };
const stats = new Map<string, Stat>(paths.map((p) => [p, { ms: [], errors: 0, statuses: {} }]));
const until = Date.now() + seconds * 1000;

async function user(n: number) {
  let i = n;
  while (Date.now() < until) {
    const p = paths[i++ % paths.length];
    const s = stats.get(p)!;
    const t0 = performance.now();
    try {
      const res = await fetch(base + p, { redirect: "manual", signal: AbortSignal.timeout(15_000) });
      await res.arrayBuffer();
      s.ms.push(performance.now() - t0);
      s.statuses[res.status] = (s.statuses[res.status] ?? 0) + 1;
      if (res.status >= 500) s.errors++;
    } catch {
      s.errors++;
    }
  }
}

const pct = (sorted: number[], q: number) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] : 0);

console.log(`${users} users × ${seconds}s against ${base}`);
await Promise.all(Array.from({ length: users }, (_, n) => user(n)));

let total = 0;
let failed = 0;
console.log("\npath".padEnd(36), "reqs".padStart(7), "p50".padStart(7), "p95".padStart(7), "p99".padStart(7), "errors".padStart(7), " statuses");
for (const [p, s] of stats) {
  const sorted = [...s.ms].sort((a, b) => a - b);
  total += s.ms.length;
  failed += s.errors;
  console.log(
    p.padEnd(35),
    String(s.ms.length).padStart(7),
    `${pct(sorted, 0.5).toFixed(0)}ms`.padStart(7),
    `${pct(sorted, 0.95).toFixed(0)}ms`.padStart(7),
    `${pct(sorted, 0.99).toFixed(0)}ms`.padStart(7),
    String(s.errors).padStart(7),
    " " + JSON.stringify(s.statuses),
  );
}
console.log(`\n${total} requests, ${(total / seconds).toFixed(1)} req/s, ${failed} errors`);
process.exit(failed ? 1 : 0);
