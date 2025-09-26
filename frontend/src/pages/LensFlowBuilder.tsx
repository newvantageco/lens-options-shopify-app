import React, { useState } from 'react';
import {
  Page,
  Card,
  Layout,
  Text,
  Button,
  Spinner,
  TextField,
  FormLayout,
  Select,
  Checkbox,
  Stack,
  Badge,
  Modal,
  Banner,
} from '@shopify/polaris';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { SaveIcon, PlusIcon, DeleteIcon } from '@shopify/polaris-icons';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const LensFlowBuilder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    prescriptionTypes: [
      {
        name: 'single-vision',
        displayName: 'Single Vision',
        isActive: true,
        settings: {
          requirePrescription: true,
          allowAddOns: true,
        },
      },
    ],
    lensGroups: [
      {
        name: 'clear-lenses',
        displayName: 'Clear Lenses',
        description: 'Standard clear prescription lenses',
        sortOrder: 1,
        isActive: true,
      },
    ],
    lenses: [],
    settings: {
      showMatrixImage: true,
      allowQuickBuy: true,
      requirePrescriptionUpload: false,
    },
  });

  const [showAddLensModal, setShowAddLensModal] = useState(false);
  const [newLens, setNewLens] = useState({
    name: '',
    displayName: '',
    description: '',
    type: 'clear',
    basePrice: 0,
    compareAtPrice: 0,
    isActive: true,
    sortOrder: 0,
    options: [],
    addOns: [],
  });

  // Fetch existing lens flow if editing
  const { data: existingFlow, isLoading: loadingFlow } = useQuery(
    ['lensFlow', id],
    () => apiService.lensFlows.getById(id!),
    {
      enabled: isEditing,
      onSuccess: (data) => {
        setFormData(data);
      },
    }
  );

  // Create/Update mutation
  const saveMutation = useMutation(
    (data: any) => {
      if (isEditing) {
        return apiService.lensFlows.update(id!, data);
      } else {
        return apiService.lensFlows.create(data);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('lensFlows');
        toast.success(`Lens flow ${isEditing ? 'updated' : 'created'} successfully`);
        navigate('/lens-flows');
      },
      onError: () => {
        toast.error(`Failed to ${isEditing ? 'update' : 'create'} lens flow`);
      },
    }
  );

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleAddLens = () => {
    setFormData({
      ...formData,
      lenses: [...formData.lenses, { ...newLens, id: Date.now().toString() }],
    });
    setNewLens({
      name: '',
      displayName: '',
      description: '',
      type: 'clear',
      basePrice: 0,
      compareAtPrice: 0,
      isActive: true,
      sortOrder: 0,
      options: [],
      addOns: [],
    });
    setShowAddLensModal(false);
  };

  const handleRemoveLens = (lensId: string) => {
    setFormData({
      ...formData,
      lenses: formData.lenses.filter((lens: any) => lens.id !== lensId),
    });
  };

  if (loadingFlow) {
    return (
      <Page title="Loading Lens Flow...">
        <div className="loading-spinner">
          <Spinner size="large" />
        </div>
      </Page>
    );
  }

  return (
    <Page
      title={isEditing ? 'Edit Lens Flow' : 'Create Lens Flow'}
      breadcrumbs={[{ content: 'Lens Flows', url: '/lens-flows' }]}
      primaryAction={{
        content: 'Save',
        icon: SaveIcon,
        onAction: handleSave,
        loading: saveMutation.isLoading,
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: () => navigate('/lens-flows'),
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <FormLayout>
              <TextField
                label="Flow Name"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
                placeholder="Enter lens flow name"
                required
              />
              <TextField
                label="Description"
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Enter flow description"
                multiline={3}
              />
              <Checkbox
                label="Active"
                checked={formData.isActive}
                onChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </FormLayout>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card
            title="Prescription Types"
            sectioned
            actions={[
              {
                content: 'Add Type',
                onAction: () => {
                  // Implement add prescription type
                },
              },
            ]}
          >
            <Stack vertical>
              {formData.prescriptionTypes.map((type: any, index: number) => (
                <div key={index} style={{ padding: '10px', border: '1px solid #e1e3e5', borderRadius: '4px' }}>
                  <Stack distribution="equalSpacing">
                    <div>
                      <Text variant="bodyMd" fontWeight="bold">
                        {type.displayName}
                      </Text>
                      <Text variant="bodySm" color="subdued">
                        {type.name}
                      </Text>
                    </div>
                    <Badge status={type.isActive ? 'success' : 'critical'}>
                      {type.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Stack>
                </div>
              ))}
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card
            title="Lens Groups"
            sectioned
            actions={[
              {
                content: 'Add Group',
                onAction: () => {
                  // Implement add lens group
                },
              },
            ]}
          >
            <Stack vertical>
              {formData.lensGroups.map((group: any, index: number) => (
                <div key={index} style={{ padding: '10px', border: '1px solid #e1e3e5', borderRadius: '4px' }}>
                  <Stack distribution="equalSpacing">
                    <div>
                      <Text variant="bodyMd" fontWeight="bold">
                        {group.displayName}
                      </Text>
                      <Text variant="bodySm" color="subdued">
                        {group.description}
                      </Text>
                    </div>
                    <Badge status={group.isActive ? 'success' : 'critical'}>
                      {group.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Stack>
                </div>
              ))}
            </Stack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card
            title="Lenses"
            sectioned
            actions={[
              {
                content: 'Add Lens',
                icon: PlusIcon,
                onAction: () => setShowAddLensModal(true),
              },
            ]}
          >
            {formData.lenses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Text variant="bodyMd" color="subdued">
                  No lenses added yet. Click "Add Lens" to get started.
                </Text>
              </div>
            ) : (
              <Stack vertical>
                {formData.lenses.map((lens: any) => (
                  <div key={lens.id} style={{ padding: '15px', border: '1px solid #e1e3e5', borderRadius: '4px' }}>
                    <Stack distribution="equalSpacing">
                      <div>
                        <Text variant="bodyMd" fontWeight="bold">
                          {lens.displayName}
                        </Text>
                        <Text variant="bodySm" color="subdued">
                          {lens.type} - ${lens.basePrice}
                        </Text>
                        {lens.description && (
                          <Text variant="bodySm" color="subdued">
                            {lens.description}
                          </Text>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Badge status={lens.isActive ? 'success' : 'critical'}>
                          {lens.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          size="slim"
                          destructive
                          icon={DeleteIcon}
                          onClick={() => handleRemoveLens(lens.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </Stack>
                  </div>
                ))}
              </Stack>
            )}
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="Settings" sectioned>
            <FormLayout>
              <Checkbox
                label="Show Matrix Image"
                checked={formData.settings.showMatrixImage}
                onChange={(checked) =>
                  setFormData({
                    ...formData,
                    settings: { ...formData.settings, showMatrixImage: checked },
                  })
                }
              />
              <Checkbox
                label="Allow Quick Buy"
                checked={formData.settings.allowQuickBuy}
                onChange={(checked) =>
                  setFormData({
                    ...formData,
                    settings: { ...formData.settings, allowQuickBuy: checked },
                  })
                }
              />
              <Checkbox
                label="Require Prescription Upload"
                checked={formData.settings.requirePrescriptionUpload}
                onChange={(checked) =>
                  setFormData({
                    ...formData,
                    settings: { ...formData.settings, requirePrescriptionUpload: checked },
                  })
                }
              />
            </FormLayout>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Add Lens Modal */}
      <Modal
        open={showAddLensModal}
        onClose={() => setShowAddLensModal(false)}
        title="Add Lens"
        primaryAction={{
          content: 'Add Lens',
          onAction: handleAddLens,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setShowAddLensModal(false),
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Lens Name"
              value={newLens.name}
              onChange={(value) => setNewLens({ ...newLens, name: value })}
              placeholder="e.g., standard-clear"
            />
            <TextField
              label="Display Name"
              value={newLens.displayName}
              onChange={(value) => setNewLens({ ...newLens, displayName: value })}
              placeholder="e.g., Standard Clear"
            />
            <TextField
              label="Description"
              value={newLens.description}
              onChange={(value) => setNewLens({ ...newLens, description: value })}
              placeholder="Brief description of the lens"
            />
            <Select
              label="Lens Type"
              options={[
                { label: 'Clear', value: 'clear' },
                { label: 'Blue Light Blocking', value: 'blue-light-blocking' },
                { label: 'Photochromic', value: 'photochromic' },
                { label: 'Sunglasses', value: 'sunglasses' },
                { label: 'Polarized Sunglasses', value: 'polarized-sunglasses' },
              ]}
              value={newLens.type}
              onChange={(value) => setNewLens({ ...newLens, type: value })}
            />
            <TextField
              label="Base Price"
              type="number"
              value={newLens.basePrice.toString()}
              onChange={(value) => setNewLens({ ...newLens, basePrice: parseFloat(value) || 0 })}
              prefix="$"
            />
            <TextField
              label="Compare At Price (Optional)"
              type="number"
              value={newLens.compareAtPrice.toString()}
              onChange={(value) => setNewLens({ ...newLens, compareAtPrice: parseFloat(value) || 0 })}
              prefix="$"
            />
            <Checkbox
              label="Active"
              checked={newLens.isActive}
              onChange={(checked) => setNewLens({ ...newLens, isActive: checked })}
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
};

export default LensFlowBuilder;
