/**
 * Construye el prompt de typos para Gemini,
 * inyectando las excepciones creativas del proyecto.
 */
export const buildTypoPrompt = (exceptions = []) => {
  let base = `Eres un corrector de pruebas profesional de publicidad digital. Analiza el texto visible en esta imagen de un banner o elemento de marketing.
Busca únicamente errores ortográficos, errores tipográficos, palabras mal escritas o errores gramaticales evidentes en español o inglés.`;

  if (exceptions.length > 0) {
    const list = exceptions
      .map(e => `"${e.word}"${e.reason ? ` (${e.reason})` : ''}`)
      .join(', ');
    base += `\n\nIMPORTANTE: Las siguientes palabras son decisiones creativas intencionales aprobadas para este proyecto y NO deben considerarse errores: ${list}.`;
  }

  base += `\nSi encuentras errores responde SOLO con JSON válido: {"found": true, "errors": ["descripción del error 1", "descripción del error 2"]}
Si NO hay errores responde SOLO: {"found": false}
Sin texto adicional fuera del JSON.`;

  return base;
};

/**
 * Llama a Gemini Vision con una imagen en base64.
 * Retorna el objeto parsed { found, errors } o { found: false } en caso de error.
 */
export const analyzeImageWithGemini = async (imageUrl, exceptions = []) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { found: false };

  const imgResponse = await fetch(imageUrl);
  if (!imgResponse.ok) return { found: false };

  const base64Image = Buffer.from(await imgResponse.arrayBuffer()).toString('base64');
  const mimeType = imgResponse.headers.get('content-type') || 'image/jpeg';

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: buildTypoPrompt(exceptions) },
            { inline_data: { mime_type: mimeType, data: base64Image } }
          ]
        }],
        generationConfig: { temperature: 0.1 }
      })
    }
  );

  if (!geminiRes.ok) return { found: false };

  const data = await geminiRes.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{"found":false}';
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { found: false };
  } catch {
    return { found: false };
  }
};
