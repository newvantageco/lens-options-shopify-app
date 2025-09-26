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
} from '@shopify/polaris';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, EditIcon, DuplicateIcon, DeleteIcon } from '@shopify/polaris-icons';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const LensFlows: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');

  // Fetch lens flows
  const { data: lensFlows, isLoading, error } = useQuery(
    'lensFlows',
    () => apiService.lensFlows.getAll(),
    {
      refetchInterval: 30000,
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id: string) => apiService.lensFlows.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('lensFlows');
        toast.success('Lens flow deleted successfully');
        setShowDeleteModal(false);
        setSelectedItems([]);
      },
      onError: () => {
        toast.error('Failed to delete lens flow');
      },
    }
  );

  // Duplicate mutation
  const duplicateMutation = useMutation(
    ({ id, name }: { id: string; name: string }) => {
      return apiService.lensFlows.duplicate(id).then((response) => {
        // Update the duplicated flow name
        return apiService.lensFlows.update(response.data._id, { name });
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('lensFlows');
        toast.success('Lens flow duplicated successfully');
        setShowDuplicateModal(false);
        setDuplicateName('');
        setSelectedItems([]);
      },
      onError: () => {
        toast.error('Failed to duplicate lens flow');
      },
    }
  );

  const handleDelete = () => {
    if (selectedItems.length > 0) {
      deleteMutation.mutate(selectedItems[0]);
    }
  };

  const handleDuplicate = () => {
    if (selectedItems.length > 0 && duplicateName) {
      duplicateMutation.mutate({ id: selectedItems[0], name: duplicateName });
    }
  };

  const handleBulkDelete = () => {
    // Implement bulk delete logic
    toast.success(`${selectedItems.length} lens flows deleted`);
    setSelectedItems([]);
  };

  const filteredFlows = lensFlows?.filter((flow: any) => {
    const matchesSearch = !filters.search || 
      flow.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      flow.description?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = !filters.status || flow.isActive === (filters.status === 'active');
    
    return matchesSearch && matchesStatus;
  }) || [];

  const filterControl = (
    <Filters
      queryValue={filters.search}
      queryPlaceholder="Search lens flows..."
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
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
              ]}
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
            />
          ),
        },
      ]}
    />
  );

  const renderItem = (item: any) => {
    const { id, name, description, isActive, lenses, assignedProducts, createdAt } = item;
    
    return (
      <ResourceItem
        id={id}
        url={`/lens-flows/${id}/edit`}
        media={<Avatar customer size="medium" name={name} />}
        accessibilityLabel={`View details for ${name}`}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <Text variant="bodyMd" fontWeight="bold" as="h3">
              {name}
            </Text>
            {description && (
              <Text variant="bodySm" color="subdued" as="p">
                {description}
              </Text>
            )}
            <div style={{ marginTop: '8px', display: 'flex', gap: '12px' }}>
              <Badge status={isActive ? 'success' : 'critical'}>
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Text variant="bodySm" color="subdued">
                {lenses?.length || 0} lenses
              </Text>
              <Text variant="bodySm" color="subdued">
                {assignedProducts?.length || 0} products
              </Text>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              size="slim"
              icon={EditIcon}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/lens-flows/${id}/edit`);
              }}
            >
              Edit
            </Button>
            <Button
              size="slim"
              icon={DuplicateIcon}
              onClick={(e) => {
                e.preventDefault();
                setSelectedItems([id]);
                setDuplicateName(`${name} (Copy)`);
                setShowDuplicateModal(true);
              }}
            >
              Duplicate
            </Button>
            <Button
              size="slim"
              destructive
              icon={DeleteIcon}
              onClick={(e) => {
                e.preventDefault();
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
      <Page title="Lens Flows">
        <div className="loading-spinner">
          <Spinner size="large" />
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Lens Flows">
        <Card sectioned>
          <EmptyState
            heading="Error loading lens flows"
            action={{
              content: 'Try again',
              onAction: () => window.location.reload(),
            }}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>There was an error loading your lens flows. Please try again.</p>
          </EmptyState>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title="Lens Flows"
      subtitle={`${filteredFlows.length} lens flows`}
      primaryAction={{
        content: 'Create Lens Flow',
        icon: PlusIcon,
        onAction: () => navigate('/lens-flows/new'),
      }}
      secondaryActions={[
        {
          content: 'Bulk Delete',
          destructive: true,
          disabled: selectedItems.length === 0,
          onAction: handleBulkDelete,
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <ResourceList
              resourceName={{ singular: 'lens flow', plural: 'lens flows' }}
              items={filteredFlows}
              renderItem={renderItem}
              selectedItems={selectedItems}
              onSelectionChange={setSelectedItems}
              filterControl={filterControl}
              emptyState={
                <EmptyState
                  heading="Create your first lens flow"
                  action={{
                    content: 'Create Lens Flow',
                    onAction: () => navigate('/lens-flows/new'),
                  }}
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>
                    Lens flows help customers select the right prescription lenses for their frames.
                    Create your first flow to get started.
                  </p>
                </EmptyState>
              }
            />
          </Card>
        </Layout.Section>
      </Layout>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Lens Flow"
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
            Are you sure you want to delete this lens flow? This action cannot be undone.
          </Text>
        </Modal.Section>
      </Modal>

      {/* Duplicate Modal */}
      <Modal
        open={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        title="Duplicate Lens Flow"
        primaryAction={{
          content: 'Duplicate',
          loading: duplicateMutation.isLoading,
          onAction: handleDuplicate,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setShowDuplicateModal(false),
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="New Lens Flow Name"
              value={duplicateName}
              onChange={setDuplicateName}
              placeholder="Enter name for duplicated lens flow"
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
};

export default LensFlows;
