import React, { useState } from 'react';
import {
  Page,
  Card,
  Layout,
  Text,
  Button,
  Spinner,
  Select,
  Stack,
  Badge,
} from '@shopify/polaris';
import { useQuery } from 'react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { apiService } from '../services/api';

const Analytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('30');

  // Fetch analytics data
  const { data: analyticsData, isLoading, error } = useQuery(
    ['analytics', dateRange],
    () => apiService.dashboard.getData(),
    {
      refetchInterval: 30000,
    }
  );

  const COLORS = ['#008060', '#00A0AC', '#5C6AC4', '#EEC200', '#F49342'];

  if (isLoading) {
    return (
      <Page title="Analytics">
        <div className="loading-spinner">
          <Spinner size="large" />
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Analytics">
        <Card sectioned>
          <Text variant="headingMd" as="h2" color="critical">
            Error loading analytics data
          </Text>
        </Card>
      </Page>
    );
  }

  const {
    totalOrders = 0,
    totalRevenue = 0,
    totalPrescriptions = 0,
    activeLensFlows = 0,
    orderStats = [],
    prescriptionStats = [],
    revenueStats = [],
  } = analyticsData || {};

  return (
    <Page
      title="Analytics"
      subtitle="Performance metrics and insights"
      primaryAction={{
        content: 'Export Report',
        onAction: () => {
          // Implement report export
        },
      }}
    >
      <Layout>
        {/* Date Range Selector */}
        <Layout.Section>
          <Card sectioned>
            <Stack>
              <Text variant="headingMd" as="h3">
                Date Range
              </Text>
              <Select
                options={[
                  { label: 'Last 7 days', value: '7' },
                  { label: 'Last 30 days', value: '30' },
                  { label: 'Last 90 days', value: '90' },
                  { label: 'Last year', value: '365' },
                ]}
                value={dateRange}
                onChange={setDateRange}
              />
            </Stack>
          </Card>
        </Layout.Section>

        {/* Key Metrics */}
        <Layout.Section>
          <Layout>
            <Layout.Section oneHalf>
              <Card sectioned>
                <div className="analytics-card">
                  <div className="analytics-metric">{totalOrders}</div>
                  <div className="analytics-label">Total Orders</div>
                </div>
              </Card>
            </Layout.Section>
            <Layout.Section oneHalf>
              <Card sectioned>
                <div className="analytics-card">
                  <div className="analytics-metric">${totalRevenue.toLocaleString()}</div>
                  <div className="analytics-label">Total Revenue</div>
                </div>
              </Card>
            </Layout.Section>
          </Layout>
        </Layout.Section>

        <Layout.Section>
          <Layout>
            <Layout.Section oneHalf>
              <Card sectioned>
                <div className="analytics-card">
                  <div className="analytics-metric">{totalPrescriptions}</div>
                  <div className="analytics-label">Prescriptions</div>
                </div>
              </Card>
            </Layout.Section>
            <Layout.Section oneHalf>
              <Card sectioned>
                <div className="analytics-card">
                  <div className="analytics-metric">{activeLensFlows}</div>
                  <div className="analytics-label">Active Lens Flows</div>
                </div>
              </Card>
            </Layout.Section>
          </Layout>
        </Layout.Section>

        {/* Charts */}
        <Layout.Section>
          <Layout>
            <Layout.Section oneHalf>
              <Card title="Orders Over Time" sectioned>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={orderStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="orders" fill="#008060" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Layout.Section>
            <Layout.Section oneHalf>
              <Card title="Revenue Over Time" sectioned>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                      <Line type="monotone" dataKey="revenue" stroke="#008060" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Layout.Section>
          </Layout>
        </Layout.Section>

        <Layout.Section>
          <Layout>
            <Layout.Section oneHalf>
              <Card title="Prescription Types" sectioned>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prescriptionStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {prescriptionStats.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Layout.Section>
            <Layout.Section oneHalf>
              <Card title="Lens Types" sectioned>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Clear', value: 45 },
                      { name: 'Blue Light', value: 25 },
                      { name: 'Progressive', value: 20 },
                      { name: 'Sunglasses', value: 10 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#00A0AC" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Layout.Section>
          </Layout>
        </Layout.Section>

        {/* Performance Metrics */}
        <Layout.Section>
          <Card title="Performance Metrics" sectioned>
            <Layout>
              <Layout.Section oneThird>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text variant="headingLg" as="h3" color="success">
                    98.5%
                  </Text>
                  <Text variant="bodyMd" as="p" color="subdued">
                    Conversion Rate
                  </Text>
                </div>
              </Layout.Section>
              <Layout.Section oneThird>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text variant="headingLg" as="h3" color="success">
                    2.3 min
                  </Text>
                  <Text variant="bodyMd" as="p" color="subdued">
                    Avg. Checkout Time
                  </Text>
                </div>
              </Layout.Section>
              <Layout.Section oneThird>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text variant="headingLg" as="h3" color="success">
                    $127
                  </Text>
                  <Text variant="bodyMd" as="p" color="subdued">
                    Avg. Order Value
                  </Text>
                </div>
              </Layout.Section>
            </Layout>
          </Card>
        </Layout.Section>

        {/* Top Performing Lens Flows */}
        <Layout.Section>
          <Card title="Top Performing Lens Flows" sectioned>
            <Stack vertical>
              {[
                { name: 'Premium Collection', orders: 45, revenue: 5670 },
                { name: 'Standard Collection', orders: 38, revenue: 3420 },
                { name: 'Budget Collection', orders: 29, revenue: 2030 },
              ].map((flow, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '15px 0',
                  borderBottom: index < 2 ? '1px solid #e1e3e5' : 'none'
                }}>
                  <div>
                    <Text variant="bodyMd" fontWeight="bold">
                      {flow.name}
                    </Text>
                    <Text variant="bodySm" color="subdued">
                      {flow.orders} orders
                    </Text>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Text variant="bodyMd" fontWeight="bold">
                      ${flow.revenue}
                    </Text>
                    <Badge status="success">
                      #{index + 1}
                    </Badge>
                  </div>
                </div>
              ))}
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default Analytics;
