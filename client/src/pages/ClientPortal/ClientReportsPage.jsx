import React, { useState, useEffect, useMemo } from 'react';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import clientReportsService from '../../services/clientReportsService';
import { Tabs, Card, Button, Select, Alert, Spinner } from '../../components/common';
import { Pie, Doughnut, Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Filler
} from 'chart.js';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Filler
);

// Chart component (copied from ReportsTab)
const Chart = ({ type, data, options }) => {
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      title: { display: false },
    },
    ...(options || {}),
  };
  if (!data || !data.labels || !data.datasets || data.labels.length === 0 || data.datasets.length === 0 || !data.datasets[0].data || data.datasets[0].data.length === 0) {
    return (
      <div className="bg-gray-50 border rounded-md p-4 h-64 flex items-center justify-center">
        <p className="text-gray-400 text-center text-sm">No data available for this chart.</p>
      </div>
    );
  }
  const defaultColors = [
    'rgba(75, 192, 192, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)',
    'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)', 'rgba(255, 99, 132, 0.6)',
    'rgba(99, 255, 132, 0.6)', 'rgba(132, 99, 255, 0.6)'
  ];
  const formattedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || (type === 'Pie' || type === 'Doughnut' ? defaultColors : defaultColors[index % defaultColors.length]),
      borderColor: dataset.borderColor || (type === 'Pie' || type === 'Doughnut' ? 'rgba(255, 255, 255, 1)' : defaultColors[index % defaultColors.length].replace('0.6', '1')),
      borderWidth: dataset.borderWidth || 1,
      fill: dataset.fill !== undefined ? dataset.fill : (type === 'Line'),
      tension: dataset.tension || (type === 'Line' ? 0.1 : undefined)
    }))
  };
  const renderChart = () => {
    switch (type?.toLowerCase()) {
      case 'pie': return <Pie data={formattedData} options={commonOptions} />;
      case 'doughnut': return <Doughnut data={formattedData} options={commonOptions} />;
      case 'line':
      case 'area': return <Line data={formattedData} options={commonOptions} />;
      case 'bar': return <Bar data={formattedData} options={commonOptions} />;
      default: return <p className="text-red-500">Unknown or invalid chart type</p>;
    }
  };
  return <div className="relative h-64 w-full">{renderChart()}</div>;
};

const reportTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'registrations', label: 'Registrations' },
  { id: 'food', label: 'Food' },
  { id: 'kitBag', label: 'Kit Bags' },
  { id: 'certificates', label: 'Certs' },
  { id: 'abstracts', label: 'Abstracts' }
];

const ClientReportsPage = () => {
  const { event } = useClientAuth();
  const eventId = event?._id;
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(reportTabs[0].id);
  const [dateRange, setDateRange] = useState('all');
  const [exportFormat, setExportFormat] = useState('excel');
  const [exportLoading, setExportLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [fetchErrors, setFetchErrors] = useState({});
  const [statistics, setStatistics] = useState({
    registrations: { total: 0, checkedIn: 0, byCategory: {}, byDay: [] },
    resources: { food: { total: 0, byType: {}, byDay: [] }, kitBag: { total: 0, byType: {} }, certificates: { total: 0, byType: {} } },
    abstracts: { total: 0, byStatus: {}, byCategory: {} }
  });
  const [resourceStats, setResourceStats] = useState({ food: 0, kits: 0, certificates: 0, total: 0 });
  const [recentFoodScans, setRecentFoodScans] = useState([]);
  const [foodScansLoading, setFoodScansLoading] = useState(false);
  const [recentKitScans, setRecentKitScans] = useState([]);
  const [kitScansLoading, setKitScansLoading] = useState(false);
  const [recentCertScans, setRecentCertScans] = useState([]);
  const [certScansLoading, setCertScansLoading] = useState(false);

  // Hourly scan data (copied from ReportsTab)
  const hourlyFoodScanData = useMemo(() => {
    if (!recentFoodScans || recentFoodScans.length === 0) return { labels: [], datasets: [{ data: [] }] };
    const hourlyCounts = Array(24).fill(0);
    recentFoodScans.forEach(scan => {
      if (scan.timestamp) {
        try { const hour = new Date(scan.timestamp).getHours(); if (hour >= 0 && hour < 24) hourlyCounts[hour]++; } catch (e) {}
      }
    });
    const relevantData = [], hourLabels = [];
    for (let hour = 6; hour <= 22; hour++) {
      relevantData.push(hourlyCounts[hour]);
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const ampm = hour < 12 || hour === 24 ? 'AM' : 'PM';
      hourLabels.push(`${displayHour} ${ampm}`);
    }
    return { labels: hourLabels, datasets: [{ label: 'Scans per Hour', data: relevantData }] };
  }, [recentFoodScans]);
  const hourlyKitScanData = useMemo(() => {
    if (!recentKitScans || recentKitScans.length === 0) return { labels: [], datasets: [{ data: [] }] };
    const hourlyCounts = Array(24).fill(0);
    recentKitScans.forEach(scan => {
      if (scan.timestamp) {
        try { const hour = new Date(scan.timestamp).getHours(); if (hour >= 0 && hour < 24) hourlyCounts[hour]++; } catch (e) {}
      }
    });
    const relevantData = [], hourLabels = [];
    for (let hour = 6; hour <= 22; hour++) {
      relevantData.push(hourlyCounts[hour]);
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const ampm = hour < 12 || hour === 24 ? 'AM' : 'PM';
      hourLabels.push(`${displayHour} ${ampm}`);
    }
    return { labels: hourLabels, datasets: [{ label: 'Scans per Hour', data: relevantData }] };
  }, [recentKitScans]);
  const hourlyCertScanData = useMemo(() => {
    if (!recentCertScans || recentCertScans.length === 0) return { labels: [], datasets: [{ data: [] }] };
    const hourlyCounts = Array(24).fill(0);
    recentCertScans.forEach(scan => {
      if (scan.timestamp) {
        try { const hour = new Date(scan.timestamp).getHours(); if (hour >= 0 && hour < 24) hourlyCounts[hour]++; } catch (e) {}
      }
    });
    const relevantData = [], hourLabels = [];
    for (let hour = 6; hour <= 22; hour++) {
      relevantData.push(hourlyCounts[hour]);
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const ampm = hour < 12 || hour === 24 ? 'AM' : 'PM';
      hourLabels.push(`${displayHour} ${ampm}`);
    }
    return { labels: hourLabels, datasets: [{ label: 'Scans per Hour', data: relevantData }] };
  }, [recentCertScans]);

  useEffect(() => {
    if (!eventId) return;
      setLoading(true);
    setStatus(null);
    setFetchErrors({});
    setFoodScansLoading(true);
    setKitScansLoading(true);
    setCertScansLoading(true);
    Promise.allSettled([
      clientReportsService.getStats(eventId),
      clientReportsService.getAnalytics(eventId),
      clientReportsService.getRecentScans(eventId, 'food', 20),
      clientReportsService.getRecentScans(eventId, 'kitBag', 20),
      clientReportsService.getRecentScans(eventId, 'certificate', 20)
    ]).then(results => {
      const [statsRes, analyticsRes, foodScansRes, kitScansRes, certScansRes] = results;
      const errors = {};
      // Stats
      if (statsRes.status === 'fulfilled' && statsRes.value?.data?.success) {
        const stats = statsRes.value.data.data || {};
        // Use analytics if available for resource and abstract stats
        const analytics = analyticsRes?.value?.data || {};
        setStatistics(prev => ({
          ...prev,
          registrations: {
            ...prev.registrations,
            total: stats.totalRegistrations || 0,
            checkedIn: stats.checkedInRegistrations || 0,
            byCategory: analytics.registrationsByCategory || {},
            byType: analytics.registrationsByType || {},
            byDay: analytics.registrationsByDay || []
          },
          resources: {
            food: {
              total: analytics.resourceUsageTrends?.food || 0,
              byType: {},
              byDay: []
            },
            kitBag: {
              total: analytics.resourceUsageTrends?.kit || 0,
              byType: {}
            },
            certificates: {
              total: analytics.resourceUsageTrends?.certificate || 0,
              byType: {}
            }
          },
          abstracts: {
            total: stats.totalAbstracts || 0,
            byStatus: analytics.abstractsByStatus || {},
            byCategory: analytics.abstractsByCategory || {}
          }
        }));
        setResourceStats({
          food: analytics.resourceUsageTrends?.food || 0,
          kits: analytics.resourceUsageTrends?.kit || 0,
          certificates: analytics.resourceUsageTrends?.certificate || 0,
          total: (analytics.resourceUsageTrends?.food || 0) + (analytics.resourceUsageTrends?.kit || 0) + (analytics.resourceUsageTrends?.certificate || 0)
        });
      } else {
        errors.stats = statsRes.reason?.message || statsRes.value?.message || 'Failed to fetch stats';
      }
      // Analytics
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.data) {
        const analytics = analyticsRes.value.data;
        setStatistics(prev => ({
          ...prev,
          registrations: {
            ...prev.registrations,
            byCategory: analytics.registrationsByCategory || {},
            byType: analytics.registrationsByType || {},
            byDay: analytics.registrationsByDay || [],
            total: prev.registrations.total,
            checkedIn: prev.registrations.checkedIn
          },
          resources: {
            food: {
              byType: analytics.resources?.food?.byType || {},
              byDay: analytics.resources?.food?.byDay || [],
              total: Object.values(analytics.resources?.food?.byType || {}).reduce((a, b) => a + b, 0)
            },
            kitBag: {
              byType: analytics.resources?.kitBag?.byType || {},
              byDay: analytics.resources?.kitBag?.byDay || [],
              total: Object.values(analytics.resources?.kitBag?.byType || {}).reduce((a, b) => a + b, 0)
            },
            certificates: {
              byType: analytics.resources?.certificates?.byType || {},
              byDay: analytics.resources?.certificates?.byDay || [],
              total: Object.values(analytics.resources?.certificates?.byType || {}).reduce((a, b) => a + b, 0)
            }
          },
          abstracts: {
            byStatus: analytics.abstractsByStatus || {},
            total: Object.values(analytics.abstractsByStatus || {}).reduce((a, b) => a + b, 0)
          }
        }));
        setResourceStats({
          food: Object.values(analytics.resources?.food?.byType || {}).reduce((a, b) => a + b, 0),
          kits: Object.values(analytics.resources?.kitBag?.byType || {}).reduce((a, b) => a + b, 0),
          certificates: Object.values(analytics.resources?.certificates?.byType || {}).reduce((a, b) => a + b, 0),
          total: (Object.values(analytics.resources?.food?.byType || {})?.reduce((a, b) => a + b, 0) || 0) +
                (Object.values(analytics.resources?.kitBag?.byType || {})?.reduce((a, b) => a + b, 0) || 0) +
                (Object.values(analytics.resources?.certificates?.byType || {})?.reduce((a, b) => a + b, 0) || 0)
        });
      } else {
        errors.analytics = analyticsRes.reason?.message || analyticsRes.value?.message || 'Failed to fetch analytics';
      }
      // Food scans
      if (foodScansRes.status === 'fulfilled' && foodScansRes.value?.data?.data) {
        setRecentFoodScans(foodScansRes.value.data.data);
      } else {
        errors.foodScans = foodScansRes.reason?.message || foodScansRes.value?.message || 'Failed to fetch food scans';
        setRecentFoodScans([]);
      }
      setFoodScansLoading(false);
      // Kit scans
      if (kitScansRes.status === 'fulfilled' && kitScansRes.value?.data?.data) {
        setRecentKitScans(kitScansRes.value.data.data);
      } else {
        errors.kitScans = kitScansRes.reason?.message || kitScansRes.value?.message || 'Failed to fetch kit scans';
        setRecentKitScans([]);
      }
      setKitScansLoading(false);
      // Cert scans
      if (certScansRes.status === 'fulfilled' && certScansRes.value?.data?.data) {
        setRecentCertScans(certScansRes.value.data.data);
        } else {
        errors.certScans = certScansRes.reason?.message || certScansRes.value?.message || 'Failed to fetch cert scans';
        setRecentCertScans([]);
      }
      setCertScansLoading(false);
      setFetchErrors(errors);
      setLoading(false);
    }).catch(err => {
      setStatus({ type: 'error', message: 'Failed to load report data.', details: err.message });
        setLoading(false);
      setFoodScansLoading(false);
      setKitScansLoading(false);
      setCertScansLoading(false);
    });
  }, [eventId]);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const reportType = activeTab === 'overview' ? 'registrations' : activeTab;
      const response = await clientReportsService.exportReport(eventId, reportType, 'excel', dateRange);
      if (response && response.data instanceof Blob) {
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        let filename = `Event_Report`;
        if (activeTab !== 'overview') filename += `_${activeTab}`;
        filename += `.xlsx`;
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setStatus({ type: 'success', message: `Report exported successfully as Excel` });
      } else {
        throw new Error('Export failed or returned unexpected data.');
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to export report. Please try again.', details: error.message });
    } finally {
      setExportLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return new Intl.NumberFormat().format(num);
  };

  const handleTabChange = (index) => {
    if (reportTabs[index]) setActiveTab(reportTabs[index].id);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2 text-gray-500">Loading report data...</span>
      </div>
    );
  }
  if (status?.type === 'error') {
    return (
      <div className="p-4">
        <Alert type="error" message={status.message} details={status.details} onClose={() => setStatus(null)} />
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="flex justify-end items-center mb-6 space-x-2">
        <Select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          options={[
            { value: 'all', label: 'All Time' },
            { value: 'week', label: 'Past Week' },
            { value: 'month', label: 'Past Month' },
          ]}
          className="w-32"
          size="sm"
        />
        <Select
          value={exportFormat}
          onChange={() => setExportFormat('excel')}
          options={[
            { value: 'excel', label: 'Excel' }
          ]}
          className="w-24"
          size="sm"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exportLoading}
          leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
        >
          {exportLoading ? <Spinner size="xs" className="mr-1" /> : null}
          Export
        </Button>
      </div>
      {status && status.type !== 'error' && (
        <Alert type={status.type} message={status.message} details={status.details} className="mb-6" onClose={() => setStatus(null)} />
      )}
      {/* Only show warning if a critical section fails */}
      {(fetchErrors.stats || fetchErrors.analytics) && (
        <Alert
          type="warning"
          message="Some critical data sections could not be loaded."
          details={`Issues loading: ${Object.keys(fetchErrors).filter(k => k === 'stats' || k === 'analytics').join(', ')}`}
          className="mb-6"
          onClose={() => setFetchErrors({ ...fetchErrors, stats: undefined, analytics: undefined })}
        />
      )}
      <Card className="mb-6">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium">Event Summary</h3>
          {event ? (
            <p className="text-gray-600 text-sm">
              {event.name} - {new Date(event.startDate).toLocaleDateString()} to {new Date(event.endDate).toLocaleDateString()}
            </p>
          ) : (
            <p className="text-gray-500 text-sm">Loading event info...</p>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-blue-700 mb-1 uppercase tracking-wider">Registrations</h4>
            <div className="flex items-baseline">
              <span className="text-xl font-bold mr-1">{formatNumber(statistics.registrations.total)}</span>
              <span className="text-xs text-gray-500">({formatNumber(statistics.registrations.checkedIn)} in)</span>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-green-700 mb-1 uppercase tracking-wider">Food</h4>
            <div className="flex items-baseline">
              <span className="text-xl font-bold mr-1">{formatNumber(resourceStats.food)}</span>
              <span className="text-xs text-gray-500">meals</span>
            </div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-amber-700 mb-1 uppercase tracking-wider">Kits</h4>
            <div className="flex items-baseline">
              <span className="text-xl font-bold mr-1">{formatNumber(resourceStats.kits)}</span>
              <span className="text-xs text-gray-500">distrib.</span>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-purple-700 mb-1 uppercase tracking-wider">Certs</h4>
            <div className="flex items-baseline">
              <span className="text-xl font-bold mr-1">{formatNumber(resourceStats.certificates)}</span>
              <span className="text-xs text-gray-500">issued</span>
            </div>
          </div>
        </div>
      </Card>
      <Card>
        <Tabs
          tabs={reportTabs}
          activeTab={activeTab}
          onChange={handleTabChange}
          variant="underline"
        />
        <div className="mt-4 p-4">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {Object.keys(statistics.registrations.byCategory).length > 0 && (
                <div>
                  <h3 className="text-md font-semibold mb-3">Registrations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">By Category</h4>
                      <Chart type="Pie" data={{ labels: Object.keys(statistics.registrations.byCategory), datasets: [{ data: Object.values(statistics.registrations.byCategory) }] }} />
                    </div>
                    {statistics.registrations.byDay?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Trend</h4>
                        <Chart type="Line" data={{ labels: statistics.registrations.byDay.map(d => new Date(d.date).toLocaleDateString()), datasets: [{ data: statistics.registrations.byDay.map(d => d.count) }] }} />
                      </div>
                    )}
                  </div>
                </div>
              )}
              {(statistics.resources?.food?.byType && Object.keys(statistics.resources.food.byType).length > 0 ||
                statistics.resources?.kitBag?.byType && Object.keys(statistics.resources.kitBag.byType).length > 0 ||
                statistics.resources?.certificates?.byType && Object.keys(statistics.resources.certificates.byType).length > 0) && (
                <div>
                  <h3 className="text-md font-semibold mb-3">Resources</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {statistics.resources?.food?.byType && Object.keys(statistics.resources.food.byType).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Food</h4>
                        <Chart type="Bar" data={{ labels: Object.keys(statistics.resources.food.byType), datasets: [{ data: Object.values(statistics.resources.food.byType) }] }} />
                      </div>
                    )}
                    {statistics.resources?.kitBag?.byType && Object.keys(statistics.resources.kitBag.byType).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Kits</h4>
                        <Chart type="Doughnut" data={{ labels: Object.keys(statistics.resources.kitBag.byType), datasets: [{ data: Object.values(statistics.resources.kitBag.byType) }] }} />
                      </div>
                    )}
                    {statistics.resources?.certificates?.byType && Object.keys(statistics.resources.certificates.byType).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Certs</h4>
                        <Chart type="Doughnut" data={{ labels: Object.keys(statistics.resources.certificates.byType), datasets: [{ data: Object.values(statistics.resources.certificates.byType) }] }} />
                      </div>
                    )}
                  </div>
                </div>
              )}
              {(statistics.abstracts?.byStatus && Object.keys(statistics.abstracts.byStatus).length > 0 ||
                statistics.abstracts?.byCategory && Object.keys(statistics.abstracts.byCategory).length > 0) && (
                <div>
                  <h3 className="text-md font-semibold mb-3">Abstracts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {statistics.abstracts?.byStatus && Object.keys(statistics.abstracts.byStatus).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">By Status</h4>
                        <Chart type="Pie" data={{ labels: Object.keys(statistics.abstracts.byStatus), datasets: [{ data: Object.values(statistics.abstracts.byStatus) }] }} />
                      </div>
                    )}
                    {statistics.abstracts?.byCategory && Object.keys(statistics.abstracts.byCategory).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">By Category</h4>
                        <Chart type="Bar" data={{ labels: Object.keys(statistics.abstracts.byCategory), datasets: [{ label: 'Count', data: Object.values(statistics.abstracts.byCategory) }] }} />
                      </div>
                    )}
                  </div>
                </div>
              )}
              {(!statistics.registrations?.byCategory || Object.keys(statistics.registrations.byCategory).length === 0) &&
                !statistics.registrations?.byDay?.length &&
                (!statistics.resources?.food?.byType || Object.keys(statistics.resources.food.byType).length === 0) &&
                (!statistics.resources?.kitBag?.byType || Object.keys(statistics.resources.kitBag.byType).length === 0) &&
                (!statistics.resources?.certificates?.byType || Object.keys(statistics.resources.certificates.byType).length === 0) &&
                (!statistics.abstracts?.byStatus || Object.keys(statistics.abstracts.byStatus).length === 0) &&
                (!statistics.abstracts?.byCategory || Object.keys(statistics.abstracts.byCategory).length === 0) && (
                  <div className="py-16 text-center">
                    <p className="text-gray-500 mb-2">No statistics data available for this event yet.</p>
                    {!Object.keys(fetchErrors).length && <p className="text-sm text-gray-400">Data fetching completed successfully.</p>}
                    {Object.keys(fetchErrors).length > 0 && <p className="text-sm text-orange-500">Some data sections failed to load.</p>}
                  </div>
                )}
            </div>
          )}
          {/* Registrations Tab */}
          {activeTab === 'registrations' && (
            <div className="space-y-6">
              {statistics.registrations.byDay?.length > 0 ? (
                <div>
                  <h3 className="text-md font-semibold mb-3">Registration Timeline</h3>
                  <Chart type="Area" data={{ labels: statistics.registrations.byDay.map(d => new Date(d.date).toLocaleDateString()), datasets: [{ data: statistics.registrations.byDay.map(d => d.count) }] }} />
                </div>
              ) : <p className="text-center text-gray-500 py-4">No timeline data.</p>}
              {Object.keys(statistics.registrations.byCategory).length > 0 ? (
                <div>
                  <h3 className="text-md font-semibold mb-3">Registrations by Category</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">% of Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(statistics.registrations.byCategory).map(([category, count]) => (
                          <tr key={category}>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">{category}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{formatNumber(count)}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {statistics.registrations.total > 0 ? Math.round((count / statistics.registrations.total) * 100) : 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : <p className="text-center text-gray-500 py-4">No category data.</p>}
            </div>
          )}
          {/* Food Tab */}
          {activeTab === 'food' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {statistics.resources?.food?.byType && Object.keys(statistics.resources.food.byType).length > 0 ? (
                  <div>
                    <h3 className="text-md font-semibold mb-3">Meals Scanned (by Type)</h3>
                    <Chart type="Bar" data={{ labels: Object.keys(statistics.resources.food.byType), datasets: [{ label: 'Scans', data: Object.values(statistics.resources.food.byType) }] }} />
                  </div>
                ) : (
                  !loading && <p className="text-center text-gray-500 py-4">No meal scan data available.</p>
                )}
                {statistics.resources?.food?.byDay?.length > 0 ? (
                  <div>
                    <h3 className="text-md font-semibold mb-3">Daily Food Scan Trend</h3>
                    <Chart type="Line" data={{ labels: statistics.resources.food.byDay.map(d => new Date(d.date).toLocaleDateString()), datasets: [{ label: 'Scans', data: statistics.resources.food.byDay.map(d => d.count), fill: true }] }} />
                  </div>
                ) : (
                  !loading && <p className="text-center text-gray-500 py-4">No daily trend data available.</p>
                )}
              </div>
              {hourlyFoodScanData.labels.length > 0 ? (
                <div>
                  <h3 className="text-md font-semibold mb-3">Hourly Scan Distribution (Recent)</h3>
                  <Chart type="Bar" data={hourlyFoodScanData} />
                </div>
              ) : (
                !loading && <p className="text-center text-gray-500 py-4">Not enough scan data for hourly breakdown.</p>
              )}
              <div>
                <h3 className="text-md font-semibold mb-3">Recent Food Scans</h3>
                {foodScansLoading ? (
                  <div className="flex justify-center items-center h-32"><Spinner size="md" /></div>
                ) : recentFoodScans.length > 0 ? (
                  <div className="overflow-x-auto border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50"><tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Attendee</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Meal</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Scanned By</th>
                      </tr></thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentFoodScans.map((scan) => (
                          <tr key={scan._id}>
                            <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{scan.timestamp ? new Date(scan.timestamp).toLocaleString() : ''}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">{scan.registration?.firstName || ''} {scan.registration?.lastName || ''}<span className="text-xs text-gray-500 block">({scan.registration?.registrationId || 'N/A'})</span></td>
                            <td className="px-4 py-2 text-sm text-gray-700">{scan.resourceOption?.name || 'Unknown Meal'}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{scan.actionBy || 'Unknown'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No recent food scans found.</p>
                )}
              </div>
            </div>
          )}
          {/* Kit Bags Tab */}
          {activeTab === 'kitBag' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {statistics.resources?.kitBag?.byType && Object.keys(statistics.resources.kitBag.byType).length > 0 ? (
                  <div>
                    <h3 className="text-md font-semibold mb-3">Kits Distributed (by Type)</h3>
                    <Chart type="Doughnut" data={{ labels: Object.keys(statistics.resources.kitBag.byType), datasets: [{ data: Object.values(statistics.resources.kitBag.byType) }] }} />
                  </div>
                ) : (
                  !loading && <p className="text-center text-gray-500 py-4">No kit distribution data available.</p>
                )}
                {hourlyKitScanData.labels.length > 0 ? (
                  <div>
                    <h3 className="text-md font-semibold mb-3">Hourly Distribution (Recent)</h3>
                    <Chart type="Bar" data={hourlyKitScanData} />
                  </div>
                ) : (
                  !loading && <p className="text-center text-gray-500 py-4">Not enough scan data for hourly breakdown.</p>
                )}
              </div>
              <div>
                <h3 className="text-md font-semibold mb-3">Recent Kit Distributions</h3>
                {kitScansLoading ? (
                  <div className="flex justify-center items-center h-32"><Spinner size="md" /></div>
                ) : recentKitScans.length > 0 ? (
                  <div className="overflow-x-auto border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50"><tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Attendee</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kit Item</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Scanned By</th>
                      </tr></thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentKitScans.map((scan) => (
                          <tr key={scan._id}>
                            <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{scan.timestamp ? new Date(scan.timestamp).toLocaleString() : ''}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">{scan.registration?.firstName || ''} {scan.registration?.lastName || ''}<span className="text-xs text-gray-500 block">({scan.registration?.registrationId || 'N/A'})</span></td>
                            <td className="px-4 py-2 text-sm text-gray-700">{scan.resourceOption?.name || 'Unknown Kit'}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{scan.actionBy || 'Unknown'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No recent kit distributions found.</p>
                )}
              </div>
            </div>
          )}
          {/* Certificates Tab */}
          {activeTab === 'certificates' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {statistics.resources?.certificates?.byType && Object.keys(statistics.resources.certificates.byType).length > 0 ? (
                  <div>
                    <h3 className="text-md font-semibold mb-3">Certificates Issued (by Type)</h3>
                    <Chart type="Pie" data={{ labels: Object.keys(statistics.resources.certificates.byType), datasets: [{ data: Object.values(statistics.resources.certificates.byType) }] }} />
                  </div>
                ) : (
                  !loading && <p className="text-center text-gray-500 py-4">No certificate issuance data available.</p>
                )}
                {hourlyCertScanData.labels.length > 0 ? (
                  <div>
                    <h3 className="text-md font-semibold mb-3">Hourly Distribution (Recent)</h3>
                    <Chart type="Bar" data={hourlyCertScanData} />
                  </div>
                ) : (
                  !loading && <p className="text-center text-gray-500 py-4">Not enough scan data for hourly breakdown.</p>
                )}
              </div>
              <div>
                <h3 className="text-md font-semibold mb-3">Recent Certificate Issuances</h3>
                {certScansLoading ? (
                  <div className="flex justify-center items-center h-32"><Spinner size="md" /></div>
                ) : recentCertScans.length > 0 ? (
                  <div className="overflow-x-auto border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50"><tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Attendee</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Certificate Type</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Issued By</th>
                      </tr></thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentCertScans.map((scan) => (
                          <tr key={scan._id}>
                            <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{scan.timestamp ? new Date(scan.timestamp).toLocaleString() : ''}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">{scan.registration?.firstName || ''} {scan.registration?.lastName || ''}<span className="text-xs text-gray-500 block">({scan.registration?.registrationId || 'N/A'})</span></td>
                            <td className="px-4 py-2 text-sm text-gray-700">{scan.resourceOption?.name || 'Unknown Type'}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{scan.actionBy || 'Unknown'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No recent certificate issuances found.</p>
                )}
              </div>
            </div>
          )}
          {/* Abstracts Tab */}
          {activeTab === 'abstracts' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(statistics.abstracts?.byStatus && Object.keys(statistics.abstracts.byStatus).length > 0) ? (
                  <div>
                    <h3 className="text-md font-semibold mb-3">Abstracts by Status</h3>
                    <Chart type="Pie" data={{ labels: Object.keys(statistics.abstracts.byStatus), datasets: [{ data: Object.values(statistics.abstracts.byStatus) }] }} />
                  </div>
                ) : (
                  !loading && <p className="text-center text-gray-500 py-4">No abstract status data available.</p>
                )}
                {(statistics.abstracts?.byCategory && Object.keys(statistics.abstracts.byCategory).length > 0) ? (
                  <div>
                    <h3 className="text-md font-semibold mb-3">Abstracts by Category</h3>
                    <Chart type="Bar" data={{ labels: Object.keys(statistics.abstracts.byCategory), datasets: [{ label: 'Count', data: Object.values(statistics.abstracts.byCategory) }] }} />
                  </div>
                ) : (
                  !loading && <p className="text-center text-gray-500 py-4">No abstract category data available.</p>
                )}
              </div>
      </div>
          )}
      </div>
      </Card>
    </div>
  );
};

export default ClientReportsPage; 