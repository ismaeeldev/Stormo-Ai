import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const result = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  console.log("TABLES IN DATABASE:", result.map(r => r.table_name));
}
main();
