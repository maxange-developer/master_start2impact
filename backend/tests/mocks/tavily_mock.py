"""Mock for Tavily API responses"""


class MockTavilyClient:
    """Mock Tavily client for testing"""
    
    def __init__(self, mock_images):
        self.mock_images = mock_images
    
    def search(self, query, **kwargs):
        """Mock Tavily search with image results"""
        # Extract key from query (first word lowercased)
        key = query.lower().split()[0] if query else "default"
        
        return {
            "results": [],
            "images": self.mock_images.get(key, [
                {
                    "url": "https://picsum.photos/seed/default/800/600",
                    "description": "Default image"
                }
            ])
        }
