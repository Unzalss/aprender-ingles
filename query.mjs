import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        envVars[match[1].trim()] = match[2].trim();
    }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await supabase.from('items').select('label, type, category, image_url');
    if (error) { console.error("Error DB:", error); return; }
    
    // Filtro isBadImageUrl
    const missing = data.filter(i => {
       if (!i.image_url) return true;
       const val = i.image_url.trim().toLowerCase();
       if (!val) return true;
       if (!val.startsWith('http')) return true;
       if (val.includes('loremflickr.com')) return true;
       return false;
    });

    const objects = missing.filter(i => i.type === 'object' || (i.category && i.category.includes('FAMILIA')));
    const actions = missing.filter(i => i.type === 'command');
    const adjs = missing.filter(i => i.category && (i.category.includes('ADJETIVOS') || i.category.includes('ESTADOS')));
    const others = missing.filter(i => !objects.includes(i) && !actions.includes(i) && !adjs.includes(i));

    console.log("=== OBJETOS Y PERSONAS ===");
    console.log(objects.map(o => o.label).join(', '));
    console.log("\n=== VERBOS Y ACCIONES ===");
    console.log(actions.map(a => a.label).join(', '));
    console.log("\n=== ADJETIVOS Y ESTADOS ===");
    console.log(adjs.map(a => a.label).join(', '));
    console.log("\n=== OTROS (Colores, números, preposiciones) ===");
    console.log(others.map(a => a.label).join(', '));
}
run();
