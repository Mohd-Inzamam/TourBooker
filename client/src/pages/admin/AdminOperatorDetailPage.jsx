import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, IndianRupee, Map, Star, ArrowLeft, ShieldCheck, Mail, Phone } from 'lucide-react';
import { getOperatorDetail, promoteToAdmin, approveOperator } from '../../services/admin.service';
import { DataTable } from '../../components/DataTable';
import '../../styles/admin.css';

const AdminOperatorDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [promoting, setPromoting] = useState(false);

    const fetchDetail = () => {
        setLoading(true);
        getOperatorDetail(id)
            .then(res => setData(res.data))
            .catch(err => setError(err.message || 'Failed to fetch details'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchDetail(); }, [id]);

    const handlePromote = async () => {
        if (!window.confirm(`Are you sure you want to promote ${data.operator.userId.name} to Admin?\n\nThis will remove their Operator dashboard and tours management capabilities.`)) return;
        
        setPromoting(true);
        try {
            await promoteToAdmin(data.operator.userId._id);
            alert('User promoted successfully!');
            navigate('/admin/users');
        } catch (err) {
            alert(err.message || 'Promotion failed');
        } finally {
            setPromoting(false);
        }
    };

    if (loading) return <div className="ag-admin-page"><p>Loading operator profile...</p></div>;
    if (error) return <div className="ag-admin-page"><p className="ag-error-msg">{error}</p></div>;
    if (!data) return null;

    const { operator, tours, bookings, reviews, stats } = data;

    const tourCols = [
        { label: 'Tour Name', key: 'title' },
        { label: 'Price', key: 'price', render: (v) => `₹${v}` },
        { label: 'Rating', key: 'ratingAverage', render: (v) => `${v} ★` },
        { label: 'City', key: 'city' },
        { label: 'Status', key: 'isActive', render: (v) => v ? 'Active' : 'Inactive' }
    ];

    return (
        <div className="ag-admin-page">
            <button className="ag-btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowLeft size={18} /> Back to Operators
            </button>

            <div className="ag-admin-page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: 'var(--ag-radius-lg)', background: 'var(--ag-surface-hover)', border: '1px solid var(--ag-border)', color: 'var(--ag-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building2 size={32} />
                    </div>
                    <div>
                        <h1 className="ag-admin-page-title">{operator.companyName || operator.userId.name}</h1>
                        <p className="ag-admin-page-sub">Operator Profile • ID: {operator._id}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="ag-btn-secondary" onClick={handlePromote} disabled={promoting} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={18} /> {promoting ? 'Promoting...' : 'Promote to Admin'}
                    </button>
                    {!operator.isApproved && (
                        <button className="ag-admin-action-btn ag-admin-btn-approve" onClick={() => approveOperator(operator._id).then(fetchDetail)}>
                            Approve Profile
                        </button>
                    )}
                </div>
            </div>

            <div className="ag-admin-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '32px' }}>
                <div className="ag-admin-stat-card">
                    <p className="ag-label" style={{ color: 'var(--ag-text-muted)' }}>Total Revenue</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <IndianRupee size={20} color="var(--ag-success)" />
                        <h3 className="gold" style={{ fontSize: '1.5rem' }}>{stats.totalRevenue.toLocaleString()}</h3>
                    </div>
                </div>
                <div className="ag-admin-stat-card">
                    <p className="ag-label" style={{ color: 'var(--ag-text-muted)' }}>Active Tours</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <Map size={20} />
                        <h3>{stats.totalTours}</h3>
                    </div>
                </div>
                <div className="ag-admin-stat-card">
                    <p className="ag-label" style={{ color: 'var(--ag-text-muted)' }}>Total Bookings</p>
                    <h3 style={{ marginTop: '8px' }}>{stats.totalBookings}</h3>
                </div>
                <div className="ag-admin-stat-card">
                    <p className="ag-label" style={{ color: 'var(--ag-text-muted)' }}>Contact Info</p>
                    <div style={{ fontSize: '0.85rem', marginTop: '8px', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={12} /> {operator.userId.email}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}><Phone size={12} /> {operator.phone || 'N/A'}</div>
                    </div>
                </div>
            </div>

            <div className="ag-admin-activity-card" style={{ marginBottom: '32px' }}>
                <h3 style={{ marginBottom: '16px' }}>Tour Portfolio</h3>
                <DataTable columns={tourCols} data={tours} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div className="ag-admin-activity-card">
                    <h3 style={{ marginBottom: '16px' }}>Recent Bookings</h3>
                    {bookings.length > 0 ? (
                        <ul className="ag-activity-list">
                            {bookings.map(b => (
                                <li key={b._id} className="ag-activity-item">
                                    <div className="ag-activity-dot" style={{ background: 'var(--ag-success)' }} />
                                    <span style={{ fontSize: '0.85rem' }}>₹{b.totalPrice} booking on {new Date(b.createdAt).toLocaleDateString()}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p style={{ color: '#aaa', textAlign: 'center' }}>No bookings yet.</p>}
                </div>
                <div className="ag-admin-activity-card">
                    <h3 style={{ marginBottom: '16px' }}>Public Reviews</h3>
                    {reviews.length > 0 ? (
                        <ul className="ag-activity-list">
                            {reviews.map(r => (
                                <li key={r._id} className="ag-activity-item">
                                    <div className="ag-activity-dot" />
                                    <div style={{ fontSize: '0.85rem' }}>
                                        <div style={{ fontWeight: 600 }}>{r.userId?.name} <span style={{ color: '#fbbf24' }}>{r.rating}★</span></div>
                                        <div style={{ color: 'var(--ag-text-muted)' }}>"{r.comment}"</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : <p style={{ color: '#aaa', textAlign: 'center' }}>No reviews yet.</p>}
                </div>
            </div>
        </div>
    );
};

export default AdminOperatorDetailPage;
