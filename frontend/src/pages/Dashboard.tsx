import React from 'react';
import { Page, Card, Layout, Text, Button, Spinner } from '@shopify/polaris';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PlusIcon } from '@shopify/polaris-icons';
import { api } from '../services/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery(
    'dashboard',
    () => api.get('/dashboard'),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  if (isLoading) {
    return (
      <Page title="Dashboard">
        <div className="loading-spinner">
          <Spinner size="large" />
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Dashboard">
        <Card sectioned>
          <Text variant="headingMd" as="h2" color="critical">
            Error loading dashboard data
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
    recentOrders = [],
    orderStats = [],
    prescriptionStats = []
  } = dashboardData || {};

  const COLORS = ['#008060', '#00A0AC', '#5C6AC4', '#EEC200', '#F49342'];

  return (
    <Page
      title="Dashboard"
      primaryAction={{
        content: 'Create Lens Flow',
        icon: PlusIcon,
        onAction: () => navigate('/lens-flows/new'),
      }}
    >
      <Layout>
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
          </Layout>
        </Layout.Section>

        {/* Recent Orders */}
        <Layout.Section>
          <Card title="Recent Orders" sectioned>
            {recentOrders.length > 0 ? (
              <div>
                {recentOrders.slice(0, 5).map((order: any) => (
                  <div key={order.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid #e1e3e5'
                  }}>
                    <div>
                      <Text variant="bodyMd" as="p" fontWeight="semibold">
                        Order #{order.orderNumber}
                      </Text>
                      <Text variant="bodySm" as="p" color="subdued">
                        {order.customerEmail}
                      </Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text variant="bodyMd" as="p" fontWeight="semibold">
                        ${order.totalPrice}
                      </Text>
                      <Text variant="bodySm" as="p" color="subdued">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </Text>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: '15px', textAlign: 'center' }}>
                  <Button onClick={() => navigate('/orders')}>
                    View All Orders
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Text variant="bodyMd" as="p" color="subdued">
                  No orders yet. Create your first lens flow to get started!
                </Text>
                <div style={{ marginTop: '15px' }}>
                  <Button primary onClick={() => navigate('/lens-flows/new')}>
                    Create Lens Flow
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </Layout.Section>

        {/* Quick Actions */}
        <Layout.Section>
          <Card title="Quick Actions" sectioned>
            <Layout>
              <Layout.Section oneThird>
                <Button
                  fullWidth
                  onClick={() => navigate('/lens-flows/new')}
                >
                  Create Lens Flow
                </Button>
              </Layout.Section>
              <Layout.Section oneThird>
                <Button
                  fullWidth
                  onClick={() => navigate('/prescriptions')}
                >
                  View Prescriptions
                </Button>
              </Layout.Section>
              <Layout.Section oneThird>
                <Button
                  fullWidth
                  onClick={() => navigate('/settings')}
                >
                  App Settings
                </Button>
              </Layout.Section>
            </Layout>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default Dashboard;
