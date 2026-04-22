const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const client = new Client({
    connectionString: "postgresql://postgres:135792000Pr.@db.suseccacxdfozgsxkmxx.supabase.co:5432/postgres" // Using 5432 or 6543
  });
  await client.connect();
  
  const scripts = [
    '/home/nicolas/Documentos/PlataformaAinara/scripts/003a_create_tables.sql',
    '/home/nicolas/Documentos/PlataformaAinara/scripts/003b_enable_rls.sql',
    '/home/nicolas/Documentos/PlataformaAinara/scripts/003c_indexes_triggers.sql'
  ];
  
  for (const script of scripts) {
      console.log(`Executing ${script}...`);
      const sql = fs.readFileSync(script, 'utf8');
      try {
          await client.query(sql);
          console.log(`Success: ${script}`);
      } catch (err) {
          console.error(`Error in ${script}:`, err.message);
          console.error(err);
          throw err;
      }
  }
  
  await client.end();
}

run().catch(console.error);
