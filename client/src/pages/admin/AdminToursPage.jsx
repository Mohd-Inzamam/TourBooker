import React, { useEffect, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { getTours } from '../../services/tour.service';
import { removeTour } from '../../services/admin.service';
import '../../styles/admin.css';

const TABS = ['All', 'Active', 'Removed'];

const Toast = ({ msg, type }) => msg ? <div className={`ag-admin-toast ${type}`}>{msg}</div> : null;

const Modal = ({ open, title, desc, warn, onCancel, onConfirm, loading }) => {
  if (!open) return null;
  return (
    <div className="ag-admin-modal-overlay">
      <div className="ag-admin-modal">
        <h3 className="ag-admin-modal-title">{title}</h3>
        <p className="ag-admin-modal-desc">{desc}</p>
        <p className="ag-admin-modal-warn">{warn}</p>
        <div className="ag-admin-modal-actions">
          <button
            style={{ flex: 1, cursor: 'pointer', background: '#f0f0f0', color: '#555', border: '1px solid #ddd', padding: '8px 0', borderRadius: '6px', fontWeight: 600 }}
            onClick={onCancel} disabled={loading}
          >Cancel</button>
          <button
            className="ag-admin-action-btn ag-admin-btn-danger"
            style={{ flex: 1 }}
            onClick={onConfirm} disabled={loading}
          >{loading ? 'Removing...' : 'Yes, Remove'}</button>
        </div>
      </div>
    </div>
  );
};

const AdminToursPage = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [toast, setToast] = useState({ msg: '', type: '' });
  const [modal, setModal] = useState({ open: false, id: null, title: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3000);
  };

  const fetchAll = () => {
    setLoading(true); setError(null);
    // Pass empty params to get all tours (admin sees all)
    getTours()
      .then(res => {
        const raw = res.data?.tours || res.data?.data || res.data || res.tours || res;
        setTours(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setError('Failed to fetch tours.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleRemoveConfirm = async () => {
    setActionLoading(true);
    try {
      await removeTour(modal.id);
      setTours(prev => prev.map(t => (t._id || t.id) === modal.id ? { ...t, isActive: false } : t));
      showToast('Tour removed successfully');
      setModal({ open: false, id: null, title: '' });
    } catch {
      showToast('Remove action failed.', 'error');
    } finally { setActionLoading(false); }
  };

  const filtered = tours.filter(t => {
    if (activeTab === 'Active') return t.isActive !== false;
    if (activeTab === 'Removed') return t.isActive === false;
    return true;
  });

  const columns = [
    {
      label: 'Tour', key: 'title', width: '30%',
      render: (val, row) => {
        const img = Array.isArray(row.images) ? row.images[0] : row.image;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={img || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=80'} alt={val} className="ag-admin-thumb" />
            <span style={{ fontWeight: 500 }}>{val}</span>
          </div>
        );
      }
    },
    { label: 'Operator', key: 'operatorId', render: (v) => v?.name || v?.email || '—' },
    { label: 'Category', key: 'category',   render: (v) => v?.name || v || '—' },
    { label: 'Location', key: 'location',   render: (v, row) => v?.city || row.city || '—' },
    { label: 'Price',    key: 'price',       render: (v) => `₹${v}` },
    { label: 'Rating',   key: 'ratingAverage', render: (v, row) => v > 0 ? `⭐ ${v} (${row.ratingCount ?? 0})` : 'No rating' },
    {
      label: 'Status', key: 'isActive',
      render: (v) => v !== false
        ? <span className="ag-badge ag-badge--approved">Active</span>
        : <span className="ag-badge ag-badge--inactive">Removed</span>
    },
    {
      label: 'Actions', key: 'actions', align: 'right',
      render: (_, row) => {
        const id = row._id || row.id;
        if (row.isActive === false) {
          return <button className="ag-admin-action-btn ag-admin-btn-disabled" disabled>Removed</button>;
        }
        return (
          <button
            className="ag-admin-action-btn ag-admin-btn-danger"
            onClick={() => setModal({ open: true, id, title: row.title })}
          >Remove Tour</button>
        );
      }
    }
  ];

  return (
    <div className="ag-admin-page">
      <Toast msg={toast.msg} type={toast.type} />

      <div className="ag-admin-page-header">
        <h1 className="ag-admin-page-title">Manage Tours</h1>
        <p className="ag-admin-page-sub">{tours.length} tours on platform</p>
      </div>

      <div className="ag-admin-tabs">
        {TABS.map(t => (
          <button key={t} className={`ag-admin-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
        ))}
      </div>

      <div className="ag-admin-table-wrap">
        {loading ? (
          <div style={{ padding: '24px' }}>
            {[1,2,3,4].map(n => <div key={n} className="ag-admin-skeleton-row" />)}
          </div>
        ) : error ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ color: 'var(--ag-danger)' }}>{error}</p>
            <button className="ag-admin-action-btn ag-admin-btn-approve" onClick={fetchAll} style={{ marginTop: '12px' }}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ padding: '48px', textAlign: 'center', color: '#aaa' }}>No tours found.</p>
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}
      </div>

      <Modal
        open={modal.open}
        title="Remove this tour?"
        desc={`Tour: ${modal.title}`}
        warn="It will no longer be visible to users."
        onCancel={() => setModal({ open: false, id: null, title: '' })}
        onConfirm={handleRemoveConfirm}
        loading={actionLoading}
      />
    </div>
  );
};

export default AdminToursPage;
