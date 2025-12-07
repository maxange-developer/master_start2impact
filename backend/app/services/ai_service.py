"""
AI Service Module - OpenAI Integration for Activity Search

This module integrates OpenAI GPT-3.5 for intelligent Tenerife activity search,
combining web search results with AI-powered response generation.

Key Features:
    - Natural language query understanding
    - Multi-language response generation (ES, EN, IT)
    - Tenerife-specific relevance checking
    - Price and rating extraction from search results
    - Activity categorization and structuring
    - Image retrieval for activities
    - Off-topic query detection

Architecture:
    User Query → Relevance Check → Tavily Search → OpenAI Processing → Structured Results

Dependencies:
    - OpenAI API: GPT-3.5-turbo for response generation
    - Tavily API: Web search for real-time activity data
    - SearchService: Image and web search functionality

Technical Notes:
    - Uses JSON mode for structured responses
    - Temperature 0.7 for balanced creativity/accuracy
    - Fallback to mock responses when API unavailable
"""

import json
import httpx
from openai import AsyncOpenAI
from app.core.config import settings
from app.schemas.search import ActivityResult, SearchResponse
from app.services.search_service import search_service

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

class AIService:
    async def process_query(self, user_query: str, is_suggestion: bool = False, language: str = "es") -> SearchResponse:
        """
        Process user search query with AI to return structured activity results.
        
        Workflow:
        1. Check if query is Tenerife-related (skip for suggestions)
        2. Search web for activity data and reviews
        3. Use OpenAI to extract and structure activities
        4. Fetch images for each activity
        5. Return structured SearchResponse
        
        Args:
            user_query (str): Natural language search query (e.g., "beaches in Tenerife")
            is_suggestion (bool, optional): Whether query is a predefined suggestion (default: False)
            language (str, optional): Response language code - "es", "en", "it" (default: "es")
            
        Returns:
            SearchResponse: Structured activities with prices, ratings, images, links
            
        Raises:
            HTTPException: If OpenAI API fails or returns invalid JSON
            
        Example:
            >>> await ai_service.process_query("best beaches", language="en")
            SearchResponse(results=[
                ActivityResult(title="Playa de las Teresitas", price="Free", ...)
            ])
            
        Technical Notes:
            - Automatically enhances suggestion queries with "a Tenerife"
            - Prioritizes real pricing data over invented values
            - Marks public viewpoints/miradors as free
            - Searches both general activities and specific reviews
            - Falls back to mock responses if OpenAI unavailable
        """
        # Language-specific off-topic messages
        off_topic_messages = {
            "es": "Lo siento, pero solo puedo ayudarte con información sobre Tenerife. ¡Intenta buscar actividades, lugares o experiencias para vivir en Tenerife!",
            "en": "Sorry, but I can only help you with information about Tenerife. Try searching for activities, places, or experiences to live in Tenerife!",
            "it": "Mi dispiace, ma posso aiutarti solo con informazioni su Tenerife. Prova a cercare attività, luoghi o esperienze da vivere a Tenerife!"
        }
        
        # If it's a predefined suggestion, ensure "Tenerife" is in the query
        if is_suggestion and "tenerife" not in user_query.lower():
            user_query = f"{user_query} a Tenerife"
            print(f"[AIService] Suggestion query enhanced: '{user_query}'")
        
        # 0. First check if the query is about Tenerife (skip for suggestions)
        if not is_suggestion:
            is_tenerife_related = await self._check_tenerife_relevance(user_query)
            if not is_tenerife_related:
                return SearchResponse(
                    results=[],
                    off_topic=True,
                    message=off_topic_messages.get(language, off_topic_messages["es"])
                )
        
        # 1. Search the web for real data including reviews
        search_context = await search_service.search_web(f"Tenerife activities: {user_query}")
        
        # 2. Search specifically for reviews/ratings
        reviews_context = await search_service.search_web(f"Tenerife {user_query} recensioni Google valutazione stelle rating TripAdvisor")
        
        # Language mappings for AI responses
        language_names = {
            "es": "español (Spanish)",
            "en": "inglese (English)",
            "it": "italiano (Italian)"
        }
        target_language = language_names.get(language, "español (Spanish)")
        
        # 3. Ask OpenAI to structure the data
        system_prompt = f"""
        Sei un assistente di viaggio SUPER esperto per Tenerife, Spagna.
        Il tuo obiettivo è prendere i risultati di ricerca forniti (inclusi testi, snippet, possibili link e recensioni) ed estrarre le migliori attività che corrispondono alla richiesta dell'utente.

        IMPORTANTE: Tutte le risposte (titoli, descrizioni) DEVONO essere scritte in {target_language}.

        DEVI essere il più fedele possibile alle informazioni reali trovate nei risultati di ricerca:
        - Non inventare prezzi o valutazioni.
        - Non inventare dettagli che non compaiono da nessuna parte nel contesto.
        - Se una informazione non è presente, è meglio dire "Dettagli" o "N/A" piuttosto che indovinare.

        Restituisci il risultato SOLO come un oggetto JSON valido con una chiave 'results' contenente una lista di attività.
        Ogni attività DEVE avere questi campi:
        - 'title': string (nome dell'attività in italiano, il più vicino possibile al nome reale trovato)
        - 'description': string (3-4 frasi che descrivono l'attività in italiano, argomentate e basate sui dettagli reali trovati: cosa si fa, per chi è adatta, punti salienti, eventuali note pratiche)
        - 'price': string (es. "€50", "Da €30", "Circa €40", "Gratis", oppure "Contattare per il prezzo"). MAI null.
        - 'duration': string (es. "2 ore", "Mezza giornata", "Tutto il giorno"; se non è chiaro, usa una formula onesta tipo "Durata variabile")
        - 'rating': string (usa SOLO valutazioni reali trovate, es. "4.5/5", "4.5 stelle". Se trovi numeri come "4.8", "4,5 su 5", "4,7 stelle", usali. Se NON trovi alcuna valutazione numerica, usa esattamente "N/A".)
        - 'location': string (es. "Costa Adeje", "Teide", "Santa Cruz"; se non esplicitata, usa una descrizione generica ma coerente dal contesto)
        - 'category': string (es. "Avventura", "Relax", "Cultura", "Acqua", "Natura", "Mirador", "Tramonto")
        - 'image_url': string o null (IMPORTANTE: NON usare immagini. Lascia SEMPRE questo campo a null. Le immagini verranno generate automaticamente dal sistema.)
        - 'link': string o null (URL alla pagina di prenotazione/info se trovata)

        REGOLE SPECIALI PER PREZZI E ATTIVITÀ GRATUITE:
        - Se dai risultati emerge che si tratta di un mirador, viewpoint, belvedere, punto panoramico, spiaggia, percorso semplice per vedere il tramonto, o in generale un luogo pubblico, allora considera l'attività come GRATUITA a meno che NON sia chiaramente indicato un biglietto o tour a pagamento.
        - In questi casi, imposta 'price' = "Gratis" (Spanish: "Gratis", English: "Free", Italian: "Gratis").
        - Non assegnare mai un prezzo inventato a un semplice mirador o punto panoramico pubblico.

        - Se nei risultati trovi un prezzo CHIARO (es. "from €30", "€40 per person", "adult 38€"), usa quel valore adattandolo alla lingua target, ad esempio:
          - Spanish: "Desde €30", "Unos €40", "Unos 38€ por persona"
          - English: "From €30", "About €40", "About €38 per person"
          - Italian: "Da €30", "Circa €40", "Circa 38€ a persona"
        - Se trovi più prezzi leggermente diversi, scegli uno rappresentativo e non inventare numeri nuovi.
        - Se non trovi nessun prezzo o è troppo confuso, usa:
          - "Gratis"/"Free"/"Gratis" se è chiaramente un luogo pubblico.
          - Altrimenti "Detalles"/"Details"/"Dettagli" (a seconda della lingua).

        REGOLE PER IL RATING:
        - Cerca attentamente nei risultati di ricerca numeri che indicano valutazioni (es. "4.8 su Google", "valutazione 4.5", "4,7 stelle", "rating 4.6/5", "4.7 based on 1,200 reviews", etc.).
        - Usa SOLO numeri che trovi nel testo o nei contesti mostrati.
        - Formato consigliato: "4.5/5" oppure "4.5 stelle".
        - Se trovi più valutazioni, scegline una rappresentativa (preferibilmente Google o TripAdvisor).
        - Se NON trovi alcun numero di valutazione, usa esattamente "N/A" e NON inventare.

        REGOLE PER LA DESCRIZIONE:
        - Scrivi 3-4 frasi nella lingua target ({target_language}), non marketing vuoto ma descrizione concreta.
        - Usa i dettagli reali trovati: cosa si fa, tipo di esperienza (tour organizzato, escursione, semplice luogo panoramico), se è adatta a famiglie, se è impegnativa, cosa si vede (es. Teide, oceano, delfini, tramonto, città), eventuali highlight.
        - Se è un mirador o un semplice spot per il tramonto, specifica chiaramente che è un luogo pubblico, normalmente gratuito, ideale per vedere il tramonto o il panorama.
        - Non inventare servizi extra (es. transfer, cena, ecc.) se non sono menzionati da nessuna parte.

        Restituisci 10 attività rilevanti. Non includere formattazione markdown o spiegazioni, SOLO il JSON.
        """
        
        user_prompt = f"""
        Richiesta Utente: {user_query}
        
        Risultati Ricerca Attività:
        {search_context}
        
        Risultati Ricerca Recensioni e Valutazioni:
        {reviews_context}
        """
        
        try:
            print(f"[AIService] OpenAI API Key configured: {bool(settings.OPENAI_API_KEY)}")
            
            if not settings.OPENAI_API_KEY:
                print("[AIService] No OpenAI API key, using mock response")
                return self._get_mock_response()

            response = await client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            print(f"[AIService] Got response from OpenAI")
            data = json.loads(content)
            
            # Add images to results by searching online for each activity
            if data.get("results"):
                for result in data["results"]:
                    # Search for a relevant image online for this specific activity
                    image_url = await search_service.search_image_for_activity(
                        title=result.get("title", ""),
                        description=result.get("description", ""),
                        location=result.get("location", "")
                    )
                    
                    # If no online image found, fallback to local images
                    if not image_url:
                        image_url = await self._get_smart_local_image(result)
                    
                    result["image_url"] = image_url
            
            return SearchResponse(**data)
            
        except Exception as e:
            print(f"[AIService] AI Error: {e}")
            return self._get_mock_response()

    async def _check_tenerife_relevance(self, query: str) -> bool:
        """Check if the user query is related to Tenerife"""
        try:
            if not settings.OPENAI_API_KEY:
                # If no API key, assume it's related to be permissive
                return True
            
            validation_prompt = f"""
            Analizza la seguente richiesta dell'utente e determina se è correlata a Tenerife (Spagna) o se sta cercando informazioni su altre destinazioni, città o paesi.
            
            Richiesta: "{query}"
            
            Rispondi SOLO con un oggetto JSON nel formato: {{"is_tenerife_related": true}} o {{"is_tenerife_related": false}}
            
            Considera "is_tenerife_related": true se:
            - La richiesta menziona esplicitamente Tenerife o Isole Canarie
            - La richiesta è generica su attività/luoghi turistici senza specificare una destinazione (es. "spiagge", "escursioni", "ristoranti") - in questo caso assumiamo che l'utente cerchi a Tenerife
            - La richiesta è vaga ma potrebbe riferirsi a Tenerife nel contesto di un'app dedicata a Tenerife
            
            Considera "is_tenerife_related": false se:
            - La richiesta menziona esplicitamente altre città, regioni o paesi (es. "Madrid", "Barcellona", "Roma", "Parigi", "New York", ecc.)
            - La richiesta è chiaramente su una destinazione diversa da Tenerife
            """
            
            response = await client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": validation_prompt}],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            is_related = result.get("is_tenerife_related", True)
            print(f"[AIService] Query relevance check: '{query}' -> {is_related}")
            return is_related
            
        except Exception as e:
            print(f"[AIService] Error checking relevance: {e}")
            # In case of error, be permissive and allow the query
            return True
    
    async def _get_smart_local_image(self, activity: dict) -> str:
        """Use AI to intelligently match activity to best available local image"""
        
        # List of available image categories from filesystem
        available_categories = [
            "adeje", "anaga", "carneval", "dolphins", "eat", "elhierro", 
            "garachico", "gomera", "hiking", "kidsactivity", "la-laguna", 
            "lapalma", "loro-parque", "masca-valley", "mtb", "parapendio", 
            "playa", "puerto", "quad", "santacruz", "siam-park", "teide", 
            "villa", "vitigni"
        ]
        
        try:
            if not settings.OPENAI_API_KEY:
                return self._get_local_image(activity.get("title", ""), activity.get("category", ""), activity.get("location", ""))
            
            matching_prompt = f"""
            Analizza questa attività a Tenerife e scegli la categoria di immagine più appropriata dalla lista disponibile.
            
            ATTIVITÀ:
            Titolo: {activity.get('title', '')}
            Descrizione: {activity.get('description', '')}
            Categoria: {activity.get('category', '')}
            Località: {activity.get('location', '')}
            
            CATEGORIE IMMAGINI DISPONIBILI:
            {', '.join(available_categories)}
            
            DESCRIZIONE CATEGORIE:
            - adeje: zona Costa Adeje, resort, spiagge sud
            - anaga: Parco Rurale Anaga, foreste, montagne verdi, hiking
            - carneval: carnevale di Santa Cruz, feste, eventi culturali
            - dolphins: avvistamento cetacei, balene, delfini, tour in barca
            - eat: ristoranti, cibo, gastronomia locale
            - elhierro: isola El Hierro (isole Canarie)
            - garachico: cittadina storica, piscine naturali
            - gomera: isola La Gomera (isole Canarie)
            - hiking: escursioni, trekking, camminate, sentieri
            - kidsactivity: attività per bambini, famiglie
            - la-laguna: città di La Laguna, cultura, architettura
            - lapalma: isola La Palma (isole Canarie)
            - loro-parque: zoo, pappagalli, animali, famiglia
            - masca-valley: Valle di Masca, canyon, escursioni panoramiche
            - mtb: mountain bike, ciclismo
            - parapendio: parapendio, volo, sport aerei
            - playa: spiagge, mare, sabbia, relax
            - puerto: porti, marina, barche
            - quad: quad, fuoristrada, avventura motori
            - santacruz: capitale Santa Cruz, città, shopping, cultura
            - siam-park: parco acquatico Siam Park
            - teide: Vulcano Teide, Parco Nazionale, stelle, montagna
            - villa: alloggi, hotel, ville, accommodation
            - vitigni: vino, vigneti, degustazioni
            
            REGOLE:
            1. Scegli la categoria che meglio rappresenta l'attività principale
            2. Se l'attività menziona un luogo specifico (es. Teide, Anaga, Masca), privilegia quella categoria
            3. Se menziona un'attività specifica (es. delfini, parapendio, Siam Park), usa quella categoria
            4. Per attività generiche, usa la categoria che meglio si allinea con la descrizione
            5. Rispondi SOLO con il nome della categoria scelto, niente altro
            
            Categoria scelta:
            """
            
            response = await client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": matching_prompt}],
                temperature=0.2,
                max_tokens=20
            )
            
            selected_category = response.choices[0].message.content.strip().lower()
            
            # Validate that the response is in our available categories
            if selected_category not in available_categories:
                print(f"[AIService] AI selected invalid category '{selected_category}', using fallback")
                return self._get_local_image(activity.get("title", ""), activity.get("category", ""), activity.get("location", ""))
            
            # Get random image from selected category
            import random
            from pathlib import Path
            
            blog_images_path = Path(__file__).resolve().parent.parent.parent.parent / "frontend" / "public" / "images" / "blog"
            
            matching_images = []
            if blog_images_path.exists():
                for file in blog_images_path.iterdir():
                    if file.is_file() and file.suffix.lower() in ['.webp', '.jpg', '.jpeg', '.avif', '.png']:
                        if file.stem.startswith(selected_category):
                            matching_images.append(file.name)
            
            if matching_images:
                selected_image = random.choice(matching_images)
                image_path = f"/images/blog/{selected_image}"
                print(f"[AIService] AI-matched '{activity.get('title')}' to category '{selected_category}' -> {image_path}")
                return image_path
            else:
                print(f"[AIService] No images found for category '{selected_category}', using fallback")
                return self._get_local_image(activity.get("title", ""), activity.get("category", ""), activity.get("location", ""))
                
        except Exception as e:
            print(f"[AIService] Error in smart image matching: {e}")
            return self._get_local_image(activity.get("title", ""), activity.get("category", ""), activity.get("location", ""))

    def _get_local_image(self, title: str, category: str, location: str) -> str:
        """Get a relevant image from local blog images based on activity keywords"""
        import random
        import os
        from pathlib import Path
        
        # Get the actual list of images from the filesystem
        blog_images_path = Path(__file__).resolve().parent.parent.parent.parent / "frontend" / "public" / "images" / "blog"
        
        # Scan directory and group images by prefix
        available_images = {}
        try:
            if blog_images_path.exists():
                for file in blog_images_path.iterdir():
                    if file.is_file() and file.suffix.lower() in ['.webp', '.jpg', '.jpeg', '.avif', '.png']:
                        # Extract prefix (everything before the last dash and number)
                        name = file.stem  # filename without extension
                        # Handle cases like "masca-valley", "la-laguna", etc.
                        if '-' in name and name.split('-')[-1].isdigit():
                            prefix = '-'.join(name.split('-')[:-1])
                            if prefix not in available_images:
                                available_images[prefix] = []
                            available_images[prefix].append(file.name)
                        else:
                            # Single image without number (e.g., masca-valley.jpg)
                            if name not in available_images:
                                available_images[name] = []
                            available_images[name].append(file.name)
                
                print(f"[AIService] Scanned {len(available_images)} image prefixes from filesystem")
            else:
                print(f"[AIService] Blog images path not found: {blog_images_path}")
        except Exception as e:
            print(f"[AIService] Error scanning blog images: {e}")
        
        # Fallback if directory scan fails
        if not available_images:
            print("[AIService] Using fallback image list")
            available_images = {
                "playa": ["playa-1.jpg"], "teide": ["teide-1.jpg"], 
                "anaga": ["anaga-1.webp"], "dolphins": ["dolphins-1.jpg"]
            }
        
        # Define mapping of keywords to image prefixes
        keyword_mappings = {
            # Locations
            "teide": ["teide"],
            "anaga": ["anaga"],
            "masca": ["masca-valley", "masca"],
            "adeje": ["adeje"],
            "garachico": ["garachico"],
            "santa cruz": ["santacruz"],
            "puerto": ["puerto"],
            "la laguna": ["la-laguna"],
            "la palma": ["lapalma"],
            "la gomera": ["gomera"],
            "el hierro": ["elhierro"],
            
            # Activities
            "whale": ["dolphins"],
            "dolphin": ["dolphins"],
            "delfin": ["dolphins"],
            "balena": ["dolphins"],
            "osservazione": ["dolphins"],
            "avvistamento": ["dolphins"],
            "siam": ["siam-park"],
            "parco acquatico": ["siam-park"],
            "water park": ["siam-park"],
            "loro parque": ["loro-parque"],
            "pappagallo": ["loro-parque"],
            "zoo": ["loro-parque"],
            "parapendio": ["parapendio"],
            "paragliding": ["parapendio"],
            "quad": ["quad"],
            "mtb": ["mtb"],
            "mountain bike": ["mtb"],
            "bici": ["mtb"],
            "escursion": ["hiking", "anaga", "teide"],
            "trekking": ["hiking", "anaga"],
            "hiking": ["hiking", "anaga"],
            "cammino": ["hiking", "anaga"],
            
            # Food & Culture
            "ristorante": ["eat"],
            "cibo": ["eat"],
            "cucina": ["eat"],
            "food": ["eat"],
            "gastronomia": ["eat"],
            "vino": ["vitigni"],
            "wine": ["vitigni"],
            "vigna": ["vitigni"],
            "carneval": ["carneval"],
            "carnevale": ["carneval"],
            "festa": ["carneval"],
            
            # Beach & Water
            "spiaggia": ["playa"],
            "beach": ["playa"],
            "playa": ["playa"],
            "mare": ["playa", "dolphins"],
            "ocean": ["playa", "dolphins"],
            
            # Family & Kids
            "bambini": ["kidsactivity", "loro-parque", "siam-park"],
            "famiglia": ["kidsactivity", "loro-parque", "siam-park"],
            "kids": ["kidsactivity", "loro-parque", "siam-park"],
            "children": ["kidsactivity", "loro-parque", "siam-park"],
            
            # Accommodation
            "hotel": ["villa"],
            "alloggio": ["villa"],
            "villa": ["villa"],
            "accommodation": ["villa"],
        }
        
        # Normalize search text (combine title, category, location)
        search_text = f"{title} {category} {location}".lower()
        
        # Find matching image prefixes
        matched_prefixes = []
        
        # First, try direct keyword matching
        for keyword, prefixes in keyword_mappings.items():
            if keyword in search_text:
                # Only add prefixes that actually exist in the filesystem
                matched_prefixes.extend([p for p in prefixes if p in available_images])
        
        # If no match from keywords, try fuzzy matching with available prefixes
        if not matched_prefixes:
            # Extract words from search text
            search_words = set(search_text.lower().split())
            for prefix in available_images.keys():
                # Check if any word in search matches prefix or vice versa
                prefix_words = set(prefix.replace('-', ' ').split())
                if search_words & prefix_words:  # Set intersection
                    matched_prefixes.append(prefix)
        
        # Remove duplicates while preserving order
        matched_prefixes = list(dict.fromkeys(matched_prefixes))
        
        # If no match, use category-based fallback
        if not matched_prefixes:
            category_fallbacks = {
                "avventura": ["hiking", "parapendio", "quad"],
                "natura": ["anaga", "teide", "hiking"],
                "acqua": ["playa", "dolphins", "siam-park"],
                "mare": ["playa", "dolphins"],
                "cultura": ["santacruz", "la-laguna", "carneval"],
                "relax": ["playa", "villa"],
                "divertimento": ["siam-park", "loro-parque", "kidsactivity"],
                "mirador": ["teide", "anaga"],
                "tramonto": ["teide", "playa", "anaga"],
            }
            fallback_prefixes = category_fallbacks.get(category.lower(), ["playa"])
            # Filter to only existing prefixes
            matched_prefixes = [p for p in fallback_prefixes if p in available_images]
        
        # Final fallback: use any available prefix
        if not matched_prefixes:
            matched_prefixes = list(available_images.keys())
        
        # Select a random prefix from matches
        selected_prefix = random.choice(matched_prefixes) if matched_prefixes else "playa"
        
        # Get a random image from the selected prefix
        if selected_prefix in available_images and available_images[selected_prefix]:
            # Use instance variable to track used images per prefix for variety
            if not hasattr(self, '_image_indices'):
                self._image_indices = {}
            
            if selected_prefix not in self._image_indices:
                self._image_indices[selected_prefix] = available_images[selected_prefix].copy()
                random.shuffle(self._image_indices[selected_prefix])
            
            # Get next image (cycle through if exhausted)
            if not self._image_indices[selected_prefix]:
                self._image_indices[selected_prefix] = available_images[selected_prefix].copy()
                random.shuffle(self._image_indices[selected_prefix])
            
            selected_image = self._image_indices[selected_prefix].pop(0)
            image_path = f"/images/blog/{selected_image}"
        else:
            # Ultimate fallback
            image_path = "/images/blog/playa-1.jpg"
        
        print(f"[AIService] Selected local image for '{title}': {image_path}")
        return image_path
    
    async def _get_unsplash_image(self, title: str, category: str) -> str:
        """Get a relevant image from Unsplash based on activity title and category"""
        try:
            if not settings.UNSPLASH_ACCESS_KEY:
                print("[AIService] No Unsplash API key configured")
                return None
            
            # Create search query combining title keywords and "Tenerife"
            # Extract key terms from title (remove common words)
            common_words = {"tour", "di", "della", "del", "delle", "dei", "a", "con", "per", "il", "la", "i", "le", "uno", "una"}
            keywords = [word for word in title.lower().split() if word not in common_words]
            
            # Build search query: prioritize Tenerife + category, fallback to just category
            search_queries = [
                f"Tenerife {category}",
                f"Tenerife {' '.join(keywords[:2])}" if keywords else f"Tenerife {category}",
                category
            ]
            
            async with httpx.AsyncClient() as client:
                for query in search_queries:
                    try:
                        response = await client.get(
                            "https://api.unsplash.com/search/photos",
                            params={
                                "query": query,
                                "per_page": 1,
                                "orientation": "landscape"
                            },
                            headers={"Authorization": f"Client-ID {settings.UNSPLASH_ACCESS_KEY}"},
                            timeout=5.0
                        )
                        
                        if response.status_code == 200:
                            data = response.json()
                            if data.get("results") and len(data["results"]) > 0:
                                image_url = data["results"][0]["urls"]["regular"]
                                print(f"[AIService] Found Unsplash image for '{title}' using query '{query}'")
                                return image_url
                    except Exception as e:
                        print(f"[AIService] Unsplash query '{query}' failed: {e}")
                        continue
                
                print(f"[AIService] No Unsplash image found for '{title}'")
                return None
                
        except Exception as e:
            print(f"[AIService] Error getting Unsplash image: {e}")
            return None
    
    def _get_mock_response(self) -> SearchResponse:
        return SearchResponse(results=[
            ActivityResult(
                title="Osservazione delle Stelle sul Teide (Demo)",
                description="Vivi l'esperienza del cielo notturno dal Parco Nazionale del Teide, uno dei migliori luoghi al mondo per l'osservazione delle stelle.",
                price="€55",
                duration="4 ore",
                rating="4.8/5",
                location="Parco Nazionale del Teide",
                category="Natura",
                link=None,
                image_url=None
            ),
            ActivityResult(
                title="Tour di Avvistamento Balene (Demo)",
                description="Osserva delfini e balene su un catamarano di lusso lungo la costa di Tenerife.",
                price="€40",
                duration="3 ore",
                rating="4.7/5",
                location="Costa Adeje",
                category="Mare",
                link=None,
                image_url=None
            ),
            ActivityResult(
                title="Siam Park (Demo)",
                description="Visita il parco acquatico famoso in tutto il mondo con scivoli emozionanti e attrazioni per tutte le età.",
                price="€38",
                duration="Tutto il giorno",
                rating="4.9/5",
                location="Costa Adeje",
                category="Divertimento",
                link=None,
                image_url=None
            )
        ])

ai_service = AIService()
