import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { createServer } from "node:http";
import { config } from "./config.js";
import { authenticate, verifyAccessToken } from "./auth.js";
import { listEvents, startEventListener, subscribeEvents } from "./events.js";
import { productsRouter } from "./modules/products.js";
import { ordersRouter } from "./modules/orders.js";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || config.corsOrigins.length === 0 || config.corsOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Origin not allowed"));
  },
  credentials: true,
}));

app.get("/health", (_req, res) => res.json({ ok: true, service: "subhone-backend" }));
app.use("/api/v1/products", productsRouter);
app.use("/api/v1/orders", ordersRouter);

app.get("/api/v1/events", authenticate, async (req, res) => {
  const after = Math.max(0, Number(req.query.after || 0));
  const events = await listEvents(after);
  res.setHeader("Cache-Control", "no-store");
  res.json({ data: events, nextCursor: events.at(-1)?.id ?? after });
});

const httpServer = createServer(app);
const wss = new WebSocketServer({ noServer: true });

httpServer.on("upgrade", async (req, socket, head) => {
  if (req.url !== "/realtime") return socket.destroy();

  // Browser WebSocket clients send the bearer token in the first message.
  wss.handleUpgrade(req, socket, head, ws => {
    ws.once("message", async raw => {
      try {
        const token = JSON.parse(raw.toString()).token;
        (ws as any).principal = await verifyAccessToken(token);
        ws.send(JSON.stringify({ type: "ready" }));
      } catch {
        ws.close(1008, "Unauthorized");
      }
    });
  });
});

subscribeEvents(event => {
  const message = JSON.stringify({ type: "domain_event", event });
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(message);
  }
});

startEventListener().then(() => console.log("Realtime listener started")).catch(err => {
  console.error("Realtime listener failed", err);
  process.exit(1);
});

httpServer.listen(config.port, () => {
  console.log(`SubhOne backend listening on :${config.port}`);
});
