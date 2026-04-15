module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const JINA_API_KEY = process.env.JINA_API_KEY;
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    const readerUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;

    const headers = {
      'Accept': 'text/plain'
    };

    if (JINA_API_KEY) {
      headers['Authorization'] = `Bearer ${JINA_API_KEY}`;
    }

    const response = await fetch(readerUrl, { headers });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      if (response.status === 401) {
        errorMessage = 'Authentication failed. Check your Jina API key.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (response.status === 451) {
        errorMessage = 'Content unavailable due to legal restrictions. This article cannot be accessed through the reader. Please use "Open Original" to view it directly.';
      }

      return res.status(response.status).json({ 
        success: false,
        error: errorMessage 
      });
    }

    const content = await response.text();

    if (!content || content.trim().length === 0) {
      return res.status(500).json({ 
        success: false,
        error: 'Empty response from Jina AI Reader' 
      });
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json({
      success: true,
      content: content,
      title: '',
      description: '',
      author: '',
      publishedTime: ''
    });
  } catch (error) {
    console.error('Error fetching article content:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fetch article content' 
    });
  }
};
