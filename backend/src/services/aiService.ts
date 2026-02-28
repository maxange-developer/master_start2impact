/**
 * AI Service Module
 *
 * OpenAI integration for activity search — mirrors Python backend exactly.
 *
 * Flow:
 * 1. Check Tenerife relevance (skip for suggestions)
 * 2. Tavily web search (activity data + reviews)
 * 3. OpenAI structures activities (image_url always null from AI)
 * 4. Per-activity Tavily image search (include_images: true)
 * 5. Fallback to local /images/blog/ files if no Tavily image
 */

import path from "path";
import fs from "fs";
import { OpenAI } from "openai";
import { settings } from "../core/config";
import { searchService } from "./searchService";
import { ActivityResult, SearchResponse } from "../schemas/search";

const openai = new OpenAI({ apiKey: settings.OPENAI_API_KEY });

// ── Local image catalogue ────────────────────────────────────────────────────
// Maps keyword → image prefix(es) exactly as in the Python backend
const KEYWORD_MAPPINGS: Record<string, string[]> = {
  teide:          ["teide"],
  anaga:          ["anaga"],
  masca:          ["masca-valley"],
  adeje:          ["adeje"],
  garachico:      ["garachico"],
  "santa cruz":   ["santacruz"],
  santacruz:      ["santacruz"],
  puerto:         ["puerto"],
  "la laguna":    ["la-laguna"],
  "la palma":     ["lapalma"],
  "la gomera":    ["gomera"],
  "el hierro":    ["elhierro"],
  whale:          ["dolphins"],
  dolphin:        ["dolphins"],
  delfin:         ["dolphins"],
  balena:         ["dolphins"],
  osservazione:   ["dolphins"],
  avvistamento:   ["dolphins"],
  cetacei:        ["dolphins"],
  siam:           ["siam-park"],
  "parco acquatico": ["siam-park"],
  "water park":   ["siam-park"],
  "loro parque":  ["loro-parque"],
  pappagallo:     ["loro-parque"],
  zoo:            ["loro-parque"],
  parapendio:     ["parapendio"],
  paragliding:    ["parapendio"],
  quad:           ["quad"],
  mtb:            ["mtb"],
  "mountain bike":["mtb"],
  bici:           ["mtb"],
  escursion:      ["hiking", "anaga", "teide"],
  trekking:       ["hiking", "anaga"],
  hiking:         ["hiking", "anaga"],
  cammino:        ["hiking", "anaga"],
  ristorante:     ["eat"],
  cibo:           ["eat"],
  cucina:         ["eat"],
  food:           ["eat"],
  gastronomia:    ["eat"],
  vino:           ["vitigni"],
  wine:           ["vitigni"],
  vigna:          ["vitigni"],
  carneval:       ["carneval"],
  carnevale:      ["carneval"],
  festa:          ["carneval"],
  spiaggia:       ["playa"],
  beach:          ["playa"],
  playa:          ["playa"],
  mare:           ["playa", "dolphins"],
  ocean:          ["playa", "dolphins"],
  bambini:        ["kidsactivity", "loro-parque", "siam-park"],
  famiglia:       ["kidsactivity", "loro-parque", "siam-park"],
  kids:           ["kidsactivity", "loro-parque", "siam-park"],
  hotel:          ["villa"],
  alloggio:       ["villa"],
  villa:          ["villa"],
};

const CATEGORY_FALLBACKS: Record<string, string[]> = {
  avventura:    ["hiking", "parapendio", "quad"],
  natura:       ["anaga", "teide", "hiking"],
  acqua:        ["playa", "dolphins", "siam-park"],
  mare:         ["playa", "dolphins"],
  cultura:      ["santacruz", "la-laguna", "carneval"],
  relax:        ["playa", "villa"],
  divertimento: ["siam-park", "loro-parque", "kidsactivity"],
  mirador:      ["teide", "anaga"],
  tramonto:     ["teide", "playa", "anaga"],
};

function getLocalImage(title: string, category: string = "", location: string = ""): string {
  const blogDir = path.join(__dirname, "../../../../frontend/public/images/blog");

  // Build catalogue: prefix → filename[]
  const catalogue: Record<string, string[]> = {};
  try {
    if (fs.existsSync(blogDir)) {
      for (const file of fs.readdirSync(blogDir)) {
        const ext = path.extname(file).toLowerCase();
        if (![".webp", ".jpg", ".jpeg", ".avif", ".png"].includes(ext)) continue;
        const stem = path.basename(file, ext);
        // "teide-1", "siam-park-3", "masca-valley" -> prefix
        const parts = stem.split("-");
        const lastPart = parts[parts.length - 1];
        const prefix = /^\d+$/.test(lastPart) ? parts.slice(0, -1).join("-") : stem;
        if (!catalogue[prefix]) catalogue[prefix] = [];
        catalogue[prefix].push(file);
      }
    }
  } catch (e) { /* ignore */ }

  if (Object.keys(catalogue).length === 0) return "/images/blog/playa-1.jpg";

  const searchText = `${title} ${category} ${location}`.toLowerCase();

  let matched: string[] = [];
  for (const [kw, prefixes] of Object.entries(KEYWORD_MAPPINGS)) {
    if (searchText.includes(kw)) {
      matched.push(...prefixes.filter(p => catalogue[p]));
    }
  }

  if (matched.length === 0) {
    // fuzzy: word overlap
    for (const prefix of Object.keys(catalogue)) {
      const prefixWords = new Set(prefix.replace(/-/g, " ").split(" "));
      const textWords = new Set(searchText.split(/\s+/));
      for (const w of prefixWords) {
        if (textWords.has(w)) { matched.push(prefix); break; }
      }
    }
  }

  if (matched.length === 0) {
    const fallback = CATEGORY_FALLBACKS[category.toLowerCase()] || ["playa"];
    matched = fallback.filter(p => catalogue[p]);
  }

  if (matched.length === 0) matched = Object.keys(catalogue);

  // Deduplicate
  matched = [...new Set(matched)];
  const prefix = matched[Math.floor(Math.random() * matched.length)];
  const files = catalogue[prefix] || ["playa-1.jpg"];
  const file = files[Math.floor(Math.random() * files.length)];
  const result = `/images/blog/${file}`;
  console.log(`[AIService] Local image for '${title}': ${result}`);
  return result;
}

// ── Main service ─────────────────────────────────────────────────────────────

class AIService {
  async processQuery(
    userQuery: string,
    isSuggestion: boolean = false,
    language: string = "es"
  ): Promise<SearchResponse> {

    const offTopicMessages: Record<string, string> = {
      es: "Lo siento, pero solo puedo ayudarte con información sobre Tenerife. ¡Intenta buscar actividades, lugares o experiencias para vivir en Tenerife!",
      en: "Sorry, but I can only help you with information about Tenerife. Try searching for activities, places, or experiences to live in Tenerife!",
      it: "Mi dispiace, ma posso aiutarti solo con informazioni su Tenerife. Prova a cercare attività, luoghi o esperienze da vivere a Tenerife!",
    };

    if (isSuggestion && !userQuery.toLowerCase().includes("tenerife")) {
      userQuery = `${userQuery} a Tenerife`;
    }

    if (!isSuggestion) {
      const isRelated = await this.checkTenerifeRelevance(userQuery);
      if (!isRelated) {
        return {
          results: [],
          off_topic: true,
          message: offTopicMessages[language] || offTopicMessages.es,
        };
      }
    }

    // Two Tavily searches (activity data + reviews), just like Python
    const [searchContext, reviewsContext] = await Promise.all([
      searchService.searchWeb(`Tenerife activities: ${userQuery}`),
      searchService.searchWeb(`Tenerife ${userQuery} recensioni Google valutazione stelle rating TripAdvisor`),
    ]);

    const languageNames: Record<string, string> = {
      es: "español (Spanish)",
      en: "inglese (English)",
      it: "italiano (Italian)",
    };
    const targetLanguage = languageNames[language] || "español (Spanish)";

    const systemPrompt = `
Sei un assistente di viaggio SUPER esperto per Tenerife, Spagna.
Il tuo obiettivo è prendere i risultati di ricerca forniti ed estrarre le migliori attività che corrispondono alla richiesta dell'utente.

IMPORTANTE: Tutte le risposte (titoli, descrizioni) DEVONO essere scritte in ${targetLanguage}.

Restituisci il risultato SOLO come un oggetto JSON valido con una chiave 'results' contenente una lista di attività.
Ogni attività DEVE avere questi campi:
- 'title': string (nome dell'attività)
- 'description': string (3-4 frasi concrete basate sui dettagli reali trovati)
- 'price': string (es. "€50", "Da €30", "Gratis"). MAI null.
- 'duration': string (es. "2 ore", "Mezza giornata"; se non chiaro, "Durata variabile")
- 'rating': string (usa SOLO valutazioni reali trovate nei risultati, es. "4.5/5". Se non trovi alcun numero, usa "N/A".)
- 'location': string (es. "Costa Adeje", "Teide")
- 'category': string (es. "Avventura", "Relax", "Cultura", "Acqua", "Natura", "Mirador", "Tramonto")
- 'image_url': null (IMPORTANTE: imposta SEMPRE questo campo a null. Le immagini vengono generate automaticamente dal sistema.)
- 'link': string o null (URL alla pagina di prenotazione/info se trovata nei risultati di ricerca)

REGOLE SPECIALI:
- Miradors, viewpoint, spiagge, percorsi pubblici → price = "Gratis" a meno che non sia indicato un biglietto.
- Non inventare prezzi, rating o dettagli non presenti nei risultati.
- Se il prezzo non è chiaro e non è un luogo pubblico, usa "Dettagli".

Restituisci 10 attività rilevanti. SOLO il JSON, nessuna formattazione markdown.`;

    const userPrompt = `
Richiesta Utente: ${userQuery}

Risultati Ricerca Attività:
${searchContext}

Risultati Ricerca Recensioni e Valutazioni:
${reviewsContext}`;

    try {
      if (!settings.OPENAI_API_KEY) {
        return this._getMockResponse();
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const data = JSON.parse(completion.choices[0].message.content || '{"results":[]}');
      const activities: any[] = data.results || [];
      console.log(`[AIService] Got ${activities.length} activities from OpenAI`);

      // Fetch images for each activity (Tavily → local fallback), same as Python
      for (const activity of activities) {
        const tavalyImage = await searchService.searchImageForActivity(
          activity.title || "",
          activity.location || ""
        );
        activity.image_url = tavalyImage || getLocalImage(
          activity.title || "",
          activity.category || "",
          activity.location || ""
        );
      }

      return {
        results: activities.map((a: any) => ({
          title:       a.title       || "Unknown Activity",
          description: a.description || "",
          price:       a.price       || "Varies",
          image_url:   a.image_url   || null,
          link:        a.link        || null,
          rating:      a.rating      || "",
          location:    a.location    || "",
          duration:    a.duration    || "",
          category:    a.category    || "",
        })),
      };

    } catch (error: any) {
      console.error("❌ OpenAI error:", error.message);
      if (error.status === 429 || error.code === "insufficient_quota") {
        throw new Error("AI_QUOTA_EXCEEDED");
      }
      if (error.status === 401 || error.code === "invalid_api_key") {
        throw new Error("AI_INVALID_KEY");
      }
      return { results: [] };
    }
  }

  private async checkTenerifeRelevance(query: string): Promise<boolean> {
    try {
      if (!settings.OPENAI_API_KEY) return true;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: `Analizza la seguente richiesta e determina se è correlata a Tenerife o è una query generica su attività turistiche (in questo caso considerala correlata). Rispondi SOLO con JSON: {"is_tenerife_related": true} o {"is_tenerife_related": false}.\n\nRichiesta: "${query}"`,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{"is_tenerife_related":true}');
      return result.is_tenerife_related !== false;
    } catch {
      return true; // permissive on error
    }
  }

  private _getMockResponse(): SearchResponse {
    return {
      results: [
        {
          title: "Osservazione delle Stelle sul Teide (Demo)",
          description: "Vivi l'esperienza del cielo notturno dal Parco Nazionale del Teide.",
          price: "€55",
          duration: "4 ore",
          rating: "4.8/5",
          location: "Parco Nazionale del Teide",
          category: "Natura",
          link: null,
          image_url: getLocalImage("Teide stelle", "Natura", "Teide"),
        } as any,
      ],
    };
  }
}

export const aiService = new AIService();
