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
  FormLayout,
  TextField,
  Select,
  Checkbox,
  FileUpload,
  Thumbnail,
  Stack,
  Badge,
  Divider,
} from '@shopify/polaris';
import { useAppQuery, useAppMutation } from '@shopify/app-bridge-react';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';

interface ProductBlockProps {
  product: {
    id: string;
    title: string;
    handle: string;
    variants: Array<{
      id: string;
      title: string;
      price: string;
      compareAtPrice?: string;
    }>;
  };
  selectedVariant?: {
    id: string;
    title: string;
    price: string;
  };
}

interface LensFlow {
  id: string;
  name: string;
  prescriptionTypes: Array<{
    name: string;
    displayName: string;
    isActive: boolean;
  }>;
  lenses: Array<{
    id: string;
    name: string;
    displayName: string;
    type: string;
    basePrice: number;
    options: Array<{
      name: string;
      displayName: string;
      price: number;
    }>;
  }>;
}

interface PrescriptionData {
  prescriptionType: string;
  odSphere?: string;
  odCylinder?: string;
  odAxis?: string;
  odAdd?: string;
  osSphere?: string;
  osCylinder?: string;
  osAxis?: string;
  osAdd?: string;
  pd?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

const ProductBlock: React.FC<ProductBlockProps> = ({ product, selectedVariant }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPrescriptionType, setSelectedPrescriptionType] = useState('');
  const [selectedLens, setSelectedLens] = useState<any>(null);
  const [selectedLensOptions, setSelectedLensOptions] = useState<Record<string, string>>({});
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData>({});
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useAuthenticatedFetch();

  // Fetch lens flow data
  const { data: lensFlow, isLoading: flowLoading } = useAppQuery({
    url: `/api/lens-flows/product/${product.id}`,
    reactQueryOptions: {
      enabled: !!product.id,
    },
  });

  // Add to cart mutation
  const addToCartMutation = useAppMutation({
    url: '/api/cart/add',
    method: 'POST',
  });

  const steps = [
    'Select Prescription Type',
    'Choose Lens',
    'Lens Options',
    'Prescription Details',
    'Review & Add to Cart',
  ];

  const handlePrescriptionTypeSelect = (type: string) => {
    setSelectedPrescriptionType(type);
    setPrescriptionData({ ...prescriptionData, prescriptionType: type });
    setCurrentStep(1);
  };

  const handleLensSelect = (lens: any) => {
    setSelectedLens(lens);
    setCurrentStep(2);
  };

  const handleLensOptionChange = (optionName: string, value: string) => {
    setSelectedLensOptions({ ...selectedLensOptions, [optionName]: value });
  };

  const handleAddOnToggle = (addOnId: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addOnId) 
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const handlePrescriptionDataChange = (field: string, value: string) => {
    setPrescriptionData({ ...prescriptionData, [field]: value });
  };

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles(files);
  };

  const calculateTotalPrice = () => {
    if (!selectedLens) return 0;
    
    let total = selectedLens.basePrice;
    
    // Add lens option prices
    Object.entries(selectedLensOptions).forEach(([optionName, value]) => {
      const option = selectedLens.options.find((opt: any) => opt.name === optionName);
      if (option) {
        total += option.price;
      }
    });
    
    // Add add-on prices
    selectedAddOns.forEach(addOnId => {
      const addOn = selectedLens.addOns?.find((addon: any) => addon.productId === addOnId);
      if (addOn) {
        total += addOn.price;
      }
    });
    
    return total;
  };

  const handleAddToCart = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create prescription if needed
      let prescriptionId = null;
      if (selectedPrescriptionType !== 'non-prescription' && selectedPrescriptionType !== 'frame-only') {
        const prescriptionResponse = await fetch('/api/prescriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prescriptionData),
        });
        
        if (!prescriptionResponse.ok) {
          throw new Error('Failed to create prescription');
        }
        
        const prescription = await prescriptionResponse.json();
        prescriptionId = prescription._id;
        
        // Upload files if any
        if (uploadedFiles.length > 0) {
          const formData = new FormData();
          uploadedFiles.forEach(file => {
            formData.append('files', file);
          });
          
          await fetch(`/api/prescriptions/${prescriptionId}/upload`, {
            method: 'POST',
            body: formData,
          });
        }
      }
      
      // Add to cart
      const cartData = {
        productId: product.id,
        variantId: selectedVariant?.id,
        lensFlowId: lensFlow.id,
        selectedLens: {
          lensId: selectedLens.id,
          lensName: selectedLens.name,
          lensType: selectedLens.type,
          options: Object.entries(selectedLensOptions).map(([name, value]) => ({
            name,
            value,
            price: selectedLens.options.find((opt: any) => opt.name === name)?.price || 0,
          })),
          addOns: selectedAddOns.map(addOnId => {
            const addOn = selectedLens.addOns?.find((addon: any) => addon.productId === addOnId);
            return {
              productId: addOnId,
              variantId: addOn?.variantId,
              name: addOn?.name,
              price: addOn?.price || 0,
            };
          }),
        },
        prescriptionId,
        totalPrice: calculateTotalPrice(),
      };
      
      await addToCartMutation.mutate(cartData);
      
      // Close modal and show success
      setIsModalOpen(false);
      // You might want to show a success toast here
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to cart');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Layout>
            <Layout.Section>
              <Text variant="headingMd" as="h2">
                Select Prescription Type
              </Text>
              <div style={{ marginTop: '20px' }}>
                {lensFlow?.prescriptionTypes?.map((type) => (
                  <Card
                    key={type.name}
                    sectioned
                    onClick={() => handlePrescriptionTypeSelect(type.name)}
                    style={{ cursor: 'pointer', marginBottom: '10px' }}
                  >
                    <Stack>
                      <Text variant="bodyMd" fontWeight="bold">
                        {type.displayName}
                      </Text>
                      <Text variant="bodySm" color="subdued">
                        {type.name === 'single-vision' && 'For distance or reading vision correction'}
                        {type.name === 'progressive' && 'No-line multifocal lenses for all distances'}
                        {type.name === 'reading' && 'For close-up reading and computer work'}
                        {type.name === 'non-prescription' && 'Plano lenses with no prescription'}
                        {type.name === 'frame-only' && 'Purchase frame without lenses'}
                      </Text>
                    </Stack>
                  </Card>
                ))}
              </div>
            </Layout.Section>
          </Layout>
        );
        
      case 1:
        return (
          <Layout>
            <Layout.Section>
              <Text variant="headingMd" as="h2">
                Choose Your Lens
              </Text>
              <div style={{ marginTop: '20px' }}>
                {lensFlow?.lenses?.map((lens) => (
                  <Card
                    key={lens.id}
                    sectioned
                    onClick={() => handleLensSelect(lens)}
                    style={{ cursor: 'pointer', marginBottom: '10px' }}
                  >
                    <Stack>
                      <Stack distribution="equalSpacing">
                        <div>
                          <Text variant="bodyMd" fontWeight="bold">
                            {lens.displayName}
                          </Text>
                          <Text variant="bodySm" color="subdued">
                            {lens.type}
                          </Text>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Text variant="bodyMd" fontWeight="bold">
                            ${lens.basePrice}
                          </Text>
                          {lens.compareAtPrice && (
                            <Text variant="bodySm" color="subdued" decoration="lineThrough">
                              ${lens.compareAtPrice}
                            </Text>
                          )}
                        </div>
                      </Stack>
                    </Stack>
                  </Card>
                ))}
              </div>
            </Layout.Section>
          </Layout>
        );
        
      case 2:
        return (
          <Layout>
            <Layout.Section>
              <Text variant="headingMd" as="h2">
                Lens Options
              </Text>
              <div style={{ marginTop: '20px' }}>
                {selectedLens?.options?.map((option: any) => (
                  <Card key={option.name} sectioned>
                    <FormLayout>
                      <Select
                        label={option.displayName}
                        options={[
                          { label: 'Select an option', value: '' },
                          { label: option.displayName, value: option.name },
                        ]}
                        value={selectedLensOptions[option.name] || ''}
                        onChange={(value) => handleLensOptionChange(option.name, value)}
                      />
                      {option.price > 0 && (
                        <Text variant="bodySm" color="subdued">
                          +${option.price}
                        </Text>
                      )}
                    </FormLayout>
                  </Card>
                ))}
                
                {selectedLens?.addOns && selectedLens.addOns.length > 0 && (
                  <Card sectioned>
                    <Text variant="headingSm" as="h3">
                      Add-Ons
                    </Text>
                    <div style={{ marginTop: '15px' }}>
                      {selectedLens.addOns.map((addOn: any) => (
                        <div key={addOn.productId} style={{ marginBottom: '10px' }}>
                          <Checkbox
                            label={`${addOn.name} - $${addOn.price}`}
                            checked={selectedAddOns.includes(addOn.productId)}
                            onChange={() => handleAddOnToggle(addOn.productId)}
                          />
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </Layout.Section>
          </Layout>
        );
        
      case 3:
        return (
          <Layout>
            <Layout.Section>
              <Text variant="headingMd" as="h2">
                Prescription Details
              </Text>
              <div style={{ marginTop: '20px' }}>
                <Card sectioned>
                  <FormLayout>
                    <FormLayout.Group>
                      <TextField
                        label="Customer Name"
                        value={prescriptionData.customerName || ''}
                        onChange={(value) => handlePrescriptionDataChange('customerName', value)}
                      />
                      <TextField
                        label="Email"
                        type="email"
                        value={prescriptionData.customerEmail || ''}
                        onChange={(value) => handlePrescriptionDataChange('customerEmail', value)}
                      />
                    </FormLayout.Group>
                    
                    <FormLayout.Group>
                      <TextField
                        label="Phone"
                        value={prescriptionData.customerPhone || ''}
                        onChange={(value) => handlePrescriptionDataChange('customerPhone', value)}
                      />
                      <TextField
                        label="Pupillary Distance (PD)"
                        value={prescriptionData.pd || ''}
                        onChange={(value) => handlePrescriptionDataChange('pd', value)}
                        helpText="Distance between pupils in millimeters"
                      />
                    </FormLayout.Group>
                    
                    <Divider />
                    
                    <Text variant="headingSm" as="h3">
                      Right Eye (OD)
                    </Text>
                    <FormLayout.Group>
                      <TextField
                        label="Sphere"
                        value={prescriptionData.odSphere || ''}
                        onChange={(value) => handlePrescriptionDataChange('odSphere', value)}
                      />
                      <TextField
                        label="Cylinder"
                        value={prescriptionData.odCylinder || ''}
                        onChange={(value) => handlePrescriptionDataChange('odCylinder', value)}
                      />
                    </FormLayout.Group>
                    <FormLayout.Group>
                      <TextField
                        label="Axis"
                        value={prescriptionData.odAxis || ''}
                        onChange={(value) => handlePrescriptionDataChange('odAxis', value)}
                      />
                      <TextField
                        label="Add"
                        value={prescriptionData.odAdd || ''}
                        onChange={(value) => handlePrescriptionDataChange('odAdd', value)}
                      />
                    </FormLayout.Group>
                    
                    <Divider />
                    
                    <Text variant="headingSm" as="h3">
                      Left Eye (OS)
                    </Text>
                    <FormLayout.Group>
                      <TextField
                        label="Sphere"
                        value={prescriptionData.osSphere || ''}
                        onChange={(value) => handlePrescriptionDataChange('osSphere', value)}
                      />
                      <TextField
                        label="Cylinder"
                        value={prescriptionData.osCylinder || ''}
                        onChange={(value) => handlePrescriptionDataChange('osCylinder', value)}
                      />
                    </FormLayout.Group>
                    <FormLayout.Group>
                      <TextField
                        label="Axis"
                        value={prescriptionData.osAxis || ''}
                        onChange={(value) => handlePrescriptionDataChange('osAxis', value)}
                      />
                      <TextField
                        label="Add"
                        value={prescriptionData.osAdd || ''}
                        onChange={(value) => handlePrescriptionDataChange('osAdd', value)}
                      />
                    </FormLayout.Group>
                    
                    <FileUpload
                      label="Upload Prescription"
                      accept="image/*,.pdf"
                      multiple
                      onDrop={handleFileUpload}
                    >
                      {uploadedFiles.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                          {uploadedFiles.map((file, index) => (
                            <Thumbnail
                              key={index}
                              source={URL.createObjectURL(file)}
                              alt={file.name}
                              size="small"
                            />
                          ))}
                        </div>
                      )}
                    </FileUpload>
                  </FormLayout>
                </Card>
              </div>
            </Layout.Section>
          </Layout>
        );
        
      case 4:
        return (
          <Layout>
            <Layout.Section>
              <Text variant="headingMd" as="h2">
                Review Your Selection
              </Text>
              <div style={{ marginTop: '20px' }}>
                <Card sectioned>
                  <Stack vertical>
                    <Stack distribution="equalSpacing">
                      <Text variant="bodyMd" fontWeight="bold">Product</Text>
                      <Text variant="bodyMd">{product.title}</Text>
                    </Stack>
                    
                    <Stack distribution="equalSpacing">
                      <Text variant="bodyMd" fontWeight="bold">Prescription Type</Text>
                      <Text variant="bodyMd">{selectedPrescriptionType}</Text>
                    </Stack>
                    
                    <Stack distribution="equalSpacing">
                      <Text variant="bodyMd" fontWeight="bold">Lens</Text>
                      <Text variant="bodyMd">{selectedLens?.displayName}</Text>
                    </Stack>
                    
                    <Stack distribution="equalSpacing">
                      <Text variant="bodyMd" fontWeight="bold">Total Price</Text>
                      <Text variant="bodyMd" fontWeight="bold">
                        ${calculateTotalPrice().toFixed(2)}
                      </Text>
                    </Stack>
                  </Stack>
                </Card>
              </div>
            </Layout.Section>
          </Layout>
        );
        
      default:
        return null;
    }
  };

  if (flowLoading) {
    return (
      <Card sectioned>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spinner size="large" />
          <Text variant="bodyMd" as="p" style={{ marginTop: '10px' }}>
            Loading lens options...
          </Text>
        </div>
      </Card>
    );
  }

  if (!lensFlow) {
    return null; // Don't show the block if no lens flow is configured
  }

  return (
    <>
      <Card sectioned>
        <Stack vertical>
          <Text variant="headingMd" as="h2">
            Select Your Lenses
          </Text>
          <Text variant="bodyMd" as="p" color="subdued">
            Choose the perfect prescription lenses for your {product.title}
          </Text>
          <Button
            primary
            onClick={() => setIsModalOpen(true)}
            disabled={!selectedVariant}
          >
            Select Lenses
          </Button>
        </Stack>
      </Card>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Select Your Lenses"
        large
        primaryAction={{
          content: currentStep === steps.length - 1 ? 'Add to Cart' : 'Continue',
          onAction: currentStep === steps.length - 1 ? handleAddToCart : () => setCurrentStep(currentStep + 1),
          loading: isLoading,
          disabled: currentStep === 0 && !selectedPrescriptionType,
        }}
        secondaryActions={[
          {
            content: currentStep === 0 ? 'Cancel' : 'Back',
            onAction: currentStep === 0 ? () => setIsModalOpen(false) : () => setCurrentStep(currentStep - 1),
          },
        ]}
      >
        <Modal.Section>
          {error && (
            <Banner status="critical" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          )}
          
          <div style={{ marginBottom: '20px' }}>
            <Text variant="bodySm" color="subdued">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
            </Text>
          </div>
          
          {renderStep()}
        </Modal.Section>
      </Modal>
    </>
  );
};

export default ProductBlock;
