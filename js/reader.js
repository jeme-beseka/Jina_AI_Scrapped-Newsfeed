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
     * Clean markdown content by removing navigation and metadata
     * @param {string} markdown - Raw markdown content
     * @returns {string} Cleaned markdown
     */
    cleanMarkdownContent(markdown) {
        if (!markdown) return '';

        let lines = markdown.split('\n');
        let cleanedLines = [];
        let inArticle = false;
        let skipPatterns = [
            /^(Skip to content|Advertisement|Watch Live|Subscribe|Sign In)/i,
            /^(Home|News|Sport|Business|Technology|Health|Culture|Arts|Travel)/i,
            /^(Weather|Newsletters|Share|Save|Add as preferred)/i,
            /^(Related|More from the BBC|Follow BBC on)/i,
            /^(Terms of Use|Privacy Policy|Cookies|Accessibility)/i,
            /^(BBC in other languages|Read the BBC)/i,
            /^\[.*\]\(.*\)$/,  // Standalone links
            /^Image \d+/i,      // Image metadata
            /^!<a href=/i,      // Broken image tags
            /loading="lazy"/i,  // Image attributes
            /^\d+ (mins?|hrs?|days?) ago$/i,  // Timestamps
            /^##\s*(US home buyers|What is a|Founder of|Quantum computing)/i  // Related articles
        ];

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();

            // Skip empty lines at the start
            if (!inArticle && !line) continue;

            // Start capturing after title/metadata
            if (line.match(/^(Title:|URL Source:|Published Time:|Markdown Content:)/)) {
                continue;
            }

            // Skip navigation and metadata patterns
            let shouldSkip = skipPatterns.some(pattern => pattern.test(line));
            if (shouldSkip) continue;

            // Stop at "Related" or footer sections
            if (line.match(/^(Related|More from the BBC|Follow BBC|BBC in other languages)/i)) {
                break;
            }

            // Start article content after first substantial paragraph
            if (!inArticle && line.length > 50) {
                inArticle = true;
            }

            if (inArticle || line.startsWith('#')) {
                cleanedLines.push(lines[i]);
            }
        }

        return cleanedLines.join('\n');
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

        // Clean the markdown content first
        content = this.cleanMarkdownContent(content);

        // Convert markdown to HTML
        content = this.markdownToHtml(content);

        // Wrap in article container
        return `<article class="reader-article">${content}</article>`;
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
