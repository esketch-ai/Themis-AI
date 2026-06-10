import { runContextGC } from "./gc.js";

/**
 * Lightweight background worker
 * Periodically triggers GC.
 */
async function worker() {
  console.error("[Worker] Themis Background Worker started.");
  while (true) {
    try {
      await runContextGC();
    } catch (e) {
      console.error(`[Worker] GC Error: ${e}`);
    }
    // Run every 1 hour (3600000 ms)
    await new Promise(resolve => setTimeout(resolve, 3600000));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  worker().catch(console.error);
}
