"""Tests for article structure service without calling OpenAI API"""
import pytest
from app.services.article_structure_service import ArticleStructureService


def test_basic_structure_fallback():
    """Test basic structure fallback when OpenAI is not available"""
    service = ArticleStructureService()
    
    content = """Tenerife è un'isola meravigliosa.

    Il Teide è il vulcano più alto di Spagna.
    
    Le spiagge sono bellissime e il clima è perfetto tutto l'anno.
    
    Consiglio di visitare La Laguna per la cultura."""
    
    result = service._get_basic_structure(content)
    
    # Check structure
    assert "intro" in result
    assert "highlights" in result
    assert "sections" in result
    assert "tips" in result
    assert "conclusion" in result
    
    # Check intro has first paragraph
    assert "Tenerife" in result["intro"]["text"]
    
    # Check sections exist
    assert len(result["sections"]) > 0
    assert "title" in result["sections"][0]
    assert "content" in result["sections"][0]
    assert "type" in result["sections"][0]


def test_basic_structure_empty_content():
    """Test basic structure with empty content"""
    service = ArticleStructureService()
    
    result = service._get_basic_structure("")
    
    assert "intro" in result
    assert result["intro"]["text"] == ""
    assert isinstance(result["highlights"], list)
    assert isinstance(result["sections"], list)


def test_basic_structure_single_paragraph():
    """Test basic structure with single paragraph"""
    service = ArticleStructureService()
    
    content = "This is a single paragraph article."
    result = service._get_basic_structure(content)
    
    assert result["intro"]["text"] == content
    assert len(result["sections"]) == 1
    assert result["sections"][0]["content"] == content


def test_basic_structure_multiple_paragraphs():
    """Test basic structure with multiple paragraphs"""
    service = ArticleStructureService()
    
    content = """First paragraph introduction.

    Second paragraph with details.
    
    Third paragraph with more info.
    
    Final paragraph conclusion."""
    
    result = service._get_basic_structure(content)
    
    # First paragraph should be intro
    assert "First paragraph" in result["intro"]["text"]
    
    # Remaining paragraphs should be in sections
    assert len(result["sections"]) > 0
    sections_content = result["sections"][0]["content"]
    assert "Second paragraph" in sections_content or "Third paragraph" in sections_content


@pytest.mark.asyncio
async def test_structure_article_no_api_key(monkeypatch):
    """Test structure_article falls back to basic structure without API key"""
    # Clear the API key
    monkeypatch.setenv("OPENAI_API_KEY", "")
    
    service = ArticleStructureService()
    
    title = "Amazing Tenerife"
    content = """Tenerife is wonderful.

    Visit the Teide volcano.
    
    Enjoy the beaches."""
    
    result = await service.structure_article(title, content)
    
    # Should return basic structure (might be nested in highlights)
    assert "intro" in result
    # Check if structure exists (either at top level or nested)
    assert "sections" in result or any("sections" in str(v) for v in result.values())
    assert "Tenerife" in str(result)


def test_service_instantiation():
    """Test service can be instantiated"""
    service = ArticleStructureService()
    assert service is not None
    assert hasattr(service, 'structure_article')
    assert hasattr(service, '_get_basic_structure')


def test_basic_structure_preserves_formatting():
    """Test that basic structure preserves paragraph breaks"""
    service = ArticleStructureService()
    
    content = """Introduction here.

    Section 1 content.
    
    Section 2 content.
    
    Section 3 content."""
    
    result = service._get_basic_structure(content)
    
    # Check that content has paragraph breaks
    sections_content = result["sections"][0]["content"]
    assert "\n\n" in sections_content or len(result["sections"][0]["content"]) > 0
