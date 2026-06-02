import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, Calendar, IndianRupee, ArrowLeft, User as UserIcon } from 'lucide-react';
import { getOperatorUserDetail } from '../../services/analytics.service';
import { DataTable } from '../../components/DataTable';

const OperatorUserDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        getOperatorUserDetail(id)
            .then(res => setData(res.data))
            .catch(err => setError(err.message || 'Failed to fetch customer details'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="ag-admin-page"><p>Loading customer profile...</p></div>;
    if (error) return <div className="ag-admin-page"><p className="ag-error-msg">{error}</p></div>;
    if (!data) return null;

    const { user, bookings, stats } = data;

    const bookingCols = [
        { label: 'Booking ID', key: '_id' },
        { label: 'Tour', key: 'tourId', render: (t) => t?.title || 'Unknown' },
        { label: 'Travel Date', key: 'bookingDate', render: (v) => new Date(v).toLocaleDateString() },
        { label: 'Price Paid', key: 'totalPrice', render: (v) => `₹${v}` },
        { label: 'Status', key: 'status' }
    ];

    return (
        <div className="ag-admin-page">
            <button className="ag-btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowLeft size={18} /> Back to Dashboard
            </button>

            <div className="ag-admin-page-header" style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--ag-surface-hover)', border: '1px solid var(--ag-border)', color: 'var(--ag-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserIcon size={32} />
                    </div>
                    <div>
                        <h1 className="ag-admin-page-title">{user.name}</h1>
                        <p className="ag-admin-page-sub">Customer Profile • Customer since {new Date(user.createdAt).getFullYear()}</p>
                    </div>
                </div>
            </div>

            <div className="ag-admin-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '32px' }}>
                <div className="ag-admin-stat-card">
                    <p className="ag-label" style={{ color: 'var(--ag-text-muted)' }}>Email Address</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <Mail size={16} color="var(--ag-primary)" />
                        <span style={{ fontWeight: 600 }}>{user.email}</span>
                    </div>
                </div>
                <div className="ag-admin-stat-card">
                    <p className="ag-label" style={{ color: 'var(--ag-text-muted)' }}>Bookings with Me</p>
                    <h3 style={{ marginTop: '8px' }}>{stats.totalBookings}</h3>
                </div>
                <div className="ag-admin-stat-card">
                    <p className="ag-label" style={{ color: 'var(--ag-text-muted)' }}>Total Business</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <IndianRupee size={20} color="var(--ag-success)" />
                        <h3 className="gold">{stats.totalSpent.toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            <div className="ag-admin-activity-card">
                <h3 style={{ marginBottom: '16px' }}>Customer Booking History (With You)</h3>
                <DataTable columns={bookingCols} data={bookings} />
            </div>
        </div>
    );
};

export default OperatorUserDetailPage;
