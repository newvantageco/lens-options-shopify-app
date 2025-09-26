import React from 'react';
import { render } from 'react-dom';
import { AppProvider } from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';
import ProductBlock from './ProductBlock';

// Get product data from Shopify
const product = window.Shopify?.product || {
  id: '123456789',
  title: 'Sample Frame',
  handle: 'sample-frame',
  variants: [
    {
      id: '987654321',
      title: 'Default',
      price: '199.00',
    },
  ],
};

const selectedVariant = window.Shopify?.selectedVariant || product.variants[0];

const App = () => {
  return (
    <AppProvider i18n={enTranslations}>
      <ProductBlock product={product} selectedVariant={selectedVariant} />
    </AppProvider>
  );
};

// Render the app
const container = document.getElementById('lens-options-app');
if (container) {
  render(<App />, container);
} else {
  // Create container if it doesn't exist
  const newContainer = document.createElement('div');
  newContainer.id = 'lens-options-app';
  document.body.appendChild(newContainer);
  render(<App />, newContainer);
}
