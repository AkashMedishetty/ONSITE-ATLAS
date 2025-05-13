import { useParams } from 'react-router-dom';
import { FiBarChart2, FiUsers, FiDollarSign, FiCalendar, FiFileText } from 'react-icons/fi';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { Card, Row, Col, Alert } from 'react-bootstrap';
import DashboardWidget from './DashboardWidget';
import DashboardChart from './DashboardChart';

const ClientDashboard = () => {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      registrations: 0,
      revenue: 0,
      abstracts: 0,
      sponsors: 0
    },
    charts: {
      registrationTrend: [],
      categoryDistribution: [],
      revenueTrend: [],
      abstractStatus: []
    }
  });

  useEffect(() => {
    fetchDashboardData();
  }, [eventId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/events/${eventId}/dashboard`);
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="m-3">
        {error}
      </Alert>
    );
  }

  return (
    <div className="client-dashboard">
      <h2 className="mb-4">Event Dashboard</h2>

      {/* Stats Overview */}
      <Row className="mb-4">
        <Col md={3}>
          <StatCard 
            icon={<FiUsers />}
            title="Registrations"
            value={dashboardData.stats.registrations}
            subtitle="Total registrants"
            color="blue"
          />
        </Col>
        <Col md={3}>
          <StatCard 
            icon={<FiDollarSign />}
            title="Revenue"
            value={`$${dashboardData.stats.revenue.toLocaleString()}`}
            subtitle="Total revenue"
            color="green"
          />
        </Col>
        <Col md={3}>
          <StatCard 
            icon={<FiFileText />}
            title="Abstracts"
            value={dashboardData.stats.abstracts}
            subtitle="Submissions"
            color="purple"
          />
        </Col>
        <Col md={3}>
          <StatCard 
            icon={<FiCalendar />}
            title="Days"
            value={dashboardData.stats.daysRemaining}
            subtitle="Until event"
            color="orange"
          />
        </Col>
      </Row>

      {/* Charts and Widgets */}
      <Row className="mb-4">
        <Col lg={8}>
          <DashboardWidget 
            title="Registration Trend" 
            icon={<FiBarChart2 />}
            isLoading={loading}
          >
            <DashboardChart 
              type="line"
              height={300}
              data={{
                labels: dashboardData.charts.registrationTrend.map(item => item.date),
                datasets: [
                  {
                    label: 'Registrations',
                    data: dashboardData.charts.registrationTrend.map(item => item.count)
                  }
                ]
              }}
            />
          </DashboardWidget>
        </Col>

        <Col lg={4}>
          <DashboardWidget 
            title="Categories"
            icon={<FiUsers />}
            isLoading={loading}
          >
            <DashboardChart 
              type="doughnut"
              height={260}
              data={{
                labels: dashboardData.charts.categoryDistribution.map(item => item.name),
                datasets: [
                  {
                    data: dashboardData.charts.categoryDistribution.map(item => item.count)
                  }
                ]
              }}
            />
          </DashboardWidget>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={6}>
          <DashboardWidget 
            title="Revenue Trend" 
            icon={<FiDollarSign />}
            isLoading={loading}
          >
            <DashboardChart 
              type="bar"
              height={300}
              data={{
                labels: dashboardData.charts.revenueTrend.map(item => item.date),
                datasets: [
                  {
                    label: 'Revenue',
                    data: dashboardData.charts.revenueTrend.map(item => item.amount)
                  }
                ]
              }}
            />
          </DashboardWidget>
        </Col>
        <Col lg={6}>
          <DashboardWidget 
            title="Abstract Submissions" 
            icon={<FiFileText />}
            isLoading={loading}
          >
            <DashboardChart 
              type="pie"
              height={300}
              data={{
                labels: dashboardData.charts.abstractStatus.map(item => item.status),
                datasets: [
                  {
                    data: dashboardData.charts.abstractStatus.map(item => item.count)
                  }
                ]
              }}
            />
          </DashboardWidget>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row>
        <Col>
          <DashboardWidget 
            title="Recent Activity" 
            isLoading={loading}
          >
            <div className="activity-list">
              {dashboardData.recentActivity?.length > 0 ? (
                dashboardData.recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item d-flex align-items-center py-2 border-bottom">
                    <div className={`activity-icon rounded-circle me-3 bg-${activity.type === 'registration' ? 'primary' : activity.type === 'payment' ? 'success' : 'info'}-subtle p-2`}>
                      {activity.type === 'registration' ? <FiUsers /> : 
                       activity.type === 'payment' ? <FiDollarSign /> : <FiFileText />}
                    </div>
                    <div className="activity-content">
                      <div className="d-flex justify-content-between">
                        <span className="fw-bold">{activity.title}</span>
                        <small className="text-muted">{activity.time}</small>
                      </div>
                      <p className="text-muted mb-0 small">{activity.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted py-3">No recent activity</p>
              )}
            </div>
          </DashboardWidget>
        </Col>
      </Row>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, title, value, subtitle, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200'
  };
  
  return (
    <Card className={`mb-3 border ${colorClasses[color] || 'bg-light'}`}>
      <Card.Body className="p-3">
        <div className="d-flex align-items-center">
          <div className={`stat-icon me-3 rounded-circle d-flex align-items-center justify-content-center bg-${color}-100`}
              style={{ width: '48px', height: '48px' }}>
            {icon}
          </div>
          <div>
            <h3 className="mb-0 fw-bold">{value}</h3>
            <div className="text-muted small">{title}</div>
          </div>
        </div>
        {subtitle && (
          <div className="text-muted mt-2 small">{subtitle}</div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ClientDashboard; 