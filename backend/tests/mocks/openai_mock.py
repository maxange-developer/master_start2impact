"""Mock for OpenAI API responses"""
from unittest.mock import AsyncMock


class MockOpenAI:
    """Mock OpenAI client for testing"""
    
    def __init__(self, mock_response):
        self.mock_response = mock_response
        self.chat = self.Chat(mock_response)
    
    class Chat:
        def __init__(self, mock_response):
            self.completions = self.Completions(mock_response)
        
        class Completions:
            def __init__(self, mock_response):
                self.mock_response = mock_response
            
            async def create(self, **kwargs):
                """Mock OpenAI chat completion"""
                import json
                
                class MockMessage:
                    def __init__(self, content):
                        self.content = content
                
                class MockChoice:
                    def __init__(self, content):
                        self.message = MockMessage(content)
                
                class MockResponse:
                    def __init__(self, content):
                        self.choices = [MockChoice(content)]
                
                # Return JSON string of mock response
                return MockResponse(json.dumps(self.mock_response))
