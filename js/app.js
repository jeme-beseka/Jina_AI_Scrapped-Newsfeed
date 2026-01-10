// Enhanced Main Application Logic
const App = {
    // Application State
    currentCategory: '',
    currentSearchQuery: '',
    searchDebounceTimer: null,

    // DOM Elements
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    categoryBtns: document.querySelectorAll('.category-btn'),
    modalClose: document.getElementById('modalClose'),
    modalOverlay: document.getElementById('modalOverlay'),
    readerModeBtn: document.getElementById('readerModeBtn'),
    embedModeBtn: document.getElementById('embedModeBtn'),
    shareBtn: document.getElementById('shareBtn'),

    /**
     * Load news based on current state
     */
    async loadNews() {
        try {
            // Show skeleton loading instead of spinner
            UI.showSkeletonLoading(12);

            let data;

            // Determine which API call to make
            if (this.currentSearchQuery) {
                data = await API.searchNews(this.currentSearchQuery);
                UI.updateSectionTitle(`Search: "${this.currentSearchQuery}"`);

                // Add to search history
                UI.addToSearchHistory(this.currentSearchQuery);
            } else {
                data = await API.fetchTopHeadlines(this.currentCategory);
                const categoryName = this.currentCategory
                    ? this.currentCategory.charAt(0).toUpperCase() + this.currentCategory.slice(1)
                    : 'Top';
                UI.updateSectionTitle(`${categoryName} Headlines`);
            }

            UI.hideLoading();

            // Check if API call was successful
            if (data.status === 'ok') {
                UI.renderArticles(data.articles);

                // Hide API key banner if API is working
                if (API.isApiKeyConfigured()) {
                    UI.hideApiKeyBanner();
                }
            } else {
                UI.showError(data.message || 'Failed to load news');
            }
        } catch (error) {
            UI.hideLoading();

            // Check if error is due to missing API key
            if (!API.isApiKeyConfigured()) {
                UI.showError('Please add your NewsAPI key in js/api.js to fetch news. Get a free key at NewsAPI.org');
            } else if (error.message.includes('429')) {
                UI.showError('Rate limit exceeded. Please try again later.');
            } else if (error.message.includes('401')) {
                UI.showError('Invalid API key. Please check your NewsAPI key in js/api.js');
            } else {
                UI.showError(`Error: ${error.message}`);
            }

            console.error('Error loading news:', error);
        }
    },

    /**
     * Handle category button click
     * @param {Event} e - Click event
     */
    handleCategoryClick(e) {
        if (e.target.classList.contains('category-btn')) {
            // Update active state
            this.categoryBtns.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            // Update state
            this.currentCategory = e.target.dataset.category;
            this.currentSearchQuery = '';
            this.searchInput.value = '';

            // Load news
            this.loadNews();
        }
    },

    /**
     * Handle search
     */
    handleSearch() {
        const query = this.searchInput.value.trim();

        if (query) {
            // Update state
            this.currentSearchQuery = query;
            this.currentCategory = '';

            // Remove active state from all category buttons
            this.categoryBtns.forEach(btn => btn.classList.remove('active'));

            // Load news
            this.loadNews();
        } else {
            UI.showError('Please enter a search term');
            setTimeout(() => {
                UI.errorMessage.style.display = 'none';
            }, 3000);
        }
    },

    /**
     * Handle search input enter key
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleSearchKeypress(e) {
        if (e.key === 'Enter') {
            this.handleSearch();
        }
    },

    /**
     * Handle modal close button click
     */
    handleModalClose() {
        UI.closeArticleModal();
    },

    /**
     * Handle overlay click (close modal)
     * @param {Event} e - Click event
     */
    handleOverlayClick(e) {
        if (e.target === this.modalOverlay) {
            UI.closeArticleModal();
        }
    },

    /**
     * Handle escape key press (close modal)
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleEscapeKey(e) {
        if (e.key === 'Escape') {
            if (this.modalOverlay.classList.contains('active')) {
                UI.closeArticleModal();
            } else {
                // Also close search suggestions on escape
                UI.hideSearchSuggestions();
            }
        }
    },

    /**
     * Handle view mode toggle
     * @param {Event} e - Click event
     */
    handleViewModeToggle(e) {
        const mode = e.target.dataset.mode;

        if (mode === 'reader') {
            UI.showReaderMode();
        } else if (mode === 'embed') {
            UI.showEmbedMode();
        }
    },

    /**
     * Handle share button click
     */
    handleShare() {
        UI.shareArticle();
    },

    /**
     * Handle search suggestion selection
     */
    handleSuggestionSelected() {
        this.handleSearch();
    },

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Category click handler
        document.querySelector('.category-list').addEventListener('click', (e) => {
            this.handleCategoryClick(e);
        });

        // Search button handler
        this.searchBtn.addEventListener('click', () => {
            this.handleSearch();
        });

        // Search input enter key handler
        this.searchInput.addEventListener('keypress', (e) => {
            this.handleSearchKeypress(e);
        });

        // Search suggestion selected handler
        this.searchInput.addEventListener('suggestionSelected', () => {
            this.handleSuggestionSelected();
        });

        // Modal close button
        this.modalClose.addEventListener('click', () => {
            this.handleModalClose();
        });

        // Modal overlay click
        this.modalOverlay.addEventListener('click', (e) => {
            this.handleOverlayClick(e);
        });

        // Escape key to close modal and suggestions
        document.addEventListener('keydown', (e) => {
            this.handleEscapeKey(e);
        });

        // View mode toggle buttons
        this.readerModeBtn.addEventListener('click', (e) => {
            this.handleViewModeToggle(e);
        });

        this.embedModeBtn.addEventListener('click', (e) => {
            this.handleViewModeToggle(e);
        });

        // Share button
        this.shareBtn.addEventListener('click', () => {
            this.handleShare();
        });
    },

    /**
     * Initialize the application
     */
    init() {
        console.log('Initializing NewsHub...');

        // Initialize theme
        UI.initTheme();

        // Set up event listeners
        this.initEventListeners();

        // Load initial news
        this.loadNews();

        console.log('NewsHub initialized successfully');
        console.log('Features: Skeleton Loading, Search Autocomplete, Reader Mode');
        console.log('Reader mode powered by Jina AI Reader');
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        App.init();
    });
} else {
    App.init();
}