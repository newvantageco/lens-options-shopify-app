# 🕶️ Lens Options - Shopify App

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Shopify](https://img.shields.io/badge/Shopify-App-purple.svg)](https://shopify.dev/)

A comprehensive Shopify app for prescription lens selection and customization, similar to LensAdvisor. This app allows customers to select prescription lenses, upload prescriptions, and bundle frames with lenses seamlessly.

## 🚀 **Live Demo**
- **Test Server**: http://localhost:3001
- **GitHub Repository**: https://github.com/newvantageco/lens-options-shopify-app
- **Documentation**: See [PRESCRIPTION_FEATURES.md](./PRESCRIPTION_FEATURES.md)

## Features

### Core Functionality
- **Lens Flow Builder**: Create custom lens selection flows with drag-and-drop interface
- **Prescription Handling**: Upload, manual entry, and validation of prescription data
- **Cart Bundling**: Automatic bundling of frames and lenses in cart
- **Multi-language Support**: Built-in translation system
- **Analytics Integration**: Google Analytics 4 and Facebook Pixel support

### Prescription Types
- Single Vision
- Progressive
- Reading
- Non-Prescription
- Frame Only

### Lens Types
- Clear lenses
- Blue-light-blocking
- Photochromic (light-sensitive)
- Non-polarized sunglasses
- Polarized sunglasses

### Compliance
- **HIPAA Compliant**: Encrypted prescription data storage
- **GDPR Compliant**: Data anonymization and deletion
- **PIPEDA Compliant**: Canadian privacy law compliance

## 📦 **Installation**

### Prerequisites
- Node.js 18+ 
- MongoDB
- Redis (optional, for caching)
- AWS S3 (for file uploads)
- Shopify Partner account

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/newvantageco/lens-options-shopify-app.git
   cd lens-options-shopify-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Shopify App Configuration
   SHOPIFY_API_KEY=your_api_key
   SHOPIFY_API_SECRET=your_api_secret
   SHOPIFY_SCOPES=write_products,read_products,write_orders,read_orders,write_customers,read_customers,write_script_tags,read_script_tags,write_themes,read_themes,write_files,read_files
   SHOPIFY_APP_URL=https://your-app-url.com
   
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/lens-options
   
   # AWS Configuration
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your-s3-bucket
   
   # Security
   JWT_SECRET=your_jwt_secret_key
   ENCRYPTION_KEY=your_encryption_key_32_chars
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB
   mongod
   
   # The app will automatically create the necessary collections
   ```

5. **Development Server**
   ```bash
   # Backend
   npm run dev
   
   # Frontend (in another terminal)
   cd frontend && npm run dev
   ```

## Usage

### Creating a Lens Flow

1. **Access the App**: Install the app in your Shopify store
2. **Create Flow**: Go to "Lens Flows" → "Create Lens Flow"
3. **Configure Steps**:
   - Add prescription types
   - Create lens groups
   - Add lenses with options and pricing
   - Configure add-ons
4. **Assign Products**: Link the flow to specific products or collections
5. **Customize**: Add custom CSS/JS for styling and behavior

### Product Integration

The app automatically adds a "Select Lenses" button to products that have an assigned lens flow. Customers can:

1. Select prescription type
2. Choose lens type and options
3. Enter prescription details or upload prescription
4. Review selection and add to cart

### Cart Bundling

The app supports three bundling modes:

1. **Standard Bundling**: Separate line items kept in sync
2. **Native Bundling**: Combined into single cart row (preferred)
3. **Single Lineitem Bundling**: Shopify Plus only, truly single line item

## API Documentation

### Authentication
All API requests require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints

#### Lens Flows
- `GET /api/lens-flows` - Get all lens flows
- `POST /api/lens-flows` - Create new lens flow
- `GET /api/lens-flows/:id` - Get specific lens flow
- `PUT /api/lens-flows/:id` - Update lens flow
- `DELETE /api/lens-flows/:id` - Delete lens flow

#### Prescriptions
- `GET /api/prescriptions` - Get prescriptions
- `POST /api/prescriptions` - Create prescription
- `POST /api/prescriptions/:id/upload` - Upload prescription files
- `POST /api/prescriptions/:id/validate` - Validate prescription

#### Orders
- `GET /api/orders` - Get orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/tracking` - Add tracking information

## Customization

### CSS Injection
Add custom CSS in the app settings:
```css
.lens-options-modal {
  border-radius: 12px;
}

.lens-options-btn-primary {
  background: #your-brand-color;
}
```

### JavaScript Injection
Add custom JavaScript for advanced functionality:
```javascript
// Custom event handling
LensOptions.on('lensOptions:lens:selected', function(data) {
  console.log('Lens selected:', data);
  // Your custom logic here
});

// Custom validation
LensOptions.on('lensOptions:prescription:validate', function(data) {
  // Custom validation logic
  return { isValid: true, errors: [] };
});
```

### Event System
The app provides a comprehensive event system:

```javascript
// Available events
LensOptions.EVENTS = {
  INIT_START: 'lensOptions:init:start',
  INIT_COMPLETE: 'lensOptions:init:complete',
  PRESCRIPTION_TYPE_CHANGE: 'lensOptions:prescriptionType:change',
  LENS_SELECTED: 'lensOptions:lens:selected',
  CART_ADD_SUCCESS: 'lensOptions:cart:add:success',
  // ... and more
};

// Event listeners
LensOptions.on(LensOptions.EVENTS.LENS_SELECTED, function(data) {
  // Handle lens selection
});
```

## Analytics Integration

### Google Analytics 4
```javascript
// Automatic page view tracking
LensOptions.analytics.trackPageView('/lensadvisor/select_prescription_type');

// Custom event tracking
LensOptions.analytics.trackEvent('lens_selected', {
  lens_type: 'progressive',
  price: 150
});
```

### Facebook Pixel
```javascript
// Automatic conversion tracking
LensOptions.analytics.trackConversion(199.99, 'USD');
```

## Deployment

### Production Setup

1. **Environment Variables**
   - Set all production environment variables
   - Use secure, randomly generated secrets
   - Configure proper database and AWS credentials

2. **Database**
   - Use MongoDB Atlas or self-hosted MongoDB
   - Enable authentication and SSL
   - Set up regular backups

3. **File Storage**
   - Configure AWS S3 with proper permissions
   - Enable server-side encryption
   - Set up CloudFront for CDN (optional)

4. **Security**
   - Enable HTTPS
   - Configure CORS properly
   - Set up rate limiting
   - Use environment-specific secrets

### Shopify App Store Submission

1. **App Review Requirements**
   - Complete app functionality
   - Proper error handling
   - User-friendly interface
   - Clear documentation

2. **Privacy Policy**
   - HIPAA compliance statement
   - Data handling practices
   - User rights and controls

3. **Support Documentation**
   - Installation guide
   - User manual
   - FAQ section
   - Contact information

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Email: support@lensoptions.com
- Documentation: https://docs.lensoptions.com
- GitHub Issues: https://github.com/lensoptions/app/issues

## 📚 **Documentation**

- [PRESCRIPTION_FEATURES.md](./PRESCRIPTION_FEATURES.md) - Complete prescription system documentation
- [PRESCRIPTION_VERIFICATION.md](./PRESCRIPTION_VERIFICATION.md) - Verification checklist
- [TEST_RESULTS.md](./TEST_RESULTS.md) - Testing results and status

## 🤝 **Contributing**

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏢 **About New Vantage Co**

This project is developed by [New Vantage Co](https://www.newvantageco.com) - a leading provider of innovative e-commerce solutions.

## 📞 **Support**

For support, email support@newvantageco.com or create an issue in this repository.

## 📝 **Changelog**

### Version 1.0.0
- Initial release
- Core lens flow functionality
- Prescription handling
- Cart bundling
- Analytics integration
- Multi-language support
- HIPAA/GDPR compliance
- New Vantage Co inspired styling
