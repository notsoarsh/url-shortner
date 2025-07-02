// URL Shortener App - Main JavaScript

class UrlShortener {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadRecentUrls();
    }

    bindEvents() {
        // Form submission
        const form = document.getElementById('shortenForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Custom alias input formatting
        const aliasInput = document.getElementById('customAlias');
        if (aliasInput) {
            aliasInput.addEventListener('input', (e) => {
                // Remove invalid characters and convert to lowercase
                e.target.value = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-_]/g, '');
            });
        }

        // URL input validation
        const urlInput = document.getElementById('urlInput');
        if (urlInput) {
            urlInput.addEventListener('input', (e) => this.validateUrl(e.target));
            urlInput.addEventListener('paste', (e) => {
                setTimeout(() => this.validateUrl(e.target), 10);
            });
        }

        // Pagination
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        if (prevBtn) prevBtn.addEventListener('click', () => this.changePage(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.changePage(1));
    }

    validateUrl(input) {
        const url = input.value.trim();
        if (!url) return;

        // Basic URL validation
        const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        let testUrl = url;
        
        if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
            testUrl = 'https://' + testUrl;
        }

        if (urlPattern.test(testUrl)) {
            input.setCustomValidity('');
            input.classList.remove('invalid');
        } else {
            input.setCustomValidity('Please enter a valid URL');
            input.classList.add('invalid');
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('shortenBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const spinner = submitBtn.querySelector('.loading-spinner');
        
        // Show loading state
        this.setLoadingState(submitBtn, btnText, spinner, true);
        
        try {
            const formData = new FormData(e.target);
            let url = formData.get('url').trim();
            
            // Add protocol if missing
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            
            const requestData = {
                url: url,
                customAlias: formData.get('customAlias')?.trim() || undefined,
                ttlDays: parseInt(formData.get('ttlDays')) || 30
            };
            
            const response = await fetch('/api/urls/shorten', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showResult(result.data);
                this.loadRecentUrls(); // Refresh recent URLs
                this.showNotification('URL shortened successfully!', 'success');
            } else {
                throw new Error(result.error || 'Failed to shorten URL');
            }
            
        } catch (error) {
            console.error('Error:', error);
            this.showNotification(error.message, 'error');
        } finally {
            this.setLoadingState(submitBtn, btnText, spinner, false);
        }
    }

    setLoadingState(btn, btnText, spinner, loading) {
        if (loading) {
            btn.disabled = true;
            btnText.style.display = 'none';
            spinner.style.display = 'inline';
        } else {
            btn.disabled = false;
            btnText.style.display = 'inline';
            spinner.style.display = 'none';
        }
    }

    showResult(data) {
        const resultCard = document.getElementById('resultCard');
        const shortUrlDisplay = document.getElementById('shortUrlDisplay');
        const originalUrlDisplay = document.getElementById('originalUrlDisplay');
        const analyticsLink = document.getElementById('analyticsLink');
        
        shortUrlDisplay.value = data.shortUrl;
        originalUrlDisplay.textContent = data.originalUrl;
        
        const code = data.customAlias || data.shortCode;
        analyticsLink.href = `/analytics/${code}`;
        
        resultCard.style.display = 'block';
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    async loadRecentUrls() {
        const container = document.getElementById('recentUrls');
        const pagination = document.getElementById('pagination');
        
        try {
            container.innerHTML = '<p class="loading">Loading recent URLs...</p>';
            
            const response = await fetch(`/api/urls/urls?page=${this.currentPage}&limit=${this.itemsPerPage}`);
            const result = await response.json();
            
            if (response.ok && result.data.urls.length > 0) {
                this.renderUrls(result.data.urls);
                this.updatePagination(result.data.pagination);
                pagination.style.display = 'flex';
            } else {
                container.innerHTML = '<p class="no-data">No URLs found</p>';
                pagination.style.display = 'none';
            }
        } catch (error) {
            console.error('Error loading URLs:', error);
            container.innerHTML = '<p class="no-data">Failed to load URLs</p>';
            pagination.style.display = 'none';
        }
    }

    renderUrls(urls) {
        const container = document.getElementById('recentUrls');
        
        container.innerHTML = urls.map(url => `
            <div class="url-item">
                <div class="url-info-compact">
                    <a href="${url.shortUrl}" class="short-url" target="_blank" rel="noopener">
                        ${url.shortUrl}
                    </a>
                    <div class="original" title="${url.originalUrl}">
                        ${this.truncateUrl(url.originalUrl, 60)}
                    </div>
                </div>
                <div class="url-meta">
                    <div class="url-stats">
                        <div class="number">${url.clicks}</div>
                        <div class="label">clicks</div>
                    </div>
                    <a href="/analytics/${url.customAlias || url.shortCode}" class="btn btn-secondary">
                        📊 Analytics
                    </a>
                </div>
            </div>
        `).join('');
    }

    updatePagination(paginationData) {
        const { page, pages, total } = paginationData;
        
        document.getElementById('pageInfo').textContent = `Page ${page} of ${pages}`;
        document.getElementById('prevPage').disabled = page <= 1;
        document.getElementById('nextPage').disabled = page >= pages;
    }

    changePage(direction) {
        this.currentPage += direction;
        this.loadRecentUrls();
    }

    truncateUrl(url, maxLength) {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength - 3) + '...';
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; padding: 0 0 0 10px;">×</button>
        `;
        
        // Add styles if not already present
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 8px;
                    color: white;
                    font-weight: 500;
                    z-index: 1000;
                    animation: slideInRight 0.3s ease-out;
                    max-width: 400px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                .notification-success { background: #28a745; }
                .notification-error { background: #dc3545; }
                .notification-info { background: #17a2b8; }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Global functions
function copyToClipboard(elementId = 'shortUrlDisplay') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const text = element.value || element.textContent;
    
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showCopyFeedback(element);
        }).catch(err => {
            console.error('Failed to copy:', err);
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showCopyFeedback();
    } catch (err) {
        console.error('Fallback copy failed:', err);
    }
    
    textArea.remove();
}

function showCopyFeedback(element) {
    // Create temporary feedback
    const feedback = document.createElement('span');
    feedback.textContent = '✓ Copied!';
    feedback.style.cssText = `
        color: #28a745;
        font-weight: 600;
        margin-left: 10px;
        animation: fadeInOut 2s ease-in-out;
    `;
    
    if (element && element.parentElement) {
        element.parentElement.appendChild(feedback);
        setTimeout(() => feedback.remove(), 2000);
    }
    
    // Add fadeInOut animation if not already present
    if (!document.querySelector('#copy-feedback-styles')) {
        const styles = document.createElement('style');
        styles.id = 'copy-feedback-styles';
        styles.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(-5px); }
                50% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-5px); }
            }
        `;
        document.head.appendChild(styles);
    }
}

function resetForm() {
    document.getElementById('shortenForm').reset();
    document.getElementById('resultCard').style.display = 'none';
    document.getElementById('urlInput').focus();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UrlShortener();
    
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Service Worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment if you want to add PWA capabilities
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered:', registration))
        //     .catch(error => console.log('SW registration failed:', error));
    });
}
