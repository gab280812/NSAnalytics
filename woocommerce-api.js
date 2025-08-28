class WooCommerceAPI {
    constructor() {
        // Hardcoded credentials for Nature's Seed store
        this.baseUrl = 'https://naturesseed.com/wp-json/wc/v3';
        this.consumerKey = 'ck_9629579f1379f272169de8628edddb00b24737f9';
        this.consumerSecret = 'cs_bf6dcf206d6ed26b83e55e8af62c16de26339815';
        this.isConfigured = true;
    }

    // Configuration methods removed - using hardcoded credentials

    async makeRequest(endpoint, params = {}) {
        if (!this.isConfigured) {
            throw new Error('API not configured. Please set up your WooCommerce credentials.');
        }

        const url = new URL(`${this.baseUrl}${endpoint}`);
        
        // Add authentication
        url.searchParams.append('consumer_key', this.consumerKey);
        url.searchParams.append('consumer_secret', this.consumerSecret);
        
        // Add additional parameters
        Object.keys(params).forEach(key => {
            url.searchParams.append(key, params[key]);
        });

        try {
            console.log('Making API request to:', url.toString());
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors'
            });

            console.log('API Response status:', response.status);
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('API Response data:', data);
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async getOrders(params = {}) {
        const defaultParams = {
            per_page: 100,
            orderby: 'date',
            order: 'desc',
            ...params
        };
        return await this.makeRequest('/orders', defaultParams);
    }

    async getOrdersInDateRange(startDate, endDate) {
        console.log('Getting orders for date range:', startDate, 'to', endDate);
        
        // Convert dates to ISO format if they're Date objects
        const afterDate = startDate instanceof Date ? startDate.toISOString() : startDate;
        const beforeDate = endDate instanceof Date ? endDate.toISOString() : endDate;
        
        console.log('Converted dates:', afterDate, 'to', beforeDate);
        
        return await this.getOrders({
            after: afterDate,
            before: beforeDate,
            per_page: 100
        });
    }

    async getProducts(params = {}) {
        const defaultParams = {
            per_page: 100,
            orderby: 'popularity',
            order: 'desc',
            ...params
        };
        return await this.makeRequest('/products', defaultParams);
    }

    async getCustomers(params = {}) {
        const defaultParams = {
            per_page: 100,
            orderby: 'registered_date',
            order: 'desc',
            ...params
        };
        return await this.makeRequest('/customers', defaultParams);
    }

    async getReports() {
        return await this.makeRequest('/reports');
    }

    async getSalesReport(period = 'week') {
        return await this.makeRequest(`/reports/sales`, { period });
    }

    async getTopSellers(period = 'week') {
        return await this.makeRequest(`/reports/top_sellers`, { period });
    }

    async testConnection() {
        try {
            await this.makeRequest('/system_status');
            return true;
        } catch (error) {
            return false;
        }
    }

    // Analytics helper methods
    calculateMetrics(orders) {
        console.log('Calculating metrics for orders:', orders?.length || 0);
        
        if (!orders || orders.length === 0) {
            return {
                totalRevenue: 0,
                totalOrders: 0,
                totalCustomers: 0,
                avgOrderValue: 0
            };
        }
        
        const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Get unique customers
        const uniqueCustomers = new Set();
        orders.forEach(order => {
            if (order.customer_id && order.customer_id !== 0) {
                uniqueCustomers.add(order.customer_id);
            } else if (order.billing && order.billing.email) {
                uniqueCustomers.add(order.billing.email);
            }
        });
        
        const metrics = {
            totalRevenue,
            totalOrders,
            totalCustomers: uniqueCustomers.size,
            avgOrderValue
        };
        
        console.log('Calculated metrics:', metrics);
        return metrics;
    }

    calculateMetricsWithComparison(currentMetrics, comparisonMetrics) {
        if (!comparisonMetrics) {
            return {
                ...currentMetrics,
                changes: {
                    revenueChange: 0,
                    ordersChange: 0,
                    customersChange: 0,
                    aovChange: 0
                }
            };
        }

        return {
            ...currentMetrics,
            changes: {
                revenueChange: this.calculatePercentageChange(currentMetrics.totalRevenue, comparisonMetrics.totalRevenue),
                ordersChange: this.calculatePercentageChange(currentMetrics.totalOrders, comparisonMetrics.totalOrders),
                customersChange: this.calculatePercentageChange(currentMetrics.totalCustomers, comparisonMetrics.totalCustomers),
                aovChange: this.calculatePercentageChange(currentMetrics.avgOrderValue, comparisonMetrics.avgOrderValue)
            }
        };
    }

    groupOrdersByDate(orders) {
        const grouped = {};
        
        orders.forEach(order => {
            const date = new Date(order.date_created).toDateString();
            if (!grouped[date]) {
                grouped[date] = {
                    date,
                    revenue: 0,
                    orders: 0
                };
            }
            grouped[date].revenue += parseFloat(order.total || 0);
            grouped[date].orders += 1;
        });

        return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    getTopProducts(orders, limit = 10) {
        const productSales = {};

        orders.forEach(order => {
            if (order.line_items) {
                order.line_items.forEach(item => {
                    const productId = item.product_id;
                    const productName = item.name;
                    const quantity = item.quantity;
                    const total = parseFloat(item.total || 0);

                    if (!productSales[productId]) {
                        productSales[productId] = {
                            name: productName,
                            quantity: 0,
                            revenue: 0
                        };
                    }

                    productSales[productId].quantity += quantity;
                    productSales[productId].revenue += total;
                });
            }
        });

        return Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);
    }

    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    }

    formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }

    formatDateRange(startDate, endDate) {
        const start = this.formatDate(startDate);
        const end = this.formatDate(endDate);
        return `${start} - ${end}`;
    }

    getDateRange(days) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        return { startDate, endDate };
    }

    getDateRangeByPeriod(period) {
        const now = new Date();
        let startDate, endDate;

        switch (period) {
            case 'ytd': // Year to Date
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date();
                break;
            
            case 'mtd': // Month to Date
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date();
                break;
            
            case 'thisweek': // This Week (Monday to Sunday)
                const dayOfWeek = now.getDay();
                const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                startDate = new Date(now);
                startDate.setDate(now.getDate() + mondayOffset);
                endDate = new Date();
                break;
            
            case 'lastweek': // Last Week
                const lastWeekEnd = new Date(now);
                lastWeekEnd.setDate(now.getDate() - now.getDay());
                lastWeekEnd.setDate(lastWeekEnd.getDate() - 1); // Last Sunday
                
                const lastWeekStart = new Date(lastWeekEnd);
                lastWeekStart.setDate(lastWeekEnd.getDate() - 6); // Last Monday
                
                startDate = lastWeekStart;
                endDate = lastWeekEnd;
                break;
            
            case 'lastmonth': // Last Month
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            
            case 'last30': // Last 30 days
            default:
                return this.getDateRange(30);
        }

        return { startDate, endDate };
    }

    getDateRange(period) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let startDate, endDate;

        switch (period) {
            case 'today':
                startDate = new Date(today);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'yesterday':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 1);
                endDate = new Date(startDate);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'mtd':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'ytd':
                startDate = new Date(today.getFullYear(), 0, 1);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'last-month':
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                startDate = new Date(lastMonth);
                endDate = new Date(lastMonthEnd);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'last-30':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 29);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'last-7':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 6);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                break;
            default:
                // Default to today
                startDate = new Date(today);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
        }

        return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        };
    }

    getComparisonDateRange(period, comparisonType) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let startDate, endDate;

        if (comparisonType === 'last-year') {
            // Get same period from last year
            const currentRange = this.getDateRange(period);
            const currentStart = new Date(currentRange.startDate);
            const currentEnd = new Date(currentRange.endDate);
            
            startDate = new Date(currentStart);
            startDate.setFullYear(currentStart.getFullYear() - 1);
            endDate = new Date(currentEnd);
            endDate.setFullYear(currentEnd.getFullYear() - 1);
        } else {
            // Last period logic
            switch (period) {
                case 'today':
                    // Compare to yesterday
                    startDate = new Date(today);
                    startDate.setDate(today.getDate() - 1);
                    endDate = new Date(startDate);
                    break;
                case 'yesterday':
                    // Compare to day before yesterday
                    startDate = new Date(today);
                    startDate.setDate(today.getDate() - 2);
                    endDate = new Date(startDate);
                    break;
                case 'mtd':
                    // Compare to last month (same days)
                    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                    startDate = new Date(lastMonthStart);
                    endDate = new Date(lastMonthEnd);
                    break;
                case 'ytd':
                    // Compare to same period last year
                    startDate = new Date(today.getFullYear() - 1, 0, 1);
                    endDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
                    break;
                case 'last-month':
                    // Compare to month before last month
                    const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);
                    const twoMonthsAgoEnd = new Date(today.getFullYear(), today.getMonth() - 1, 0);
                    startDate = new Date(twoMonthsAgo);
                    endDate = new Date(twoMonthsAgoEnd);
                    break;
                case 'last-30':
                    // Compare to 30 days before that period
                    startDate = new Date(today);
                    startDate.setDate(today.getDate() - 59);
                    endDate = new Date(today);
                    endDate.setDate(today.getDate() - 30);
                    break;
                case 'last-7':
                    // Compare to 7 days before that period
                    startDate = new Date(today);
                    startDate.setDate(today.getDate() - 13);
                    endDate = new Date(today);
                    endDate.setDate(today.getDate() - 7);
                    break;
                default:
                    // Fallback to previous period
                    startDate = new Date(today);
                    startDate.setDate(today.getDate() - 1);
                    endDate = new Date(startDate);
            }
        }

        endDate.setHours(23, 59, 59, 999);
        return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        };
    }

    async getOrdersWithComparison(startDate, endDate, enableComparison = false, comparisonStartDate = null, comparisonEndDate = null) {
        try {
            console.log('getOrdersWithComparison called with:', { startDate, endDate, enableComparison });
            
            const currentOrders = await this.getOrdersInDateRange(new Date(startDate), new Date(endDate));
            console.log('Current orders received:', currentOrders?.length || 0);
            
            let comparisonOrders = [];
            let comparisonMetrics = null;
            
            if (enableComparison) {
                let comparisonRange;
                
                if (comparisonStartDate && comparisonEndDate) {
                    // Use custom comparison dates
                    comparisonRange = {
                        startDate: comparisonStartDate,
                        endDate: comparisonEndDate
                    };
                } else {
                    // Use automatic previous period
                    comparisonRange = this.getComparisonDateRange(startDate, endDate);
                }
                
                comparisonOrders = await this.getOrdersInDateRange(new Date(comparisonRange.startDate), new Date(comparisonRange.endDate));
                comparisonMetrics = this.calculateMetrics(comparisonOrders);
            }
            
            const result = {
                current: currentOrders,
                comparison: comparisonOrders,
                currentMetrics: this.calculateMetrics(currentOrders),
                comparisonMetrics
            };
            
            console.log('getOrdersWithComparison result:', result);
            return result;
        } catch (error) {
            console.error('Error in getOrdersWithComparison:', error);
            throw error;
        }
    }
}

// Create global instance
window.wooAPI = new WooCommerceAPI();
