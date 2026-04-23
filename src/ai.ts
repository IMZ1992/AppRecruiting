import { GoogleGenAI, Type } from '@google/genai';

const ai = "AIzaSyAze9tzAuDNwRrwwscnJuYbd44jUmDRAgM";//= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function evaluateCandidateForOffer(candidate: any, offer: any) {
  const prompt = `
    Actúa como un Senior Tech Recruiter. Tu objetivo es hacer un "Match Perfecto" entre la oferta y el candidato.
    Analiza semánticamente los requisitos de la oferta y compáralos con el perfil y conocimientos del candidato.

    REGLAS DE EVALUACIÓN ESTRICTAS:
    1. MATCH DE PERFIL: El 'Perfil' del candidato debe estar alineado con el 'Título' de la oferta. Si buscan un "Data Engineer" y el perfil es "Frontend Developer", el score debe ser menor a 30.
    2. KEYWORDS: Busca coincidencias exactas o sinónimos entre los 'Requisitos' de la oferta y el 'Key Knowledge'/'Conocimiento' del candidato.
    3. PENALIZACIÓN: Si la oferta exige una tecnología clave y el candidato no la tiene, resta al menos 40 puntos.
    4. SCORING:
       - 90-100: Match perfecto. Cumple todos los requisitos y el perfil es exacto.
       - 75-89: Buen match. Cumple la mayoría de requisitos clave.
       - 50-74: Match parcial. Faltan skills importantes.
       - 0-49: No apto. Perfil o skills no coinciden.
    5. JUSTIFICACIÓN: En 'recommendation', explica exactamente qué skills coinciden y cuáles faltan en 1-2 frases concisas.
    
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
    - isFit: boolean (true si score >= 75, false si no)
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
  const batchSize = 5; // Process in smaller batches of 5 for much higher accuracy
  
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    
    const prompt = `
      Actúa como un Senior Tech Recruiter. Tu objetivo es hacer un "Match Perfecto" entre la oferta y los candidatos.
      Analiza semánticamente los requisitos de la oferta y compáralos con el perfil y conocimientos de cada candidato.

      REGLAS DE EVALUACIÓN ESTRICTAS:
      1. MATCH DE PERFIL: El 'Perfil' del candidato debe estar alineado con el 'Título' de la oferta. Si buscan un "Data Engineer" y el perfil es "Frontend Developer", el score debe ser menor a 30.
      2. KEYWORDS: Busca coincidencias exactas o sinónimos entre los 'Requisitos' de la oferta y el 'KeyKnowledge'/'Conocimiento' del candidato.
      3. PENALIZACIÓN: Si la oferta exige una tecnología clave y el candidato no la tiene, resta al menos 40 puntos.
      4. SCORING:
         - 90-100: Match perfecto. Cumple todos los requisitos y el perfil es exacto.
         - 75-89: Buen match. Cumple la mayoría de requisitos clave.
         - 50-74: Match parcial. Faltan skills importantes.
         - 0-49: No apto. Perfil o skills no coinciden.
      5. JUSTIFICACIÓN: En 'recommendation', explica exactamente qué skills coinciden y cuáles faltan en 1-2 frases concisas.
      
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
      
      INSTRUCCIONES:
      1. Para CADA candidato, realiza un análisis profundo (reasoning) comparando paso a paso los "Requisitos" de la oferta con el "Perfil", "KeyKnowledge" y "Conocimiento" del candidato.
      2. Basándote en ese análisis y las reglas estrictas, asigna un 'score' del 0 al 100.
      3. Determina 'isFit' como true solo si el score es >= 75.
      4. Escribe una 'recommendation' (1-2 frases) resumiendo tu análisis y por qué es apto o no.
      
      Devuelve estrictamente un array JSON con los resultados.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                candidateId: { type: Type.STRING },
                reasoning: { type: Type.STRING, description: "Análisis paso a paso del encaje del candidato con los requisitos" },
                isFit: { type: Type.BOOLEAN },
                recommendation: { type: Type.STRING },
                score: { type: Type.NUMBER }
              },
              required: ['candidateId', 'reasoning', 'isFit', 'recommendation', 'score']
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
