const { Client } = require('pg');

const regions = [
  'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-south-1', 'eu-south-2', 'eu-north-1',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'sa-east-1', 'ca-central-1',
  'ap-southeast-1', 'ap-northeast-1', 'ap-northeast-2', 'ap-southeast-2', 'ap-south-1'
];

async function tryRegion(region) {
  const uri = `postgresql://postgres.suseccacxdfozgsxkmxx:135792000Pr.@aws-0-${region}.pooler.supabase.com:6543/postgres`;
  const client = new Client({ connectionString: uri, statement_timeout: 8000, connectionTimeoutMillis: 8000 });
  try {
    await client.connect();
    return uri;
  } catch (e) {
    if (e.message.includes('password authentication failed') || e.code !== 'ENOTFOUND') {
       return uri + ' -> ' + e.message;
    }
  }
}

async function run() {
  const promises = regions.map(r => tryRegion(r));
  const results = await Promise.all(promises);
  console.log('Results:');
  results.forEach((r, i) => r && console.log(regions[i], r));
}

run();
