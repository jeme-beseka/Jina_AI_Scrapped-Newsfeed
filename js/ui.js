// Enhanced UI Module - Handles all UI rendering and updates
const UI = {
    // DOM Elements
    newsGrid: document.getElementById('newsGrid'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    errorMessage: document.getElementById('errorMessage'),
    emptyState: document.getElementById('emptyState'),
    sectionTitle: document.getElementById('sectionTitle'),
    resultsCount: document.getElementById('resultsCount'),
    apiKeyBanner: document.getElementById('apiKeyBanner'),

    // Modal Elements
    modalOverlay: document.getElementById('modalOverlay'),
    modalImage: document.getElementById('modalImage'),
    modalSource: document.getElementById('modalSource'),
    modalDate: document.getElementById('modalDate'),
    modalTitle: document.getElementById('modalTitle'),
    modalDescription: document.getElementById('modalDescription'),
    readerContent: document.getElementById('readerContent'),
    modalEmbed: document.getElementById('modalEmbed'),
    modalBody: document.getElementById('modalBody'),
    articleFrame: document.getElementById('articleFrame'),
    openOriginalBtn: document.getElementById('openOriginalBtn'),

    // Search Elements
    searchInput: document.getElementById('searchInput'),

    // Current article for modal
    currentArticle: null,

    // Search history management
    searchHistory: [],
    maxSearchHistory: 5,

    /**
     * Initialize UI features
     */
    init() {
        this.loadSearchHistory();
        this.initSearchAutocomplete();
    },

    /**
     * Load search history from localStorage
     */
    loadSearchHistory() {
        try {
            const saved = localStorage.getItem('newsHub_searchHistory');
            if (saved) {
                this.searchHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading search history:', error);
            this.searchHistory = [];
        }
    },

    /**
     * Save search history to localStorage
     */
    saveSearchHistory() {
        try {
            localStorage.setItem('newsHub_searchHistory', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    },

    /**
     * Add search term to history
     * @param {string} term - Search term
     */
    addToSearchHistory(term) {
        if (!term || term.trim().length === 0) return;

        const trimmedTerm = term.trim();

        // Remove if already exists
        this.searchHistory = this.searchHistory.filter(t => t.toLowerCase() !== trimmedTerm.toLowerCase());

        // Add to beginning
        this.searchHistory.unshift(trimmedTerm);

        // Keep only max items
        if (this.searchHistory.length > this.maxSearchHistory) {
            this.searchHistory = this.searchHistory.slice(0, this.maxSearchHistory);
        }

        this.saveSearchHistory();
    },

    /**
     * Initialize search autocomplete
     */
    initSearchAutocomplete() {
        // Create autocomplete dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'search-autocomplete';
        dropdown.id = 'searchAutocomplete';
        this.searchInput.parentNode.style.position = 'relative';
        this.searchInput.parentNode.appendChild(dropdown);

        // Show dropdown on focus if there's history
        this.searchInput.addEventListener('focus', () => {
            if (this.searchHistory.length > 0) {
                this.showSearchSuggestions();
            }
        });

        // Filter suggestions on input
        this.searchInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            if (value.length > 0) {
                this.showSearchSuggestions(value);
            } else if (this.searchHistory.length > 0) {
                this.showSearchSuggestions();
            } else {
                this.hideSearchSuggestions();
            }
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.searchInput.contains(e.target) && !dropdown.contains(e.target)) {
                this.hideSearchSuggestions();
            }
        });

        // Handle keyboard navigation
        this.searchInput.addEventListener('keydown', (e) => {
            const dropdown = document.getElementById('searchAutocomplete');
            const items = dropdown.querySelectorAll('.search-suggestion-item');

            if (items.length === 0) return;

            const activeItem = dropdown.querySelector('.search-suggestion-item.active');
            let currentIndex = activeItem ? Array.from(items).indexOf(activeItem) : -1;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                this.setActiveSuggestion(items, currentIndex);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                this.setActiveSuggestion(items, currentIndex);
            } else if (e.key === 'Enter' && activeItem) {
                e.preventDefault();
                const term = activeItem.querySelector('.suggestion-text').textContent;
                this.selectSearchSuggestion(term);
            }
        });
    },

    /**
     * Set active suggestion in keyboard navigation
     * @param {NodeList} items - Suggestion items
     * @param {number} index - Index to activate
     */
    setActiveSuggestion(items, index) {
        items.forEach(item => item.classList.remove('active'));
        items[index].classList.add('active');
        items[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    },

    /**
     * Show search suggestions dropdown
     * @param {string} filter - Optional filter text
     */
    showSearchSuggestions(filter = '') {
        const dropdown = document.getElementById('searchAutocomplete');

        let suggestions = this.searchHistory;

        // Filter suggestions if filter text provided
        if (filter) {
            suggestions = suggestions.filter(term =>
                term.toLowerCase().includes(filter.toLowerCase())
            );
        }

        if (suggestions.length === 0) {
            this.hideSearchSuggestions();
            return;
        }

        const html = `
            <div class="search-suggestions-header">
                <span>Recent Searches</span>
                <button class="clear-history-btn" onclick="UI.clearSearchHistory()">Clear</button>
            </div>
            ${suggestions.map(term => `
                <div class="search-suggestion-item" onclick="UI.selectSearchSuggestion('${this.escapeHtml(term)}')">
                    <svg class="suggestion-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M7 13A6 6 0 1 0 7 1a6 6 0 0 0 0 12zM15 15l-3.35-3.35" 
                              stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <span class="suggestion-text">${this.escapeHtml(term)}</span>
                    <button class="remove-suggestion-btn" 
                            onclick="event.stopPropagation(); UI.removeFromSearchHistory('${this.escapeHtml(term)}')">
                        <svg width="12" height="12" viewBox="0 0 12 12">
                            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                </div>
            `).join('')}
        `;

        dropdown.innerHTML = html;
        dropdown.classList.add('active');
    },

    /**
     * Hide search suggestions dropdown
     */
    hideSearchSuggestions() {
        const dropdown = document.getElementById('searchAutocomplete');
        dropdown.classList.remove('active');
    },

    /**
     * Select a search suggestion
     * @param {string} term - Search term
     */
    selectSearchSuggestion(term) {
        this.searchInput.value = term;
        this.hideSearchSuggestions();

        // Trigger search via custom event
        this.searchInput.dispatchEvent(new Event('suggestionSelected'));
    },

    /**
     * Remove term from search history
     * @param {string} term - Search term to remove
     */
    removeFromSearchHistory(term) {
        this.searchHistory = this.searchHistory.filter(t => t !== term);
        this.saveSearchHistory();

        // Refresh dropdown
        if (this.searchHistory.length > 0) {
            this.showSearchSuggestions(this.searchInput.value);
        } else {
            this.hideSearchSuggestions();
        }
    },

    /**
     * Clear all search history
     */
    clearSearchHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
        this.hideSearchSuggestions();
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Create skeleton card for loading state
     * @returns {HTMLElement} Skeleton card element
     */
    createSkeletonCard() {
        const skeleton = document.createElement('div');
        skeleton.className = 'news-card skeleton-card';

        skeleton.innerHTML = `
            <div class="skeleton-image"></div>
            <div class="news-content">
                <div class="news-meta">
                    <div class="skeleton-text skeleton-source"></div>
                    <div class="skeleton-text skeleton-date"></div>
                </div>
                <div class="skeleton-text skeleton-title"></div>
                <div class="skeleton-text skeleton-title-line2"></div>
                <div class="skeleton-text skeleton-description"></div>
                <div class="skeleton-text skeleton-description-line2"></div>
                <div class="skeleton-text skeleton-description-line3"></div>
            </div>
        `;

        return skeleton;
    },

    /**
     * Show skeleton loading cards
     * @param {number} count - Number of skeleton cards to show
     */
    showSkeletonLoading(count = 12) {
        this.errorMessage.style.display = 'none';
        this.emptyState.style.display = 'none';
        this.loadingSpinner.style.display = 'none';
        this.newsGrid.innerHTML = '';

        // Create skeleton cards
        for (let i = 0; i < count; i++) {
            const skeleton = this.createSkeletonCard();
            this.newsGrid.appendChild(skeleton);

            // Stagger animation
            setTimeout(() => {
                skeleton.style.opacity = '1';
            }, i * 30);
        }
    },

    /**
     * Show loading spinner (fallback)
     */
    showLoading() {
        // Use skeleton loading instead of spinner
        this.showSkeletonLoading();
    },

    /**
     * Hide loading spinner
     */
    hideLoading() {
        this.loadingSpinner.style.display = 'none';
    },

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        this.errorMessage.innerHTML = `
            <div class="error-content">
                <svg class="error-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <div class="error-text">
                    <strong>Error</strong>
                    <p>${message}</p>
                </div>
            </div>
        `;
        this.errorMessage.style.display = 'flex';
        this.emptyState.style.display = 'none';
        this.newsGrid.innerHTML = '';
        this.hideLoading();
    },

    /**
     * Show empty state
     */
    showEmpty() {
        this.emptyState.style.display = 'block';
        this.errorMessage.style.display = 'none';
        this.newsGrid.innerHTML = '';
        this.hideLoading();
    },

    /**
     * Hide API key banner
     */
    hideApiKeyBanner() {
        this.apiKeyBanner.style.display = 'none';
    },

    /**
     * Format date to relative time
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 60) {
            return `${diffMinutes}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
    },

    /**
     * Truncate text to specified length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    },

    /**
     * Create a news card element
     * @param {Object} article - Article data
     * @returns {HTMLElement} News card element
     */
    createNewsCard(article) {
        const card = document.createElement('div');
        card.className = 'news-card';

        // Fallback image with proper SVG encoding
        const fallbackImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23cbd5e1" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%2364748b"%3ENo Image%3C/text%3E%3C/svg%3E';

        const imageUrl = article.urlToImage || fallbackImage;
        const title = this.truncateText(article.title, 100);
        const description = this.truncateText(article.description || 'No description available', 150);

        card.innerHTML = `
            <img src="${imageUrl}" 
                 alt="${this.escapeHtml(article.title)}" 
                 class="news-image" 
                 loading="lazy"
                 onerror="this.src='${fallbackImage}'">
            <div class="news-content">
                <div class="news-meta">
                    <span class="news-source">${this.escapeHtml(article.source.name)}</span>
                    <span class="news-date">${this.formatDate(article.publishedAt)}</span>
                </div>
                <h3 class="news-title">${this.escapeHtml(title)}</h3>
                <p class="news-description">${this.escapeHtml(description)}</p>
                <span class="read-more">Read more →</span>
            </div>
        `;

        // Add click event to open modal
        card.addEventListener('click', () => {
            this.openArticleModal(article);
        });

        return card;
    },

    /**
     * Render articles to the grid
     * @param {Array} articles - Array of article objects
     */
    renderArticles(articles) {
        this.newsGrid.innerHTML = '';

        if (!articles || articles.length === 0) {
            this.showEmpty();
            this.resultsCount.textContent = '';
            return;
        }

        // Filter out articles without titles
        const validArticles = articles.filter(article => article.title && article.title !== '[Removed]');

        if (validArticles.length === 0) {
            this.showEmpty();
            this.resultsCount.textContent = '';
            return;
        }

        this.resultsCount.textContent = `${validArticles.length} article${validArticles.length !== 1 ? 's' : ''}`;

        // Create and append cards with animation
        validArticles.forEach((article, index) => {
            const card = this.createNewsCard(article);
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            this.newsGrid.appendChild(card);

            // Stagger animation
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50);
        });
    },

    /**
     * Update section title
     * @param {string} title - Title text
     */
    updateSectionTitle(title) {
        this.sectionTitle.textContent = title;
    },

    /**
     * Open article modal
     * @param {Object} article - Article object
     */
    async openArticleModal(article) {
        this.currentArticle = article;

        // Populate modal header
        const fallbackImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23cbd5e1" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%2364748b"%3ENo Image%3C/text%3E%3C/svg%3E';

        this.modalImage.src = article.urlToImage || fallbackImage;
        this.modalImage.onerror = () => {
            this.modalImage.src = fallbackImage;
        };
        this.modalSource.textContent = article.source.name;
        this.modalDate.textContent = this.formatDate(article.publishedAt);
        this.modalTitle.textContent = article.title;
        this.modalDescription.textContent = article.description || 'No description available';
        this.openOriginalBtn.href = article.url;

        // Show modal
        this.modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Load article content in reader mode
        this.showReaderMode();
        await this.loadArticleContent(article.url);
    },

    /**
     * Close article modal
     */
    closeArticleModal() {
        this.modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        this.currentArticle = null;

        // Clear iframe
        this.articleFrame.src = 'about:blank';
    },

    /**
     * Load article content for reader mode
     * @param {string} url - Article URL
     */
    async loadArticleContent(url) {
        // Show loading state
        this.readerContent.innerHTML = `
            <div class="reader-loading">
                <div class="spinner-small"></div>
                <p>Loading article content...</p>
            </div>
        `;

        try {
            // Extract content using Reader module
            const content = await Reader.extractContent(url);
            this.readerContent.innerHTML = content;
        } catch (error) {
            console.error('Error loading article content:', error);
            this.readerContent.innerHTML = `
                <div class="reader-error">
                    <h3>Failed to load content</h3>
                    <p>Unable to extract article content. Please try the embedded view or open the original article.</p>
                </div>
            `;
        }
    },

    /**
     * Show reader mode
     */
    showReaderMode() {
        this.modalBody.style.display = 'block';
        this.modalEmbed.style.display = 'none';

        document.getElementById('readerModeBtn').classList.add('active');
        document.getElementById('embedModeBtn').classList.remove('active');
    },

    /**
     * Show embed mode
     */
    showEmbedMode() {
        this.modalBody.style.display = 'none';
        this.modalEmbed.style.display = 'block';

        document.getElementById('readerModeBtn').classList.remove('active');
        document.getElementById('embedModeBtn').classList.add('active');

        // Load iframe if not already loaded
        if (!this.articleFrame.src || this.articleFrame.src === 'about:blank') {
            this.articleFrame.src = this.currentArticle.url;
        }
    },

    /**
     * Share article
     */
    shareArticle() {
        if (!this.currentArticle) return;

        const shareData = {
            title: this.currentArticle.title,
            text: this.currentArticle.description,
            url: this.currentArticle.url
        };

        // Check if Web Share API is available
        if (navigator.share) {
            navigator.share(shareData)
                .then(() => console.log('Shared successfully'))
                .catch(err => console.log('Error sharing:', err));
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(this.currentArticle.url)
                .then(() => {
                    this.showToast('Link copied to clipboard!', 'success');
                })
                .catch(err => {
                    console.error('Failed to copy:', err);
                    this.showToast('Failed to copy link', 'error');
                });
        }
    },

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error, info)
     */
    showToast(message, type = 'info') {
        // Remove existing toast if any
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /**
     * Initialize theme toggle
     */
    initTheme() {
        const themeToggle = document.getElementById('themeToggle');
        const savedTheme = localStorage.getItem('theme') || 'light';

        document.documentElement.setAttribute('data-theme', savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
};

// Initialize UI features when module loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        UI.init();
    });
} else {
    UI.init();
}