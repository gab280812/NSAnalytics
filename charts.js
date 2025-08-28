class ChartManager {
    constructor() {
        this.charts = {};
        this.colors = {
            primary: '#69874B',
            secondary: '#F4810F',
            accent: '#58743F',
            danger: '#F4810F',
            gradient: ['#69874B', '#58743F', '#F4810F']
        };
    }

    updateRevenueChart(data, comparisonData = null) {
        const ctx = document.getElementById('revenueChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts.revenue) {
            this.charts.revenue.destroy();
        }

        // Handle empty or undefined data
        if (!data || !Array.isArray(data) || data.length === 0) {
            data = [];
        }

        const labels = data.map(item => this.formatDate(item.date || item.date_created));
        const revenues = data.map(item => parseFloat(item.revenue || item.total || 0));
        
        const datasets = [{
            label: 'Current Period',
            data: revenues,
            borderColor: this.colors.primary,
            backgroundColor: this.createGradient(ctx, this.colors.primary),
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: this.colors.primary,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 8
        }];
        
        // Add comparison dataset if provided
        if (comparisonData && comparisonData.length > 0) {
            const comparisonRevenues = comparisonData.map(item => item.revenue);
            datasets.push({
                label: 'Previous Period',
                data: comparisonRevenues,
                borderColor: this.colors.secondary,
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                tension: 0.4,
                pointBackgroundColor: this.colors.secondary,
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            });
        }

        this.charts.revenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: comparisonData && comparisonData.length > 0,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12
                            },
                            color: '#374151'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: this.colors.primary,
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: (context) => {
                                return `Revenue: ${wooAPI.formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6b7280',
                            font: {
                                size: 12
                            }
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(107, 114, 128, 0.1)'
                        },
                        ticks: {
                            color: '#6b7280',
                            font: {
                                size: 12
                            },
                            callback: function(value) {
                                return wooAPI.formatCurrency(value);
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    createProductsChart(data) {
        const ctx = document.getElementById('productsChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts.products) {
            this.charts.products.destroy();
        }

        // Handle empty or undefined data
        if (!data || !Array.isArray(data) || data.length === 0) {
            data = [];
        }

        const labels = data.map(item => this.truncateText(item.name || 'Unknown Product', 20));
        const revenues = data.map(item => parseFloat(item.revenue || 0));
        const quantities = data.map(item => parseInt(item.quantity || 0));

        this.charts.products = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: revenues,
                    backgroundColor: this.generateColors(data.length),
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    hoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            },
                            color: '#374151'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: this.colors.primary,
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: (context) => {
                                const label = context.label;
                                const value = context.parsed;
                                const quantity = quantities[context.dataIndex];
                                return [
                                    `${label}`,
                                    `Revenue: ${wooAPI.formatCurrency(value)}`,
                                    `Quantity: ${quantity} sold`
                                ];
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    createGradient(ctx, color) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, color + '40');
        gradient.addColorStop(1, color + '00');
        return gradient;
    }

    generateColors(count) {
        const baseColors = [
            '#69874B', '#F4810F', '#58743F', '#B9C0C7', 
            '#6B7280', '#2D333A', '#E6E8EA', '#F5F6F7'
        ];
        
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }
        return colors;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    updateCharts(revenueData, productsData, comparisonRevenueData = null) {
        this.updateRevenueChart(revenueData, comparisonRevenueData);
        this.createProductsChart(productsData);
    }

    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
}

// Create global instance
window.chartManager = new ChartManager();
