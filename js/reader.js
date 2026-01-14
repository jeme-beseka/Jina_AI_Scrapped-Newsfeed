// Reader Module - Content Extraction API Integration
const Reader = {
    // Get one at https://jina.ai/ (10 million free tokens)
    JINA_API_KEY: '', // Leave empty to use without authentication
    //Go to the Jina API reader website and get your own API Key to run with authentication and about 10 million requests

    /**
     * Fetch article content using Jina AI Reader
     * @param {string} url - Article URL
     * @returns {Promise<Object>} Extracted content
     */
    async fetchArticleContent(url) {
        try {
            const readerUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;

            // Build headers
            const headers = {
                'Accept': 'text/plain' // Request plain text/markdown for better compatibility
            };

            // Add API key if configured (optional, for higher rate limits)
            if (this.JINA_API_KEY) {
                headers['Authorization'] = `Bearer ${this.JINA_API_KEY}`;
            }

            const response = await fetch(readerUrl, { headers });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication failed. Check your Jina API key or remove it to use free tier.');
                } else if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Try adding a free Jina API key in reader.js');
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Get the content as text (Jina returns markdown/text by default)
            const content = await response.text();

            // Validate content
            if (!content || content.trim().length === 0) {
                throw new Error('Empty response from Jina AI Reader');
            }

            return {
                success: true,
                content: content,
                title: '',
                description: '',
                author: '',
                publishedTime: ''
            };
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
