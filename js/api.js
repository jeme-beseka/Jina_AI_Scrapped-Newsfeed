// API Configuration
const API_KEY = ''; // Visit https://newsapi.org/v2 to get your own API key and input here to get app running properly
const API_BASE_URL = 'https://newsapi.org/v2';

// API Module - Handles all API requests
const API = {
    /**
     * Fetch top headlines from NewsAPI
     * @param {string} category - News category (business, technology, etc.)
     * @returns {Promise<Object>} News data
     */
    async fetchTopHeadlines(category = '') {
        try {
            const categoryParam = category ? `&category=${category}` : '';
            const url = `${API_BASE_URL}/top-headlines?country=us${categoryParam}&pageSize=30&apiKey=${API_KEY}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching top headlines:', error);
            throw error;
        }
    },

    /**
     * Search for news articles
     * @param {string} query - Search query
     * @returns {Promise<Object>} News data
     */
    async searchNews(query) {
        try {
            const url = `${API_BASE_URL}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=30&language=en&apiKey=${API_KEY}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error searching news:', error);
            throw error;
        }
    },

    /**
     * Check if API key is configured
     * @returns {boolean}
     */
    isApiKeyConfigured() {
        return API_KEY !== 'YOUR_API_KEY_HERE' && API_KEY.length > 0;
    }
};
