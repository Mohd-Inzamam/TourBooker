import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { getAdminOperators, approveOperator, deactivateUser } from '../../services/admin.service';
import '../../styles/admin.css';
import { useState, useEffect } from 'react';

const TABS = ['All', 'Pending Approval', 'Approved', 'Inactive'];

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
          >{loading ? 'Processing...' : 'Yes, Deactivate'}</button>
        </div>
      </div>
    </div>
  );
};

// ── The API returns Operator docs populated with userId: { name, email, isActive }
// ── isApproved lives on the Operator doc itself
// ── isActive lives on the nested userId (User) doc

const getIsActive = (op) => op.userId?.isActive !== false;
const getIsApproved = (op) => op.isApproved === true;

const getBadge = (op) => {
  // isActive check FIRST — an inactive operator may also be unapproved
  if (!getIsActive(op)) return <span className="ag-badge ag-badge--inactive">Inactive</span>;
  if (!getIsApproved(op)) return <span className="ag-badge ag-badge--pending">Pending</span>;
  return <span className="ag-badge ag-badge--approved">Approved</span>;
};

const AdminOperatorsPage = () => {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [toast, setToast] = useState({ msg: '', type: '' });
  const [modal, setModal] = useState({ open: false, operatorId: null, userId: null, name: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3000);
  };

  const fetchAll = () => {
    setLoading(true);
    setError(null);
    getAdminOperators()
      .then(res => {
        // API: { status, results, data: { operators: [...] } }
        const list = res.data?.operators || res.data || res.operators || [];
        const arr = Array.isArray(list) ? list : [];
        console.log('All operators fetched:', arr);
        console.log('Pending operators:', arr.filter(op => !op.isApproved && getIsActive(op)));
        setOperators(arr);
      })
      .catch(() => setError('Failed to fetch operators.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleApprove = async (operatorId) => {
    try {
      await approveOperator(operatorId);
      setOperators(prev =>
        prev.map(o => o._id === operatorId ? { ...o, isApproved: true } : o)
      );
      showToast('Operator approved successfully!');
    } catch {
      showToast('Failed to approve operator. Try again.', 'error');
    }
  };

  const handleDeactivateConfirm = async () => {
    setActionLoading(true);
    try {
      await deactivateUser(modal.userId);
      setOperators(prev =>
        prev.map(o => o._id === modal.operatorId
          ? { ...o, userId: { ...o.userId, isActive: false } }
          : o
        )
      );
      showToast('Operator deactivated');
      setModal({ open: false, operatorId: null, userId: null, name: '' });
    } catch {
      showToast('Deactivation failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Tab filtering using correct field accessors ──
  const filtered = operators.filter(op => {
    if (activeTab === 'Pending Approval') return !getIsApproved(op) && getIsActive(op);
    if (activeTab === 'Approved') return getIsApproved(op) && getIsActive(op);
    if (activeTab === 'Inactive') return !getIsActive(op);
    return true; // 'All'
  });

  const columns = [
    {
      label: 'Name', key: 'name',
      render: (_, row) => row.userId?.name || '—'
    },
    {
      label: 'Email', key: 'email',
      render: (_, row) => row.userId?.email || '—'
    },
    {
      label: 'Company', key: 'companyName',
      render: (v) => v || '—'
    },
    {
      label: 'Phone', key: 'phone',
      render: (v) => v || '—'
    },
    {
      label: 'Joined', key: 'createdAt',
      render: (v) => v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
    },
    {
      label: 'Status', key: 'status',
      render: (_, row) => getBadge(row)
    },
    {
      label: 'Actions', key: 'actions', align: 'right',
      render: (_, row) => {
        const operatorId = row._id;
        const userId = row.userId?._id || row.userId;
        const isActive = getIsActive(row);
        const isApproved = getIsApproved(row);

        return (
          <div className="ag-admin-actions-cell">
            {/* Approve button — show when not yet approved and not inactive */}
            {!isApproved && isActive && (
              <button
                className="ag-admin-action-btn ag-admin-btn-approve"
                onClick={(e) => { e.stopPropagation(); handleApprove(operatorId); }}
              >
                Approve
              </button>
            )}
            {/* Static approved indicator */}
            {isApproved && isActive && (
              <button className="ag-admin-action-btn ag-admin-btn-disabled" disabled>
                Approved
              </button>
            )}
            {/* Deactivate — only for active operators */}
            {isActive && (
              <button
                className="ag-admin-action-btn ag-admin-btn-danger"
                onClick={(e) => { e.stopPropagation(); setModal({ open: true, operatorId, userId, name: row.userId?.name || 'Operator' }); }}
              >
                Deactivate
              </button>
            )}
          </div>
        );
      }
    },
  ];

  return (
    <div className="ag-admin-page">
      <Toast msg={toast.msg} type={toast.type} />

      <div className="ag-admin-page-header">
        <h1 className="ag-admin-page-title">Manage Operators</h1>
        <p className="ag-admin-page-sub">{operators.length} operators registered</p>
      </div>

      <div className="ag-admin-tabs">
        {TABS.map(t => (
          <button
            key={t}
            className={`ag-admin-tab ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="ag-admin-table-wrap">
        {loading ? (
          <div style={{ padding: '24px' }}>
            {[1, 2, 3, 4].map(n => <div key={n} className="ag-admin-skeleton-row" />)}
          </div>
        ) : error ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ color: 'var(--ag-danger)' }}>{error}</p>
            <button className="ag-admin-action-btn ag-admin-btn-approve" onClick={fetchAll} style={{ marginTop: '12px' }}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ padding: '48px', textAlign: 'center', color: '#aaa' }}>No operators found.</p>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            onRowClick={(row) => navigate(`/admin/operators/${row._id}`)}
          />
        )}
      </div>

      <Modal
        open={modal.open}
        title="Deactivate this operator?"
        desc={`Operator: ${modal.name}`}
        warn="They will lose access to their dashboard."
        onCancel={() => setModal({ open: false, operatorId: null, userId: null, name: '' })}
        onConfirm={handleDeactivateConfirm}
        loading={actionLoading}
      />
    </div>
  );
};

export default AdminOperatorsPage;
