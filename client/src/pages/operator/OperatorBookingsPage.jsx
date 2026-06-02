import React, { useEffect, useState, useMemo } from 'react';
import { Search, Download, Calendar, Users, IndianRupee, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { Button } from '../../components/Button';
import { getOperatorDashboard } from '../../services/analytics.service';
import { startConversation } from '../../services/messaging.service';
import '../../styles/operator.css';

/* ── Inline helpers ────────────────────────────────────── */
const Toast = ({ msg, type }) =>
  msg ? <div className={`ag-toast ${type}`}>{msg}</div> : null;

const fmtDate = (iso, opts = {}) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
        ...opts
      })
    : '—';

const fmtShort = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const StatusBadge = ({ status }) => {
  const map = {
    confirmed: { label: 'Confirmed', cls: 'ag-badge-success' },
    cancelled:  { label: 'Cancelled',  cls: 'ag-badge-danger' },
    pending:    { label: 'Pending',    cls: 'ag-badge-warning' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'ag-badge-warning' };
  return <span className={`ag-badge ${cls}`}>{label}</span>;
};

const SkeletonRows = () =>
  [1, 2, 3, 4, 5].map(n => (
    <div key={n} style={{
      height: '56px', marginBottom: '6px', borderRadius: '8px',
      background: 'linear-gradient(90deg,#ece8e0 25%,#faf8f3 50%,#ece8e0 75%)',
      backgroundSize: '200% 100%', animation: 'agSpin 1.4s infinite'
    }} />
  ));

/* ── Main Component ────────────────────────────────────── */
const OperatorBookingsPage = () => {
  const [allBookings, setAllBookings] = useState([]);
  const [stats, setStats] = useState({ totalBookings: 0, totalRevenue: 0, totalTours: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ msg: '', type: '' });

  const navigate = useNavigate();

  const handleMessageGuest = async (booking) => {
    try {
      await startConversation({
        recipientId: booking.userId?._id || booking.userId,
        tourId: booking.tourId?._id || booking.tourId
      });
      navigate('/messages');
    } catch (err) {
      console.error(err);
      setToast({ msg: 'Cannot start conversation', type: 'error' });
    }
  };

  const fetchData = () => {
    setLoading(true);
    setError(null);
    getOperatorDashboard()
      .then(res => {
        const d = res.data || res;
        setStats({
          totalBookings: d.totalBookings ?? 0,
          totalRevenue:  d.totalRevenue  ?? 0,
          totalTours:    d.totalTours    ?? 0,
        });
        setAllBookings(Array.isArray(d.recentBookings) ? d.recentBookings : []);
      })
      .catch(() => setError('Failed to load bookings. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  /* Tab counts */
  const tabCounts = useMemo(() => ({
    All:       allBookings.length,
    Confirmed: allBookings.filter(b => b.status === 'confirmed').length,
    Cancelled: allBookings.filter(b => b.status === 'cancelled').length,
  }), [allBookings]);

  /* Client-side filter: tab + search */
  const filtered = useMemo(() => {
    let list = allBookings;
    if (activeTab !== 'All') list = list.filter(b => b.status === activeTab.toLowerCase());
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        (b.userId?.name  || '').toLowerCase().includes(q) ||
        (b.tourId?.title || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [allBookings, activeTab, search]);

  /* DataTable columns */
  const columns = [
    {
      label: 'Tour', key: 'tour', width: '22%',
      render: (_, row) => {
        const img = row.tourId?.images?.[0] || row.tourId?.image || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=80';
        const city = row.tourId?.location?.city || '—';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src={img} alt="thumb"
              style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{row.tourId?.title || '—'}</div>
              <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '2px' }}>📍 {city}</div>
            </div>
          </div>
        );
      }
    },
    {
      label: 'Guest', key: 'guest',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{row.userId?.name || 'Guest'}</div>
          <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '2px' }}>{row.userId?.email || '—'}</div>
        </div>
      )
    },
    {
      label: 'Tour Date', key: 'tourDate',
      render: (_, row) => <span style={{ fontSize: '0.88rem' }}>{fmtDate(row.availabilityId?.date)}</span>
    },
    {
      label: 'Booked On', key: 'bookingDate',
      render: (_, row) => <span style={{ fontSize: '0.88rem', color: '#666' }}>{fmtShort(row.bookingDate)}</span>
    },
    {
      label: 'Guests', key: 'slotsBooked',
      render: (v) => (
        <span style={{ fontSize: '0.88rem' }}>
          {v} {v === 1 ? 'guest' : 'guests'}
        </span>
      )
    },
    {
      label: 'Revenue', key: 'totalPrice', align: 'right',
      render: (v) => (
        <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, color: 'var(--ag-gold, #C9A84C)', fontSize: '1rem' }}>
          ₹{v ?? 0}
        </span>
      )
    },
    {
      label: 'Status', key: 'status',
      render: (v) => <StatusBadge status={v} />
    },
    {
      label: 'Actions', key: 'msg', align: 'right',
      render: (_, row) => (
        <button className="ag-btn-ghost" style={{ padding: '6px', color: 'var(--ag-primary)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => handleMessageGuest(row)} title="Message Guest">
          <MessageSquare size={18} />
        </button>
      )
    }
  ];

  return (
    <div className="ag-dashboard-page">
      <Toast msg={toast.msg} type={toast.type} />

      {/* Header */}
      <div className="ag-page-header">
        <div>
          <h1 className="ag-page-title">Bookings</h1>
          <p style={{ color: '#777', margin: '4px 0 0', fontSize: '0.95rem' }}>
            All bookings received across your tours
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="ag-stat-card">
          <div className="ag-stat-icon"><Calendar size={22} /></div>
          <div className="ag-stat-info">
            <p>Total Bookings</p>
            <h3>{loading ? '—' : stats.totalBookings}</h3>
          </div>
        </div>
        <div className="ag-stat-card">
          <div className="ag-stat-icon"><IndianRupee size={22} /></div>
          <div className="ag-stat-info">
            <p>Total Revenue</p>
            <h3 style={{ color: 'var(--ag-gold, #C9A84C)' }}>{loading ? '—' : `₹${stats.totalRevenue}`}</h3>
          </div>
        </div>
        <div className="ag-stat-card">
          <div className="ag-stat-icon"><Users size={22} /></div>
          <div className="ag-stat-info">
            <p>Active Tours</p>
            <h3>{loading ? '—' : stats.totalTours}</h3>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #eaeaea', marginBottom: '20px' }}>
        {['All', 'Confirmed', 'Cancelled'].map(tab => (
          <button
            key={tab}
            className={`ag-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab} ({tabCounts[tab] ?? 0})
          </button>
        ))}
      </div>

      {/* Search + Export row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '16px' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search by guest name or tour..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ag-form-input"
            style={{ paddingLeft: '40px', paddingRight: '16px', margin: 0, width: '100%' }}
          />
        </div>

        {/* Export + count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {!loading && (
            <span style={{ fontSize: '0.85rem', color: '#999' }}>
              Showing {filtered.length} of {allBookings.length} bookings
            </span>
          )}
          <Button variant="ghost" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={16} /> Export CSV
          </Button>
        </div>
      </div>

      {/* Table / States */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: 'var(--ag-shadow-soft)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '24px' }}><SkeletonRows /></div>
        ) : error ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <p style={{ color: 'var(--ag-danger, #e3342f)', marginBottom: '16px' }}>{error}</p>
            <Button variant="ghost" onClick={fetchData}>Retry</Button>
          </div>
        ) : allBookings.length === 0 ? (
          <div style={{ padding: '80px 24px', textAlign: 'center' }}>
            <p style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '8px' }}>No bookings yet.</p>
            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>When travellers book your tours, they'll appear here.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#aaa' }}>
            No {activeTab.toLowerCase()} bookings found.
          </div>
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}
      </div>

    </div>
  );
};

export default OperatorBookingsPage;
