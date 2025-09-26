import React, { useState } from 'react';
import {
  Frame,
  Navigation,
  TopBar,
  Toast,
  Loading,
} from '@shopify/polaris';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeMajor,
  ProductsMajor,
  OrdersMajor,
  AnalyticsMajor,
  SettingsMajor,
  PrescriptionMajor,
} from '@shopify/polaris-icons';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [toastProps, setToastProps] = useState<{
    content: string;
    error?: boolean;
  } | null>(null);

  const navigationItems = [
    {
      label: 'Dashboard',
      icon: HomeMajor,
      url: '/',
      selected: location.pathname === '/',
    },
    {
      label: 'Lens Flows',
      icon: ProductsMajor,
      url: '/lens-flows',
      selected: location.pathname.startsWith('/lens-flows'),
    },
    {
      label: 'Prescriptions',
      icon: PrescriptionMajor,
      url: '/prescriptions',
      selected: location.pathname.startsWith('/prescriptions'),
    },
    {
      label: 'Orders',
      icon: OrdersMajor,
      url: '/orders',
      selected: location.pathname.startsWith('/orders'),
    },
    {
      label: 'Analytics',
      icon: AnalyticsMajor,
      url: '/analytics',
      selected: location.pathname.startsWith('/analytics'),
    },
    {
      label: 'Settings',
      icon: SettingsMajor,
      url: '/settings',
      selected: location.pathname.startsWith('/settings'),
    },
  ];

  const handleNavigationToggle = () => {
    // Handle mobile navigation toggle if needed
  };

  const handleNavigationClick = (url: string) => {
    navigate(url);
  };

  const navigationMarkup = (
    <Navigation location="/">
      <Navigation.Section
        items={navigationItems.map((item) => ({
          ...item,
          onClick: () => handleNavigationClick(item.url),
        }))}
      />
    </Navigation>
  );

  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      onNavigationToggle={handleNavigationToggle}
    />
  );

  const toastMarkup = toastProps ? (
    <Toast
      content={toastProps.content}
      error={toastProps.error}
      onDismiss={() => setToastProps(null)}
    />
  ) : null;

  return (
    <Frame
      navigation={navigationMarkup}
      topBar={topBarMarkup}
      showMobileNavigation={false}
    >
      {isLoading && <Loading />}
      {children}
      {toastMarkup}
    </Frame>
  );
};

export default Layout;
