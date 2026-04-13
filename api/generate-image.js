export default async function handler(req, res) {
  // Solo aceptamos peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { label, type } = req.body;
    console.log(`\n\n[API Backend] 🚀 Generando imagen para: "${label}" (Tipo: ${type})`);
    
    if (!label) {
      console.warn("[API Backend] ❌ Falta parámetro label.");
      return res.status(400).json({ error: 'Falta la palabra o acción' });
    }

    // Leemos la variable de entorno del servidor
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Falta OPENAI_API_KEY en el backend' });
    }

    let promptText = "";
    if (type === 'word' || type === 'object') {
      promptText = `A simple, cute children's illustration of a single ${label}. 
Centered composition. 
White background. 
Soft pastel colors. 
Rounded shapes. 
Minimal details. 
No text. 
No letters. 
No watermark. 
Not realistic. 
Cartoon style. 
Clean vector-like drawing. 
Consistent children's book style.`;
    } else {
      const verbMap = {
        'sit': 'sitting down',
        'eat': 'eating food',
        'look': 'looking at something',
        'walk': 'walking',
        'run': 'running',
        'jump': 'jumping',
        'play': 'playing',
        'sleep': 'sleeping'
      };
      const mappedAction = verbMap[label.toLowerCase()] || `${label}`;

      promptText = `A simple, cute children's illustration of a child ${mappedAction} clearly. 
White background. 
Centered. 
Soft colors. 
No text. 
Cartoon style. 
Very clear action for kids. 
No realism.`;
    }

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: promptText,
        n: 1,
        size: "1024x1024"
      })
    });

    console.log(`[API Backend] ⚡ Respuesta de OpenAI - Status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[API Backend] 💥 Error JSON de OpenAI RAW:", JSON.stringify(errorData, null, 2));
      return res.status(response.status).json({ error: errorData.error?.message || 'Error en la respuesta de OpenAI' });
    }

    const data = await response.json();
    console.log("[API Backend] 🔬 Response JSON RAW de OpenAI:", JSON.stringify(data, null, 2));

    const generatedUrl = data.data && data.data[0] ? data.data[0].url : null;

    if (!generatedUrl) {
      console.error("[API Backend] 💥 OpenAI no devolvió URL esperada:", JSON.stringify(data, null, 2));
      return res.status(500).json({ error: 'OpenAI devolvió resultado vacío' });
    }

    console.log(`[API Backend] ✅ Éxito. Entregando URL al frontend.`);
    return res.status(200).json({ url: generatedUrl });
  } catch (error) {
    console.error("Error en API /generate-image:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
