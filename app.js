class DashboardApp {
    constructor() {
        this.wooAPI = new WooCommerceAPI();
        this.chartManager = new ChartManager();
        this.currentPeriod = 'mtd';
        this.comparisonEnabled = false;
        this.comparisonType = 'last-period';
        this.chartAggregation = 'daily';
        this.isDateControlsVisible = true;
        this.isWelcomeMode = true;
        
        this.initializeApp();
    }

    initializeApp() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.bindEvents();
                this.loadConfiguration();
            });
        } else {
            this.bindEvents();
            this.loadConfiguration();
        }
    }

    bindEvents() {
        // Welcome page timeframe buttons
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.currentTarget.classList.add('active');
                this.currentPeriod = e.currentTarget.dataset.period;
                
                // Show/hide custom date range
                const customDateRange = document.getElementById('customDateRange');
                if (this.currentPeriod === 'custom') {
                    customDateRange.style.display = 'block';
                } else {
                    customDateRange.style.display = 'none';
                }
            });
        });

        // Generate report button
        const generateBtn = document.getElementById('generateReport');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateReport();
            });
        }

        // New report button (in dashboard)
        const newReportBtn = document.getElementById('newReportBtn');
        if (newReportBtn) {
            newReportBtn.addEventListener('click', () => {
                this.showWelcomePage();
            });
        }

        // Back to welcome button (in error state)
        const backToWelcomeBtn = document.getElementById('backToWelcome');
        if (backToWelcomeBtn) {
            backToWelcomeBtn.addEventListener('click', () => {
                this.showWelcomePage();
            });
        }

        // Period buttons (legacy - for dashboard mode)
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
                this.currentPeriod = e.target.dataset.period;
                this.loadDashboardData();
            });
        });

        // Comparison toggle
        document.getElementById('enableComparison').addEventListener('change', (e) => {
            this.comparisonEnabled = e.target.checked;
            this.toggleComparisonOptions();
            this.loadDashboardData();
        });

        // Comparison type buttons
        document.querySelectorAll('.comparison-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                document.querySelectorAll('.comparison-type-btn').forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
                this.comparisonType = e.target.dataset.comparison;
                if (this.comparisonEnabled) {
                    this.loadDashboardData();
                }
            });
        });

        // Chart aggregation buttons
        document.querySelectorAll('.aggregation-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                document.querySelectorAll('.aggregation-btn').forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
                this.chartAggregation = e.target.dataset.aggregation;
                this.loadDashboardData();
            });
        });



        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadDashboardData();
            });
        }

        // Retry button
        const retryBtn = document.getElementById('retryBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.loadDashboardData();
            });
        }

    }

    loadConfiguration() {
        // Show welcome page initially
        this.showWelcomePage();
    }


    async loadDashboardData() {
        try {
            console.log('Starting to load dashboard data...');
            this.showLoading();
            
            // Test API connectivity first
            console.log('Testing API connectivity...');
            const testUrl = `${this.wooAPI.baseUrl}/orders?consumer_key=${this.wooAPI.consumerKey}&consumer_secret=${this.wooAPI.consumerSecret}&per_page=1`;
            
            try {
                const testResponse = await fetch(testUrl, { mode: 'cors' });
                console.log('API test response status:', testResponse.status);
                
                if (!testResponse.ok) {
                    const errorText = await testResponse.text();
                    console.error('API test failed:', errorText);
                    throw new Error(`API connection failed: ${testResponse.status} - ${errorText}`);
                }
            } catch (error) {
                console.error('API connectivity test failed:', error);
                throw new Error(`Cannot connect to WooCommerce API: ${error.message}`);
            }
            
            const dateRange = this.wooAPI.getDateRange(this.currentPeriod);
            console.log('Date range:', dateRange);
            let comparisonData = null;
            
            if (this.comparisonEnabled) {
                const comparisonRange = this.wooAPI.getComparisonDateRange(this.currentPeriod, this.comparisonType);
                comparisonData = await this.wooAPI.getOrdersWithComparison(
                    dateRange.startDate, 
                    dateRange.endDate, 
                    true,
                    comparisonRange.startDate,
                    comparisonRange.endDate
                );
            } else {
                comparisonData = await this.wooAPI.getOrdersWithComparison(
                    dateRange.startDate, 
                    dateRange.endDate, 
                    false
                );
            }
            
            // Apply chart aggregation
            if (comparisonData.current) {
                comparisonData.current = this.aggregateData(comparisonData.current, this.chartAggregation);
            }
            if (comparisonData.comparison) {
                comparisonData.comparison = this.aggregateData(comparisonData.comparison, this.chartAggregation);
            }
            
            if (!comparisonData || !comparisonData.currentMetrics) {
                console.error('Invalid data received:', comparisonData);
                this.showError('Invalid data received from API');
                return;
            }

            this.updateDashboard(comparisonData);
            this.hideLoading();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError(`Failed to load dashboard data: ${error.message}`);
        }
    }

    aggregateData(orders, aggregation) {
        if (!orders || orders.length === 0) return orders;

        const aggregatedData = {};
        
        orders.forEach(order => {
            const orderDate = new Date(order.date_created);
            let key;
            
            switch (aggregation) {
                case 'weekly':
                    // Get start of week (Sunday)
                    const startOfWeek = new Date(orderDate);
                    startOfWeek.setDate(orderDate.getDate() - orderDate.getDay());
                    key = startOfWeek.toISOString().split('T')[0];
                    break;
                case 'monthly':
                    // Get first day of month
                    key = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-01`;
                    break;
                case 'daily':
                default:
                    key = orderDate.toISOString().split('T')[0];
                    break;
            }
            
            if (!aggregatedData[key]) {
                aggregatedData[key] = {
                    date_created: key,
                    total: 0,
                    orders: []
                };
            }
            
            aggregatedData[key].total += parseFloat(order.total);
            aggregatedData[key].orders.push(order);
        });
        
        // Convert back to array format
        return Object.values(aggregatedData).map(item => ({
            date_created: item.date_created,
            total: item.total.toString(),
            orders_count: item.orders.length
        }));
    }

    updateMetrics(metrics) {
        document.getElementById('totalRevenue').textContent = this.wooAPI.formatCurrency(metrics.totalRevenue || 0);
        document.getElementById('totalOrders').textContent = (metrics.totalOrders || 0).toLocaleString();
        document.getElementById('totalCustomers').textContent = (metrics.totalCustomers || 0).toLocaleString();
        document.getElementById('avgOrderValue').textContent = this.wooAPI.formatCurrency(metrics.avgOrderValue || 0);

        // Update changes with real comparison data (with fallback for missing changes)
        const changes = metrics.changes || {};
        this.updateMetricChange('revenueChange', changes.revenueChange || 0);
        this.updateMetricChange('ordersChange', changes.ordersChange || 0);
        this.updateMetricChange('customersChange', changes.customersChange || 0);
        this.updateMetricChange('aovChange', changes.aovChange || 0);
    }

    updateMetricChange(elementId, change) {
        const element = document.getElementById(elementId);
        const isPositive = change >= 0;
        const displayChange = Math.abs(change) < 0.1 ? '0.0' : change.toFixed(1);
        element.textContent = `${isPositive ? '+' : ''}${displayChange}%`;
        element.className = `metric-change ${isPositive ? 'positive' : 'negative'}`;
    }

    updateCharts(revenueData, topProducts, comparisonRevenueData = null) {
        this.chartManager.updateCharts(revenueData, topProducts, comparisonRevenueData);
    }

    updateOrdersTable(orders) {
        const tbody = document.getElementById('ordersTableBody');
        tbody.innerHTML = '';

        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${order.number}</td>
                <td>${this.getCustomerName(order)}</td>
                <td>${this.wooAPI.formatDate(order.date_created)}</td>
                <td><span class="status-badge status-${order.status}">${this.formatStatus(order.status)}</span></td>
                <td>${this.wooAPI.formatCurrency(order.total)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    getCustomerName(order) {
        if (order.billing && (order.billing.first_name || order.billing.last_name)) {
            return `${order.billing.first_name} ${order.billing.last_name}`.trim();
        }
        return order.billing?.email || 'Guest';
    }

    formatStatus(status) {
        return status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    showLoading(message = 'Generating your analytics report...') {
        this.isLoading = true;
        document.getElementById('loading').style.display = 'flex';
        document.getElementById('loading').querySelector('p').textContent = message;
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('errorState').style.display = 'none';
        document.getElementById('welcomePage').style.display = 'none';
    }

    showDashboard() {
        this.isLoading = false;
        this.isWelcomeMode = false;
        document.getElementById('loading').style.display = 'none';
        document.getElementById('errorState').style.display = 'none';
        document.getElementById('welcomePage').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
    }

    showError(message) {
        this.isLoading = false;
        document.getElementById('loading').style.display = 'none';
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('welcomePage').style.display = 'none';
        document.getElementById('errorState').style.display = 'flex';
        document.getElementById('errorMessage').textContent = message;
    }


    applyDateRange() {
        const startDateInput = document.getElementById('startDate').value;
        const endDateInput = document.getElementById('endDate').value;
        
        if (!startDateInput || !endDateInput) {
            alert('Please select both start and end dates.');
            return;
        }
        
        this.currentStartDate = new Date(startDateInput);
        this.currentEndDate = new Date(endDateInput);
        
        // Clear active quick range button for custom range
        document.querySelectorAll('.quick-range-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        this.loadDashboardData();
    }

    updateComparisonVisibility() {
        const comparisonElements = document.querySelectorAll('.comparison-period');
        const comparisonDates = document.getElementById('comparisonDates');
        
        comparisonElements.forEach(el => {
            el.style.display = this.enableComparison ? 'block' : 'none';
        });
        
        comparisonDates.style.display = this.enableComparison ? 'block' : 'none';
        
        if (this.enableComparison) {
            // Set default comparison dates (previous period)
            const comparisonRange = this.wooAPI.getComparisonDateRange(this.currentStartDate, this.currentEndDate);
            document.getElementById('comparisonStartDate').value = this.wooAPI.formatDateForInput(comparisonRange.startDate);
            document.getElementById('comparisonEndDate').value = this.wooAPI.formatDateForInput(comparisonRange.endDate);
            
            this.loadDashboardData();
        }
    }

    updatePeriodLabel() {
        let label;
        if (this.currentPeriod === 'custom' && this.currentStartDate && this.currentEndDate) {
            label = this.wooAPI.formatDateRange(this.currentStartDate, this.currentEndDate);
        } else {
            // Use period-based labels
            const periodLabels = {
                'today': 'Today',
                'yesterday': 'Yesterday',
                'last-7': 'Last 7 Days',
                'mtd': 'Month to Date',
                'last-month': 'Last Month',
                'last-30': 'Last 30 Days',
                'ytd': 'Year to Date'
            };
            label = periodLabels[this.currentPeriod] || 'Selected Period';
        }
        
        const labelElement = document.getElementById('currentPeriodLabel');
        if (labelElement) {
            labelElement.textContent = label;
        }
    }

    initializeDateControls() {
        // Set initial state - expanded by default
        const content = document.getElementById('dateControlsContent');
        const toggleIcon = document.querySelector('.toggle-icon');
        
        if (content && toggleIcon) {
            content.classList.add('expanded');
            toggleIcon.style.transform = 'rotate(180deg)';
            this.isDateControlsVisible = true;
        }
    }

    toggleDateControls() {
        const content = document.getElementById('dateControlsContent');
        const toggleIcon = document.querySelector('.toggle-icon');
        
        content.classList.toggle('expanded');
        toggleIcon.classList.toggle('rotated');
    }

    showWelcomePage() {
        this.isWelcomeMode = true;
        document.getElementById('loading').style.display = 'none';
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('errorState').style.display = 'none';
        document.getElementById('welcomePage').style.display = 'block';
    }

    generateReport() {
        // Validate custom date range if selected
        if (this.currentPeriod === 'custom') {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            
            if (!startDate || !endDate) {
                alert('Please select both start and end dates for custom range.');
                return;
            }
            
            if (new Date(startDate) > new Date(endDate)) {
                alert('Start date must be before end date.');
                return;
            }
        }

        // Get report options
        this.comparisonEnabled = document.getElementById('includeComparison').checked;
        const includeCharts = document.getElementById('includeCharts').checked;
        const includeProducts = document.getElementById('includeProducts').checked;
        const includeOrders = document.getElementById('includeOrders').checked;

        // Store options for dashboard rendering
        this.reportOptions = {
            includeCharts,
            includeProducts,
            includeOrders
        };

        // Load dashboard data
        this.loadDashboardData();
    }

    updateDashboard(data) {
        // Update metrics
        this.updateMetrics(data.currentMetrics);
        
        // Update comparison visibility
        const comparisonElements = document.querySelectorAll('.comparison-period');
        comparisonElements.forEach(el => {
            el.style.display = this.comparisonEnabled ? 'inline' : 'none';
        });
        
        // Update charts if enabled
        if (!this.reportOptions || this.reportOptions.includeCharts !== false) {
            this.updateCharts(data.current, data.topProducts, data.comparison);
        }
        
        // Update orders table if enabled
        if (this.reportOptions && this.reportOptions.includeOrders) {
            this.updateOrdersTable(data.recentOrders || []);
        } else {
            // Hide orders section if not requested
            const ordersSection = document.querySelector('.recent-orders');
            if (ordersSection) {
                ordersSection.style.display = this.reportOptions?.includeOrders ? 'block' : 'none';
            }
        }
        
        // Update period label
        this.updatePeriodLabel();
        
        this.showDashboard();
    }

    hideLoading() {
        // This method is called by the existing code, so we need to keep it
        // but redirect to showDashboard for consistency
        this.showDashboard();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DashboardApp();
});
