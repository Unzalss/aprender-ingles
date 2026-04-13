export default async function handler(req, res) {
  // Solo aceptamos peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { label, type } = req.body;
    
    if (!label) {
      return res.status(400).json({ error: 'Falta la palabra o acción' });
    }

    // Leemos la variable de entorno del servidor (NO expuesta a frontend)
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
      promptText = `A simple, cute children's illustration of a child clearly performing the action '${label}'. 
Centered composition. 
White background. 
Soft pastel colors. 
Rounded shapes. 
Minimal details. 
Very clear action. 
No text. 
No letters. 
No watermark. 
Not realistic. 
Cartoon style. 
Clean vector-like drawing. 
Consistent children's book style.`;
    }

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: promptText,
        n: 1,
        size: "1024x1024"
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData.error?.message || 'Error de la API de OpenAI' });
    }

    const data = await response.json();
    const generatedUrl = data.data[0].url;

    return res.status(200).json({ url: generatedUrl });
  } catch (error) {
    console.error("Error en API /generate-image:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
