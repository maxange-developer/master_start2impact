"""
Search Request/Response Pydantic Schemas Module

Validation schemas for AI-powered activity search functionality.

This module defines Pydantic models for:
- Search query validation with language support
- Activity result structure
- Search response with multiple activities
- Off-topic query detection

Key Features:
- Multi-language support (ES, EN, DE, FR)
- Price and duration default value handling
- Query suggestion mode flag
- Off-topic detection response

Technical Notes:
- Validator ensures default price when missing
- Language defaults to Spanish (ES) for Tenerife context
- ActivityResult supports optional fields for flexible API responses
"""

from pydantic import BaseModel, validator
from typing import List, Optional

class SearchRequest(BaseModel):
    """
    AI search query request schema.
    
    Validates user search query with language and suggestion mode options.
    
    Attributes:
        query (str): Natural language search text (e.g., "beaches in Tenerife")
        is_suggestion (bool, optional): Whether to generate related suggestions (default: False)
        language (str, optional): Response language code (default: "es" - Spanish)
        
    Supported Languages:
        - "es": Spanish (default for Tenerife)
        - "en": English
        - "de": German
        - "fr": French
        
    Example:
        {
            "query": "best beaches in Tenerife",
            "is_suggestion": false,
            "language": "en"
        }
    """
    query: str
    is_suggestion: Optional[bool] = False
    language: Optional[str] = "es"  # Default to Spanish

class ActivityResult(BaseModel):
    """
    Single activity search result schema.
    
    Represents one discovered activity/attraction with pricing,
    location, and rating information.
    
    Attributes:
        title (str): Activity name/headline
        description (str): Detailed activity description
        price (str, optional): Price information (default: "Contattare per il prezzo")
        duration (str, optional): Activity duration (default: "Durata variabile")
        rating (str, optional): User rating/score (default: "N/A")
        location (str, optional): Geographic location (default: "Tenerife")
        category (str, optional): Activity type (default: "Attività")
        image_url (str, optional): Activity image URL
        link (str, optional): External booking/info link
        
    Validators:
        - set_default_price: Ensures price defaults to "Contact for price"
        
    Example:
        {
            "title": "Teide National Park Tour",
            "description": "Guided tour of Mount Teide...",
            "price": "€45",
            "duration": "5 hours",
            "rating": "4.8/5",
            "location": "Tenerife North",
            "category": "Nature",
            "image_url": "https://...",
            "link": "https://booking.com/..."
        }
    """
    
    title: str
    description: str
    price: Optional[str] = "Contattare per il prezzo"
    duration: Optional[str] = "Durata variabile"
    rating: Optional[str] = "N/A"
    location: Optional[str] = "Tenerife"
    category: Optional[str] = "Attività"
    image_url: Optional[str] = None
    link: Optional[str] = None
    
    @validator('price', pre=True, always=True)
    def set_default_price(cls, v):
        """
        Ensure price defaults to contact message when missing.
        
        Args:
            v: Price value from API/database
            
        Returns:
            str: Price value or "Contact for price" default
        """
        return v if v else "Contact for price"

class SearchResponse(BaseModel):
    """
    AI search results response schema.
    
    Contains multiple activity results and optional off-topic detection.
    
    Attributes:
        results (List[ActivityResult]): Array of discovered activities (0+ items)
        off_topic (bool, optional): True if query is unrelated to Tenerife (default: False)
        message (str, optional): Informational message (e.g., "No results found")
        
    Example (successful search):
        {
            "results": [
                {"title": "Beach Tour", "description": "...", ...},
                {"title": "Mountain Hike", "description": "...", ...}
            ],
            "off_topic": false,
            "message": null
        }
        
    Example (off-topic query):
        {
            "results": [],
            "off_topic": true,
            "message": "Your query is not related to Tenerife activities"
        }
        
    Technical Notes:
        - Empty results array indicates no matches found
        - off_topic flag triggers UI warning message
        - message field provides user feedback
    """
    results: List[ActivityResult]
    off_topic: Optional[bool] = False
    message: Optional[str] = None
