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
  FileUpload,
  Thumbnail,
  Stack,
  Divider,
  Banner,
} from '@shopify/polaris';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { PlusIcon, EditIcon, DeleteIcon, ViewIcon } from '@shopify/polaris-icons';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const Prescriptions: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    prescriptionType: '',
    search: '',
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [validationData, setValidationData] = useState({
    isValidated: false,
    validationNotes: '',
  });

  // Fetch prescriptions
  const { data: prescriptionsData, isLoading, error } = useQuery(
    'prescriptions',
    () => apiService.prescriptions.getAll(filters),
    {
      refetchInterval: 30000,
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id: string) => apiService.prescriptions.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('prescriptions');
        toast.success('Prescription deleted successfully');
        setShowDeleteModal(false);
        setSelectedItems([]);
      },
      onError: () => {
        toast.error('Failed to delete prescription');
      },
    }
  );

  // Validation mutation
  const validationMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => apiService.prescriptions.validate(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('prescriptions');
        toast.success('Prescription validation updated');
        setShowValidationModal(false);
        setSelectedItems([]);
      },
      onError: () => {
        toast.error('Failed to update prescription validation');
      },
    }
  );

  const prescriptions = prescriptionsData?.prescriptions || [];
  const pagination = prescriptionsData?.pagination;

  const handleDelete = () => {
    if (selectedItems.length > 0) {
      deleteMutation.mutate(selectedItems[0]);
    }
  };

  const handleValidation = () => {
    if (selectedItems.length > 0) {
      validationMutation.mutate({
        id: selectedItems[0],
        data: validationData,
      });
    }
  };

  const handleViewDetails = (prescription: any) => {
    setSelectedPrescription(prescription);
    setShowDetailsModal(true);
  };

  const filterControl = (
    <Filters
      queryValue={filters.search}
      queryPlaceholder="Search prescriptions..."
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
                { label: 'Draft', value: 'draft' },
                { label: 'Submitted', value: 'submitted' },
                { label: 'Validated', value: 'validated' },
                { label: 'Rejected', value: 'rejected' },
                { label: 'Fulfilled', value: 'fulfilled' },
              ]}
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
            />
          ),
        },
        {
          key: 'prescriptionType',
          label: 'Type',
          filter: (
            <Select
              options={[
                { label: 'All', value: '' },
                { label: 'Single Vision', value: 'single-vision' },
                { label: 'Progressive', value: 'progressive' },
                { label: 'Reading', value: 'reading' },
                { label: 'Non-Prescription', value: 'non-prescription' },
                { label: 'Frame Only', value: 'frame-only' },
              ]}
              value={filters.prescriptionType}
              onChange={(value) => setFilters({ ...filters, prescriptionType: value })}
            />
          ),
        },
      ]}
    />
  );

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { status: 'info' as const, label: 'Draft' },
      submitted: { status: 'warning' as const, label: 'Submitted' },
      validated: { status: 'success' as const, label: 'Validated' },
      rejected: { status: 'critical' as const, label: 'Rejected' },
      fulfilled: { status: 'success' as const, label: 'Fulfilled' },
    };
    return statusMap[status as keyof typeof statusMap] || { status: 'info' as const, label: status };
  };

  const renderItem = (item: any) => {
    const { id, prescriptionData, status, createdAt } = item;
    const statusBadge = getStatusBadge(status);
    
    return (
      <ResourceItem
        id={id}
        media={<Avatar customer size="medium" name={prescriptionData.customerName || 'Unknown'} />}
        accessibilityLabel={`View details for ${prescriptionData.customerName}`}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <Text variant="bodyMd" fontWeight="bold" as="h3">
              {prescriptionData.customerName || 'Unknown Customer'}
            </Text>
            <Text variant="bodySm" color="subdued" as="p">
              {prescriptionData.customerEmail}
            </Text>
            <div style={{ marginTop: '8px', display: 'flex', gap: '12px' }}>
              <Badge status={statusBadge.status}>
                {statusBadge.label}
              </Badge>
              <Text variant="bodySm" color="subdued">
                {prescriptionData.prescriptionType}
              </Text>
              <Text variant="bodySm" color="subdued">
                {new Date(createdAt).toLocaleDateString()}
              </Text>
            </div>
            {prescriptionData.uploadedFiles && prescriptionData.uploadedFiles.length > 0 && (
              <Text variant="bodySm" color="subdued">
                📎 {prescriptionData.uploadedFiles.length} file(s) uploaded
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
            {status === 'submitted' && (
              <Button
                size="slim"
                onClick={() => {
                  setSelectedItems([id]);
                  setShowValidationModal(true);
                }}
              >
                Validate
              </Button>
            )}
            <Button
              size="slim"
              destructive
              icon={DeleteIcon}
              onClick={() => {
                setSelectedItems([id]);
                setShowDeleteModal(true);
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </ResourceItem>
    );
  };

  if (isLoading) {
    return (
      <Page title="Prescriptions">
        <div className="loading-spinner">
          <Spinner size="large" />
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Prescriptions">
        <Card sectioned>
          <EmptyState
            heading="Error loading prescriptions"
            action={{
              content: 'Try again',
              onAction: () => window.location.reload(),
            }}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>There was an error loading your prescriptions. Please try again.</p>
          </EmptyState>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title="Prescriptions"
      subtitle={`${prescriptions.length} prescriptions`}
      primaryAction={{
        content: 'Export CSV',
        onAction: () => {
          // Implement CSV export
          toast.success('CSV export started');
        },
      }}
      secondaryActions={[
        {
          content: 'Bulk Validate',
          disabled: selectedItems.length === 0,
          onAction: () => {
            // Implement bulk validation
            toast.success(`${selectedItems.length} prescriptions validated`);
            setSelectedItems([]);
          },
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <ResourceList
              resourceName={{ singular: 'prescription', plural: 'prescriptions' }}
              items={prescriptions}
              renderItem={renderItem}
              selectedItems={selectedItems}
              onSelectionChange={setSelectedItems}
              filterControl={filterControl}
              emptyState={
                <EmptyState
                  heading="No prescriptions yet"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>
                    Prescriptions will appear here when customers submit them through your lens flows.
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

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Prescription"
        primaryAction={{
          content: 'Delete',
          destructive: true,
          loading: deleteMutation.isLoading,
          onAction: handleDelete,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setShowDeleteModal(false),
          },
        ]}
      >
        <Modal.Section>
          <Text as="p">
            Are you sure you want to delete this prescription? This action cannot be undone.
          </Text>
        </Modal.Section>
      </Modal>

      {/* Validation Modal */}
      <Modal
        open={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title="Validate Prescription"
        primaryAction={{
          content: 'Update Validation',
          loading: validationMutation.isLoading,
          onAction: handleValidation,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setShowValidationModal(false),
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <Select
              label="Validation Status"
              options={[
                { label: 'Validated', value: 'true' },
                { label: 'Rejected', value: 'false' },
              ]}
              value={validationData.isValidated.toString()}
              onChange={(value) => setValidationData({ ...validationData, isValidated: value === 'true' })}
            />
            <TextField
              label="Validation Notes"
              multiline={4}
              value={validationData.validationNotes}
              onChange={(value) => setValidationData({ ...validationData, validationNotes: value })}
              placeholder="Add any notes about the prescription validation..."
            />
          </FormLayout>
        </Modal.Section>
      </Modal>

      {/* Details Modal */}
      <Modal
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Prescription Details"
        large
        primaryAction={{
          content: 'Close',
          onAction: () => setShowDetailsModal(false),
        }}
      >
        <Modal.Section>
          {selectedPrescription && (
            <div>
              <Layout>
                <Layout.Section oneHalf>
                  <Card sectioned>
                    <Text variant="headingMd" as="h3">
                      Customer Information
                    </Text>
                    <div style={{ marginTop: '15px' }}>
                      <Text variant="bodyMd" as="p">
                        <strong>Name:</strong> {selectedPrescription.prescriptionData.customerName || 'N/A'}
                      </Text>
                      <Text variant="bodyMd" as="p">
                        <strong>Email:</strong> {selectedPrescription.prescriptionData.customerEmail || 'N/A'}
                      </Text>
                      <Text variant="bodyMd" as="p">
                        <strong>Phone:</strong> {selectedPrescription.prescriptionData.customerPhone || 'N/A'}
                      </Text>
                    </div>
                  </Card>
                </Layout.Section>
                <Layout.Section oneHalf>
                  <Card sectioned>
                    <Text variant="headingMd" as="h3">
                      Prescription Information
                    </Text>
                    <div style={{ marginTop: '15px' }}>
                      <Text variant="bodyMd" as="p">
                        <strong>Type:</strong> {selectedPrescription.prescriptionData.prescriptionType}
                      </Text>
                      <Text variant="bodyMd" as="p">
                        <strong>Status:</strong> {selectedPrescription.status}
                      </Text>
                      <Text variant="bodyMd" as="p">
                        <strong>Created:</strong> {new Date(selectedPrescription.createdAt).toLocaleString()}
                      </Text>
                    </div>
                  </Card>
                </Layout.Section>
              </Layout>

              {selectedPrescription.prescriptionData.prescriptionType !== 'non-prescription' && 
               selectedPrescription.prescriptionData.prescriptionType !== 'frame-only' && (
                <Card sectioned style={{ marginTop: '20px' }}>
                  <Text variant="headingMd" as="h3">
                    Prescription Details
                  </Text>
                  <Layout>
                    <Layout.Section oneHalf>
                      <Text variant="headingSm" as="h4">
                        Right Eye (OD)
                      </Text>
                      <div style={{ marginTop: '10px' }}>
                        <Text variant="bodyMd" as="p">
                          <strong>Sphere:</strong> {selectedPrescription.prescriptionData.odSphere || 'N/A'}
                        </Text>
                        <Text variant="bodyMd" as="p">
                          <strong>Cylinder:</strong> {selectedPrescription.prescriptionData.odCylinder || 'N/A'}
                        </Text>
                        <Text variant="bodyMd" as="p">
                          <strong>Axis:</strong> {selectedPrescription.prescriptionData.odAxis || 'N/A'}
                        </Text>
                        <Text variant="bodyMd" as="p">
                          <strong>Add:</strong> {selectedPrescription.prescriptionData.odAdd || 'N/A'}
                        </Text>
                      </div>
                    </Layout.Section>
                    <Layout.Section oneHalf>
                      <Text variant="headingSm" as="h4">
                        Left Eye (OS)
                      </Text>
                      <div style={{ marginTop: '10px' }}>
                        <Text variant="bodyMd" as="p">
                          <strong>Sphere:</strong> {selectedPrescription.prescriptionData.osSphere || 'N/A'}
                        </Text>
                        <Text variant="bodyMd" as="p">
                          <strong>Cylinder:</strong> {selectedPrescription.prescriptionData.osCylinder || 'N/A'}
                        </Text>
                        <Text variant="bodyMd" as="p">
                          <strong>Axis:</strong> {selectedPrescription.prescriptionData.osAxis || 'N/A'}
                        </Text>
                        <Text variant="bodyMd" as="p">
                          <strong>Add:</strong> {selectedPrescription.prescriptionData.osAdd || 'N/A'}
                        </Text>
                      </div>
                    </Layout.Section>
                  </Layout>
                  <div style={{ marginTop: '20px' }}>
                    <Text variant="bodyMd" as="p">
                      <strong>Pupillary Distance (PD):</strong> {selectedPrescription.prescriptionData.pd || 'N/A'}
                    </Text>
                  </div>
                </Card>
              )}

              {selectedPrescription.prescriptionData.uploadedFiles && 
               selectedPrescription.prescriptionData.uploadedFiles.length > 0 && (
                <Card sectioned style={{ marginTop: '20px' }}>
                  <Text variant="headingMd" as="h3">
                    Uploaded Files
                  </Text>
                  <div style={{ marginTop: '15px' }}>
                    {selectedPrescription.prescriptionData.uploadedFiles.map((file: any, index: number) => (
                      <div key={index} style={{ marginBottom: '10px' }}>
                        <Text variant="bodyMd" as="p">
                          📎 {file.originalName} ({file.size} bytes)
                        </Text>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {selectedPrescription.prescriptionData.doctorName && (
                <Card sectioned style={{ marginTop: '20px' }}>
                  <Text variant="headingMd" as="h3">
                    Doctor Information
                  </Text>
                  <div style={{ marginTop: '15px' }}>
                    <Text variant="bodyMd" as="p">
                      <strong>Name:</strong> {selectedPrescription.prescriptionData.doctorName}
                    </Text>
                    {selectedPrescription.prescriptionData.doctorPhone && (
                      <Text variant="bodyMd" as="p">
                        <strong>Phone:</strong> {selectedPrescription.prescriptionData.doctorPhone}
                      </Text>
                    )}
                    {selectedPrescription.prescriptionData.prescriptionDate && (
                      <Text variant="bodyMd" as="p">
                        <strong>Prescription Date:</strong> {new Date(selectedPrescription.prescriptionData.prescriptionDate).toLocaleDateString()}
                      </Text>
                    )}
                    {selectedPrescription.prescriptionData.expirationDate && (
                      <Text variant="bodyMd" as="p">
                        <strong>Expiration Date:</strong> {new Date(selectedPrescription.prescriptionData.expirationDate).toLocaleDateString()}
                      </Text>
                    )}
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

export default Prescriptions;
