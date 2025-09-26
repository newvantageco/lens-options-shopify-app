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
  Divider,
  Banner,
  Modal,
  Tabs,
} from '@shopify/polaris';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { SaveIcon, PlusIcon, DeleteIcon } from '@shopify/polaris-icons';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState(0);
  const [settings, setSettings] = useState({
    customCSS: '',
    customJS: '',
    nativeBundling: false,
    singleLineitemBundling: false,
    savePrescriptionInOrder: false,
    encryptPrescriptionData: true,
    dataRetentionDays: 2555,
  });
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [newTranslation, setNewTranslation] = useState({ key: '', value: '' });
  const [showAddTranslationModal, setShowAddTranslationModal] = useState(false);

  // Fetch settings
  const { data: settingsData, isLoading, error } = useQuery(
    'settings',
    () => apiService.settings.get(),
    {
      onSuccess: (data) => {
        setSettings(data.settings);
      },
    }
  );

  // Fetch translations
  const { data: translationsData } = useQuery(
    'translations',
    () => apiService.settings.getTranslations(),
    {
      onSuccess: (data) => {
        setTranslations(data);
      },
    }
  );

  // Update settings mutation
  const updateSettingsMutation = useMutation(
    (data: any) => apiService.settings.update(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('settings');
        toast.success('Settings updated successfully');
      },
      onError: () => {
        toast.error('Failed to update settings');
      },
    }
  );

  // Update translations mutation
  const updateTranslationsMutation = useMutation(
    (data: any) => apiService.settings.updateTranslations(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('translations');
        toast.success('Translations updated successfully');
      },
      onError: () => {
        toast.error('Failed to update translations');
      },
    }
  );

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(settings);
  };

  const handleSaveTranslations = () => {
    updateTranslationsMutation.mutate(translations);
  };

  const handleAddTranslation = () => {
    if (newTranslation.key && newTranslation.value) {
      setTranslations({
        ...translations,
        [newTranslation.key]: newTranslation.value,
      });
      setNewTranslation({ key: '', value: '' });
      setShowAddTranslationModal(false);
    }
  };

  const handleRemoveTranslation = (key: string) => {
    const newTranslations = { ...translations };
    delete newTranslations[key];
    setTranslations(newTranslations);
  };

  const tabs = [
    {
      id: 'general',
      content: 'General',
      panelID: 'general-panel',
    },
    {
      id: 'customization',
      content: 'Customization',
      panelID: 'customization-panel',
    },
    {
      id: 'translations',
      content: 'Translations',
      panelID: 'translations-panel',
    },
    {
      id: 'compliance',
      content: 'Compliance',
      panelID: 'compliance-panel',
    },
  ];

  if (isLoading) {
    return (
      <Page title="Settings">
        <div className="loading-spinner">
          <Spinner size="large" />
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Settings">
        <Card sectioned>
          <Banner status="critical">
            <p>Error loading settings. Please try again.</p>
          </Banner>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title="Settings"
      primaryAction={{
        content: 'Save Changes',
        icon: SaveIcon,
        onAction: selectedTab === 0 ? handleSaveSettings : selectedTab === 2 ? handleSaveTranslations : handleSaveSettings,
        loading: updateSettingsMutation.isLoading || updateTranslationsMutation.isLoading,
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
              {/* General Settings */}
              <div id="general-panel" style={{ padding: '20px' }}>
                <FormLayout>
                  <Text variant="headingMd" as="h3">
                    General Settings
                  </Text>
                  
                  <Checkbox
                    label="Native Bundling"
                    checked={settings.nativeBundling}
                    onChange={(checked) => setSettings({ ...settings, nativeBundling: checked })}
                    helpText="Bundle frame and lens into a single cart item"
                  />
                  
                  <Checkbox
                    label="Single Lineitem Bundling (Shopify Plus Only)"
                    checked={settings.singleLineitemBundling}
                    onChange={(checked) => setSettings({ ...settings, singleLineitemBundling: checked })}
                    helpText="Create a single line item for the entire bundle"
                  />
                  
                  <Checkbox
                    label="Save Prescription in Order"
                    checked={settings.savePrescriptionInOrder}
                    onChange={(checked) => setSettings({ ...settings, savePrescriptionInOrder: checked })}
                    helpText="Include prescription data in Shopify order properties"
                  />
                  
                  <TextField
                    label="Data Retention (Days)"
                    type="number"
                    value={settings.dataRetentionDays.toString()}
                    onChange={(value) => setSettings({ ...settings, dataRetentionDays: parseInt(value) || 2555 })}
                    helpText="How long to keep prescription data (default: 7 years)"
                    min="30"
                    max="3650"
                  />
                </FormLayout>
              </div>

              {/* Customization Settings */}
              <div id="customization-panel" style={{ padding: '20px' }}>
                <FormLayout>
                  <Text variant="headingMd" as="h3">
                    Customization
                  </Text>
                  
                  <TextField
                    label="Custom CSS"
                    multiline={10}
                    value={settings.customCSS}
                    onChange={(value) => setSettings({ ...settings, customCSS: value })}
                    placeholder="/* Add your custom CSS here */"
                    helpText="Custom CSS to style the lens selection interface"
                  />
                  
                  <TextField
                    label="Custom JavaScript"
                    multiline={10}
                    value={settings.customJS}
                    onChange={(value) => setSettings({ ...settings, customJS: value })}
                    placeholder="// Add your custom JavaScript here"
                    helpText="Custom JavaScript for advanced functionality"
                  />
                </FormLayout>
              </div>

              {/* Translations */}
              <div id="translations-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <Text variant="headingMd" as="h3">
                    Translations
                  </Text>
                  <Button
                    icon={PlusIcon}
                    onClick={() => setShowAddTranslationModal(true)}
                  >
                    Add Translation
                  </Button>
                </div>
                
                <Stack vertical>
                  {Object.entries(translations).map(([key, value]) => (
                    <div key={key} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '10px',
                      border: '1px solid #e1e3e5',
                      borderRadius: '4px',
                      marginBottom: '10px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <Text variant="bodyMd" fontWeight="bold">
                          {key}
                        </Text>
                        <Text variant="bodySm" color="subdued">
                          {value}
                        </Text>
                      </div>
                      <Button
                        size="slim"
                        destructive
                        icon={DeleteIcon}
                        onClick={() => handleRemoveTranslation(key)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  
                  {Object.keys(translations).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Text variant="bodyMd" color="subdued">
                        No translations added yet. Click "Add Translation" to get started.
                      </Text>
                    </div>
                  )}
                </Stack>
              </div>

              {/* Compliance Settings */}
              <div id="compliance-panel" style={{ padding: '20px' }}>
                <FormLayout>
                  <Text variant="headingMd" as="h3">
                    Compliance & Security
                  </Text>
                  
                  <Banner status="info">
                    <p>
                      Your app is configured for HIPAA, GDPR, and PIPEDA compliance. 
                      Prescription data is encrypted and stored securely.
                    </p>
                  </Banner>
                  
                  <Checkbox
                    label="Encrypt Prescription Data"
                    checked={settings.encryptPrescriptionData}
                    onChange={(checked) => setSettings({ ...settings, encryptPrescriptionData: checked })}
                    helpText="Encrypt prescription data at rest (recommended)"
                    disabled
                  />
                  
                  <Divider />
                  
                  <Text variant="headingSm" as="h4">
                    Data Handling
                  </Text>
                  
                  <Text variant="bodyMd" as="p">
                    • Prescription data is encrypted using AES-256 encryption
                  </Text>
                  <Text variant="bodyMd" as="p">
                    • Data is automatically anonymized after the retention period
                  </Text>
                  <Text variant="bodyMd" as="p">
                    • Customers can request data deletion (GDPR compliance)
                  </Text>
                  <Text variant="bodyMd" as="p">
                    • All data transfers use HTTPS encryption
                  </Text>
                  
                  <Divider />
                  
                  <Text variant="headingSm" as="h4">
                    Audit Trail
                  </Text>
                  
                  <Text variant="bodyMd" as="p">
                    • All prescription access is logged
                  </Text>
                  <Text variant="bodyMd" as="p">
                    • Data retention policies are automatically enforced
                  </Text>
                  <Text variant="bodyMd" as="p">
                    • Regular security audits and compliance checks
                  </Text>
                </FormLayout>
              </div>
            </Tabs>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Add Translation Modal */}
      <Modal
        open={showAddTranslationModal}
        onClose={() => setShowAddTranslationModal(false)}
        title="Add Translation"
        primaryAction={{
          content: 'Add Translation',
          onAction: handleAddTranslation,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setShowAddTranslationModal(false),
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Translation Key"
              value={newTranslation.key}
              onChange={(value) => setNewTranslation({ ...newTranslation, key: value })}
              placeholder="e.g., select_lens"
            />
            <TextField
              label="Translation Value"
              value={newTranslation.value}
              onChange={(value) => setNewTranslation({ ...newTranslation, value: value })}
              placeholder="e.g., Select Your Lens"
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
};

export default Settings;
