import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { DataTable } from '../../components/DataTable';
import { getAdminUsers, deactivateUser } from '../../services/admin.service';
import { startConversation } from '../../services/messaging.service';
import '../../styles/admin.css';

const TABS = ['All Users', 'Active', 'Inactive'];

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
          >{loading ? 'Banning...' : 'Yes, Ban User'}</button>
        </div>
      </div>
    </div>
  );
};

const roleBadge = (role) => {
  const map = { user: 'ag-badge--user', operator: 'ag-badge--operator', admin: 'ag-badge--admin' };
  return <span className={`ag-badge ${map[role] || 'ag-badge--user'}`}>{role}</span>;
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All Users');
  const [toast, setToast] = useState({ msg: '', type: '' });
  const [modal, setModal] = useState({ open: false, id: null, name: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  const handleMessageUser = async (userRow) => {
     try {
       await startConversation({ recipientId: userRow._id || userRow.id });
       navigate('/messages');
     } catch (err) {
       showToast('Could not start conversation', 'error');
     }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3000);
  };

  const fetchAll = () => {
    setLoading(true); setError(null);
    getAdminUsers()
      .then(res => setUsers(Array.isArray(res.data) ? res.data : (res.data?.users || res.users || [])))
      .catch(() => setError('Failed to fetch users.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleBanConfirm = async () => {
    setActionLoading(true);
    try {
      await deactivateUser(modal.id);
      setUsers(prev => prev.map(u => (u._id || u.id) === modal.id ? { ...u, isActive: false } : u));
      showToast('User banned successfully');
      setModal({ open: false, id: null, name: '' });
    } catch {
      showToast('Ban action failed.', 'error');
    } finally { setActionLoading(false); }
  };

  const filtered = users.filter(u => {
    if (activeTab === 'Active') return u.isActive !== false;
    if (activeTab === 'Inactive') return u.isActive === false;
    return true;
  });

  const columns = [
    { label: 'Name',   key: 'name' },
    { label: 'Email',  key: 'email' },
    { label: 'Role',   key: 'role',      render: (v) => roleBadge(v) },
    { label: 'Joined', key: 'createdAt', render: (v) => v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
    {
      label: 'Status', key: 'isActive',
      render: (v) => v !== false
        ? <span className="ag-badge ag-badge--approved">Active</span>
        : <span className="ag-badge ag-badge--inactive">Inactive</span>
    },
    {
      label: 'Actions', key: 'actions', align: 'right',
      render: (_, row) => {
        const id = row._id || row.id;
        if (row.isActive === false) {
          return <button className="ag-admin-action-btn ag-admin-btn-disabled" disabled>Banned</button>;
        }
        return (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button className="ag-btn-ghost" style={{ padding: '6px', color: 'var(--ag-primary)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => handleMessageUser(row)} title="Message User">
              <MessageSquare size={18} />
            </button>
            <button
              className="ag-admin-action-btn ag-admin-btn-danger"
              onClick={() => setModal({ open: true, id, name: row.name })}
            >Ban</button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="ag-admin-page">
      <Toast msg={toast.msg} type={toast.type} />

      <div className="ag-admin-page-header">
        <h1 className="ag-admin-page-title">Manage Users</h1>
        <p className="ag-admin-page-sub">{users.length} users registered</p>
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
          <p style={{ padding: '48px', textAlign: 'center', color: '#aaa' }}>No users found.</p>
        ) : (
          <DataTable 
            columns={columns} 
            data={filtered} 
            onRowClick={(row) => navigate(`/admin/users/${row._id || row.id}`)}
          />
        )}
      </div>

      <Modal
        open={modal.open}
        title="Ban this user?"
        desc={`User: ${modal.name}`}
        warn="They will be unable to access the platform."
        onCancel={() => setModal({ open: false, id: null, name: '' })}
        onConfirm={handleBanConfirm}
        loading={actionLoading}
      />
    </div>
  );
};

export default AdminUsersPage;
