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

    console.log("[Backend Test] Generando sesión dividida por fases...");
    const sessionData = await getSessionItems(supabase);

    // Formatear resumen analítico para Frontend y Developers
    const summary = {
      exposure_total: sessionData.exposure_queue.length,
      evaluation_total: sessionData.evaluation_queue.length,
      news_in_exposure: sessionData.exposure_queue.filter(i => i.status === 'new').length,
      news_in_evaluation: sessionData.evaluation_queue.filter(i => i.status === 'new').length
    };

    console.log("[Backend Test] Sesión generada:", summary);

    // Devolvemos Payload dividido según reglas
    return res.status(200).json({
       _analytics: summary,
       exposure_queue: sessionData.exposure_queue,
       evaluation_queue: sessionData.evaluation_queue
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
