import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@shopify/polaris';
import { Provider as AppBridgeProvider } from '@shopify/app-bridge-react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import enTranslations from '@shopify/polaris/locales/en.json';

// Import pages
import Dashboard from './pages/Dashboard';
import LensFlows from './pages/LensFlows';
import LensFlowBuilder from './pages/LensFlowBuilder';
import Prescriptions from './pages/Prescriptions';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';

// Import components
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Import styles
import '@shopify/polaris/build/esm/styles.css';
import './App.css';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// App Bridge configuration
const appBridgeConfig = {
  apiKey: process.env.REACT_APP_SHOPIFY_API_KEY || '',
  shopOrigin: new URLSearchParams(window.location.search).get('shop') || '',
  forceRedirect: true,
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppBridgeProvider config={appBridgeConfig}>
          <AppProvider i18n={enTranslations}>
            <Router>
              <div className="App">
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/lens-flows" element={<LensFlows />} />
                    <Route path="/lens-flows/new" element={<LensFlowBuilder />} />
                    <Route path="/lens-flows/:id/edit" element={<LensFlowBuilder />} />
                    <Route path="/prescriptions" element={<Prescriptions />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </Layout>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#4CAF50',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      duration: 5000,
                      iconTheme: {
                        primary: '#F44336',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
              </div>
            </Router>
          </AppProvider>
        </AppBridgeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
