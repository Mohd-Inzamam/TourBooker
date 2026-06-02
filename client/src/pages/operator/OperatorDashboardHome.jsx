import React, { useEffect, useState } from 'react';
import { MapPin, Calendar, IndianRupee, CheckCircle, ArrowRight, MessageSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getOperatorDashboard, getTourSentimentAnalytics, getOperatorActivities } from '../../services/analytics.service';
import { getConversations } from '../../services/messaging.service';
import { DataTable } from '../../components/DataTable';
import '../../styles/operator.css';

const OperatorDashboardHome = () => {
  const [data, setData] = useState({
    totalTours: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeTours: 0,
    recentBookings: []
  });
  const [loading, setLoading] = useState(true);
  const [inquiries, setInquiries] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sentimentTours, setSentimentTours] = useState([]);
  const [activities, setActivities] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getOperatorDashboard();
        // Fallback for response parsing
        const dashData = res.data || res;
        setData({
          totalTours: dashData.totalTours || 0,
          totalBookings: dashData.totalBookings || 0,
          totalRevenue: dashData.totalRevenue || 0,
          activeTours: dashData.activeTours || dashData.totalTours || 0, // Fallback if backend doesn't supply it
          recentBookings: dashData.recentBookings || []
        });
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchInquiries = async () => {
       try {
         const res = await getConversations();
         if (res && res.conversations) {
            setInquiries(res.conversations.slice(0, 5));
            setUnreadCount(res.unreadCount || 0);
         }
       } catch (err) {
         console.error('Failed to load inquiries', err);
       }
    };

    const fetchSentiments = async () => {
       try {
         const senRes = await getTourSentimentAnalytics();
         if (senRes && senRes.data) {
           setSentimentTours(senRes.data.slice(0, 5));
         }
       } catch (err) {
         console.error('Failed to load sentiment tours', err);
       }
    };

     const fetchActivities = async () => {
       try {
         const res = await getOperatorActivities();
         if (res && res.data) setActivities(res.data);
       } catch (err) {
         console.error('Failed to load activities', err);
       }
     };

     fetchStats();
     fetchInquiries();
     fetchSentiments();
     fetchActivities();
   }, []);

  const bookingCols = [
    { label: 'Tour Name', key: 'tourName', width: '30%' },
    { label: 'Guest Name', key: 'guestName' },
    { label: 'Date', key: 'date', render: (val) => new Date(val).toLocaleDateString() },
    { label: 'Slots', key: 'slots' },
    { label: 'Total Price', key: 'totalPrice', render: (val) => `₹${val}`, align: 'right' },
    { 
      label: 'Status', 
      key: 'status', 
      render: (val) => (
        <span className={`ag-badge ${val === 'confirmed' ? 'ag-badge-success' : 'ag-badge-danger'}`}>
          {val}
        </span>
      ) 
    }
  ];

  // Map mock backend fields if necessary for table props
  const formattedBookings = data.recentBookings.slice(0, 5).map(b => ({
    userId: b.userId?._id || b.userId,
    tourName: b.tourId?.title || 'Unknown Tour',
    guestName: b.userId?.name || 'Guest User',
    date: b.bookingDate || b.createdAt || Date.now(),
    slots: b.slotsBooked || 1,
    totalPrice: b.totalPrice || 0,
    status: b.status || 'confirmed'
  }));

  return (
    <div className="ag-dashboard-page">
      <div className="ag-page-header">
        <h1 className="ag-page-title">Dashboard Overview</h1>
      </div>

      <div className="ag-stats-grid">
        <div className="ag-stat-card">
          <div className="ag-stat-icon"><MapPin size={24} /></div>
          <div className="ag-stat-info">
            <p>Total Tours</p>
            <h3>{loading ? '-' : data.totalTours}</h3>
          </div>
        </div>
        <div className="ag-stat-card">
          <div className="ag-stat-icon"><Calendar size={24} /></div>
          <div className="ag-stat-info">
            <p>Total Bookings</p>
            <h3>{loading ? '-' : data.totalBookings}</h3>
          </div>
        </div>
        <div className="ag-stat-card">
          <div className="ag-stat-icon"><IndianRupee size={24} /></div>
          <div className="ag-stat-info">
            <p>Total Revenue</p>
            <h3>{loading ? '-' : `₹${data.totalRevenue}`}</h3>
          </div>
        </div>
        <div className="ag-stat-card">
          <div className="ag-stat-icon"><CheckCircle size={24} /></div>
          <div className="ag-stat-info">
            <p>Active Tours</p>
            <h3>{loading ? '-' : data.activeTours}</h3>
          </div>
        </div>
      </div>

      <div className="ag-form-section" style={{ padding: '24px 0' }}>
        <h3 style={{ padding: '0 24px' }}>Recent Bookings</h3>
        <DataTable 
          columns={bookingCols} 
          data={loading ? [] : formattedBookings} 
          onRowClick={(row) => navigate(`/operator/users/${row.userId}`)}
        />
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Link to="/operator/bookings" className="ag-back-link" style={{ margin: 0 }}>
            View All Bookings <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* RECENT INQUIRIES WIDGET */}
      <div className="ag-form-section" style={{ padding: '24px', marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><MessageSquare size={20} /> Recent Inquiries</h3>
          <Link to="/messages" className="ag-back-link" style={{ margin: 0, fontSize: '0.85rem' }}>View All Messages <ArrowRight size={14} style={{ marginLeft: '4px' }} /></Link>
        </div>

        {unreadCount > 0 && (
          <div style={{ padding: '12px 16px', background: 'rgba(170, 59, 255, 0.1)', color: 'var(--ag-primary)', borderRadius: '8px', marginBottom: '16px', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }}></div>
             You have {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
          </div>
        )}

        {inquiries.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: '#888' }}>
            No customer inquiries yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {inquiries.map(conv => {
              const partner = conv.participants.find(p => p.role === 'user') || conv.participants[0];
              return (
                <div key={conv._id} onClick={() => navigate('/messages')} style={{ padding: '12px 0', borderBottom: '1px solid #eaeaea', cursor: 'pointer', display: 'flex', gap: '16px', alignItems: 'center', transition: 'all 0.2s', ':hover': { opacity: 0.8 } }}>
                  {conv.isUnread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ag-primary)', flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                       <span style={{ fontWeight: conv.isUnread ? 700 : 500, color: 'var(--ag-charcoal)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{partner.name}</span>
                       <span style={{ fontSize: '0.75rem', color: '#888' }}>{new Date(conv.lastMessageAt || conv.createdAt).toLocaleDateString()}</span>
                    </div>
                    {conv.tourId && <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '2px' }}>re: {conv.tourId.title}</div>}
                    <div style={{ fontSize: '0.85rem', color: conv.isUnread ? '#333' : '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.lastMessage}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RECENT ACTIVITY LOG */}
      <div className="ag-form-section" style={{ padding: '24px', marginTop: '24px', marginBottom: '24px' }}>
        <h3>Recent Activity</h3>
        {loading ? (
          <div style={{ padding: '20px' }}>Loading activities...</div>
        ) : activities.length === 0 ? (
          <p style={{ color: '#aaa', textAlign: 'center', padding: '24px 0' }}>No recent activity.</p>
        ) : (
          <ul className="ag-activity-list" style={{ listStyle: 'none', padding: 0, marginTop: '16px' }}>
            {activities.map((act, i) => (
              <li key={i} style={{ display: 'flex', gap: '12px', padding: '8px 0', borderBottom: i < activities.length - 1 ? '1px solid #f0f0f0' : 'none', alignItems: 'center' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: act.type === 'booking' ? 'var(--ag-success)' : 'var(--ag-primary)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--ag-charcoal)' }}>{act.description}</div>
                  <div style={{ fontSize: '0.75rem', color: '#888' }}>{new Date(act.createdAt).toLocaleString()}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
};

export default OperatorDashboardHome;
