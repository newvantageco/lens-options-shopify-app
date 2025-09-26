# 🧪 **Testing Guide - Lens Options Shopify App**

This guide shows you how to interact with and test your Lens Options Shopify App before launching it to production.

## 🚀 **Current Status**
- ✅ **Test Server Running**: http://localhost:3001
- ✅ **All APIs Functional**: Prescriptions, Orders, Lens Flows, Settings
- ✅ **Frontend Ready**: React app with Polaris UI
- ✅ **Extensions Ready**: Product and Cart blocks

---

## 🌐 **1. Web Interface Testing**

### **Main Test Server**
```bash
# Your test server is already running at:
http://localhost:3001
```

**Available Pages:**
- **Health Check**: http://localhost:3001/health
- **API Documentation**: http://localhost:3001/api
- **Static Files**: http://localhost:3001/lens-options.js
- **CSS Styling**: http://localhost:3001/lens-options.css

### **Frontend Development Server**
```bash
# Start the React frontend (in a new terminal)
cd frontend
npm run dev
# Opens at: http://localhost:5173
```

---

## 🔧 **2. API Testing**

### **Using cURL Commands**

#### **Health Check**
```bash
curl http://localhost:3001/health
```

#### **Prescription API**
```bash
# Get all prescriptions
curl http://localhost:3001/api/prescriptions

# Create a new prescription
curl -X POST http://localhost:3001/api/prescriptions \
  -H "Content-Type: application/json" \
  -d '{
    "prescriptionType": "single-vision",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "odSphere": "-2.00",
    "osSphere": "-2.00",
    "pd": "64"
  }'

# Get specific prescription
curl http://localhost:3001/api/prescriptions/1
```

#### **Lens Flows API**
```bash
# Get all lens flows
curl http://localhost:3001/api/lens-flows

# Create a new lens flow
curl -X POST http://localhost:3001/api/lens-flows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Collection",
    "description": "High-end lens options",
    "isActive": true
  }'
```

#### **Orders API**
```bash
# Get all orders
curl http://localhost:3001/api/orders

# Create a new order
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "LO-001",
    "customerEmail": "customer@example.com",
    "totalPrice": 199.99,
    "status": "pending"
  }'
```

### **Using Postman/Insomnia**
1. Import the API collection (see below)
2. Set base URL: `http://localhost:3001`
3. Test all endpoints interactively

---

## 🎨 **3. Frontend Testing**

### **Start Frontend Development Server**
```bash
cd frontend
npm install
npm run dev
```

**Available at**: http://localhost:5173

**Pages to Test:**
- **Dashboard**: Overview and analytics
- **Lens Flows**: Create and manage lens flows
- **Prescriptions**: View and manage prescriptions
- **Orders**: Order management interface
- **Settings**: App configuration
- **Analytics**: Performance metrics

### **Frontend Features to Test:**
- ✅ **Navigation**: Between different pages
- ✅ **Forms**: Create lens flows, prescriptions
- ✅ **Modals**: View details, validation
- ✅ **Responsive Design**: Mobile and desktop
- ✅ **Polaris Components**: Buttons, cards, forms

---

## 🛍️ **4. Shopify Integration Testing**

### **Product Block Extension**
```bash
# Test the product block component
cd extensions/lens-options-product-block
npm install
npm run dev
```

**Features to Test:**
- ✅ **Prescription Type Selection**: Single Vision, Progressive, etc.
- ✅ **Lens Selection**: Choose from available lenses
- ✅ **Prescription Entry**: Manual entry form
- ✅ **File Upload**: Upload prescription images
- ✅ **Add to Cart**: Bundle frame and lens

### **Cart Block Extension**
```bash
# Test the cart block component
cd extensions/lens-options-cart-block
npm install
npm run dev
```

**Features to Test:**
- ✅ **Bundling Display**: Show frame + lens bundle
- ✅ **Price Calculation**: Total with lens options
- ✅ **Modification**: Edit lens selection
- ✅ **Removal**: Remove lens from bundle

---

## 🧪 **5. Automated Testing**

### **Run Test Suite**
```bash
# Backend tests
npm test

# Frontend tests
cd frontend
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### **Code Quality Checks**
```bash
# Linting
npm run lint
cd frontend && npm run lint

# Formatting
npm run format:check
cd frontend && npm run format:check

# Type checking
cd frontend && npm run type-check
```

---

## 📱 **6. Mobile Testing**

### **Responsive Design**
1. Open browser developer tools
2. Toggle device toolbar
3. Test on different screen sizes:
   - iPhone (375px)
   - iPad (768px)
   - Desktop (1200px+)

### **Touch Interactions**
- Tap buttons and links
- Scroll through forms
- Test file upload on mobile
- Check modal interactions

---

## 🔒 **7. Security Testing**

### **Authentication Testing**
```bash
# Test protected endpoints
curl -H "Authorization: Bearer invalid-token" \
  http://localhost:3001/api/prescriptions
# Should return 401 Unauthorized
```

### **Input Validation**
```bash
# Test with invalid data
curl -X POST http://localhost:3001/api/prescriptions \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
# Should return validation errors
```

### **File Upload Security**
- Test with non-image files
- Test with oversized files
- Test with malicious file names

---

## 📊 **8. Performance Testing**

### **Load Testing**
```bash
# Install Artillery for load testing
npm install -g artillery

# Run load test
artillery quick --count 10 --num 5 http://localhost:3001/health
```

### **Performance Monitoring**
- Check response times
- Monitor memory usage
- Test with large datasets
- Check database query performance

---

## 🎯 **9. User Journey Testing**

### **Complete Customer Flow**
1. **Product Page**: Select frame
2. **Lens Selection**: Choose prescription type
3. **Prescription Entry**: Enter or upload prescription
4. **Add to Cart**: Bundle frame and lens
5. **Cart Review**: Verify selection and pricing
6. **Checkout**: Complete purchase

### **Admin Flow**
1. **Login**: Access admin interface
2. **Dashboard**: View analytics
3. **Prescriptions**: Review and validate
4. **Orders**: Process orders
5. **Settings**: Configure app

---

## 🛠️ **10. Development Tools**

### **Browser Developer Tools**
- **Console**: Check for JavaScript errors
- **Network**: Monitor API calls
- **Application**: Check local storage
- **Performance**: Profile app performance

### **Database Testing**
```bash
# If you have MongoDB running
mongo
use lens-options-test
db.prescriptions.find()
db.orders.find()
db.lensflows.find()
```

### **Log Monitoring**
```bash
# Check server logs
tail -f logs/app.log

# Monitor real-time requests
curl -N http://localhost:3001/health
```

---

## 🚀 **11. Pre-Launch Checklist**

### **Functionality**
- [ ] All API endpoints working
- [ ] Frontend pages loading correctly
- [ ] Forms submitting successfully
- [ ] File uploads working
- [ ] Cart bundling functional
- [ ] Prescription validation working

### **UI/UX**
- [ ] Responsive design on all devices
- [ ] Polaris components rendering correctly
- [ ] New Vantage Co styling applied
- [ ] Loading states working
- [ ] Error handling in place
- [ ] Success messages showing

### **Performance**
- [ ] Page load times < 3 seconds
- [ ] API response times < 500ms
- [ ] No memory leaks
- [ ] Efficient database queries
- [ ] Optimized images and assets

### **Security**
- [ ] Input validation working
- [ ] Authentication protecting routes
- [ ] File upload security
- [ ] HTTPS ready
- [ ] No sensitive data exposed

---

## 📞 **12. Getting Help**

### **Debugging Tips**
1. **Check Console**: Browser and server logs
2. **Network Tab**: Monitor API requests
3. **Test Server Logs**: Real-time request monitoring
4. **Database State**: Verify data persistence

### **Common Issues**
- **Port Conflicts**: Use different ports if needed
- **CORS Errors**: Check API configuration
- **File Upload Issues**: Verify multer configuration
- **Database Connection**: Ensure MongoDB is running

### **Support Resources**
- **Documentation**: See README.md and other docs
- **GitHub Issues**: Create issues for bugs
- **Test Server**: Use for debugging
- **Development Tools**: Browser dev tools

---

## 🎉 **Ready to Launch!**

Once you've completed all testing:
1. **Fix any issues** found during testing
2. **Set up production environment**
3. **Configure production secrets**
4. **Deploy to Shopify App Store**
5. **Monitor performance** in production

Your Lens Options Shopify App is ready for launch! 🚀
