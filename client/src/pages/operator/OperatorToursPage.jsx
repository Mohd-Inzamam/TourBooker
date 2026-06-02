import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit2, CalendarClock, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getMyTours, deleteTour } from '../../services/tour.service';
import { DataTable } from '../../components/DataTable';
import { Button } from '../../components/Button';
import '../../styles/operator.css';

// Simple Toast component (inline for brevity as per constraints)
const Toast = ({ message, type }) => {
  if (!message) return null;
  return <div className={`ag-toast ${type}`}>{message}</div>;
};

// Modal Component
const ConfirmModal = ({ isOpen, title, onClose, onConfirm, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="ag-modal-overlay">
      <div className="ag-modal-card">
        <h3 className="ag-modal-title">{title}</h3>
        <p className="ag-modal-desc">This action cannot be undone.</p>
        <div className="ag-modal-actions">
          <Button variant="ghost" onClick={onClose} disabled={loading} style={{ flex: 1 }}>Cancel</Button>
          <Button className="ag-btn-danger" onClick={onConfirm} isLoading={loading} style={{ flex: 1 }}>Yes, Remove</Button>
        </div>
      </div>
    </div>
  );
};

const OperatorToursPage = () => {
  const navigate = useNavigate();
  useAuth();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Toast states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tourToDelete, setTourToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '' });

  const fetchTours = async () => {
    setLoading(true);
    try {
      const res = await getMyTours();
      const myTours = res?.data?.tours ?? [];
      setTours(myTours);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch tours', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3000);
  };

  const handleDeleteClick = (tourId) => {
    setTourToDelete(tourId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!tourToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTour(tourToDelete);
      showToast('Tour removed successfully');
      setTours(prev => prev.filter(t => (t._id || t.id) !== tourToDelete));
      setDeleteModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Error removing tour', 'error');
    } finally {
      setIsDeleting(false);
      setTourToDelete(null);
    }
  };

  const cols = [
    { 
      label: 'Tour', 
      key: 'title',
      width: '35%',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src={Array.isArray(row.images) ? row.images[0] : (row.image || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=100&q=80')} 
            alt={val} 
            className="ag-table-thumbnail" 
          />
          <span style={{ fontWeight: 500 }}>{val}</span>
        </div>
      )
    },
    // FIX 3: categoryId and locationId are populated objects
    { label: 'Category', key: 'categoryId', render: (val) => val?.name || 'Uncategorized' },
    { label: 'Location', key: 'locationId', render: (val) => val?.city || 'Global' },
    { label: 'Price', key: 'price', render: (val) => `₹${val}` },
    { 
      label: 'Rating', 
      key: 'ratingAverage', 
      render: (val, row) => val > 0 ? `⭐ ${val} (${row.ratingCount || 0})` : 'No rating' 
    },
    { 
      label: 'Status', 
      key: 'isActive', 
      render: (val) => (
        <span className={`ag-badge ${val !== false ? 'ag-badge-success' : 'ag-badge-warning'}`}>
          {val !== false ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      label: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => {
        const id = row._id || row.id;
        return (
          <div className="ag-table-actions" style={{ justifyContent: 'flex-end' }}>
            <button className="ag-action-btn" title="Edit" onClick={() => navigate(`/operator/tours/${id}/edit`)}>
              <Edit2 size={16} />
            </button>
            <button className="ag-action-btn" title="Availability" onClick={() => navigate(`/operator/tours/${id}/availability`)}>
              <CalendarClock size={16} />
            </button>
            <button className="ag-action-btn danger" title="Delete" onClick={() => handleDeleteClick(id)}>
              <Trash2 size={16} />
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="ag-dashboard-page">
      <Toast message={toast.msg} type={toast.type} />
      
      <div className="ag-page-header">
        <h1 className="ag-page-title">My Tours</h1>
        <Button onClick={() => navigate('/operator/tours/create')}>
          <Plus size={18} style={{ marginRight: '8px' }}/> Create New Tour
        </Button>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: 'var(--ag-shadow-soft)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: '#888' }}>Loading tours...</div>
        ) : tours.length === 0 ? (
          <div className="ag-empty-state" style={{ padding: '80px 24px' }}>
            <p style={{ marginBottom: '16px', color: '#666' }}>You haven't added any tours yet.</p>
            <Button onClick={() => navigate('/operator/tours/create')}>Create Your First Tour</Button>
          </div>
        ) : (
          <DataTable columns={cols} data={tours} />
        )}
      </div>

      <ConfirmModal 
        isOpen={deleteModalOpen}
        title="Are you sure you want to remove this tour?"
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </div>
  );
};

export default OperatorToursPage;
