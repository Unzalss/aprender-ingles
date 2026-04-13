import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envText = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envText.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v) env[k.trim()] = v.join('=').trim();
});

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase.from('items').select('*').limit(5);
  if (error) {
    console.error("DB Error:", error);
    return;
  }
  
  console.log("Sample Data:", data);
  console.log("Fields detected:", Object.keys(data[0] || {}));
}

check();
