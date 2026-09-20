import { TypeSafeClient } from "@typesafe-ai/sdk";
import { config } from "./config.ts";
import { closePool } from "./nostr.ts";
import { createServer } from "./server.ts";

if (!process.env.TYPESAFE_API_KEY) {
  console.error("TYPESAFE_API_KEY が設定されていません。.env.example を参照してください。");
  process.exit(1);
}

/**
 * リレーとの接続が切れたとき、nostr-tools は誰も待っていない接続 Promise を reject することが
 * ある。既定では unhandledRejection はプロセスを落とすので、リレー 1 つの不調でサーバ全体が
 * 落ちないようログだけ出して続行する。
 */
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});

const client = new TypeSafeClient();
const server = createServer(client);

server.listen(config.port, () => {
  console.log(`nostr-jev-timeline: http://localhost:${config.port}/timeline (model: ${client.defaultModel})`);
  console.log(`relays: ${config.relays.join(", ")}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(() => {
      closePool();
      process.exit(0);
    });
  });
}
