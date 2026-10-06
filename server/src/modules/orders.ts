import { Router } from "express";
import { authenticate, requireRole, principal } from "../auth.js";
import { withTransaction, pool } from "../db.js";

export const ordersRouter = Router();

ordersRouter.get("/", authenticate, async (req, res) => {
  const p = principal(req);
  const requestedUser = String(req.query.userId || "");
  if (p.role !== "admin" && requestedUser && requestedUser !== p.userId) {
    return res.status(403).json({ error: "Cannot access another user's orders" });
  }
  const userId = p.role === "admin" ? (requestedUser || null) : p.userId;
  const { rows } = await pool.query(
    `SELECT o.*, COALESCE(json_agg(oi ORDER BY oi.id) FILTER (WHERE oi.id IS NOT NULL), '[]') AS order_items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE ($1::text IS NULL OR o.user_id = $1)
      GROUP BY o.id
      ORDER BY o.created_at DESC`,
    [userId || null]
  );
  res.json({ data: rows });
});

ordersRouter.post("/", authenticate, async (req, res) => {
  const p = principal(req);
  const { idempotencyKey, cartItems, shippingAddress, paymentType, customerName, customerPhone, shopName } = req.body || {};
  if (!idempotencyKey || !Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ error: "Cart is empty or request is incomplete" });
  }

  try {
    const result = await withTransaction(async client => {
      const existing = await client.query(
        `SELECT * FROM orders WHERE idempotency_key = $1 LIMIT 1`,
        [idempotencyKey]
      );
      if (existing.rows[0]) return existing.rows[0];

      const role = p.role === "retailer" ? "retailer" : "customer";
      const items: Array<{ product: any; quantity: number; unitPrice: number; lineTotal: number }> = [];
      let subtotal = 0;

      for (const raw of cartItems) {
        const quantity = Number(raw.quantity);
        if (!Number.isInteger(quantity) || quantity <= 0) throw new Error("Invalid quantity");

        const lookup = await client.query(
          `SELECT * FROM products
            WHERE id = $1 OR (numeric_id = $2 AND $2 > 0)
            ORDER BY CASE WHEN id = $1 THEN 0 ELSE 1 END
            LIMIT 1 FOR UPDATE`,
          [raw.productId || null, Number(raw.productNumericId || 0)]
        );
        const product = lookup.rows[0];
        if (!product) throw new Error(`Product not found: ${raw.name || raw.productId}`);
        if (Number(product.stock) < quantity) throw new Error(`${product.name} has insufficient stock`);

        const unitPrice = Number(role === "retailer" ? product.retailer_price : product.customer_price);
        const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
        subtotal += lineTotal;
        items.push({ product, quantity, unitPrice, lineTotal });
      }

      const delivery = role === "retailer" || subtotal >= 150 ? 0 : 40;
      const total = Math.round((subtotal + delivery) * 100) / 100;
      const paymentMethod = role === "retailer" ? "COD" : String(paymentType || "COD");

      const orderResult = await client.query(
        `INSERT INTO orders (
          order_number, user_id, customer_name, customer_phone, shipping_address,
          total_amount, payment_method, payment_status, status, user_role, shop_name, idempotency_key
        ) VALUES (
          'ORD-' || to_char(NOW(),'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text,1,8)),
          $1,$2,$3,$4,$5,$6,$7,$8,'Processing',$9,$10,$11
        ) RETURNING *`,
        [
          p.userId, customerName || "Customer", customerPhone || "",
          JSON.stringify(shippingAddress || {}), total, paymentMethod,
          ["UPI","Card","online"].includes(paymentMethod) ? "Paid" : "Pending",
          role, shopName || null, idempotencyKey
        ]
      );

      const order = orderResult.rows[0];
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items
             (order_id, product_id, product_name, sku, quantity, unit_price, total_price, image_url, mrp)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [order.id, item.product.id, item.product.name, item.product.sku,
           item.quantity, item.unitPrice, item.lineTotal, item.product.image_url, item.product.mrp]
        );
        await client.query(
          `UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2`,
          [item.quantity, item.product.id]
        );
      }
      const final = await client.query(
        `SELECT o.*, COALESCE(json_agg(oi ORDER BY oi.id) FILTER (WHERE oi.id IS NOT NULL), '[]') AS order_items
           FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id
          WHERE o.id=$1 GROUP BY o.id`, [order.id]
      );
      return final.rows[0];
    });

    res.status(201).json({ data: result });
  } catch (error: any) {
    res.status(409).json({ error: error?.message || "Unable to create order" });
  }
});

ordersRouter.patch("/:id/status", authenticate, requireRole("admin","delivery_partner"), async (req, res) => {
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ error: "status is required" });

  const result = await withTransaction(async client => {
    const current = await client.query(`SELECT * FROM orders WHERE id=$1 FOR UPDATE`, [req.params.id]);
    const order = current.rows[0];
    if (!order) throw Object.assign(new Error("Order not found"), { statusCode: 404 });

    const p = principal(req);
    if (p.role === "delivery_partner") {
      const allowed = ["Out for Delivery","Delivered"];
      if (!allowed.includes(status) || (order.delivery_partner_id && order.delivery_partner_id !== p.userId)) {
        throw Object.assign(new Error("Forbidden order transition"), { statusCode: 403 });
      }
    }

    const updated = await client.query(
      `UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [status, order.id]
    );
    return updated.rows[0];
  });
  res.json({ data: result });
});
