const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

(async () => {
  const schemaPath = path.join(__dirname, '..', '..', 'database', 'postgres_schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || undefined,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('Connected to Postgres');
    await client.query(schema);
    console.log('Schema applied successfully');
    client.release();
  } catch (err) {
    console.error('Schema application failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
