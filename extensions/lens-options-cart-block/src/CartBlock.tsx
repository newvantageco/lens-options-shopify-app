import React, { useState, useEffect } from 'react';
import {
  Banner,
  Button,
  Card,
  Modal,
  Page,
  Spinner,
  Text,
  Layout,
  Stack,
  Badge,
  Divider,
  Thumbnail,
} from '@shopify/polaris';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';

interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  quantity: number;
  price: number;
  properties: Record<string, string>;
  image?: string;
}

interface CartBlockProps {
  cart: {
    items: CartItem[];
    totalPrice: number;
    currency: string;
  };
}

const CartBlock: React.FC<CartBlockProps> = ({ cart }) => {
  const [bundledItems, setBundledItems] = useState<Record<string, CartItem[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useAuthenticatedFetch();

  useEffect(() => {
    // Group items by bundle
    const bundles: Record<string, CartItem[]> = {};
    
    cart.items.forEach(item => {
      const bundleId = item.properties._bundleId || item.id;
      if (!bundles[bundleId]) {
        bundles[bundleId] = [];
      }
      bundles[bundleId].push(item);
    });
    
    setBundledItems(bundles);
  }, [cart.items]);

  const getBundleType = (items: CartItem[]) => {
    const hasFrame = items.some(item => item.properties._productType === 'frame');
    const hasLens = items.some(item => item.properties._productType === 'lens');
    const hasAddOns = items.some(item => item.properties._productType === 'addon');
    
    if (hasFrame && hasLens) {
      return 'frame-lens-bundle';
    } else if (hasLens && hasAddOns) {
      return 'lens-addon-bundle';
    } else if (hasFrame && hasAddOns) {
      return 'frame-addon-bundle';
    }
    
    return 'single-item';
  };

  const getBundleTitle = (items: CartItem[]) => {
    const frameItem = items.find(item => item.properties._productType === 'frame');
    const lensItem = items.find(item => item.properties._productType === 'lens');
    
    if (frameItem && lensItem) {
      return `${frameItem.title} + ${lensItem.title}`;
    }
    
    return items[0]?.title || 'Bundle';
  };

  const getBundleImage = (items: CartItem[]) => {
    const frameItem = items.find(item => item.properties._productType === 'frame');
    return frameItem?.image || items[0]?.image;
  };

  const getBundlePrice = (items: CartItem[]) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleRemoveBundle = async (bundleId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const itemsToRemove = bundledItems[bundleId];
      
      // Remove all items in the bundle
      for (const item of itemsToRemove) {
        await fetch('/api/cart/remove', {
          method: 'POST',
          body: JSON.stringify({ itemId: item.id }),
        });
      }
      
      // Refresh cart
      window.location.reload();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove items');
    } finally {
      setIsLoading(false);
    }
  };

  const renderBundle = (bundleId: string, items: CartItem[]) => {
    const bundleType = getBundleType(items);
    const bundleTitle = getBundleTitle(items);
    const bundleImage = getBundleImage(items);
    const bundlePrice = getBundlePrice(items);
    const quantity = items[0]?.quantity || 1;

    return (
      <Card key={bundleId} sectioned>
        <Stack>
          <Stack.Item fill>
            <Stack>
              {bundleImage && (
                <Thumbnail
                  source={bundleImage}
                  alt={bundleTitle}
                  size="medium"
                />
              )}
              <Stack.Item fill>
                <Stack vertical>
                  <Text variant="bodyMd" fontWeight="bold">
                    {bundleTitle}
                  </Text>
                  <Badge status="info">
                    {bundleType === 'frame-lens-bundle' && 'Frame + Lens Bundle'}
                    {bundleType === 'lens-addon-bundle' && 'Lens + Add-ons'}
                    {bundleType === 'frame-addon-bundle' && 'Frame + Add-ons'}
                    {bundleType === 'single-item' && 'Single Item'}
                  </Badge>
                  
                  {/* Show lens details */}
                  {items.map(item => {
                    if (item.properties._productType === 'lens') {
                      return (
                        <div key={item.id}>
                          <Text variant="bodySm" color="subdued">
                            Lens: {item.properties._lensName || item.title}
                          </Text>
                          {item.properties._lensType && (
                            <Text variant="bodySm" color="subdued">
                              Type: {item.properties._lensType}
                            </Text>
                          )}
                          {item.properties._prescriptionType && (
                            <Text variant="bodySm" color="subdued">
                              Prescription: {item.properties._prescriptionType}
                            </Text>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}
                  
                  {/* Show add-ons */}
                  {items
                    .filter(item => item.properties._productType === 'addon')
                    .map(item => (
                      <Text key={item.id} variant="bodySm" color="subdued">
                        + {item.title}
                      </Text>
                    ))}
                </Stack>
              </Stack.Item>
            </Stack>
          </Stack.Item>
          
          <Stack.Item>
            <Stack vertical alignment="trailing">
              <Text variant="bodyMd" fontWeight="bold">
                ${bundlePrice.toFixed(2)}
              </Text>
              <Text variant="bodySm" color="subdued">
                Qty: {quantity}
              </Text>
              <Button
                size="slim"
                destructive
                onClick={() => handleRemoveBundle(bundleId)}
                loading={isLoading}
              >
                Remove
              </Button>
            </Stack>
          </Stack.Item>
        </Stack>
      </Card>
    );
  };

  const renderSingleItem = (item: CartItem) => {
    return (
      <Card key={item.id} sectioned>
        <Stack>
          <Stack.Item fill>
            <Stack>
              {item.image && (
                <Thumbnail
                  source={item.image}
                  alt={item.title}
                  size="medium"
                />
              )}
              <Stack.Item fill>
                <Stack vertical>
                  <Text variant="bodyMd" fontWeight="bold">
                    {item.title}
                  </Text>
                  {item.properties._productType && (
                    <Badge>
                      {item.properties._productType}
                    </Badge>
                  )}
                </Stack>
              </Stack.Item>
            </Stack>
          </Stack.Item>
          
          <Stack.Item>
            <Stack vertical alignment="trailing">
              <Text variant="bodyMd" fontWeight="bold">
                ${(item.price * item.quantity).toFixed(2)}
              </Text>
              <Text variant="bodySm" color="subdued">
                Qty: {item.quantity}
              </Text>
              <Button
                size="slim"
                destructive
                onClick={() => handleRemoveBundle(item.id)}
                loading={isLoading}
              >
                Remove
              </Button>
            </Stack>
          </Stack.Item>
        </Stack>
      </Card>
    );
  };

  if (error) {
    return (
      <Banner status="critical" onDismiss={() => setError(null)}>
        {error}
      </Banner>
    );
  }

  return (
    <div>
      <Text variant="headingMd" as="h2" style={{ marginBottom: '20px' }}>
        Your Cart
      </Text>
      
      {Object.entries(bundledItems).map(([bundleId, items]) => {
        const bundleType = getBundleType(items);
        
        if (bundleType === 'single-item' && items.length === 1) {
          return renderSingleItem(items[0]);
        } else {
          return renderBundle(bundleId, items);
        }
      })}
      
      <Divider />
      
      <Card sectioned>
        <Stack distribution="equalSpacing">
          <Text variant="headingMd" as="h3">
            Total
          </Text>
          <Text variant="headingMd" as="h3" fontWeight="bold">
            ${cart.totalPrice.toFixed(2)} {cart.currency}
          </Text>
        </Stack>
      </Card>
    </div>
  );
};

export default CartBlock;
