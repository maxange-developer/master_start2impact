"""
Article Structure Service Module - AI-Powered Content Organization

This module uses OpenAI GPT-3.5 to automatically structure blog articles
into visually appealing sections with highlights, tips, and formatted content.

Key Features:
    - AI-powered content sectioning
    - Automatic highlight extraction
    - Practical tips identification
    - Introduction and conclusion generation
    - Multi-section layout with type metadata
    - Fallback basic structure when AI unavailable

Output Structure:
    {
        "intro": {"text": "..."},
        "highlights": ["...", "..."],
        "sections": [{"title": "...", "content": "...", "type": "text"}],
        "tips": [{"title": "...", "text": "..."}],
        "conclusion": {"text": "..."}
    }

Dependencies:
    - OpenAI API: GPT-3.5-turbo for content analysis
    - Config: settings.OPENAI_API_KEY

Technical Notes:
    - JSON mode ensures structured output
    - Temperature 0.7 for creative sectioning
    - Fallback splits content by paragraphs when AI unavailable
"""

import json
from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

class ArticleStructureService:
    async def structure_article(self, title: str, content: str) -> dict:
        """
        Analyze blog article and structure it into intelligent sections.
        
        Uses OpenAI to identify key sections, extract highlights, and organize
        content for optimal visual presentation in blog interface.
        
        Args:
            title (str): Article headline/title
            content (str): Full article body text (plain text or markdown)
            
        Returns:
            dict: Structured article with sections:
                - intro (dict): Opening paragraph {text: "..."}
                - highlights (List[str]): 3-5 key points from article
                - sections (List[dict]): Main content sections with titles
                - tips (List[dict]): Practical advice extracted from content
                - conclusion (dict): Closing paragraph {text: "..."}
                
        Example:
            >>> await service.structure_article(
            ...     "Tenerife Beaches Guide",
            ...     "Tenerife offers amazing beaches..."
            ... )
            {
                "intro": {"text": "Discover the best beaches..."},
                "highlights": ["Black sand beaches", "Clear waters", "Family-friendly"],
                "sections": [
                    {"title": "North Coast Beaches", "content": "...", "type": "text"},
                    {"title": "South Coast Beaches", "content": "...", "type": "text"}
                ],
                "tips": [
                    {"title": "Best Time to Visit", "text": "Morning hours..."}
                ],
                "conclusion": {"text": "Plan your beach adventure today!"}
            }
            
        Technical Notes:
            - Falls back to _get_basic_structure if OpenAI unavailable
            - AI extracts 3-6 logical sections from content
            - Tips section omitted if no practical advice found
            - Maintains informal but professional Italian tone
        """
        
        system_prompt = """
        Sei un esperto di content design e UX per blog di viaggio.
        Il tuo compito è analizzare un articolo di blog su Tenerife e strutturarlo in sezioni visivamente accattivanti.
        
        Devi restituire un oggetto JSON con questa struttura:
        {
          "intro": {
            "text": "Paragrafo introduttivo coinvolgente (2-3 frasi)"
          },
          "highlights": [
            "Punto chiave 1",
            "Punto chiave 2",
            "Punto chiave 3"
          ],
          "sections": [
            {
              "title": "Titolo sezione",
              "content": "Contenuto della sezione (può contenere più paragrafi separati da \\n\\n)",
              "type": "text" // può essere "text", "list", "quote"
            }
          ],
          "tips": [
            {
              "title": "Consiglio pratico",
              "text": "Descrizione del consiglio"
            }
          ],
          "conclusion": {
            "text": "Paragrafo conclusivo che riassume e invita all'azione"
          }
        }
        
        REGOLE:
        - Intro: deve essere accattivante e catturare l'attenzione
        - Highlights: 3-5 punti chiave dell'articolo in frasi brevi
        - Sections: suddividi il contenuto in 3-6 sezioni logiche con titoli descrittivi
        - Tips: estrai 2-4 consigli pratici se presenti nel testo
        - Conclusion: riassunto che inviti il lettore a visitare o esplorare
        - Mantieni il tono italiano informale ma professionale
        - Se il contenuto non ha abbastanza materiale per una sezione, omettila
        
        Restituisci SOLO il JSON, senza markdown o spiegazioni.
        """
        
        user_prompt = f"""
        Titolo: {title}
        
        Contenuto:
        {content}
        """
        
        try:
            if not settings.OPENAI_API_KEY:
                print("[ArticleStructureService] No OpenAI API key, using basic structure")
                return self._get_basic_structure(content)

            response = await client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            content_response = response.choices[0].message.content
            structured = json.loads(content_response)
            return structured
            
        except Exception as e:
            print(f"[ArticleStructureService] Error: {e}")
            return self._get_basic_structure(content)

    def _get_basic_structure(self, content: str) -> dict:
        """
        Generate simple fallback structure when OpenAI unavailable.
        
        Splits content by paragraph breaks and creates minimal structure
        with single section containing all content.
        
        Args:
            content (str): Full article body text
            
        Returns:
            dict: Basic structure with intro and single content section
            
        Technical Notes:
            - Used when OpenAI API fails or key missing
            - First paragraph becomes intro
            - Remaining paragraphs in single "Contenuto" section
            - No highlights, tips, or conclusion generated
        """
        paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
        
        return {
            "intro": {
                "text": paragraphs[0] if paragraphs else ""
            },
            "highlights": [],
            "sections": [
                {
                    "title": "Contenuto",
                    "content": "\n\n".join(paragraphs[1:]) if len(paragraphs) > 1 else content,
                    "type": "text"
                }
            ],
            "tips": [],
            "conclusion": {
                "text": ""
            }
        }

article_structure_service = ArticleStructureService()
