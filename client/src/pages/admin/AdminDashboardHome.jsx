import React, { useEffect, useState } from 'react';
import { Users, Building2, Map, Calendar, IndianRupee, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAdminDashboard, getAdminLogs } from '../../services/admin.service';
import { getPlatformSentimentOverview } from '../../services/analytics.service';
import '../../styles/admin.css';

const AdminDashboardHome = () => {
  const [data, setData] = useState(null);
  const [platformSentiment, setPlatformSentiment] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getAdminDashboard()
      .then(res => setData(res.data || res))
      .catch(console.error)
      .finally(() => setLoading(false));

    getPlatformSentimentOverview().then(res => {
       if (res && res.data) setPlatformSentiment(res.data);
    }).catch(console.error);

    getAdminLogs().then(res => {
        if (res && res.data) setActivities(res.data);
    }).catch(console.error);
  }, []);

  const stats = [
    { label: 'Total Users',     value: data?.totalUsers,     icon: <Users size={22} /> },
    { label: 'Total Operators', value: data?.totalOperators, icon: <Building2 size={22} /> },
    { label: 'Total Tours',     value: data?.totalTours,     icon: <Map size={22} /> },
    { label: 'Total Bookings',  value: data?.totalBookings,  icon: <Calendar size={22} /> },
    { label: 'Total Revenue',   value: data?.totalRevenue != null ? `₹${data.totalRevenue}` : null, icon: <IndianRupee size={22} />, gold: true },
  ];

  const fmtTime = (ts) => ts ? new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="ag-admin-page">
      <div className="ag-admin-page-header">
        <h1 className="ag-admin-page-title">Platform Overview</h1>
        <p className="ag-admin-page-sub">Live snapshot of the marketplace</p>
      </div>

      {/* Stats Grid */}
      <div className="ag-admin-stats-grid">
        {stats.map(({ label, value, icon, gold }) => (
          <div key={label} className="ag-admin-stat-card">
            <div className="ag-admin-stat-icon">{icon}</div>
            <div className="ag-admin-stat-info">
              <p>{label}</p>
              <h3 className={gold ? 'gold' : ''}>
                {loading ? '—' : (value ?? 0)}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Messaging Stats Section */}
      <h3 style={{ marginTop: '32px', marginBottom: '16px' }}>Platform Messaging</h3>
      <div className="ag-admin-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '32px' }}>
         <div className="ag-admin-stat-card">
            <div className="ag-admin-stat-icon"><MessageSquare size={22} /></div>
            <div className="ag-admin-stat-info">
               <p>Total Conversations</p>
               <h3>{loading ? '—' : (data?.messagingStats?.totalConversations || 0)}</h3>
            </div>
         </div>
         <div className="ag-admin-stat-card">
            <div className="ag-admin-stat-icon"><MessageSquare size={22} /></div>
            <div className="ag-admin-stat-info">
               <p>Active Conversations</p>
               <h3>{loading ? '—' : (data?.messagingStats?.activeConversations || 0)}</h3>
            </div>
         </div>
         <div className="ag-admin-stat-card">
            <div className="ag-admin-stat-icon"><MessageSquare size={22} /></div>
            <div className="ag-admin-stat-info">
               <p>Messages Today</p>
               <h3>{loading ? '—' : (data?.messagingStats?.messagesToday || 0)}</h3>
            </div>
         </div>
      </div>

      {/* Platform Sentiment Overview Section */}
      <h3 style={{ marginTop: '32px', marginBottom: '16px' }}>Platform Sentiment Overview</h3>
      {platformSentiment ? (() => {
        const platformTotal = platformSentiment.totalPositive + platformSentiment.totalNeutral + platformSentiment.totalNegative;
        const posPct = platformTotal > 0 ? (platformSentiment.totalPositive / platformTotal) * 100 : 0;
        const neuPct = platformTotal > 0 ? (platformSentiment.totalNeutral / platformTotal) * 100 : 0;
        
        return (
          <div className="ag-form-section" style={{ padding: '24px', display: 'flex', gap: '32px', flexWrap: 'wrap', marginBottom: '32px' }}>
             
             {/* Donut Chart */}
             <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div 
                  className="ag-sentiment-donut" 
                  style={{ 
                    background: `conic-gradient(var(--ag-success) 0% ${posPct}%, #94a3b8 ${posPct}% ${posPct + neuPct}%, var(--ag-error) ${posPct + neuPct}% 100%)` 
                  }}
                >
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, flexDirection: 'column' }}>
                     <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ag-charcoal)' }}>
                       {Math.round((platformSentiment.overallScore + 1) / 2 * 100)}%
                     </span>
                     <span style={{ fontSize: '0.75rem', color: '#888' }}>Satisfaction</span>
                  </div>
                </div>
             </div>

             {/* Lists */}
             <div style={{ flex: '2 1 300px', display: 'flex', gap: '24px', flexDirection: 'column' }}>
                <div>
                   <h4 style={{ marginBottom: '8px', color: 'var(--ag-success)' }}>Top Performing Tours</h4>
                   {platformSentiment.topPositive.length === 0 ? (
                      <p style={{ color: '#888', fontSize: '0.85rem' }}>Not enough data.</p>
                   ) : (
                      platformSentiment.topPositive.map(t => (
                        <div key={t.tour._id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', padding: '6px 0', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600 }}>{t.tour.title}</span>
                          <span>{Math.round(t.ratio)}% Positive</span>
                        </div>
                      ))
                   )}
                </div>
                <div>
                   <h4 style={{ marginBottom: '8px', color: 'var(--ag-error)' }}>Flagged for Review</h4>
                   {platformSentiment.topNegative.length === 0 ? (
                      <p style={{ color: '#888', fontSize: '0.85rem' }}>Not enough data.</p>
                   ) : (
                      platformSentiment.topNegative.map(t => (
                        <div key={t.tour._id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', padding: '6px 0', fontSize: '0.85rem', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600 }}>{t.tour.title}</span>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                             <span style={{ color: 'var(--ag-error)' }}>{Math.round(t.ratio)}% Positive</span>
                             <button onClick={() => navigate('/admin/tours')} className="ag-btn-ghost" style={{ padding: '2px 8px', fontSize: '0.75rem', border: '1px solid var(--ag-border)' }}>Review</button>
                          </div>
                        </div>
                      ))
                   )}
                </div>
             </div>
          </div>
        );
      })() : (
         <div className="ag-form-section" style={{ padding: '32px 0', textAlign: 'center', marginBottom: '32px', color: '#888' }}>
           Loading platform sentiment data...
         </div>
      )}

      {/* Activity Log */}
      <div className="ag-admin-activity-card">
        <h3>Recent Activity</h3>
        {loading ? (
          [1,2,3,4].map(n => <div key={n} className="ag-admin-skeleton-row" />)
        ) : activities.length === 0 ? (
          <p style={{ color: '#aaa', textAlign: 'center', padding: '32px 0' }}>
            No recent activity to display
          </p>
        ) : (
          <ul className="ag-activity-list">
            {activities.slice(0, 10).map((item, i) => (
              <li key={i} className="ag-activity-item">
                <div className="ag-activity-dot" />
                <span className="ag-activity-desc">
                  {item.description || item.action || JSON.stringify(item)}
                </span>
                <span className="ag-activity-time">{fmtTime(item.createdAt || item.timestamp)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardHome;
