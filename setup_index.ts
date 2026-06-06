import { Client } from 'pg';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  await client.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
  console.log("Vector extension verified.");
  
  await client.query(`CREATE INDEX IF NOT EXISTS actions_embedding_idx ON actions USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);`);
  console.log("Vector index created successfully.");
  
  await client.end();
}
main();
