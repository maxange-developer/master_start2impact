"""
AI-Powered Search Endpoint Module

This module implements intelligent activity search functionality using AI services
including Tavily web search and OpenAI for query understanding and response generation.

Key Features:
    - Natural language query processing
    - AI-powered web search via Tavily API
    - Multi-language support (ES, EN, DE, FR)
    - Query suggestion generation
    - Real-time activity discovery
    - Personalized search results

Architecture:
    User Query → AI Service → Tavily Search → OpenAI Processing → Structured Results
"""

from typing import Any
from fastapi import APIRouter, Depends
from app.api import deps
from app.schemas.search import SearchRequest, SearchResponse
from app.services.ai_service import ai_service
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=SearchResponse)
async def search_activities(
    request: SearchRequest,
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    AI-powered search endpoint for discovering Tenerife activities.
    
    Processes natural language queries using AI to search the web
    and return relevant activities, attractions, and recommendations.
    Supports multiple languages and generates intelligent suggestions.
    
    Args:
        request (SearchRequest): Contains query text, language, and suggestion flag
        current_user (User): Authenticated user making the request
        
    Returns:
        SearchResponse: Structured search results with activities and suggestions
        
    Raises:
        HTTPException 401: User not authenticated
        HTTPException 500: AI service error or API failure
        
    Example:
        POST /api/v1/search/
        Headers: Authorization: Bearer <token>
        Body: {
            "query": "beaches in Tenerife",
            "language": "en",
            "is_suggestion": false
        }
        Response: {
            "results": [...activities...],
            "suggestions": [...related queries...]
        }
    """
    return await ai_service.process_query(request.query, request.is_suggestion, request.language)
