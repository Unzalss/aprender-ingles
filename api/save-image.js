import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, itemId } = req.body;
    if (!url || !itemId) {
      return res.status(400).json({ error: 'Falta url o itemId' });
    }

    console.log(`\n[Backend SaveImage] ⬇️ Descargando imagen externa...`);
    const imgResponse = await fetch(url);
    if (!imgResponse.ok) {
      console.error(`[Backend SaveImage] ❌ Falló fetch de imagen. Status:`, imgResponse.status);
      throw new Error(`Falló la descarga remota de la imagen externa.`);
    }

    const arrayBuffer = await imgResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("🔑 Usando service role key en backend");
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const fileName = `${Date.now()}.png`;
    const filePath = `${itemId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error(`[Backend SaveImage] ❌ Error subiendo a Supabase Storage:`, JSON.stringify(uploadError, null, 2));
      throw new Error(`Error RLS/Upload de Supabase: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    console.log(`[Backend SaveImage] ✅ Fin del proceso. URL enviada al frontend.`);
    return res.status(200).json({ publicUrl: urlData.publicUrl });
  } catch (error) {
    console.error("[Backend SaveImage] 💥 Catch Error Global:", error.message);
    return res.status(500).json({ error: error.message || 'Server error on SaveImage' });
  }
}
