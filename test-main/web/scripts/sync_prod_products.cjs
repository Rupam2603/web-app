const { neon } = require('../node_modules/@neondatabase/serverless');

const pUrl = 'postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-falling-cell-azm5qjrf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const dUrl = 'postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-divine-scene-az33au23-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

async function syncProducts() {
  const pSql = neon(pUrl);
  const dSql = neon(dUrl);

  // Check if xdzdfzrds exists and delete or renumber
  await pSql.query("DELETE FROM products WHERE name = 'xdzdfzrds'");

  const devProds = await dSql.query('SELECT * FROM products ORDER BY numeric_id ASC');
  console.log(`Found ${devProds.length} products in dev.`);

  for (const prod of devProds) {
    const existing = await pSql.query('SELECT id, numeric_id FROM products WHERE name = $1', [prod.name]);
    if (existing.length === 0) {
      console.log(`Inserting into production: ${prod.name} (numeric_id: ${prod.numeric_id})`);
      await pSql.query(
        `INSERT INTO products (
          id, numeric_id, name, subtitle, category_name, brand, sku, hsn,
          mrp, customer_price, retailer_price, discount_percent, stock,
          image_url, web_image_url, details,
          is_flash_sale, is_featured, is_listed, badges, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13,
          $14, $14, $15,
          $16, $17, true, $18, NOW(), NOW()
        )`,
        [
          prod.id,
          prod.numeric_id,
          prod.name,
          prod.subtitle || '',
          prod.category_name || 'General',
          prod.brand || '',
          prod.sku || '',
          prod.hsn || '',
          prod.mrp || 0,
          prod.customer_price || prod.mrp || 0,
          prod.retailer_price || 0,
          prod.discount_percent || 0,
          prod.stock || 100,
          prod.image_url || '',
          prod.details || '',
          Boolean(prod.is_flash_sale),
          Boolean(prod.is_featured),
          JSON.stringify(prod.badges || [])
        ]
      );
    } else {
      console.log(`Updating existing in production: ${prod.name}`);
      await pSql.query(
        `UPDATE products SET is_listed = true, customer_price = $1, mrp = $2, retailer_price = $3, stock = $4, category_name = $5, image_url = $6, web_image_url = $6 WHERE name = $7`,
        [prod.customer_price, prod.mrp, prod.retailer_price, prod.stock, prod.category_name, prod.image_url, prod.name]
      );
    }
  }

  const pCount = await pSql.query('SELECT count(*) as count FROM products WHERE is_listed = true');
  console.log(`Production active listed products count now: ${pCount[0].count}`);
  const list = await pSql.query('SELECT numeric_id, name, is_listed, customer_price, stock FROM products ORDER BY numeric_id ASC');
  console.log('Production products:', list);
}

syncProducts().catch(console.error);
