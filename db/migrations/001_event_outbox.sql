-- Durable realtime event log.
-- Domain writes and their event rows happen in the same transaction.
CREATE TABLE IF NOT EXISTS event_outbox (
  id BIGSERIAL PRIMARY KEY,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  version BIGINT NOT NULL DEFAULT 1,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_outbox_id ON event_outbox(id);
CREATE INDEX IF NOT EXISTS idx_event_outbox_aggregate ON event_outbox(aggregate_type, aggregate_id, id);

CREATE OR REPLACE FUNCTION subhone_emit_domain_event()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  event_id BIGINT;
  aggregate_id TEXT;
  event_type TEXT;
  payload JSONB;
BEGIN
  aggregate_id := COALESCE(NEW.id::text, OLD.id::text);
  event_type := TG_OP;
  payload := jsonb_build_object(
    'operation', TG_OP,
    'table', TG_TABLE_NAME,
    'id', aggregate_id,
    'record', CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END
  );

  INSERT INTO event_outbox(aggregate_type, aggregate_id, event_type, payload)
  VALUES (TG_TABLE_NAME, aggregate_id, event_type, payload)
  RETURNING id INTO event_id;

  PERFORM pg_notify('subhone_domain_events', event_id::text);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_products_domain_event ON products;
CREATE TRIGGER trg_products_domain_event
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION subhone_emit_domain_event();

DROP TRIGGER IF EXISTS trg_orders_domain_event ON orders;
CREATE TRIGGER trg_orders_domain_event
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION subhone_emit_domain_event();

DROP TRIGGER IF EXISTS trg_profiles_domain_event ON profiles;
CREATE TRIGGER trg_profiles_domain_event
AFTER INSERT OR UPDATE OR DELETE ON profiles
FOR EACH ROW EXECUTE FUNCTION subhone_emit_domain_event();

DROP TRIGGER IF EXISTS trg_retailer_approvals_domain_event ON retailer_approvals;
CREATE TRIGGER trg_retailer_approvals_domain_event
AFTER INSERT OR UPDATE OR DELETE ON retailer_approvals
FOR EACH ROW EXECUTE FUNCTION subhone_emit_domain_event();
