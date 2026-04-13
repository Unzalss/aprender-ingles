import { createClient } from '@supabase/supabase-js';
import { getSessionItems } from '../src/logic/sessionEngine.js';

export default async function handler(req, res) {
  // Solo permitimos GET para poder probarlo fácilmente desde el navegador
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Usa GET abriendo la URL en el navegador.' });
  }

  try {
    // Usar variable de entorno de Vercel/Local para conectar con backend
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
    );

    console.log("[Backend Test] Generando sesión...");
    const items = await getSessionItems(supabase);

    // Formatear resumen rápido para lectura humana
    const summary = {
      total_items: items.length,
      news_count: items.filter(i => i.status === 'new' && !i.isExposition).length,
      exposure_frames: items.filter(i => i.status === 'new' && i.isExposition).length,
      learnings_count: items.filter(i => i.status === 'learning').length,
      mastereds_review: items.filter(i => i.isReview).length,
    };

    console.log("[Backend Test] Sesión generada:", summary);

    // Devolvemos Payload limpio en JSON
    return res.status(200).json({
       _analytics: summary,
       session_queue: items
    });
    
  } catch (error) {
    console.error("[Backend Test] 💥 Error:", error.message);
    return res.status(500).json({ 
       error: error.message, 
       hint: "Asegúrate de que las columnas están creadas en Supabase (status, correct_count...)",
       stack: error.stack 
    });
  }
}
