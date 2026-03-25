import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function evaluateCandidateForOffer(candidate: any, offer: any) {
  const prompt = `
    Evalúa si el siguiente candidato es apto para la oferta de trabajo.
    
    Oferta:
    Título: ${offer.title}
    Descripción: ${offer.description}
    Requisitos: ${offer.requirements}
    
    Candidato:
    Nombre: ${candidate.Nombre}
    Perfil: ${candidate.Perfil}
    Conocimientos Clave: ${candidate['Key Knowledge']}
    Conocimiento: ${candidate.Conocimiento}
    
    Responde en formato JSON con tres campos:
    - isFit: boolean (true si es apto, false si no)
    - recommendation: string (breve justificación de 1-2 frases)
    - score: number (puntuación del 0 al 100 indicando el nivel de encaje)
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isFit: { type: Type.BOOLEAN },
            recommendation: { type: Type.STRING },
            score: { type: Type.NUMBER }
          },
          required: ['isFit', 'recommendation', 'score']
        }
      }
    });
    
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Evaluation error:", error);
    return { isFit: false, recommendation: "Error al evaluar con IA.", score: 0 };
  }
}

export async function evaluateAllCandidatesForOffer(offer: any, candidates: any[]) {
  if (!candidates || candidates.length === 0) return [];

  const results = [];
  const batchSize = 10; // Process in batches of 10 for higher accuracy without hitting rate limits
  
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    
    const prompt = `
      Actúa como un reclutador experto. Evalúa de forma precisa y estricta el encaje de los siguientes ${batch.length} candidatos para esta oferta de trabajo.
      
      Oferta:
      Título: ${offer.title}
      Descripción: ${offer.description}
      Requisitos: ${offer.requirements}
      
      Candidatos a evaluar:
      ${JSON.stringify(batch.map(c => ({
        id: c.id,
        Nombre: c.Nombre,
        Perfil: c.Perfil,
        KeyKnowledge: c['Key Knowledge'],
        Conocimiento: c.Conocimiento
      })))}
      
      Para CADA candidato en la lista, analiza detalladamente su encaje con los requisitos de la oferta.
      Sé muy estricto y preciso con el 'score' (0 a 100). Solo da scores altos (>80) si cumplen la mayoría de los requisitos.
      Devuelve estrictamente un array JSON con los resultados.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                candidateId: { type: Type.STRING },
                isFit: { type: Type.BOOLEAN },
                recommendation: { type: Type.STRING },
                score: { type: Type.NUMBER }
              },
              required: ['candidateId', 'isFit', 'recommendation', 'score']
            }
          }
        }
      });
      
      const batchResults = JSON.parse(response.text || '[]');
      results.push(...batchResults);
    } catch (error) {
      console.error("AI Bulk Evaluation error in batch:", error);
    }
  }
  
  return results;
}

export async function recommendCandidatesForNeeds(needs: string, candidates: any[]) {
  const prompt = `
    Tengo las siguientes necesidades de cliente para un proyecto/puesto:
    "${needs}"
    
    Y tengo la siguiente lista de candidatos (en formato JSON):
    ${JSON.stringify(candidates)}
    
    Devuelve una lista de los IDs de los candidatos que mejor encajen con estas necesidades, junto con una breve justificación para cada uno y una puntuación del 0 al 100 indicando el nivel de encaje.
    Responde en formato JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              candidateId: { type: Type.STRING },
              justification: { type: Type.STRING },
              score: { type: Type.NUMBER, description: "Puntuación de encaje del 0 al 100" }
            },
            required: ['candidateId', 'justification', 'score']
          }
        }
      }
    });
    
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("AI Recommendation error:", error);
    return [];
  }
}
