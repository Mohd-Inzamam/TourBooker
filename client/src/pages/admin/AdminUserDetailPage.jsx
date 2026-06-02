import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, Calendar, MapPin, ArrowLeft, Shield } from 'lucide-react';
import { getUserDetail, deactivateUser } from '../../services/admin.service';
import { DataTable } from '../../components/DataTable';
import '../../styles/admin.css';

const AdminUserDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        getUserDetail(id)
            .then(res => setData(res.data))
            .catch(err => setError(err.message || 'Failed to fetch user details'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="ag-admin-page"><p>Loading details...</p></div>;
    if (error) return <div className="ag-admin-page"><p className="ag-error-msg">{error}</p></div>;
    if (!data) return null;

    const { user, bookings, reviews } = data;

    const bookingCols = [
        { label: 'Booking ID', key: '_id' },
        { label: 'Tour', key: 'tourId', render: (t) => t?.title || 'Unknown' },
        { label: 'Date', key: 'bookingDate', render: (v) => new Date(v).toLocaleDateString() },
        { label: 'Total', key: 'totalPrice', render: (v) => `₹${v}` },
        { label: 'Status', key: 'status' }
    ];

    const reviewCols = [
        { label: 'Tour', key: 'tourId', render: (t) => t?.title || 'Unknown' },
        { label: 'Rating', key: 'rating', render: (v) => `${v} ★` },
        { label: 'Review', key: 'comment' },
        { label: 'Date', key: 'createdAt', render: (v) => new Date(v).toLocaleDateString() }
    ];

    return (
        <div className="ag-admin-page">
            <button className="ag-btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowLeft size={18} /> Back to Users
            </button>

            <div className="ag-admin-page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--ag-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700 }}>
                        {user.name[0]}
                    </div>
                    <div>
                        <h1 className="ag-admin-page-title">{user.name}</h1>
                        <p className="ag-admin-page-sub">{user.role.charAt(0).toUpperCase() + user.role.slice(1)} since {new Date(user.createdAt).getFullYear()}</p>
                    </div>
                </div>
                {user.isActive !== false ? (
                    <button className="ag-admin-action-btn ag-admin-btn-danger" onClick={() => { if(window.confirm('Ban this user?')) deactivateUser(user._id).then(() => window.location.reload()) }}>
                        Ban User
                    </button>
                ) : (
                    <span className="ag-badge ag-badge--inactive">Banned</span>
                )}
            </div>

            <div className="ag-admin-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '32px' }}>
                <div className="ag-admin-stat-card">
                    <p className="ag-label" style={{ color: 'var(--ag-text-muted)' }}>Email Address</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <Mail size={16} color="var(--ag-primary)" />
                        <span style={{ fontWeight: 600 }}>{user.email}</span>
                    </div>
                </div>
                <div className="ag-admin-stat-card">
                    <p className="ag-label" style={{ color: 'var(--ag-text-muted)' }}>Total Bookings</p>
                    <h3 style={{ marginTop: '8px' }}>{bookings.length}</h3>
                </div>
                <div className="ag-admin-stat-card">
                    <p className="ag-label" style={{ color: 'var(--ag-text-muted)' }}>Reviews Written</p>
                    <h3 style={{ marginTop: '8px' }}>{reviews.length}</h3>
                </div>
                <div className="ag-admin-stat-card">
                    <p className="ag-label" style={{ color: 'var(--ag-text-muted)' }}>Join Date</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <Calendar size={16} />
                        <span style={{ fontWeight: 600 }}>{new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            <div className="ag-admin-activity-card" style={{ marginBottom: '32px' }}>
                <h3 style={{ marginBottom: '16px' }}>Booking History</h3>
                <DataTable columns={bookingCols} data={bookings} />
            </div>

            <div className="ag-admin-activity-card">
                <h3 style={{ marginBottom: '16px' }}>Public Reviews</h3>
                <DataTable columns={reviewCols} data={reviews} />
            </div>
        </div>
    );
};

export default AdminUserDetailPage;
