import React, { useState, useEffect } from 'react';
import { getPricingRules, createPricingRule, updatePricingRule, deletePricingRule } from '../../../services/pricing.service';
import { getMyTours } from '../../../services/tour.service';
import { Trash2, Edit2, Plus, X } from 'lucide-react';
import { Button, FormError } from '../../../components';
import { parseApiErrors } from '../../../utils/formErrors';
import './PricingRulesPage.css';

const PricingRulesPage = () => {
  const [rules, setRules] = useState([]);
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const initialForm = {
    tourId: '',
    name: '',
    type: 'seasonal',
    adjustmentType: 'percentage',
    adjustmentValue: 0,
    priority: 0,
    isActive: true,
    conditions: {}
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchDependencies = async () => {
    try {
      const [rulesRes, toursRes] = await Promise.all([
        getPricingRules(),
        getMyTours()
      ]);
      if (rulesRes && rulesRes.data && rulesRes.data.rules) {
        setRules(rulesRes.data.rules);
      }
      if (toursRes && toursRes.status === 'success') {
        setTours(toursRes.data.tours || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});

    try {
      if (editingId) {
        await updatePricingRule(editingId, formData);
      } else {
        await createPricingRule(formData);
      }
      setEditingId(null);
      setShowForm(false);
      setFormData(initialForm);
      fetchDependencies();
    } catch (err) {
      const { general, fields } = parseApiErrors(err);
      setFieldErrors(fields);
      setGeneralError(general || 'Error processing request');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this rule forever?')) return;
    try {
      await deletePricingRule(id);
      fetchDependencies();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (rule) => {
    try {
      await updatePricingRule(rule._id, { isActive: !rule.isActive });
      fetchDependencies();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading records...</div>;

  return (
    <div className="ag-pricing-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--ag-font-display)' }}>Pricing Rules</h1>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData(initialForm); }} className="ag-btn-primary">
          <Plus size={18} /> Add Rule
        </Button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--ag-surface, #fff)', padding: '2rem', borderRadius: 'var(--ag-radius-lg)', boxShadow: 'var(--ag-shadow-sm)', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>{editingId ? 'Edit Rule' : 'Create Pricing Rule'}</h2>
            <button onClick={() => { setShowForm(false); setGeneralError(''); setFieldErrors({}); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
          </div>

          {generalError && <FormError message={generalError} type="general" />}

          <form onSubmit={handleCreateOrUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Tour</label>
              <select
                required
                value={formData.tourId}
                onChange={(e) => setFormData({ ...formData, tourId: e.target.value })}
                className="ag-input"
              >
                <option value="">Select a tour...</option>
                {tours.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
              </select>
              {fieldErrors.tourId && <FormError message={fieldErrors.tourId} />}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Rule Name</label>
              <input
                required
                type="text"
                placeholder="e.g. Summer Weekend Premium"
                className="ag-input"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
              {fieldErrors.name && <FormError message={fieldErrors.name} />}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Rule Type</label>
                <select
                  className="ag-input"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value, conditions: {} })}
                >
                  <option value="seasonal">Seasonal</option>
                  <option value="demand">Demand Threshold</option>
                  <option value="dayofweek">Day of Week</option>
                  <option value="earlybird">Early Bird</option>
                  <option value="lastminute">Last Minute</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Priority</label>
                <input
                  type="number"
                  className="ag-input"
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: Number(e.target.value) })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Adjustment Type</label>
                <select
                  className="ag-input"
                  value={formData.adjustmentType}
                  onChange={e => setFormData({ ...formData, adjustmentType: e.target.value })}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Value (+/-)</label>
                <input
                  type="number"
                  required
                  placeholder="Ex: -15 or 500"
                  className="ag-input"
                  value={formData.adjustmentValue}
                  onChange={e => setFormData({ ...formData, adjustmentValue: Number(e.target.value) })}
                />
                {fieldErrors.adjustmentValue && <FormError message={fieldErrors.adjustmentValue} />}
              </div>
            </div>

            <div className="ag-condition-fields">
              <h4 style={{ margin: '0 0 1rem 0' }}>Condition Logic</h4>
              {formData.type === 'seasonal' && (
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input type="date" className="ag-input" required value={formData.conditions.dateFrom?.split('T')[0] || ''} onChange={e => setFormData({ ...formData, conditions: { ...formData.conditions, dateFrom: e.target.value } })} />
                  <input type="date" className="ag-input" required value={formData.conditions.dateTo?.split('T')[0] || ''} onChange={e => setFormData({ ...formData, conditions: { ...formData.conditions, dateTo: e.target.value } })} />
                </div>
              )}
              {formData.type === 'demand' && (
                <div><label>Trigger after X bookings:</label> <input type="number" required className="ag-input" style={{ width: '200px' }} value={formData.conditions.minBookingsThreshold || ''} onChange={e => setFormData({ ...formData, conditions: { ...formData.conditions, minBookingsThreshold: Number(e.target.value) } })} /></div>
              )}
              {formData.type === 'earlybird' && (
                <div><label>Book at least X days ahead:</label> <input type="number" required className="ag-input" style={{ width: '200px' }} value={formData.conditions.minDaysBeforeBooking || ''} onChange={e => setFormData({ ...formData, conditions: { ...formData.conditions, minDaysBeforeBooking: Number(e.target.value) } })} /></div>
              )}
              {formData.type === 'lastminute' && (
                <div><label>Book within X days:</label> <input type="number" required className="ag-input" style={{ width: '200px' }} value={formData.conditions.maxDaysBeforeBooking || ''} onChange={e => setFormData({ ...formData, conditions: { ...formData.conditions, maxDaysBeforeBooking: Number(e.target.value) } })} /></div>
              )}
              {formData.type === 'dayofweek' && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input type="checkbox" checked={formData.conditions.daysOfWeek?.includes(idx) || false} onChange={(e) => {
                        const current = formData.conditions.daysOfWeek || [];
                        const next = e.target.checked ? [...current, idx] : current.filter(d => d !== idx);
                        setFormData({ ...formData, conditions: { ...formData.conditions, daysOfWeek: next } });
                      }} /> {day}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
              <Button type="submit" className="ag-btn-primary">Save Rule</Button>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} /> Active
              </label>
            </div>
          </form>
        </div>
      )}

      {rules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '12px' }}>
          <p style={{ color: '#888' }}>No pricing rules yet. Add one to start dynamically pricing your tours!</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', boxShadow: 'var(--ag-shadow-sm)' }}>
          <table className="ag-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #eaeaea' }}>
                <th style={{ padding: '16px' }}>Rule Name</th>
                <th>Tour</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Adjustment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => (
                <tr key={rule._id} style={{ borderBottom: '1px solid #eaeaea' }}>
                  <td style={{ padding: '16px', fontWeight: 600 }}>{rule.name}</td>
                  <td>{rule.tourId?.title || 'Unknown Tour'}</td>
                  <td><span className={`ag-rule-type-badge ${rule.type}`}>{rule.type}</span></td>
                  <td>{rule.priority}</td>
                  <td>
                    <span className={rule.adjustmentValue < 0 ? 'ag-adjustment-negative' : 'ag-adjustment-positive'}>
                      {rule.adjustmentValue > 0 ? '+' : ''}{rule.adjustmentValue}{rule.adjustmentType === 'percentage' ? '%' : '₹'}
                    </span>
                  </td>
                  <td>
                    <button
                      style={{
                        background: rule.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: rule.isActive ? '#22c55e' : '#ef4444',
                        border: 'none', padding: '4px 12px', borderRadius: '16px', cursor: 'pointer', fontWeight: 600
                      }}
                      onClick={() => handleToggleActive(rule)}
                    >
                      {rule.isActive ? 'Active' : 'Paused'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => {
                          setEditingId(rule._id);
                          setFormData({
                            tourId: rule.tourId?._id || rule.tourId,
                            name: rule.name,
                            type: rule.type,
                            adjustmentType: rule.adjustmentType,
                            adjustmentValue: rule.adjustmentValue,
                            priority: rule.priority,
                            isActive: rule.isActive,
                            conditions: rule.conditions || {}
                          });
                          setShowForm(true);
                          setGeneralError('');
                          setFieldErrors({});
                        }}
                        style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(rule._id)} style={{ background: 'none', border: 'none', color: 'var(--ag-error)', cursor: 'pointer' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PricingRulesPage;
