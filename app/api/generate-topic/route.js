import Groq from "groq-sdk";
import {
  getRecentTopics,
  addTopicToHistory,
  isTooSimilar,
} from "../../../lib/topicHistory";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const DIFFICULTY_PROMPTS = {
  facile:
    "Make it light, fun, accessible to anyone, and easy to talk about for beginners.",
  moyen:
    "Make it moderately challenging, requiring some structured argumentation.",
  difficile:
    "Make it provocative, complex, and suitable for an advanced debate requiring strong argumentation and nuance.",
};

const CATEGORIES = [
  "amour et relations",
  "amitié et solitude",
  "jeunesse et générations",
  "cinéma et séries",
  "anime et manga",
  "musique et culture pop",
  "réseaux sociaux et vie privée",
  "société et inégalités",
  "politique actuelle",
  "géopolitique et conflits internationaux",
  "guerres et paix",
  "problématiques mondiales actuelles",
  "Afrique : développement et culture",
  "sport et compétition",
  "santé et bien-être",
  "biologie et sciences du vivant",
  "intelligence artificielle",
  "informatique et technologie",
  "innovations et changements mondiaux",
  "cuisine et gastronomie",
  "environnement et climat",
  "éducation et école",
  "argent et consommation",
  "business et entrepreneuriat",
  "philosophie et éthique",
  "religion et spiritualité",
  "voyage et cultures du monde",
  "futur et science-fiction",
  "famille et éducation des enfants",
  "justice et droits humains",
  "humour et absurde",
  "situations de vie quotidienne",
];

const FALLBACK_TOPICS = [
  "Faut-il limiter l'usage des réseaux sociaux chez les jeunes ?",
  "L'intelligence artificielle va-t-elle remplacer la créativité humaine ?",
  "Le télétravail est-il une avancée ou un piège pour la vie privée ?",
  "Faut-il rendre le vote obligatoire ?",
  "L'argent peut-il vraiment acheter le bonheur ?",
];

export async function POST(req) {
  try {
    const { difficulty = "moyen", customTheme = "" } = await req.json();
    const theme = customTheme.trim();

    const category = theme || CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const diffInstruction = DIFFICULTY_PROMPTS[difficulty] || DIFFICULTY_PROMPTS.moyen;

    const recentTopics = getRecentTopics();

    const avoidInstruction =
      recentTopics.length > 0
        ? ` IMPORTANT: Do NOT generate a topic similar to any of these recently used topics: ${recentTopics
            .slice(-15)
            .map((t) => `"${t}"`)
            .join(", ")}.`
        : "";

    let parsed = null;
    const MAX_ATTEMPTS = 3;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 1.15,
        max_tokens: 250,
        messages: [
          {
            role: "system",
            content:
              "You are a creative public speaking coach generating unique speech/debate topics in French. " +
              "You MUST respond with ONLY a raw JSON object, nothing else: no markdown, no code fences, no explanation. " +
              'The exact format is: {"topic": "...", "category": "...", "tip": "..."} ' +
              "Start your response directly with { and end with }.",
          },
          {
            role: "user",
            content: theme
              ? `Generate a debate topic in French.

IMPORTANT: The topic MUST stay STRICTLY related to this theme: "${theme}"
The category MUST ALSO be exactly: "${theme}"
${diffInstruction}${avoidInstruction}

Return ONLY valid JSON like this:
{"topic":"...","category":"${theme}","tip":"..."}`
              : `Generate a modern, current, real-world debate topic in French. Category theme: ${category}. ${diffInstruction}
The topic should feel relevant to someone living in 2026. Make it specific and concrete, engaging, thought-provoking, suitable for debate, appropriate for all ages.${avoidInstruction}

Return ONLY valid JSON like this:
{"topic":"...","category":"...","tip":"..."}`,
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content?.trim() || "";

      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const candidate = JSON.parse(jsonMatch ? jsonMatch[0] : raw);

        if (!candidate.topic) continue;
        if (isTooSimilar(candidate.topic, recentTopics)) continue;

        if (theme) {
          candidate.category = theme;
        }

        parsed = candidate;
        break;
      } catch {
        // Invalid JSON, try again
      }
    }
    console.log("Theme requested:", theme, "| Parsed after attempts:", parsed);

    if (!parsed) {
      const available = FALLBACK_TOPICS.filter((t) => !isTooSimilar(t, recentTopics));
      const pool = available.length > 0 ? available : FALLBACK_TOPICS;
      parsed = {
        topic: pool[Math.floor(Math.random() * pool.length)],
        category,
        tip: "Structure ton discours en introduction, arguments et conclusion.",
      };
    }

    addTopicToHistory(parsed.topic);

    return Response.json({
      topic: parsed.topic,
      category: theme || parsed.category || category,
      tip: parsed.tip || "Prends 10 secondes pour structurer tes idées avant de parler.",
      difficulty,
    });
  } catch (err) {
    console.error("Groq topic error:", err);
    const fallback = FALLBACK_TOPICS[Math.floor(Math.random() * FALLBACK_TOPICS.length)];
    addTopicToHistory(fallback);
    return Response.json(
      {
        topic: fallback,
        category: "société",
        tip: "Donne deux arguments et une opinion personnelle claire.",
        difficulty: "moyen",
        fallback: true,
      },
      { status: 200 }
    );
  }
}