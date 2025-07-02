// Analytics Page JavaScript

class AnalyticsPage {
    constructor() {
        this.code = this.extractCodeFromUrl();
        this.init();
    }

    extractCodeFromUrl() {
        const pathParts = window.location.pathname.split('/');
        return pathParts[pathParts.length - 1];
    }

    async init() {
        if (!this.code) {
            this.showError('Invalid URL code');
            return;
        }

        try {
            await this.loadAnalytics();
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showError('Failed to load analytics data');
        }
    }

    async loadAnalytics() {
        const response = await fetch(`/api/urls/analytics/${this.code}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to load analytics');
        }

        this.renderAnalytics(result.data);
    }

    renderAnalytics(data) {
        // Hide loading and show content
        document.getElementById('loadingCard').style.display = 'none';
        document.getElementById('analyticsContent').style.display = 'block';

        // Update URL information
        this.updateUrlInfo(data);
        
        // Update statistics
        this.updateStatistics(data);
        
        // Render click chart
        this.renderClickChart(data.dailyClicks);
        
        // Update recent activity
        this.updateRecentActivity(data.clickHistory);
        
        // Update top referrers
        this.updateTopReferrers(data.clickHistory);
    }

    updateUrlInfo(data) {
        document.getElementById('shortUrl').value = data.shortUrl;
        document.getElementById('originalUrl').textContent = data.originalUrl;
        document.getElementById('createdAt').textContent = this.formatDate(data.createdAt);
        document.getElementById('expiresAt').textContent = this.formatDate(data.expiresAt);
        
        const statusElement = document.getElementById('status');
        const isExpired = new Date(data.expiresAt) < new Date();
        statusElement.textContent = isExpired ? 'Expired' : 'Active';
        statusElement.className = `status-badge ${isExpired ? 'expired' : 'active'}`;
    }

    updateStatistics(data) {
        const createdDate = new Date(data.createdAt);
        const currentDate = new Date();
        const daysActive = Math.max(1, Math.ceil((currentDate - createdDate) / (1000 * 60 * 60 * 24)));
        
        // Calculate today's clicks
        const today = new Date().toISOString().split('T')[0];
        const todayClicks = data.dailyClicks[today] || 0;
        
        // Calculate average daily clicks
        const avgDaily = Math.round(data.clicks / daysActive * 10) / 10;

        document.getElementById('totalClicks').textContent = this.formatNumber(data.clicks);
        document.getElementById('todayClicks').textContent = this.formatNumber(todayClicks);
        document.getElementById('avgDaily').textContent = avgDaily.toFixed(1);
        document.getElementById('daysActive').textContent = daysActive;
    }

    renderClickChart(dailyClicks) {
        const chartContainer = document.getElementById('clicksChart');
        
        // Get last 30 days
        const last30Days = this.getLast30Days();
        const chartData = last30Days.map(date => ({
            date,
            clicks: dailyClicks[date] || 0
        }));

        // Simple ASCII-style chart (can be replaced with Chart.js or similar)
        const maxClicks = Math.max(...chartData.map(d => d.clicks), 1);
        
        chartContainer.innerHTML = `
            <div class="simple-chart">
                <div class="chart-title">Daily Clicks (Last 30 Days)</div>
                <div class="chart-bars">
                    ${chartData.map(d => `
                        <div class="chart-bar-container" title="${d.date}: ${d.clicks} clicks">
                            <div class="chart-bar" style="height: ${(d.clicks / maxClicks) * 100}%"></div>
                            <div class="chart-label">${this.formatShortDate(d.date)}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="chart-legend">
                    <span>Max: ${maxClicks} clicks</span>
                    <span>Total: ${chartData.reduce((sum, d) => sum + d.clicks, 0)} clicks</span>
                </div>
            </div>
        `;

        // Add chart styles
        this.addChartStyles();
    }

    addChartStyles() {
        if (document.querySelector('#chart-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'chart-styles';
        styles.textContent = `
            .simple-chart {
                padding: 20px;
                text-align: center;
            }
            .chart-title {
                font-weight: 600;
                margin-bottom: 20px;
                color: #495057;
            }
            .chart-bars {
                display: flex;
                align-items: end;
                justify-content: center;
                gap: 2px;
                height: 200px;
                margin-bottom: 15px;
                padding: 0 10px;
            }
            .chart-bar-container {
                flex: 1;
                max-width: 20px;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: end;
                align-items: center;
                position: relative;
            }
            .chart-bar {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                width: 100%;
                min-height: 2px;
                border-radius: 2px 2px 0 0;
                transition: all 0.3s ease;
                cursor: pointer;
            }
            .chart-bar:hover {
                background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
                transform: scaleY(1.1);
            }
            .chart-label {
                font-size: 0.7rem;
                color: #6c757d;
                margin-top: 5px;
                transform: rotate(-45deg);
                white-space: nowrap;
                position: absolute;
                bottom: -20px;
            }
            .chart-legend {
                display: flex;
                justify-content: space-between;
                font-size: 0.9rem;
                color: #6c757d;
                margin-top: 20px;
            }
            @media (max-width: 768px) {
                .chart-label {
                    font-size: 0.6rem;
                }
                .chart-bars {
                    gap: 1px;
                }
                .chart-bar-container {
                    max-width: 15px;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    updateRecentActivity(clickHistory) {
        const container = document.getElementById('recentActivity');
        
        if (!clickHistory || clickHistory.length === 0) {
            container.innerHTML = '<p class="no-data">No recent activity</p>';
            return;
        }

        // Show last 20 clicks
        const recentClicks = clickHistory
            .slice(-20)
            .reverse()
            .map(click => `
                <div class="activity-item">
                    <div class="activity-info">
                        <div>Click from ${this.extractDomain(click.referrer)}</div>
                        <div class="activity-time">${this.formatDateTime(click.timestamp)}</div>
                    </div>
                    <div class="activity-details">
                        ${this.getBrowserInfo(click.userAgent)}
                    </div>
                </div>
            `).join('');

        container.innerHTML = recentClicks;
    }

    updateTopReferrers(clickHistory) {
        const container = document.getElementById('topReferrers');
        
        if (!clickHistory || clickHistory.length === 0) {
            container.innerHTML = '<p class="no-data">No referrer data available</p>';
            return;
        }

        // Count referrers
        const referrerCounts = {};
        clickHistory.forEach(click => {
            const referrer = this.extractDomain(click.referrer);
            referrerCounts[referrer] = (referrerCounts[referrer] || 0) + 1;
        });

        // Sort by count and take top 10
        const topReferrers = Object.entries(referrerCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([referrer, count]) => `
                <div class="referrer-item">
                    <span class="referrer-name">${referrer}</span>
                    <span class="referrer-count">${count} clicks</span>
                </div>
            `).join('');

        container.innerHTML = topReferrers;
    }

    showError(message) {
        document.getElementById('loadingCard').style.display = 'none';
        document.getElementById('errorCard').style.display = 'block';
        document.getElementById('errorMessage').textContent = message;
    }

    // Utility methods
    getLast30Days() {
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toISOString().split('T')[0]);
        }
        return days;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatShortDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }

    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    extractDomain(url) {
        if (!url || url === 'direct') return 'Direct';
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return 'Unknown';
        }
    }

    getBrowserInfo(userAgent) {
        if (!userAgent) return 'Unknown Browser';
        
        if (userAgent.includes('Chrome')) return '🌐 Chrome';
        if (userAgent.includes('Firefox')) return '🦊 Firefox';
        if (userAgent.includes('Safari')) return '🧭 Safari';
        if (userAgent.includes('Edge')) return '🌊 Edge';
        if (userAgent.includes('Opera')) return '🎭 Opera';
        
        return '🌐 Browser';
    }
}

// Global copy function
function copyToClipboard(elementId) {
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

// Initialize analytics page
document.addEventListener('DOMContentLoaded', () => {
    new AnalyticsPage();
});
