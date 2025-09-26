import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Page, Card, Button, Text, Banner } from '@shopify/polaris';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Page title="Something went wrong">
          <Card sectioned>
            <Banner status="critical" title="An error occurred">
              <p>
                We're sorry, but something went wrong. Please try refreshing the page.
                If the problem persists, please contact support.
              </p>
            </Banner>
            
            <div style={{ marginTop: '20px' }}>
              <Button primary onClick={this.handleReload}>
                Reload Page
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={{ marginTop: '20px' }}>
                <Text variant="headingMd" as="h3">
                  Error Details (Development Only)
                </Text>
                <pre style={{ 
                  background: '#f6f6f7', 
                  padding: '10px', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '12px'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}
          </Card>
        </Page>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
