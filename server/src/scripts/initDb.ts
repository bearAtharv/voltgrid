import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

async function runInit() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'voltgrid_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgrespassword',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('[DB Init] Connecting to PostgreSQL database...');
    await client.connect();
    console.log('[DB Init] Connected successfully.');

    // Look for database folder either relative to src or relative to project root
    let sqlDir = path.resolve(__dirname, '../../../database');
    if (!fs.existsSync(sqlDir)) {
      sqlDir = path.resolve(process.cwd(), '../database');
    }
    if (!fs.existsSync(sqlDir)) {
      sqlDir = path.resolve(process.cwd(), 'database');
    }

    const files = [
      '01_schema.sql',
      '02_triggers.sql',
      '03_stored_procedures.sql',
      '04_analytical_queries.sql',
      '05_seed_data.sql'
    ];

    for (const file of files) {
      const filePath = path.join(sqlDir, file);
      console.log(`[DB Init] Executing ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf-8');
      await client.query(sql);
      console.log(`[DB Init] ✅ Successfully executed ${file}`);
    }

    console.log('[DB Init] 🎉 VoltGrid Database initialized and seeded successfully!');
  } catch (error) {
    console.error('[DB Init Error] Failed to initialize database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runInit();
