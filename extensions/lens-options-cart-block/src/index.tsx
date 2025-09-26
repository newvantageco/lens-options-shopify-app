import React from 'react';
import { render } from 'react-dom';
import { AppProvider } from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';
import CartBlock from './CartBlock';

// Get cart data from Shopify
const cart = window.Shopify?.cart || {
  items: [],
  totalPrice: 0,
  currency: 'USD',
};

const App = () => {
  return (
    <AppProvider i18n={enTranslations}>
      <CartBlock cart={cart} />
    </AppProvider>
  );
};

// Render the app
const container = document.getElementById('lens-options-cart');
if (container) {
  render(<App />, container);
} else {
  // Create container if it doesn't exist
  const newContainer = document.createElement('div');
  newContainer.id = 'lens-options-cart';
  document.body.appendChild(newContainer);
  render(<App />, newContainer);
}
