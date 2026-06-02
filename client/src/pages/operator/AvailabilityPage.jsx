import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { FormInput, Button, FormError, DataTable } from '../../components';
import { getTourDetails, getTourAvailability, addAvailability } from '../../services/tour.service';
import { parseApiErrors } from '../../utils/formErrors';
import '../../styles/operator.css';

const AvailabilityPage = () => {
  const { tourId } = useParams();

  const [tourName, setTourName] = useState('...');
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState({ msg: '', type: '' });

  const [formData, setFormData] = useState({
    date: '',
    totalSlots: 10
  });

  const fetchAvailability = async () => {
    try {
      const res = await getTourAvailability(tourId);
      // FIX 4: backend returns { status, data: { availabilities } }
      const raw = res?.data?.availabilities ?? [];
      // FIX 4: availableSlots not stored — compute client-side
      const data = raw.map(a => ({
        ...a,
        availableSlots: a.totalSlots - (a.bookedSlots || 0)
      }));
      setAvailability(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load availability:', err);
    }
  };

  useEffect(() => {
    const fetchContext = async () => {
      setLoading(true);
      try {
        const tourRes = await getTourDetails(tourId);
        // FIX 1: backend wraps in data.data.tour
        const t = tourRes?.data?.tour || tourRes?.data || tourRes;
        setTourName(t.title || 'Unknown Tour');
        await fetchAvailability();
      } catch (err) {
        showToast('Error loading page context', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchContext();
  }, [tourId]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3000);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || formData.totalSlots < 1) return;

    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      showToast('Booking date cannot be in the past', 'error');
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    try {
      await addAvailability(tourId, {
        date: new Date(formData.date).toISOString(),
        totalSlots: Number(formData.totalSlots)
      });
      showToast('Availability added');
      setFormData({ date: '', totalSlots: 10 });
      fetchAvailability(); // refresh logic
    } catch (err) {
      const { fields, general } = parseApiErrors(err);
      setFieldErrors(fields);
      showToast(general || 'Failed to add date.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cols = [
    { label: 'Date', key: 'date', render: (val) => new Date(val).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) },
    { label: 'Total Slots', key: 'totalSlots' },
    { label: 'Booked', key: 'bookedSlots' },
    { label: 'Available', key: 'availableSlots' },
    {
      label: 'Status',
      key: 'status',
      render: (_, row) => {
        const left = row.spotsLeft;
        if (left === 0) return <span className="ag-badge ag-badge-danger">Fully Booked</span>;
        if (row.isAlmostFull) return <span className="ag-badge" style={{ background: '#f59e0b', color: '#fff' }}>Only {left} left!</span>;
        if (left === row.totalSlots) return <span className="ag-badge ag-badge-success">Available</span>;
        return <span className="ag-badge ag-badge-warning">Partial</span>;
      }
    }
  ];

  return (
    <div className="ag-dashboard-page">
      {toast.msg && <div className={`ag-toast ${toast.type}`}>{toast.msg}</div>}

      <div className="ag-page-header">
        <div>
          <Link to="/operator/tours" className="ag-back-link"><ArrowLeft size={16} /> My Tours</Link>
          <h1 className="ag-page-title">Manage Availability</h1>
          <p style={{ margin: '8px 0 0 0', color: '#666' }}>{tourName}</p>
        </div>
      </div>

      <div className="ag-avail-layout">

        {/* Left Form */}
        <div>
          <div className="ag-form-section">
            <h3 style={{ fontSize: '1.2rem' }}>Add New Date</h3>
            <form onSubmit={handleAddSubmit}>
              <div className="ag-form-group">
                <FormInput
                  type="date"
                  label="Select Date"
                  name="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
                {fieldErrors.date && <FormError message={fieldErrors.date} />}
              </div>
              <div className="ag-form-group">
                <FormInput
                  type="number"
                  label="Total Slots"
                  name="totalSlots"
                  min="1"
                  value={formData.totalSlots}
                  onChange={(e) => setFormData({ ...formData, totalSlots: e.target.value })}
                  required
                />
                {fieldErrors.totalSlots && <FormError message={fieldErrors.totalSlots} />}
              </div>
              <Button type="submit" isLoading={isSubmitting} style={{ width: '100%', marginTop: '16px' }}>
                Add Availability
              </Button>
            </form>
          </div>
        </div>

        {/* Right Details */}
        <div>
          <div className="ag-form-section">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Existing Availability</h3>
            {loading ? (
              <p style={{ color: '#888' }}>Loading slots...</p>
            ) : (
              <DataTable
                columns={cols}
                data={availability}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AvailabilityPage;
