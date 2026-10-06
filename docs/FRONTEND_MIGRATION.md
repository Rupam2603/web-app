# Frontend migration contract

Create one tiny client adapter in each presentation layer.

```ts
export interface ApiClient {
  getProducts(params?: Record<string, string>): Promise<ProductList>;
  getOrders(): Promise<Order[]>;
  createOrder(input: CreateOrderInput): Promise<Order>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<Order>;
  subscribe(listener: (event: DomainEvent) => void): () => void;
}
```

The React web app and Android app implement this interface independently.

## Important rule

Do not create a shared UI package that imports the database layer. Share only generated API types/schema and business-neutral DTO definitions.

## Realtime client algorithm

1. Authenticate.
2. Load REST snapshot.
3. Read `lastEventId` from secure app storage.
4. Request `/api/v1/events?after=lastEventId`.
5. Apply each event as an invalidation and refetch the resource.
6. Connect WebSocket.
7. On `domain_event`, refetch the affected resource.
8. Persist the newest event ID.
9. On disconnect, reconnect with exponential backoff and replay from the cursor.

This works on mobile networks and across multiple web sessions.

## UI independence

A designer can completely replace the Android screens without changing:
- database schema
- order service
- inventory service
- authorization
- web frontend
- realtime infrastructure

A web redesign similarly requires no backend changes unless the business contract changes.
