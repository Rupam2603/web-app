import { Router } from "express";
import { pool, withTransaction } from "../db.js";
import { authenticate, requireRole, principal } from "../auth.js";

export const productsRouter = Router();

productsRouter.get("/", async (req, res) => {
  const q = String(req.query.q || "").trim();
  const category = String(req.query.category || "").trim();
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 30)));
  const offset = (page - 1) * limit;

  const values: unknown[] = [];
  const where: string[] = ["is_listed = true"];
  if (q) { values.push(`%${q}%`); where.push(`(name ILIKE $${values.length} OR brand ILIKE $${values.length} OR sku ILIKE $${values.length})`); }
  if (category) { values.push(category); where.push(`category_name = $${values.length}`); }

  values.push(limit, offset);
  const { rows } = await pool.query(
    `SELECT id, numeric_id, name, subtitle, category_id, category_name, sub_category_id,
            sub_category_name, brand, sku, hsn, mrp, customer_price, retailer_price,
            discount_percent, stock, image_url, details, is_flash_sale, is_featured,
            is_listed, badges, return_policy, updated_at
       FROM products
      WHERE ${where.join(" AND ")}
      ORDER BY updated_at DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  res.json({ data: rows, page, limit });
});

productsRouter.patch("/:id", authenticate, requireRole("admin"), async (req, res) => {
  const id = req.params.id;
  const body = req.body || {};
  const allowed = ["name","subtitle","category_id","category_name","sub_category_id","sub_category_name","brand","sku","hsn","mrp","customer_price","retailer_price","purchase_price","discount_percent","stock","image_url","details","is_flash_sale","is_featured","is_listed","badges","return_policy"];
  const fields = Object.keys(body).filter(k => allowed.includes(k));
  if (!fields.length) return res.status(400).json({ error: "No editable fields supplied" });

  const values = fields.map(k => body[k]);
  const assignments = fields.map((k, i) => `"${k}" = $${i + 1}`);
  values.push(id);

  const updated = await withTransaction(async client => {
    const result = await client.query(
      `UPDATE products SET ${assignments.join(", ")}, updated_at = NOW()
        WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (!result.rows[0]) throw Object.assign(new Error("Product not found"), { statusCode: 404 });
    return result.rows[0];
  });

  res.json({ data: updated });
});
