// API Module - Handles all API requests via serverless functions
const API = {
    /**
     * Fetch top headlines from NewsAPI
     * @param {string} category - News category (business, technology, etc.)
     * @returns {Promise<Object>} News data
     */
    async fetchTopHeadlines(category = '') {
        try {
            const categoryParam = category ? `?category=${category}` : '';
            const url = `/api/headlines${categoryParam}`;

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
            const url = `/api/search?q=${encodeURIComponent(query)}`;

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
     * Check if API is available
     * @returns {boolean}
     */
    isApiKeyConfigured() {
        return true;
    }
};
