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
        let articleStarted = false;
        
        // Comprehensive skip patterns
        let skipPatterns = [
            // Navigation & UI
            /^(Skip to content|Advertisement|Watch Live|Subscribe|Sign In|Got a Tip\?)/i,
            /^(Home|News|Sport|Business|Technology|Health|Culture|Arts|Travel|Earth|Audio|Video|Live|Documentaries)/i,
            /^(Weather|Newsletters|Share|Save|Add as preferred|Plus Icon|Click to)/i,
            /^(U\.S\.|Asia|Global|Film|TV|What To Watch|Music|Docs|Digital|Gaming|Awards Circuit)/i,
            
            // Social & Sharing
            /^(Share|Facebook|Twitter|Instagram|LinkedIn|Pinterest|Reddit|Tumblr|WhatsApp|Email)/i,
            /^\[.*\]\(https?:\/\/(www\.)?(facebook|twitter|linkedin|pinterest|reddit|tumblr|whatsapp)\.com/i,
            /^!\[.*\]\(.*\)$/,  // Standalone images without context
            
            // Metadata & Timestamps
            /^Image \d+/i,
            /^!<a href=/i,
            /loading="lazy"/i,
            /^\d+ (mins?|hrs?|days?|seconds?) ago$/i,
            /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d+, \d{4}/i,
            /^\d{1,2}:\d{2}(am|pm)/i,
            
            // Related content & footers
            /^(Related|More from|Follow|Latest|Popular|Must Read|Sponsored|Most Popular)/i,
            /^(Terms of Use|Privacy Policy|Cookies|Accessibility|About Us|Contact|Advertise)/i,
            /^(BBC in other languages|Read the BBC|Our Sites|Connect|Legal|Magazine)/i,
            /^##\s*(Read More|More from|Latest|Popular)/i,
            
            // Article metadata
            /^By\s+[A-Z]/,  // Author bylines (keep first, skip repeats)
            /^(Senior|Staff|Contributing|Reporter|Editor|Writer)/i,
            
            // Ads & Promotions
            /^(Loading comments|Leave a Reply|Your email|Required fields|Sign Up|Alerts and Newsletters)/i,
            /^(Variety is a part of|Penske Media|All Rights Reserved|Powered by)/i,
            /^\d+\/\d+ Skip Ad/i,
            /^(Visit Advertiser|GO TO PAGE)/i,
            
            // Empty links and broken formatting
            /^\* \[\]\(/,  // Empty list items with links
            /^- \[\]\(/,
            /^Δ$/,  // Greek delta (form symbols)
            /^0 Comments/i,
            
            // Cookie/Privacy notices
            /^(Cookie List|Consent|Privacy Preference|Allow All|Manage Consent)/i,
            /^(Performance Cookies|Targeting Cookies|Functional Cookies|Strictly Necessary)/i,
            /checkbox label/i,
            
            // Breadcrumbs
            /^\d+\.\s+(Home|News|Film|TV|Sport)/i,
        ];

        // Patterns that indicate end of article
        let endPatterns = [
            /^(Related Stories|More from|Must Read|Popular on|Sponsored Stories|Most Popular)/i,
            /^(Sign Up for|Subscribe|Newsletter)/i,
            /^(Leave a Reply|Comments|Loading comments)/i,
            /^(Read More About:|Tags:|Categories:)/i,
            /^#### (Read More|More From|Connect|Legal|Magazine)/i,
        ];

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();

            // Skip empty lines at the start
            if (!articleStarted && !line) continue;

            // Skip metadata headers
            if (line.match(/^(Title:|URL Source:|Published Time:|Markdown Content:)/)) {
                continue;
            }

            // Check if we've hit the end of article
            if (articleStarted && endPatterns.some(pattern => pattern.test(line))) {
                break;
            }

            // Skip patterns
            if (skipPatterns.some(pattern => pattern.test(line))) {
                continue;
            }

            // Detect article start - look for substantial content
            if (!articleStarted) {
                // Article likely starts with a heading or substantial paragraph
                if (line.startsWith('#') || line.length > 80) {
                    articleStarted = true;
                    inArticle = true;
                }
            }

            // Once in article, keep content
            if (inArticle) {
                // Skip very short lines that are likely navigation
                if (line.length < 3 && !line.startsWith('#')) {
                    continue;
                }
                
                cleanedLines.push(lines[i]);
            }
        }

        // Post-processing: remove consecutive empty lines
        let result = cleanedLines.join('\n');
        result = result.replace(/\n{3,}/g, '\n\n');
        
        return result.trim();
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
