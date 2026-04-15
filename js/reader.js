// Reader Module - Content Extraction via Serverless Function
const Reader = {
    /**
     * Fetch article content using Jina AI Reader via serverless function
     * @param {string} url - Article URL
     * @returns {Promise<Object>} Extracted content
     */
    async fetchArticleContent(url) {
        try {
            const apiUrl = `/api/reader?url=${encodeURIComponent(url)}`;
            const response = await fetch(apiUrl);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch article content');
            }

            return data;
        } catch (error) {
            console.error('Error fetching article content:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Parse and clean HTML content
     * @param {string} html - Raw HTML content
     * @returns {string} Cleaned HTML
     */
    parseContent(html) {
        if (!html) return '<p>No content available</p>';

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Remove scripts for security
        const scripts = tempDiv.getElementsByTagName('script');
        for (let i = scripts.length - 1; i >= 0; i--) {
            scripts[i].parentNode.removeChild(scripts[i]);
        }

        // Remove styles
        const styles = tempDiv.getElementsByTagName('style');
        for (let i = styles.length - 1; i >= 0; i--) {
            styles[i].parentNode.removeChild(styles[i]);
        }

        return tempDiv.innerHTML;
    },

    /**
     * Convert markdown to HTML
     * @param {string} markdown - Markdown text
     * @returns {string} HTML
     */
    markdownToHtml(markdown) {
        if (!markdown) return '<p>No content available</p>';

        let html = markdown;

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold
        html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        // Images
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" loading="lazy">');

        // Line breaks
        html = html.replace(/\n\n/gim, '</p><p>');
        html = html.replace(/\n/gim, '<br>');

        // Wrap in paragraphs
        html = '<p>' + html + '</p>';

        return html;
    },

    /**
     * Format content for display
     * @param {Object} contentData - Content data from API
     * @returns {string} Formatted HTML
     */
    formatContent(contentData) {
        if (!contentData.success) {
            return `
                <div class="reader-error">
                    <h3>Unable to load article content</h3>
                    <p>${contentData.error || 'Please try the embedded view or open the original article.'}</p>
                    ${!this.JINA_API_KEY ? '<p><small>Tip: Add a free Jina API key in reader.js for higher rate limits (200 req/min instead of 20)</small></p>' : ''}
                </div>
            `;
        }

        if (!contentData.content || typeof contentData.content !== 'string') {
            return `
                <div class="reader-error">
                    <h3>Invalid content format</h3>
                    <p>The article content could not be parsed. Please try the embedded view.</p>
                </div>
            `;
        }

        let content = contentData.content;

        // Jina returns markdown by default, convert to HTML
        if (content.includes('<html') || content.includes('<!DOCTYPE')) {
            // It's full HTML page, parse it
            content = this.parseContent(content);
        } else if (content.includes('<p>') || content.includes('<div>') || content.includes('<article>')) {
            // It's HTML fragment, clean it
            content = this.parseContent(content);
        } else {
            // It's markdown, convert to HTML
            content = this.markdownToHtml(content);
        }

        return content;
    },

    /**
     * Extract article content
     * @param {string} url - Article URL
     * @returns {Promise<string>} Formatted content HTML
     */
    async extractContent(url) {
        try {
            const contentData = await this.fetchArticleContent(url);
            return this.formatContent(contentData);
        } catch (error) {
            console.error('Content extraction failed:', error);
            return `
                <div class="reader-error">
                    <h3>Content Extraction Failed</h3>
                    <p>We couldn't load the article content. Please use the embedded view or open the original article.</p>
                    <p class="error-details">${error.message}</p>
                </div>
            `;
        }
    }
};
