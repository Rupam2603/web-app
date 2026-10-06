import { pool } from "./db.js";

export type DomainEvent = {
  id: number;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  version: number;
  payload: Record<string, unknown>;
  occurredAt: string;
};

type Subscriber = (event: DomainEvent) => void;
const subscribers = new Set<Subscriber>();

export function subscribeEvents(fn: Subscriber) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export async function listEvents(after: number, limit = 200): Promise<DomainEvent[]> {
  const { rows } = await pool.query(
    `SELECT id, aggregate_type AS "aggregateType", aggregate_id AS "aggregateId",
            event_type AS "eventType", version, payload,
            occurred_at AS "occurredAt"
       FROM event_outbox
      WHERE id > $1
      ORDER BY id ASC
      LIMIT $2`,
    [after, Math.min(limit, 500)]
  );
  return rows;
}

export async function startEventListener() {
  const client = await pool.connect();
  await client.query("LISTEN subhone_domain_events");

  client.on("notification", async notification => {
    if (notification.channel !== "subhone_domain_events" || !notification.payload) return;
    const id = Number(notification.payload);
    if (!Number.isFinite(id)) return;
    const events = await listEvents(id - 1, 1);
    if (events[0]) for (const fn of subscribers) fn(events[0]);
  });

  client.on("error", err => console.error("Postgres LISTEN connection error", err));
  return () => client.release();
}
