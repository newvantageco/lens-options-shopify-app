# 🚀 CI/CD Setup Guide - Lens Options Shopify App

This document provides a comprehensive guide for setting up and using the CI/CD pipeline for the Lens Options Shopify App.

## 📋 **Overview**

The CI/CD pipeline includes:
- **Automated Testing** - Unit, integration, and E2E tests
- **Code Quality** - ESLint, Prettier, TypeScript checks
- **Security Scanning** - Dependency audits and vulnerability checks
- **Performance Testing** - Lighthouse CI and performance monitoring
- **Accessibility Testing** - Automated accessibility checks
- **Deployment** - Automated deployment to staging and production
- **Dependency Management** - Automated dependency updates

## 🔧 **Workflows**

### 1. **CI Pipeline** (`ci.yml`)
**Triggers:** Push to main/develop, Pull requests
**Jobs:**
- Lint & Format Check
- Backend Tests (with MongoDB)
- Frontend Tests
- Build Shopify App
- Security Scan
- Deploy to Staging (develop branch)
- Deploy to Production (main branch)
- Performance Tests

### 2. **Code Quality** (`code-quality.yml`)
**Triggers:** Push to main/develop, Pull requests
**Jobs:**
- Code Quality Checks (ESLint, Prettier, TypeScript)
- Unit Tests (Backend & Frontend)
- Integration Tests
- E2E Tests
- Performance Tests (Lighthouse CI)
- Accessibility Tests
- Test Summary

### 3. **Shopify Deployment** (`shopify-deploy.yml`)
**Triggers:** Tags (v*), Manual dispatch
**Jobs:**
- Deploy to Shopify App Store
- Generate app URLs
- Create releases
- Notify deployment status

### 4. **Dependency Updates** (`dependency-update.yml`)
**Triggers:** Weekly schedule, Manual dispatch
**Jobs:**
- Update Dependencies
- Security Audit
- License Check
- Create Pull Requests

### 5. **Environment Setup** (`environment-setup.yml`)
**Triggers:** Manual dispatch
**Jobs:**
- Setup/Teardown environments
- Database migrations
- AWS S3 setup
- Shopify app configuration

## 🔐 **Required Secrets**

Add these secrets to your GitHub repository:

### **Shopify Secrets**
```
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders
SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com
SHOPIFY_CLI_THEME_TOKEN=your_theme_token
```

### **Deployment Secrets**
```
STAGING_DEPLOY_KEY=your_staging_deploy_key
PRODUCTION_DEPLOY_KEY=your_production_deploy_key
```

### **Security & Monitoring**
```
SNYK_TOKEN=your_snyk_token
SLACK_WEBHOOK=your_slack_webhook_url
EMAIL_USERNAME=your_email_username
EMAIL_PASSWORD=your_email_password
NOTIFICATION_EMAIL=notifications@newvantageco.com
```

### **Performance Testing**
```
LHCI_GITHUB_APP_TOKEN=your_lighthouse_ci_token
```

## 🛠️ **Setup Instructions**

### 1. **Enable GitHub Actions**
1. Go to your repository settings
2. Navigate to "Actions" → "General"
3. Enable "Allow all actions and reusable workflows"

### 2. **Configure Environments**
1. Go to "Settings" → "Environments"
2. Create environments: `staging`, `production`
3. Add environment-specific secrets
4. Configure protection rules if needed

### 3. **Set up Branch Protection**
1. Go to "Settings" → "Branches"
2. Add rule for `main` branch:
   - Require status checks to pass
   - Require branches to be up to date
   - Require pull request reviews
   - Restrict pushes to matching branches

### 4. **Configure Dependencies**
1. Install required packages:
   ```bash
   npm install --save-dev eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin
   npm install --save-dev jest @types/jest supertest
   npm install --save-dev @lhci/cli
   ```

2. Create configuration files:
   - `.eslintrc.js`
   - `.prettierrc`
   - `jest.config.js`
   - `lighthouse.config.js`

## 📊 **Monitoring & Notifications**

### **Slack Integration**
- Deployment notifications
- Test failure alerts
- Security vulnerability reports

### **Email Notifications**
- Critical deployment failures
- Security alerts
- Performance degradation

### **GitHub Notifications**
- Pull request status updates
- Release notifications
- Issue and PR comments

## 🧪 **Testing Strategy**

### **Unit Tests**
- Backend: Jest with MongoDB in-memory
- Frontend: Vitest with React Testing Library
- Coverage: Minimum 80% code coverage

### **Integration Tests**
- API endpoint testing
- Database integration
- External service mocking

### **E2E Tests**
- User journey testing
- Cross-browser compatibility
- Mobile responsiveness

### **Performance Tests**
- Lighthouse CI for web vitals
- Load testing with Artillery
- Memory and CPU profiling

### **Accessibility Tests**
- WCAG 2.1 AA compliance
- Screen reader compatibility
- Keyboard navigation

## 🚀 **Deployment Process**

### **Staging Deployment**
1. Push to `develop` branch
2. CI pipeline runs automatically
3. Tests must pass
4. Deploy to staging environment
5. Notify team via Slack

### **Production Deployment**
1. Create release tag (`v1.0.0`)
2. CI pipeline runs automatically
3. All tests must pass
4. Deploy to production
5. Create GitHub release
6. Notify stakeholders

### **Rollback Process**
1. Identify the issue
2. Revert to previous stable version
3. Deploy rollback
4. Investigate and fix
5. Re-deploy when ready

## 📈 **Performance Monitoring**

### **Lighthouse CI**
- Performance score > 90
- Accessibility score > 95
- Best practices score > 90
- SEO score > 90

### **Core Web Vitals**
- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1

## 🔒 **Security Best Practices**

### **Dependency Management**
- Weekly security audits
- Automated dependency updates
- License compliance checking
- Vulnerability scanning

### **Code Security**
- ESLint security rules
- Secret scanning
- Dependency vulnerability checks
- Regular security reviews

## 📝 **Troubleshooting**

### **Common Issues**

1. **Tests Failing**
   - Check test environment setup
   - Verify database connections
   - Review test data setup

2. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Review build configuration

3. **Deployment Issues**
   - Verify environment secrets
   - Check deployment permissions
   - Review deployment logs

### **Debug Commands**
```bash
# Run tests locally
npm test
npm run test:integration
npm run test:e2e

# Check code quality
npm run lint
npm run format:check
npm run type-check

# Build locally
npm run build
cd frontend && npm run build
```

## 📚 **Additional Resources**

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Shopify CLI Documentation](https://shopify.dev/tools/cli)
- [Jest Testing Framework](https://jestjs.io/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [ESLint Configuration](https://eslint.org/docs/user-guide/configuring/)

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all tests pass
5. Submit a pull request

The CI/CD pipeline will automatically run tests and checks on your pull request.

---

**Need Help?** Contact the development team at dev@newvantageco.com
