"""Tests for search endpoints with mocked APIs"""
import pytest
from unittest.mock import patch, AsyncMock
import json

# API prefix
API_PREFIX = "/api/v1"


@pytest.mark.asyncio
async def test_search_success(client, auth_headers, mock_openai_response, mock_tavily_response):
    """Test successful AI search with mocked APIs"""
    
    # Mock OpenAI
    with patch("app.services.ai_service.AsyncOpenAI") as mock_openai:
        mock_client = AsyncMock()
        mock_completion = AsyncMock()
        
        # Create mock message structure
        class MockMessage:
            def __init__(self, content):
                self.content = content
        
        class MockChoice:
            def __init__(self, content):
                self.message = MockMessage(content)
        
        mock_completion.choices = [MockChoice(json.dumps(mock_openai_response))]
        mock_client.chat.completions.create.return_value = mock_completion
        mock_openai.return_value = mock_client
        
        # Mock Tavily
        with patch("app.services.search_service.TavilyClient") as mock_tavily:
            mock_tavily_instance = mock_tavily.return_value
            mock_tavily_instance.search.return_value = {
                "images": mock_tavily_response["teide"]
            }
            
            response = client.post(
                f"{API_PREFIX}/search",
                headers=auth_headers,
                json={
                    "query": "Cosa fare a Tenerife?",
                    "language": "it"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "results" in data
            assert len(data["results"]) > 0
            assert data["off_topic"] == False
            
            # Check first activity structure
            activity = data["results"][0]
            assert "title" in activity
            assert "description" in activity
            assert "category" in activity
            assert "price" in activity


def test_search_unauthorized(client):
    """Test search without authentication"""
    response = client.post(f"{API_PREFIX}/search", json={
        "query": "Cosa fare a Tenerife?"
    })
    assert response.status_code == 401


def test_search_missing_query(client, auth_headers):
    """Test search with missing query"""
    response = client.post(f"{API_PREFIX}/search", headers=auth_headers, json={})
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_search_spanish_language(client, auth_headers, mock_openai_response):
    """Test AI search with Spanish language"""
    
    with patch("app.services.ai_service.AsyncOpenAI") as mock_openai:
        mock_client = AsyncMock()
        mock_completion = AsyncMock()
        
        class MockMessage:
            def __init__(self, content):
                self.content = content
        
        class MockChoice:
            def __init__(self, content):
                self.message = MockMessage(content)
        
        mock_completion.choices = [MockChoice(json.dumps(mock_openai_response))]
        mock_client.chat.completions.create.return_value = mock_completion
        mock_openai.return_value = mock_client
        
        with patch("app.services.search_service.TavilyClient"):
            response = client.post(
                f"{API_PREFIX}/search",
                headers=auth_headers,
                json={
                    "query": "¿Qué hacer en Tenerife?",
                    "language": "es"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "results" in data


@pytest.mark.asyncio
async def test_search_suggestion_mode(client, auth_headers, mock_openai_response):
    """Test AI search with is_suggestion=true"""
    
    with patch("app.services.ai_service.AsyncOpenAI") as mock_openai:
        mock_client = AsyncMock()
        mock_completion = AsyncMock()
        
        class MockMessage:
            def __init__(self, content):
                self.content = content
        
        class MockChoice:
            def __init__(self, content):
                self.message = MockMessage(content)
        
        mock_completion.choices = [MockChoice(json.dumps(mock_openai_response))]
        mock_client.chat.completions.create.return_value = mock_completion
        mock_openai.return_value = mock_client
        
        with patch("app.services.search_service.TavilyClient"):
            response = client.post(
                f"{API_PREFIX}/search",
                headers=auth_headers,
                json={
                    "query": "Avventure nella natura",
                    "is_suggestion": True,
                    "language": "it"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "results" in data


@pytest.mark.asyncio
async def test_search_off_topic_detection(client, auth_headers):
    """Test off-topic query detection"""
    
    off_topic_response = {
        "results": [],
        "off_topic": True,
        "message": "La tua richiesta non riguarda attività a Tenerife."
    }
    
    with patch("app.services.ai_service.AsyncOpenAI") as mock_openai:
        mock_client = AsyncMock()
        mock_completion = AsyncMock()
        
        class MockMessage:
            def __init__(self, content):
                self.content = content
        
        class MockChoice:
            def __init__(self, content):
                self.message = MockMessage(content)
        
        mock_completion.choices = [MockChoice(json.dumps(off_topic_response))]
        mock_client.chat.completions.create.return_value = mock_completion
        mock_openai.return_value = mock_client
        
        response = client.post(
            f"{API_PREFIX}/search",
            headers=auth_headers,
            json={
                "query": "Come si fa la pizza?",
                "language": "it"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["off_topic"] == True
        assert "message" in data
        assert len(data["results"]) == 0


@pytest.mark.asyncio
async def test_search_default_language(client, auth_headers, mock_openai_response):
    """Test search defaults to Spanish language"""
    
    with patch("app.services.ai_service.AsyncOpenAI") as mock_openai:
        mock_client = AsyncMock()
        mock_completion = AsyncMock()
        
        class MockMessage:
            def __init__(self, content):
                self.content = content
        
        class MockChoice:
            def __init__(self, content):
                self.message = MockMessage(content)
        
        mock_completion.choices = [MockChoice(json.dumps(mock_openai_response))]
        mock_client.chat.completions.create.return_value = mock_completion
        mock_openai.return_value = mock_client
        
        with patch("app.services.search_service.TavilyClient"):
            response = client.post(
                f"{API_PREFIX}/search",
                headers=auth_headers,
                json={
                    "query": "Actividades en Tenerife"
                }
            )
            
            assert response.status_code == 200



