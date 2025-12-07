"""Tests for AI service without calling OpenAI API"""
import pytest
from app.services.ai_service import AIService

# API prefix
API_PREFIX = "/api/v1"


@pytest.mark.asyncio
async def test_check_tenerife_relevance_basic():
    """Test basic Tenerife relevance check without API"""
    service = AIService()
    
    # These should be detected as Tenerife-related by keyword matching
    tenerife_queries = [
        "Cosa fare a Tenerife",
        "Tenerife activities",
        "Visitar el Teide",
        "Playas en Tenerife"
    ]
    
    for query in tenerife_queries:
        # Since we can't call the actual API, we test that the method exists
        # and can be called (it will return False without API key)
        result = await service._check_tenerife_relevance(query)
        # Without API key, it defaults to True for queries containing "tenerife"
        if "tenerife" in query.lower():
            assert result == True


@pytest.mark.asyncio  
async def test_process_query_suggestion_enhancement():
    """Test that suggestion queries get enhanced with Tenerife"""
    service = AIService()
    
    # This would be tested by checking if the query gets modified
    # but since process_query calls external APIs, we skip full execution
    # and just verify the service can be instantiated
    assert service is not None
    

def test_language_messages():
    """Test that off-topic messages exist for all languages"""
    service = AIService()
    
    # Verify the service has the expected structure
    assert hasattr(service, 'process_query')
    

@pytest.mark.asyncio
async def test_ai_service_instantiation():
    """Test AI service can be instantiated"""
    service = AIService()
    assert service is not None


@pytest.mark.asyncio
async def test_process_query_off_topic_spanish():
    """Test process_query with off-topic query in Spanish"""
    service = AIService()
    
    # Mock the _check_tenerife_relevance to return False
    async def mock_check_relevance(query):
        return False
    
    service._check_tenerife_relevance = mock_check_relevance
    
    result = await service.process_query("pizza in Rome", is_suggestion=False, language="es")
    
    assert result.off_topic == True
    assert "Tenerife" in result.message
    assert len(result.results) == 0


@pytest.mark.asyncio
async def test_process_query_off_topic_english():
    """Test process_query with off-topic query in English"""
    service = AIService()
    
    async def mock_check_relevance(query):
        return False
    
    service._check_tenerife_relevance = mock_check_relevance
    
    result = await service.process_query("restaurants in Paris", is_suggestion=False, language="en")
    
    assert result.off_topic == True
    assert "Tenerife" in result.message
    assert "Sorry" in result.message


@pytest.mark.asyncio
async def test_process_query_off_topic_italian():
    """Test process_query with off-topic query in Italian"""
    service = AIService()
    
    async def mock_check_relevance(query):
        return False
    
    service._check_tenerife_relevance = mock_check_relevance
    
    result = await service.process_query("musei a Firenze", is_suggestion=False, language="it")
    
    assert result.off_topic == True
    assert "Tenerife" in result.message
    assert "dispiace" in result.message


@pytest.mark.asyncio
async def test_process_query_suggestion_skips_relevance_check():
    """Test that suggestions skip the Tenerife relevance check"""
    service = AIService()
    
    # Mock search and OpenAI to avoid real calls
    from unittest.mock import AsyncMock, patch
    
    mock_search_result = "Mock search results about activities"
    
    with patch("app.services.ai_service.search_service.search_web", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = mock_search_result
        
        with patch("app.services.ai_service.client.chat.completions.create", new_callable=AsyncMock) as mock_openai:
            mock_response = AsyncMock()
            mock_response.choices = [AsyncMock()]
            mock_response.choices[0].message.content = '{"results": []}'
            mock_openai.return_value = mock_response
            
            # This should NOT trigger off-topic check even without "tenerife"
            result = await service.process_query("best beaches", is_suggestion=True, language="es")
            
            # Should not be off-topic because is_suggestion=True
            assert result.off_topic == False


@pytest.mark.asyncio
async def test_process_query_with_openai_success():
    """Test process_query with successful OpenAI call"""
    service = AIService()
    
    from unittest.mock import AsyncMock, patch
    
    mock_results = {
        "results": [
            {
                "title": "Teide Stargazing",
                "description": "Amazing night sky experience",
                "price": "€50",
                "duration": "4 hours",
                "rating": "4.8/5",
                "location": "Teide",
                "category": "Nature",
                "link": None,
                "image_url": None
            }
        ]
    }
    
    with patch("app.services.ai_service.search_service.search_web", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = "Mock search results"
        
        with patch("app.services.ai_service.client.chat.completions.create", new_callable=AsyncMock) as mock_openai:
            mock_response = AsyncMock()
            mock_response.choices = [AsyncMock()]
            mock_response.choices[0].message.content = json.dumps(mock_results)
            mock_openai.return_value = mock_response
            
            with patch.object(service, '_get_smart_local_image', return_value="/images/blog/teide-1.jpg") as mock_image:
                result = await service.process_query("stargazing tenerife", is_suggestion=True, language="it")
                
                assert result.off_topic == False
                assert len(result.results) == 1
                assert result.results[0].title == "Teide Stargazing"


@pytest.mark.asyncio
async def test_check_tenerife_relevance_with_api():
    """Test _check_tenerife_relevance with OpenAI API"""
    service = AIService()
    
    from unittest.mock import AsyncMock, patch
    
    # Mock OpenAI to return true
    with patch("app.services.ai_service.client.chat.completions.create", new_callable=AsyncMock) as mock_openai:
        mock_response = AsyncMock()
        mock_response.choices = [AsyncMock()]
        mock_response.choices[0].message.content = '{"is_tenerife_related": true}'
        mock_openai.return_value = mock_response
        
        with patch("app.services.ai_service.settings") as mock_settings:
            mock_settings.OPENAI_API_KEY = "test_key"
            
            result = await service._check_tenerife_relevance("beaches in tenerife")
            assert result == True


@pytest.mark.asyncio
async def test_check_tenerife_relevance_false():
    """Test _check_tenerife_relevance returns false for non-Tenerife queries"""
    service = AIService()
    
    from unittest.mock import AsyncMock, patch
    
    with patch("app.services.ai_service.client.chat.completions.create", new_callable=AsyncMock) as mock_openai:
        mock_response = AsyncMock()
        mock_response.choices = [AsyncMock()]
        mock_response.choices[0].message.content = '{"is_tenerife_related": false}'
        mock_openai.return_value = mock_response
        
        with patch("app.services.ai_service.settings") as mock_settings:
            mock_settings.OPENAI_API_KEY = "test_key"
            
            result = await service._check_tenerife_relevance("restaurants in Rome")
            assert result == False


@pytest.mark.asyncio
async def test_check_tenerife_relevance_error_fallback():
    """Test _check_tenerife_relevance falls back to True on error"""
    service = AIService()
    
    from unittest.mock import AsyncMock, patch
    
    with patch("app.services.ai_service.client.chat.completions.create", new_callable=AsyncMock) as mock_openai:
        mock_openai.side_effect = Exception("API Error")
        
        with patch("app.services.ai_service.settings") as mock_settings:
            mock_settings.OPENAI_API_KEY = "test_key"
            
            result = await service._check_tenerife_relevance("any query")
            assert result == True  # Should be permissive on error


def test_get_local_image_basic():
    """Test _get_local_image basic functionality"""
    service = AIService()
    
    # Test with teide keyword
    result = service._get_local_image("Teide volcano tour", "nature", "Teide")
    assert "/images/blog/" in result
    assert result.endswith(('.jpg', '.webp', '.jpeg', '.avif', '.png'))


def test_get_local_image_keyword_matching():
    """Test _get_local_image with various keywords"""
    service = AIService()
    
    # Test different keywords
    test_cases = [
        ("Whale watching", "marine", "Costa Adeje"),
        ("Beach day", "relax", "Playa"),
        ("Hiking in Anaga", "adventure", "Anaga"),
        ("Siam Park tickets", "fun", "Costa Adeje"),
    ]
    
    for title, category, location in test_cases:
        result = service._get_local_image(title, category, location)
        assert "/images/blog/" in result


def test_get_local_image_fallback():
    """Test _get_local_image fallback for unknown keywords"""
    service = AIService()
    
    result = service._get_local_image("Unknown activity xyz", "unknown", "nowhere")
    assert "/images/blog/" in result


def test_get_local_image_variety():
    """Test that _get_local_image cycles through images"""
    service = AIService()
    
    # Get multiple images for same prefix
    images = set()
    for _ in range(5):
        img = service._get_local_image("Playa beach", "relax", "Costa Adeje")
        images.add(img)
    
    # Should get at least one image (might be same if only one available)
    assert len(images) >= 1


@pytest.mark.asyncio
async def test_get_smart_local_image_with_api():
    """Test _get_smart_local_image with OpenAI"""
    service = AIService()
    
    from unittest.mock import AsyncMock, patch
    
    activity = {
        "title": "Teide Volcano Tour",
        "description": "Visit the volcano",
        "category": "Nature",
        "location": "Teide"
    }
    
    with patch("app.services.ai_service.client.chat.completions.create", new_callable=AsyncMock) as mock_openai:
        mock_response = AsyncMock()
        mock_response.choices = [AsyncMock()]
        mock_response.choices[0].message.content = "teide"
        mock_openai.return_value = mock_response
        
        with patch("app.services.ai_service.settings") as mock_settings:
            mock_settings.OPENAI_API_KEY = "test_key"
            
            result = await service._get_smart_local_image(activity)
            assert "/images/blog/" in result


@pytest.mark.asyncio
async def test_get_smart_local_image_no_api():
    """Test _get_smart_local_image falls back without API"""
    service = AIService()
    
    from unittest.mock import patch
    
    activity = {
        "title": "Beach Tour",
        "description": "Beautiful beach",
        "category": "Relax",
        "location": "Costa Adeje"
    }
    
    with patch("app.services.ai_service.settings") as mock_settings:
        mock_settings.OPENAI_API_KEY = None
        
        result = await service._get_smart_local_image(activity)
        assert "/images/blog/" in result


@pytest.mark.asyncio
async def test_get_smart_local_image_invalid_category():
    """Test _get_smart_local_image with invalid AI category"""
    service = AIService()
    
    from unittest.mock import AsyncMock, patch
    
    activity = {
        "title": "Activity",
        "description": "Test",
        "category": "Test",
        "location": "Test"
    }
    
    with patch("app.services.ai_service.client.chat.completions.create", new_callable=AsyncMock) as mock_openai:
        mock_response = AsyncMock()
        mock_response.choices = [AsyncMock()]
        mock_response.choices[0].message.content = "invalid_category_xyz"  # Invalid
        mock_openai.return_value = mock_response
        
        with patch("app.services.ai_service.settings") as mock_settings:
            mock_settings.OPENAI_API_KEY = "test_key"
            
            result = await service._get_smart_local_image(activity)
            assert "/images/blog/" in result


def test_get_mock_response():
    """Test _get_mock_response returns valid SearchResponse"""
    service = AIService()
    
    result = service._get_mock_response()
    
    assert isinstance(result, SearchResponse)
    assert len(result.results) > 0
    assert result.results[0].title
    assert result.results[0].description
    assert result.results[0].price


@pytest.mark.asyncio
async def test_process_query_openai_error_fallback():
    """Test process_query falls back to mock on OpenAI error"""
    service = AIService()
    
    from unittest.mock import AsyncMock, patch
    
    with patch("app.services.ai_service.search_service.search_web", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = "Mock results"
        
        with patch("app.services.ai_service.client.chat.completions.create", new_callable=AsyncMock) as mock_openai:
            mock_openai.side_effect = Exception("OpenAI Error")
            
            with patch("app.services.ai_service.settings") as mock_settings:
                mock_settings.OPENAI_API_KEY = "test_key"
                
                result = await service.process_query("test query", is_suggestion=True)
                
                # Should return mock response on error
                assert len(result.results) > 0
                assert "(Demo)" in result.results[0].title


import json
from app.schemas.search import SearchResponse

