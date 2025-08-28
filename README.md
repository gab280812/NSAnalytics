# WooCommerce Analytics Dashboard

A beautiful, modern analytics dashboard for WooCommerce stores that displays key metrics, charts, and insights about your e-commerce business.

## Features

- **Real-time Analytics**: Connect directly to your WooCommerce store via REST API
- **Beautiful Visualizations**: Interactive charts showing revenue trends and top products
- **Key Metrics**: Total revenue, orders, customers, and average order value
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Secure Configuration**: API credentials stored locally in browser
- **GitHub Pages Ready**: Deploy instantly to GitHub Pages

## Quick Start

### 1. WooCommerce Setup

First, enable the WooCommerce REST API on your store:

1. Go to **WooCommerce > Settings > Advanced > REST API**
2. Click **Add Key**
3. Set description (e.g., "Analytics Dashboard")
4. Set user to an administrator
5. Set permissions to **Read**
6. Click **Generate API Key**
7. Copy the **Consumer Key** and **Consumer Secret**

### 2. Deploy to GitHub Pages

1. Fork or clone this repository
2. Go to your repository settings
3. Navigate to **Pages** section
4. Set source to **Deploy from a branch**
5. Select **main** branch and **/ (root)** folder
6. Click **Save**
7. Your dashboard will be available at `https://yourusername.github.io/repository-name`

### 3. Configure the Dashboard

1. Open your deployed dashboard
2. Click **Configure API** button
3. Enter your store details:
   - **Store URL**: Your WooCommerce store URL (e.g., `https://yourstore.com`)
   - **Consumer Key**: The key from step 1
   - **Consumer Secret**: The secret from step 1
4. Click **Save Configuration**

## Dashboard Features

### Key Metrics Cards
- **Total Revenue**: Sum of all completed orders
- **Total Orders**: Number of orders in selected timeframe
- **Total Customers**: Unique customers who placed orders
- **Average Order Value**: Revenue divided by number of orders

### Charts
- **Revenue Over Time**: Line chart showing daily revenue trends
- **Top Products**: Doughnut chart displaying best-selling products by revenue

### Recent Orders Table
- Latest orders with customer info, status, and totals
- Real-time status updates
- Responsive design for mobile viewing

## Technical Details

### Architecture
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Charts**: Chart.js for beautiful visualizations
- **API**: WooCommerce REST API v3
- **Styling**: Modern CSS with gradients and animations
- **Icons**: Font Awesome

### Browser Support
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Security
- API credentials stored in browser localStorage only
- HTTPS required for production use
- Read-only API permissions recommended

## Customization

### Adding New Metrics
1. Modify `woocommerce-api.js` to fetch additional data
2. Update `app.js` to calculate new metrics
3. Add new metric cards to `index.html`
4. Style new elements in `styles.css`

### Custom Charts
1. Add new chart methods to `charts.js`
2. Create chart containers in `index.html`
3. Call chart methods from `app.js`

### Styling
- Modify CSS variables in `styles.css`
- Update color scheme in `charts.js`
- Customize responsive breakpoints

## Troubleshooting

### Common Issues

**"Unable to connect to WooCommerce API"**
- Verify your store URL is correct and includes `https://`
- Check that WooCommerce REST API is enabled
- Ensure Consumer Key and Secret are correct
- Verify your site has SSL certificate

**"CORS Error"**
- WooCommerce REST API requires same-origin requests or proper CORS setup
- For GitHub Pages, ensure your WooCommerce site allows cross-origin requests
- Consider using a proxy server for production deployments

**"No data showing"**
- Check that you have orders in the selected timeframe
- Verify API permissions are set to "Read"
- Check browser console for error messages

### API Rate Limits
- WooCommerce has built-in rate limiting
- Dashboard automatically handles rate limit responses
- Consider caching for high-traffic scenarios

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this dashboard for your projects!

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review WooCommerce REST API documentation
3. Open an issue on GitHub

---

**Note**: This dashboard requires a WooCommerce store with REST API enabled. API credentials are stored locally and never transmitted to third parties.
