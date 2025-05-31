import React, { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, LineChart, Line, RadialBarChart, RadialBar, Legend
} from 'recharts';
import { FaUserCheck, FaUserTimes, FaUser, FaClipboardList, FaBoxOpen, FaUtensils, FaCertificate, FaMoneyBillWave, FaRegClock, FaRegListAlt, FaBell, FaPlus, FaDownload } from 'react-icons/fa';
import Card from '../../components/common/Card';
import { Modal, Button, Spinner, Alert } from '../../components/common';
import ClientBulkImport from './ClientBulkImport';
import { clientAnnouncementService } from '../../services/clientAnnouncementService';
import eventService from '../../services/eventService';
import { useClientAuth } from '../../contexts/ClientAuthContext';

const COLORS = ['#2A4365', '#8B5CF6', '#F59E42', '#10B981', '#F43F5E', '#6366F1', '#FBBF24', '#14B8A6'];

const statCards = [
  { key: 'totalRegistrations', label: 'Registrations', color: 'border-blue-500', icon: <FaUser className="text-blue-500" /> },
  { key: 'checkedIn', label: 'Checked-in', color: 'border-green-500', icon: <FaUserCheck className="text-green-500" /> },
  { key: 'notCheckedIn', label: 'Not Checked-in', color: 'border-yellow-500', icon: <FaUserTimes className="text-yellow-500" /> },
  { key: 'totalAbstracts', label: 'Abstracts', color: 'border-purple-500', icon: <FaClipboardList className="text-purple-500" /> },
  { key: 'totalSponsors', label: 'Sponsors', color: 'border-pink-500', icon: <FaRegListAlt className="text-pink-500" /> },
  { key: 'totalPayments', label: 'Payments', color: 'border-green-400', icon: <FaMoneyBillWave className="text-green-400" /> },
  { key: 'kitBags', label: 'Kit Bags', color: 'border-orange-400', icon: <FaBoxOpen className="text-orange-400" /> },
  { key: 'meals', label: 'Meals', color: 'border-amber-400', icon: <FaUtensils className="text-amber-400" /> },
  { key: 'certificates', label: 'Certificates', color: 'border-cyan-400', icon: <FaCertificate className="text-cyan-400" /> },
];

// Custom legend for PieChart
const PieLegend = ({ data }) => (
  <div className="flex flex-wrap gap-4 mt-4 justify-center">
    {data.map((entry, i) => (
      <div key={i} className="flex items-center space-x-2">
        <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: entry.color }}></span>
        <span className="text-sm text-gray-700 font-medium">{entry.name}</span>
        <span className="text-xs text-gray-500">({entry.value})</span>
      </div>
    ))}
  </div>
);

// Mock tasks/reminders
const mockTasks = [
  { id: 1, title: 'Check-in counter setup', due: 'Today', status: 'pending' },
  { id: 2, title: 'Print badges for VIPs', due: 'Tomorrow', status: 'pending' },
  { id: 3, title: 'Send certificate emails', due: 'In 2 days', status: 'done' },
];

const ClientDashboardPage = () => {
  const [stats, setStats] = useState({});
  const [charts, setCharts] = useState({});
  const [recent, setRecent] = useState({ activity: [], registrations: [], abstracts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [addForm, setAddForm] = useState({ firstName: '', lastName: '', email: '', category: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const { event } = useClientAuth();
  const eventId = event?._id || window.localStorage.getItem('client_event_id');
  const [registrationSettings, setRegistrationSettings] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch main stats
        const statsRes = await apiClient.get('/client-portal-auth/me/dashboard');
        // Fetch analytics (TODO: replace with real endpoints)
        const chartsRes = await apiClient.get('/client-portal-auth/me/analytics').catch(() => ({ data: {} }));
        // Fetch recent activity (TODO: replace with real endpoint)
        const recentRes = await apiClient.get('/client-portal-auth/me/recent').catch(() => ({ data: {} }));
        setStats({
          ...statsRes.data.data,
          notCheckedIn: (statsRes.data.data?.totalRegistrations || 0) - (statsRes.data.data?.checkedIn || 0),
          kitBags: chartsRes.data?.kitBags || 0,
          meals: chartsRes.data?.meals || 0,
          certificates: chartsRes.data?.certificates || 0,
        });
        setCharts(chartsRes.data || {});
        setRecent({
          activity: recentRes.data?.activity || [],
          registrations: recentRes.data?.registrations || [],
          abstracts: recentRes.data?.abstracts || [],
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Fetch announcements
  useEffect(() => {
    if (!eventId) return;
    setAnnouncementsLoading(true);
    setAnnouncementsError(null);
    clientAnnouncementService.getAnnouncementsByEvent(eventId, { isActive: true, limit: 5 })
      .then(res => setAnnouncements(res.data || res.announcements || []))
      .catch(err => setAnnouncementsError(err.message || 'Failed to load reminders'))
      .finally(() => setAnnouncementsLoading(false));
  }, [eventId]);

  // Fetch categories for AddRegistrant
  useEffect(() => {
    if (!eventId) return;
    eventService.getEventCategoriesPublic(eventId)
      .then(res => setCategories(res.data || []))
      .catch(() => setCategories([]));
  }, [eventId]);

  // Fetch registration settings when Add Registrant modal opens
  useEffect(() => {
    if (showAddModal && eventId) {
      eventService.getEventById(eventId).then(res => {
        setRegistrationSettings(res.data?.registrationSettings || null);
      });
    }
  }, [showAddModal, eventId]);

  // Helper to get all fields in order
  const getOrderedFields = () => {
    if (!registrationSettings) return [];
    const { fieldOrder = [], visibleFields = [], requiredFields = [], customFields = [] } = registrationSettings;
    const customFieldMap = customFields.reduce((acc, f) => { acc[f.name] = f; return acc; }, {});
    return fieldOrder
      .filter(f => visibleFields.includes(f))
      .map(fieldName => {
        // Built-in fields
        if (["firstName","lastName","email","categoryId","phone","organization","address","city","state","country","postalCode","mciNumber","membership"].includes(fieldName)) {
          return {
            id: fieldName,
            label: fieldName === 'categoryId' ? 'Category' : fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
            type: fieldName === 'email' ? 'email' : (fieldName === 'phone' ? 'tel' : 'text'),
            required: requiredFields.includes(fieldName),
            isCustom: false
          };
        }
        // Custom fields
        if (customFieldMap[fieldName]) {
          const cf = customFieldMap[fieldName];
          return {
            id: cf.name,
            label: cf.label || cf.name,
            type: cf.type || 'text',
            required: cf.isRequired || requiredFields.includes(cf.name),
            isCustom: true,
            options: cf.options || []
          };
        }
        return null;
      })
      .filter(Boolean);
  };

  // Add Registrant handler
  const handleAddRegistrant = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    setAddSuccess('');
    if (!registrationSettings) {
      setAddError('Form not ready.');
      setAddLoading(false);
      return;
    }
    const { fieldOrder = [], requiredFields = [], customFields = [] } = registrationSettings;
    // Validate required fields
    for (const field of fieldOrder) {
      if (requiredFields.includes(field) && (!addForm[field] || addForm[field].toString().trim() === '')) {
        setAddError(`Field "${field}" is required.`);
        setAddLoading(false);
        return;
      }
    }
    // Build payload
    const personalInfo = {};
    const customFieldMap = customFields.reduce((acc, f) => { acc[f.name] = f; return acc; }, {});
    let category = '';
    for (const field of fieldOrder) {
      if (field === 'categoryId') {
        category = addForm.categoryId;
      } else if (["firstName","lastName","email","phone","organization","address","city","state","country","postalCode","mciNumber","membership"].includes(field)) {
        personalInfo[field] = addForm[field] || '';
      }
    }
    // Custom fields
    const customFieldsPayload = {};
    for (const field of fieldOrder) {
      if (customFieldMap[field]) {
        customFieldsPayload[field] = addForm[field] || '';
      }
    }
    try {
      await apiClient.post('/client-portal-auth/me/registrants', {
        personalInfo,
        customFields: Object.keys(customFieldsPayload).length ? customFieldsPayload : undefined,
        category,
        registrationType: 'onsite',
      });
      setAddSuccess('Registrant added successfully!');
      setAddForm({});
      setTimeout(() => {
        setShowAddModal(false);
        setAddSuccess('');
        window.location.reload();
      }, 1000);
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add registrant');
    } finally {
      setAddLoading(false);
    }
  };

  if (loading) return <div className="text-center text-blue-700">Loading dashboard...</div>;
  if (error) return <div className="text-center text-red-600">{error}</div>;

  // Helper for chart data
  const pieData = (obj) => obj ? Object.entries(obj).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] })) : [];
  const barData = (obj) => obj ? Object.entries(obj).map(([name, value]) => ({ name, value })) : [];
  const lineData = (arr) => arr || [];

  // Radial progress for checked-in percentage
  const checked = Number(stats.checkedIn) || 0;
  const total = Number(stats.totalRegistrations) || 0;
  const checkedInPercent = total > 0 ? Math.round((checked / total) * 100) : 0;
  const radialData = [
    { name: 'Checked-in', value: checkedInPercent, fill: '#10B981' },
    { name: 'Not Checked-in', value: 100 - checkedInPercent, fill: '#E5E7EB' }
  ];

  // Replace quickActions with modal triggers
  const quickActions = [
    { label: 'Add Registrant', icon: <FaPlus />, onClick: () => setShowAddModal(true) },
    { label: 'Import', icon: <FaDownload />, onClick: () => setShowImportModal(true) },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-6 md:px-10 py-8 bg-gray-50 min-h-screen">
      {/* Dashboard Header */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">Event Dashboard</h1>
          <div className="h-1 w-16 bg-gradient-to-r from-blue-600 to-purple-400 rounded-full mb-2"></div>
          <p className="text-gray-500 text-base">All your event analytics, resources, and actions in one place.</p>
        </div>
        {/* Quick Actions */}
        <div className="flex gap-3">
          {quickActions.map((action, i) => (
            <button key={i} onClick={action.onClick} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition">
              {action.icon} <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
        {statCards.map(card => (
          <Card
            key={card.key}
            className={`flex items-center gap-4 px-4 py-5 border-l-8 ${card.color} bg-white shadow-lg hover:shadow-xl transition`}
            rounded="2xl"
            padding="none"
            hover
            animate
          >
            <div className="text-3xl flex-shrink-0">{card.icon}</div>
            <div>
              <div className="text-2xl font-bold text-gray-900 leading-tight">{stats[card.key] ?? '--'}</div>
              <div className="text-gray-500 text-sm font-medium tracking-wide">{card.label}</div>
            </div>
          </Card>
        ))}
      </div>
      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
        {/* Left: Charts */}
        <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Registrations by Category Donut */}
          <Card className="flex flex-col items-center bg-white/90 shadow-xl p-7" rounded="2xl" animate>
            <h3 className="font-semibold text-lg text-gray-900 mb-2 tracking-wide">Registrations by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              {pieData(charts.registrationsByCategory).length > 0 ? (
                <PieChart>
                  <Pie data={pieData(charts.registrationsByCategory)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} label>
                    {pieData(charts.registrationsByCategory).map((entry, i) => (
                      <Cell key={`cell-cat-${i}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              ) : (
                <div className="text-gray-400 text-center py-10">No data available</div>
              )}
            </ResponsiveContainer>
            {pieData(charts.registrationsByCategory).length > 0 && <PieLegend data={pieData(charts.registrationsByCategory)} />}
          </Card>
          {/* Registrations by Type Donut */}
          <Card className="flex flex-col items-center bg-white/90 shadow-xl p-7" rounded="2xl" animate>
            <h3 className="font-semibold text-lg text-gray-900 mb-2 tracking-wide">Registrations by Type</h3>
            <ResponsiveContainer width="100%" height={220}>
              {pieData(charts.registrationsByType).length > 0 ? (
                <PieChart>
                  <Pie data={pieData(charts.registrationsByType)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} label>
                    {pieData(charts.registrationsByType).map((entry, i) => (
                      <Cell key={`cell-type-${i}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              ) : (
                <div className="text-gray-400 text-center py-10">No data available</div>
              )}
            </ResponsiveContainer>
            {pieData(charts.registrationsByType).length > 0 && <PieLegend data={pieData(charts.registrationsByType)} />}
          </Card>
          {/* Registrations by Day Line */}
          <Card className="flex flex-col items-center bg-white/90 shadow-xl p-7" rounded="2xl" animate>
            <h3 className="font-semibold text-lg text-gray-900 mb-2 tracking-wide">Registrations by Day</h3>
            <ResponsiveContainer width="100%" height={220}>
              {lineData(charts.registrationsByDay).length > 0 ? (
                <LineChart data={lineData(charts.registrationsByDay)}>
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="count" stroke="#2A4365" strokeWidth={2} />
                  <RechartsTooltip />
                  <Legend />
                </LineChart>
              ) : (
                <div className="text-gray-400 text-center py-10">No data available</div>
              )}
            </ResponsiveContainer>
          </Card>
          {/* Checked-in Radial Progress */}
          <Card className="flex flex-col items-center bg-white/90 shadow-xl p-7" rounded="2xl" animate>
            <h3 className="font-semibold text-lg text-gray-900 mb-2 tracking-wide">Checked-in %</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={18} data={radialData} startAngle={90} endAngle={-270}>
                <RadialBar minAngle={15} background clockWise dataKey="value" cornerRadius={10} />
                <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
                <RechartsTooltip />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="mt-2 text-2xl font-bold text-green-600">{checkedInPercent}%</div>
            <div className="text-gray-500 text-sm">of all registrations</div>
          </Card>
        </div>
        {/* Right: Tasks/Reminders & Recent Activity */}
        <div className="flex flex-col gap-8">
          {/* Tasks/Reminders (now Announcements) */}
          <Card className="bg-white/95 shadow-xl p-6" rounded="2xl" animate>
            <div className="flex items-center gap-2 mb-4">
              <FaBell className="text-yellow-400 text-xl" />
              <h3 className="font-semibold text-lg text-gray-900 tracking-wide">Reminders & Announcements</h3>
            </div>
            {announcementsLoading ? (
              <div className="text-blue-600">Loading...</div>
            ) : announcementsError ? (
              <div className="text-red-600">{announcementsError}</div>
            ) : announcements.length === 0 ? (
              <div className="text-gray-400">No reminders or announcements.</div>
            ) : (
              <ul className="space-y-3">
                {announcements.map(a => (
                  <li key={a._id} className="flex flex-col p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                    <span className="font-medium text-gray-800">{a.title}</span>
                    <span className="text-xs text-gray-500">{a.deadline ? `Due: ${new Date(a.deadline).toLocaleDateString()}` : ''}</span>
                    <span className="text-sm text-gray-600 line-clamp-2">{a.content}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {/* Recent Activity */}
          <Card className="bg-white/95 shadow-xl p-6" rounded="2xl" animate>
            <div className="flex items-center gap-2 mb-4">
              <FaRegClock className="text-blue-400 text-xl" />
              <h3 className="font-semibold text-lg text-gray-900 tracking-wide">Recent Activity</h3>
            </div>
            <ul className="space-y-2 max-h-56 overflow-y-auto">
              {recent.activity.length === 0 ? <li className="text-gray-400">No recent activity.</li> : recent.activity.map((a, i) => (
                <li key={i} className="flex items-center text-sm text-gray-700">
                  <span>{a.description || a.details || 'Activity'}</span>
                  <span className="ml-auto text-xs text-gray-400">{a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
      {/* Recent Registrations & Abstracts */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-12">
        {/* Recent Registrations */}
        <Card className="bg-white/95 shadow-xl p-6" rounded="2xl" animate>
          <h3 className="font-semibold text-lg text-gray-900 mb-2 tracking-wide">Recent Registrations</h3>
          <ul className="space-y-2 max-h-56 overflow-y-auto">
            {recent.registrations.length === 0 ? <li className="text-gray-400">No recent registrations.</li> : recent.registrations.map((r, i) => (
              <li key={i} className="flex flex-col text-sm text-gray-700">
                <span className="font-medium">{r.name || r.personalInfo?.firstName + ' ' + r.personalInfo?.lastName}</span>
                <span className="text-xs text-gray-400">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</span>
              </li>
            ))}
          </ul>
        </Card>
        {/* Recent Abstracts */}
        <Card className="bg-white/95 shadow-xl p-6" rounded="2xl" animate>
          <h3 className="font-semibold text-lg text-gray-900 mb-2 tracking-wide">Recent Abstracts</h3>
          <ul className="space-y-2 max-h-56 overflow-y-auto">
            {recent.abstracts.length === 0 ? <li className="text-gray-400">No recent abstracts.</li> : recent.abstracts.map((a, i) => (
              <li key={i} className="flex flex-col text-sm text-gray-700">
                <span className="font-medium">{a.title || a.abstractTitle}</span>
                <span className="text-xs text-gray-400">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      {/* Add Registrant Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Registrant" size="md" centered>
        <form onSubmit={handleAddRegistrant} className="space-y-4">
          {addError && <Alert type="error" message={addError} />}
          {addSuccess && <Alert type="success" message={addSuccess} />}
          {registrationSettings ? (
            getOrderedFields().map(field => (
              <div key={field.id}>
                <label className="block text-sm font-medium mb-1">{field.label}{field.required && <span className="text-red-500">*</span>}</label>
                {field.id === 'categoryId' ? (
                  <select className="border rounded px-2 py-1 w-full" value={addForm.categoryId || ''} onChange={e => setAddForm(f => ({ ...f, categoryId: e.target.value }))} required={field.required}>
                    <option value="">Select Category</option>
                    {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                  </select>
                ) : field.type === 'select' && field.options && field.options.length > 0 ? (
                  <select className="border rounded px-2 py-1 w-full" value={addForm[field.id] || ''} onChange={e => setAddForm(f => ({ ...f, [field.id]: e.target.value }))} required={field.required}>
                    <option value="">Select {field.label}</option>
                    {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input type={field.type} className="border rounded px-2 py-1 w-full" value={addForm[field.id] || ''} onChange={e => setAddForm(f => ({ ...f, [field.id]: e.target.value }))} required={field.required} />
                )}
              </div>
            ))
          ) : (
            <div className="text-gray-500">Loading form fields...</div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={addLoading}>Add</Button>
          </div>
        </form>
      </Modal>
      {/* Import Modal */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Bulk Import Registrations" size="3xl" centered scrollBehavior="inside">
        <ClientBulkImport eventId={eventId} />
      </Modal>
    </div>
  );
};

export default ClientDashboardPage; 