import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req) {
  try {
    const { topic, duration, difficulty } = await req.json();

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content:
            "Tu es un coach expert en éloquence et prise de parole publique, bienveillant mais exigeant. " +
            "Tu DOIS répondre avec UNIQUEMENT un objet JSON brut, rien d'autre : pas de markdown, pas de balises de code, pas d'explication. " +
            'Le format exact est : {"score": <nombre entre 0 et 100>, "strengths": "...", "improvements": "...", "encouragement": "..."} ' +
            "Tous les textes doivent être en français. Ne mets pas le JSON dans des balises ```json. Commence directement par { et termine par }.",
        },
        {
          role: "user",
          content: `Un utilisateur vient de terminer un défi d'éloquence sur le sujet : "${topic}". ` +
            `Difficulté : ${difficulty}. Durée du défi : ${duration} secondes. ` +
            `Comme tu n'as pas accès à l'audio, génère un feedback générique mais utile et motivant, ` +
            `avec un score d'éloquence simulé (entre 0 et 80), des points forts probables, ` +
            `des pistes d'amélioration concrètes (structure, débit, posture, arguments), et un mot d'encouragement. ` +
            `Réponds uniquement avec l'objet JSON.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    let parsed;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      parsed = {
        score: 78,
        strengths: "Bonne prise de parole et engagement face à la caméra.",
        improvements: "Travaille la structure (intro/arguments/conclusion) et varie ton intonation.",
        encouragement: "Continue, chaque défi te rapproche d'une éloquence redoutable ! 🔥",
      };
    }

    return Response.json(parsed);
  } catch (err) {
    console.error("Groq feedback error:", err);
    return Response.json(
      {
        score: 75,
        strengths: "Tu as osé te lancer, c'est déjà une victoire.",
        improvements: "Essaie de structurer ton propos en 3 parties claires.",
        encouragement: "Bravo pour ce défi, retente-en un autre ! 💪",
        fallback: true,
      },
      { status: 200 }
    );
  }
}