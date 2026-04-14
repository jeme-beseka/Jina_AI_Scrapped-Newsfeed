export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_KEY = process.env.NEWS_API_KEY;
  
  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { category } = req.query;
    const categoryParam = category ? `&category=${category}` : '';
    const url = `https://newsapi.org/v2/top-headlines?country=us${categoryParam}&pageSize=30&apiKey=${API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching headlines:', error);
    res.status(500).json({ error: 'Failed to fetch headlines' });
  }
}
