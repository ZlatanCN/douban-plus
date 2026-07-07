// QA harness for douban-plus.user.js
// Usage: pnpm run test:e2e

import { runQa } from "./qa/runner";

process.exit(await runQa());
