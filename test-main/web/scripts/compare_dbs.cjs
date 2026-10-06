const { neon } = require('../node_modules/@neondatabase/serverless');

const pUrl = 'postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-falling-cell-azm5qjrf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const dUrl = 'postgresql://neondb_owner:npg_UOkw6Ks9FcjE@ep-divine-scene-az33au23-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

async function main() {
  const pSql = neon(pUrl);
  const dSql = neon(dUrl);

  const pProducts = await pSql.query('SELECT count(*) as count FROM products');
  const dProducts = await dSql.query('SELECT count(*) as count FROM products');
  console.log('Production products count:', pProducts[0].count);
  console.log('Vercel-dev products count:', dProducts[0].count);

  const pOrders = await pSql.query('SELECT count(*) as count FROM orders');
  const dOrders = await dSql.query('SELECT count(*) as count FROM orders');
  console.log('Production orders count:', pOrders[0].count);
  console.log('Vercel-dev orders count:', dOrders[0].count);

  const pUsers = await pSql.query('SELECT count(*) as count FROM user_profiles');
  const dUsers = await dSql.query('SELECT count(*) as count FROM user_profiles');
  console.log('Production users count:', pUsers[0].count);
  console.log('Vercel-dev users count:', dUsers[0].count);

  const pRecent = await pSql.query('SELECT id, name, is_listed, customer_price, created_at FROM products ORDER BY created_at DESC');
  const dRecent = await dSql.query('SELECT id, name, is_listed, customer_price, created_at FROM products ORDER BY created_at DESC');
  console.log('Production products:', pRecent);
  console.log('Vercel-dev products:', dRecent);
}

main().catch(console.error);
