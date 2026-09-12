import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MongoMemoryReplSet } from "mongodb-memory-server";

// Runs exactly once for the whole test run (not once per file/worker), so
// the MongoDB binary is downloaded a single time instead of once per test
// file racing in parallel. The URI is handed to each file's setup.js via a
// temp file since globalSetup and test files run in separate processes.
//
// This must be a (single-node) replica set, not a plain MongoMemoryServer —
// order.controller.js's verifyPayment/updateOrderStatus use
// session.withTransaction(), and multi-document transactions only work
// against a replica set member, never a standalone mongod.
//
// No pinned binary version: mongodb-memory-server-core's log parser turned
// out to be incompatible with 6.0.14's replica-set shutdown log line
// (crashed the whole process), so this uses the library's own default,
// which its maintainers actually test replica-set mode against.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uriFile = path.join(__dirname, ".mongo-test-uri");

export async function setup() {
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  fs.writeFileSync(uriFile, replSet.getUri());

  return async () => {
    await replSet.stop();
    if (fs.existsSync(uriFile)) fs.unlinkSync(uriFile);
  };
}
