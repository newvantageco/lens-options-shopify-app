import React, { useState } from 'react';
import {
  Page,
  Card,
  Layout,
  Text,
  Button,
  Spinner,
  EmptyState,
  ResourceList,
  ResourceItem,
  Avatar,
  Badge,
  Filters,
  Pagination,
  Modal,
  TextField,
  FormLayout,
  Select,
  Stack,
} from '@shopify/polaris';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { EditIcon, DeleteIcon, ViewIcon } from '@shopify/polaris-icons';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const Orders: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusData, setStatusData] = useState({
    status: '',
    processingNotes: '',
  });

  // Fetch orders
  const { data: ordersData, isLoading, error } = useQuery(
    'orders',
    () => apiService.orders.getAll(filters),
    {
      refetchInterval: 30000,
    }
  );

  // Update status mutation
  const statusMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => apiService.orders.updateStatus(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('orders');
        toast.success('Order status updated successfully');
        setShowStatusModal(false);
        setSelectedItems([]);
      },
      onError: () => {
        toast.error('Failed to update order status');
      },
    }
  );

  const orders = ordersData?.orders || [];
  const pagination = ordersData?.pagination;

  const handleStatusUpdate = () => {
    if (selectedItems.length > 0) {
      statusMutation.mutate({
        id: selectedItems[0],
        data: statusData,
      });
    }
  };

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const filterControl = (
    <Filters
      queryValue={filters.search}
      queryPlaceholder="Search orders..."
      onQueryChange={(value) => setFilters({ ...filters, search: value })}
      onQueryClear={() => setFilters({ ...filters, search: '' })}
      filters={[
        {
          key: 'status',
          label: 'Status',
          filter: (
            <Select
              options={[
                { label: 'All', value: '' },
                { label: 'Pending', value: 'pending' },
                { label: 'Processing', value: 'processing' },
                { label: 'Fulfilled', value: 'fulfilled' },
                { label: 'Cancelled', value: 'cancelled' },
                { label: 'Refunded', value: 'refunded' },
              ]}
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
            />
          ),
        },
      ]}
    />
  );

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { status: 'warning' as const, label: 'Pending' },
      processing: { status: 'info' as const, label: 'Processing' },
      fulfilled: { status: 'success' as const, label: 'Fulfilled' },
      cancelled: { status: 'critical' as const, label: 'Cancelled' },
      refunded: { status: 'critical' as const, label: 'Refunded' },
    };
    return statusMap[status as keyof typeof statusMap] || { status: 'info' as const, label: status };
  };

  const renderItem = (item: any) => {
    const { id, orderNumber, customerEmail, totalPrice, status, createdAt, selectedLens } = item;
    const statusBadge = getStatusBadge(status);
    
    return (
      <ResourceItem
        id={id}
        media={<Avatar customer size="medium" name={customerEmail || 'Unknown'} />}
        accessibilityLabel={`View details for order ${orderNumber}`}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <Text variant="bodyMd" fontWeight="bold" as="h3">
              Order #{orderNumber}
            </Text>
            <Text variant="bodySm" color="subdued" as="p">
              {customerEmail}
            </Text>
            <div style={{ marginTop: '8px', display: 'flex', gap: '12px' }}>
              <Badge status={statusBadge.status}>
                {statusBadge.label}
              </Badge>
              <Text variant="bodySm" color="subdued">
                ${totalPrice}
              </Text>
              <Text variant="bodySm" color="subdued">
                {new Date(createdAt).toLocaleDateString()}
              </Text>
            </div>
            {selectedLens && (
              <Text variant="bodySm" color="subdued">
                Lens: {selectedLens.lensName}
              </Text>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              size="slim"
              icon={ViewIcon}
              onClick={() => handleViewDetails(item)}
            >
              View
            </Button>
            <Button
              size="slim"
              onClick={() => {
                setSelectedItems([id]);
                setStatusData({ status: item.status, processingNotes: item.processingNotes || '' });
                setShowStatusModal(true);
              }}
            >
              Update Status
            </Button>
          </div>
        </div>
      </ResourceItem>
    );
  };

  if (isLoading) {
    return (
      <Page title="Orders">
        <div className="loading-spinner">
          <Spinner size="large" />
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Orders">
        <Card sectioned>
          <EmptyState
            heading="Error loading orders"
            action={{
              content: 'Try again',
              onAction: () => window.location.reload(),
            }}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>There was an error loading your orders. Please try again.</p>
          </EmptyState>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title="Orders"
      subtitle={`${orders.length} orders`}
      primaryAction={{
        content: 'Export CSV',
        onAction: () => {
          // Implement CSV export
          toast.success('CSV export started');
        },
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <ResourceList
              resourceName={{ singular: 'order', plural: 'orders' }}
              items={orders}
              renderItem={renderItem}
              selectedItems={selectedItems}
              onSelectionChange={setSelectedItems}
              filterControl={filterControl}
              emptyState={
                <EmptyState
                  heading="No orders yet"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>
                    Orders will appear here when customers complete their lens selections.
                  </p>
                </EmptyState>
              }
            />
          </Card>
        </Layout.Section>

        {pagination && (
          <Layout.Section>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                hasPrevious={pagination.page > 1}
                onPrevious={() => {
                  // Implement pagination
                }}
                hasNext={pagination.page < pagination.pages}
                onNext={() => {
                  // Implement pagination
                }}
              />
            </div>
          </Layout.Section>
        )}
      </Layout>

      {/* Status Update Modal */}
      <Modal
        open={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Update Order Status"
        primaryAction={{
          content: 'Update Status',
          loading: statusMutation.isLoading,
          onAction: handleStatusUpdate,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setShowStatusModal(false),
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <Select
              label="Order Status"
              options={[
                { label: 'Pending', value: 'pending' },
                { label: 'Processing', value: 'processing' },
                { label: 'Fulfilled', value: 'fulfilled' },
                { label: 'Cancelled', value: 'cancelled' },
                { label: 'Refunded', value: 'refunded' },
              ]}
              value={statusData.status}
              onChange={(value) => setStatusData({ ...statusData, status: value })}
            />
            <TextField
              label="Processing Notes"
              multiline={4}
              value={statusData.processingNotes}
              onChange={(value) => setStatusData({ ...statusData, processingNotes: value })}
              placeholder="Add any notes about the order processing..."
            />
          </FormLayout>
        </Modal.Section>
      </Modal>

      {/* Details Modal */}
      <Modal
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Order Details"
        large
        primaryAction={{
          content: 'Close',
          onAction: () => setShowDetailsModal(false),
        }}
      >
        <Modal.Section>
          {selectedOrder && (
            <div>
              <Layout>
                <Layout.Section oneHalf>
                  <Card sectioned>
                    <Text variant="headingMd" as="h3">
                      Order Information
                    </Text>
                    <div style={{ marginTop: '15px' }}>
                      <Text variant="bodyMd" as="p">
                        <strong>Order Number:</strong> {selectedOrder.orderNumber}
                      </Text>
                      <Text variant="bodyMd" as="p">
                        <strong>Status:</strong> {selectedOrder.status}
                      </Text>
                      <Text variant="bodyMd" as="p">
                        <strong>Total Price:</strong> ${selectedOrder.totalPrice}
                      </Text>
                      <Text variant="bodyMd" as="p">
                        <strong>Currency:</strong> {selectedOrder.currency}
                      </Text>
                      <Text variant="bodyMd" as="p">
                        <strong>Created:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}
                      </Text>
                    </div>
                  </Card>
                </Layout.Section>
                <Layout.Section oneHalf>
                  <Card sectioned>
                    <Text variant="headingMd" as="h3">
                      Customer Information
                    </Text>
                    <div style={{ marginTop: '15px' }}>
                      <Text variant="bodyMd" as="p">
                        <strong>Email:</strong> {selectedOrder.customerEmail}
                      </Text>
                      <Text variant="bodyMd" as="p">
                        <strong>Customer ID:</strong> {selectedOrder.customerId || 'N/A'}
                      </Text>
                    </div>
                  </Card>
                </Layout.Section>
              </Layout>

              {selectedOrder.selectedLens && (
                <Card sectioned style={{ marginTop: '20px' }}>
                  <Text variant="headingMd" as="h3">
                    Selected Lens
                  </Text>
                  <div style={{ marginTop: '15px' }}>
                    <Text variant="bodyMd" as="p">
                      <strong>Lens Name:</strong> {selectedOrder.selectedLens.lensName}
                    </Text>
                    <Text variant="bodyMd" as="p">
                      <strong>Lens Type:</strong> {selectedOrder.selectedLens.lensType}
                    </Text>
                    {selectedOrder.selectedLens.options && selectedOrder.selectedLens.options.length > 0 && (
                      <div>
                        <Text variant="bodyMd" as="p">
                          <strong>Options:</strong>
                        </Text>
                        {selectedOrder.selectedLens.options.map((option: any, index: number) => (
                          <Text key={index} variant="bodySm" as="p" style={{ marginLeft: '20px' }}>
                            • {option.name}: {option.value} (+${option.price})
                          </Text>
                        ))}
                      </div>
                    )}
                    {selectedOrder.selectedLens.addOns && selectedOrder.selectedLens.addOns.length > 0 && (
                      <div>
                        <Text variant="bodyMd" as="p">
                          <strong>Add-ons:</strong>
                        </Text>
                        {selectedOrder.selectedLens.addOns.map((addon: any, index: number) => (
                          <Text key={index} variant="bodySm" as="p" style={{ marginLeft: '20px' }}>
                            • {addon.name} (+${addon.price})
                          </Text>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {selectedOrder.lineItems && selectedOrder.lineItems.length > 0 && (
                <Card sectioned style={{ marginTop: '20px' }}>
                  <Text variant="headingMd" as="h3">
                    Line Items
                  </Text>
                  <div style={{ marginTop: '15px' }}>
                    {selectedOrder.lineItems.map((item: any, index: number) => (
                      <div key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #e1e3e5', borderRadius: '4px' }}>
                        <Stack distribution="equalSpacing">
                          <div>
                            <Text variant="bodyMd" as="p">
                              <strong>{item.title}</strong>
                            </Text>
                            <Text variant="bodySm" color="subdued" as="p">
                              {item.productType} • Qty: {item.quantity}
                            </Text>
                          </div>
                          <Text variant="bodyMd" as="p">
                            ${(item.price * item.quantity).toFixed(2)}
                          </Text>
                        </Stack>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {selectedOrder.processingNotes && (
                <Card sectioned style={{ marginTop: '20px' }}>
                  <Text variant="headingMd" as="h3">
                    Processing Notes
                  </Text>
                  <div style={{ marginTop: '15px' }}>
                    <Text variant="bodyMd" as="p">
                      {selectedOrder.processingNotes}
                    </Text>
                  </div>
                </Card>
              )}
            </div>
          )}
        </Modal.Section>
      </Modal>
    </Page>
  );
};

export default Orders;
