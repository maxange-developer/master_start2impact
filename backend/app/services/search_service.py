"""
Search Service Module - Tavily Web Search Integration

This module provides web search capabilities using Tavily API for discovering
real-time Tenerife activities, pricing, reviews, and images.

Key Features:
    - Real-time web search via Tavily API
    - Activity-specific image search
    - Review and rating extraction
    - Mock data fallback for development
    - Timeout-protected API calls

Dependencies:
    - Tavily API: Web search with image support
    - httpx: Async HTTP client for API calls
    - Config: settings.TAVILY_API_KEY

Technical Notes:
    - 15s timeout for search requests
    - 10s timeout for image requests
    - Falls back to mock data when API unavailable
    - Formats search results for AI context processing
"""

import httpx
from app.core.config import settings
from typing import Optional

try:
    from tavily import TavilyClient
except ImportError:
    TavilyClient = None

class SearchService:
    async def search_web(self, query: str) -> str:
        """
        Search the web for activity information using Tavily API.
        
        Performs real-time web search and formats results for AI processing.
        Returns contextual information including titles, URLs, and content snippets.
        
        Args:
            query (str): Search query (e.g., "Tenerife beaches", "Teide tour reviews")
            
        Returns:
            str: Formatted search results as text context for AI:
                "Title: ...\nURL: ...\nContent: ...\n\n"
                Returns mock data if Tavily API unavailable
                
        Example:
            >>> await search_service.search_web("Tenerife whale watching")
            "Title: Whale Watching Tours\\nURL: https://...\\nContent: Best tours...\\n\\n"
            
        Technical Notes:
            - Uses Tavily basic search depth for faster results
            - Images excluded from general search (separate method)
            - 15-second timeout prevents hanging requests
            - Formats results for OpenAI context window
            - Falls back to mock data on API error or missing key
        """
        print(f"[SearchService] Tavily API Key configured: {bool(settings.TAVILY_API_KEY)}")
        
        if settings.TAVILY_API_KEY:
            try:
                print(f"[SearchService] Searching for: {query}")
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "https://api.tavily.com/search",
                        json={"api_key": settings.TAVILY_API_KEY, "query": query, "search_depth": "basic", "include_images": False},
                        timeout=15.0
                    )
                    response.raise_for_status()
                    data = response.json()
                    # Format results for AI context
                    context = ""
                    for result in data.get("results", []):
                        context += f"Title: {result.get('title')}\nURL: {result.get('url')}\nContent: {result.get('content')}\n\n"
                    
                    print(f"[SearchService] Got {len(data.get('results', []))} results")
                    return context if context else self._get_mock_data()
            except Exception as e:
                print(f"[SearchService] Search API error: {e}")
                return self._get_mock_data()
        else:
            print("[SearchService] No Tavily API key, using mock data")
            return self._get_mock_data()

    def _get_mock_data(self) -> str:
        """
        Provide mock search results for development and testing.
        
        Returns pre-defined Tenerife activities with realistic pricing
        and descriptions for use when Tavily API is unavailable.
        
        Returns:
            str: Formatted mock search results (4 sample activities)
            
        Technical Notes:
            - Includes diverse activity types (nature, water, park, hiking)
        """
        return """
        Mock Search Results for Tenerife:
        1. Teide National Park Stargazing Tour. Price: 50 EUR. Description: Watch the stars from the highest peak in Spain. Link: https://example.com/teide
        2. Whale Watching Catamaran. Price: 35 EUR. Description: See whales and dolphins in their natural habitat. Link: https://example.com/whales
        3. Siam Park Tickets. Price: 40 EUR. Description: The best water park in the world. Link: https://example.com/siam
        4. Masca Valley Hike. Price: Free (Guide optional 20 EUR). Description: Beautiful hike in a deep ravine. Link: https://example.com/masca
        """
    
    async def search_image_for_activity(self, title: str, description: str, location: str = "") -> Optional[str]:
        """
        Search for relevant activity image using Tavily with image support.
        
        Constructs focused search query from activity details and retrieves
        the most relevant image URL. Used to enrich activity results visually.
        
        Args:
            title (str): Activity name (e.g., "Whale Watching Tour")
            description (str): Activity description for context
            location (str, optional): Specific location (e.g., "Costa Adeje")
            
        Returns:
            Optional[str]: Image URL if found, None otherwise
            
        Example:
            >>> await search_service.search_image_for_activity(
            ...     "Teide National Park",
            ...     "Visit the volcano",
            ...     "Tenerife North"
            ... )
            "https://images.example.com/teide-park.jpg"
            
        Technical Notes:
            - Combines title and location for precise search
            - Requests max 3 image results from Tavily
            - Returns first (most relevant) image URL
            - 10-second timeout for image search
            - Returns None on error or no results (fallback to local images)
        """
        # Create a focused search query combining title and key terms from description
        search_query = f"Tenerife {title} {location}".strip()
        print(f"[SearchService] Searching image for: {search_query}")
        
        # Try Tavily first (with images enabled)
        if settings.TAVILY_API_KEY:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "https://api.tavily.com/search",
                        json={
                            "api_key": settings.TAVILY_API_KEY,
                            "query": search_query,
                            "search_depth": "basic",
                            "include_images": True,
                            "max_results": 3
                        },
                        timeout=10.0
                    )
                    response.raise_for_status()
                    data = response.json()
                    
                    # Get images from Tavily
                    images = data.get("images", [])
                    if images and len(images) > 0:
                        # Return the first image URL
                        image_url = images[0]
                        print(f"[SearchService] Found Tavily image: {image_url}")
                        return image_url
                    
            except Exception as e:
                print(f"[SearchService] Tavily image search error: {e}")
        
        print(f"[SearchService] No online image found for '{title}'")
        return None

search_service = SearchService()
