import React, { useState, useEffect } from 'react';
import { getAllPromotions, createPromotion, updatePromotion, deletePromotion } from '../../../services/pricing.service';
import { getTours } from '../../../services/tour.service';
import { Trash2, Edit2, Plus, X, Copy, Check } from 'lucide-react';
import { Button } from '../../../components/Button';
import './AdminPromotionsPage.css';

const AdminPromotionsPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [allTours, setAllTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  const initialForm = {
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    maxDiscountAmount: '',
    minOrderAmount: 0,
    validFrom: '',
    validTo: '',
    usageLimit: '',
    applicableTours: [],
    isActive: true
  };
  
  const [formData, setFormData] = useState(initialForm);

  const fetchDependencies = async () => {
    try {
      setLoading(true);
      const [promoRes, toursRes] = await Promise.all([
        getAllPromotions(),
        getTours() // fetch all for admin
      ]);

      if (promoRes && promoRes.data && promoRes.data.promotions) {
        setPromotions(promoRes.data.promotions);
      }
      if (toursRes && toursRes.data && toursRes.data.tours) {
        setAllTours(toursRes.data.tours);
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
    try {
      const payload = { ...formData };
      if (!payload.maxDiscountAmount) delete payload.maxDiscountAmount;
      if (!payload.usageLimit) delete payload.usageLimit;
      if (!payload.validFrom) delete payload.validFrom;
      if (!payload.validTo) delete payload.validTo;

      if (editingId) {
        await updatePromotion(editingId, payload);
      } else {
        await createPromotion(payload);
      }
      
      setEditingId(null);
      setShowForm(false);
      setFormData(initialForm);
      fetchDependencies();
    } catch (err) {
      alert(err.message || 'Error processing request');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this promotion permanently?")) return;
    try {
      await deletePromotion(id);
      fetchDependencies();
    } catch(err) {
      alert("Error deleting");
    }
  };

  const handleToggleActive = async (promo) => {
    try {
      await updatePromotion(promo._id, { isActive: !promo.isActive });
      fetchDependencies();
    } catch(err) {
      alert("Status toggle failed");
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatus = (promo) => {
    if (!promo.isActive) return 'Inactive';
    if (promo.validTo && new Date(promo.validTo) < new Date()) return 'Expired';
    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) return 'Expired';
    return 'Active';
  };

  const totalUsed = promotions.reduce((sum, p) => sum + (p.usedCount || 0), 0);
  const activeCount = promotions.filter(p => getStatus(p) === 'Active').length;

  return (
    <div className="ag-admin-promos-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--ag-font-display)' }}>Promotions & Discount Codes</h1>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData(initialForm); }} className="ag-btn-primary">
          <Plus size={18} /> Create Promotion
        </Button>
      </div>

      <div className="ag-promo-stats">
        <div className="ag-promo-stat-card">
          <div style={{ fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>Total Promotions</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--ag-charcoal)' }}>{promotions.length}</div>
        </div>
        <div className="ag-promo-stat-card">
          <div style={{ fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>Active Now</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--ag-success)' }}>{activeCount}</div>
        </div>
        <div className="ag-promo-stat-card">
          <div style={{ fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>Total Redemptions</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--ag-primary)' }}>{totalUsed}</div>
        </div>
        <div className="ag-promo-stat-card">
          <div style={{ fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>Effectiveness Avg</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--ag-charcoal)' }}>{(promotions.length > 0 ? totalUsed / promotions.length : 0).toFixed(1)} <span style={{ fontSize: '0.9rem', color: '#888', fontWeight: 500 }}>uses/promo</span></div>
        </div>
      </div>

      {showForm && (
        <div style={{ background: 'var(--ag-surface, #fff)', padding: '2rem', borderRadius: 'var(--ag-radius-lg)', boxShadow: 'var(--ag-shadow-sm)', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>{editingId ? 'Edit Promotion' : 'Create Promotion'}</h2>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><X /></button>
          </div>
          
          <form onSubmit={handleCreateOrUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Promo Code</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. SUMMER25" 
                  className="ag-input"
                  style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' }}
                  value={formData.code} 
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Description</label>
                <input 
                  required 
                  type="text" 
                  placeholder="Internal description of what this is for" 
                  className="ag-input"
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Discount Type</label>
                <select 
                  className="ag-input"
                  value={formData.discountType} 
                  onChange={e => setFormData({ ...formData, discountType: e.target.value })}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Value</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  placeholder="Ex: 15 or 500" 
                  className="ag-input"
                  value={formData.discountValue}
                  onChange={e => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Max Discount Cap (₹)</label>
                <input 
                  type="number" 
                  placeholder="Optional limit" 
                  className="ag-input"
                  disabled={formData.discountType === 'fixed'}
                  value={formData.maxDiscountAmount}
                  onChange={e => setFormData({ ...formData, maxDiscountAmount: e.target.value ? Number(e.target.value) : '' })}
                />
                {formData.discountType === 'percentage' && <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#888' }}>Maximum amount in ₹</p>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #eaeaea' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Valid From</label>
                <input type="date" className="ag-input" value={formData.validFrom ? formData.validFrom.split('T')[0] : ''} onChange={e => setFormData({...formData, validFrom: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Valid To</label>
                <input type="date" className="ag-input" value={formData.validTo ? formData.validTo.split('T')[0] : ''} onChange={e => setFormData({...formData, validTo: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Usage Limit</label>
                <input 
                  type="number" 
                  className="ag-input"
                  placeholder="Leave empty for unlimited"
                  value={formData.usageLimit}
                  onChange={e => setFormData({ ...formData, usageLimit: e.target.value ? Number(e.target.value) : '' })}
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Min Order Amount (₹)</label>
                <input 
                  type="number" 
                  className="ag-input"
                  value={formData.minOrderAmount}
                  onChange={e => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                />
              </div>
              <div>
                 <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Applicable Tours (Optional limit)</label>
                 <select 
                   multiple 
                   className="ag-input" 
                   style={{ height: 'auto', minHeight: '80px' }}
                   value={formData.applicableTours} 
                   onChange={e => setFormData({ ...formData, applicableTours: Array.from(e.target.selectedOptions, option => option.value) })}
                 >
                   {allTours.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
                 </select>
                 <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#888' }}>Hold Ctrl/Cmd to select multiple. Leave completely unselected to apply globally to ALL tours.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', alignItems: 'center' }}>
              <Button type="submit" className="ag-btn-primary" style={{ padding: '10px 24px' }}>Save Promotion</Button>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} style={{ width: '18px', height: '18px' }} /> Activate Code Immediately
              </label>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div>Loading records...</div>
      ) : promotions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '12px' }}>
          <p style={{ color: '#888' }}>No promotions active. Create one to kick off marketing discounts!</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', boxShadow: 'var(--ag-shadow-sm)' }}>
          <table className="ag-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #eaeaea' }}>
                <th style={{ padding: '16px' }}>Code & Desc</th>
                <th>Discount</th>
                <th>Valid Period</th>
                <th>Usage</th>
                <th>Tours</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map(promo => {
                const statusStr = getStatus(promo);
                const statusClass = statusStr === 'Active' ? 'ag-promo-status-active' : statusStr === 'Expired' ? 'ag-promo-status-expired' : 'ag-promo-status-inactive';
                
                const percentUsed = promo.usageLimit ? Math.min((promo.usedCount / promo.usageLimit) * 100, 100) : 0;

                return (
                  <tr key={promo._id} style={{ borderBottom: '1px solid #eaeaea' }}>
                    <td style={{ padding: '16px' }}>
                      <div className="ag-code-cell">
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{promo.code}</span>
                        <button onClick={() => copyToClipboard(promo.code)} className="ag-code-copy-btn" title="Copy to clipboard">
                          {copiedCode === promo.code ? <Check size={16} color="var(--ag-success)" /> : <Copy size={16} />}
                        </button>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>{promo.description}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{promo.discountType === 'percentage' ? `${promo.discountValue}% off` : `₹${promo.discountValue} off`}</span>
                      {promo.maxDiscountAmount && <div style={{ fontSize: '0.75rem', color: '#888' }}>Max ₹{promo.maxDiscountAmount}</div>}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {(promo.validFrom || promo.validTo) ? (
                        <>
                          <div>{promo.validFrom ? new Date(promo.validFrom).toLocaleDateString() : 'Always'}</div>
                          <div style={{ color: '#888' }}>to {promo.validTo ? new Date(promo.validTo).toLocaleDateString() : 'Forever'}</div>
                        </>
                      ) : (
                        <span style={{ color: '#888', fontStyle: 'italic' }}>Lifetime</span>
                      )}
                    </td>
                    <td style={{ width: '120px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{promo.usedCount}</span>
                        <span style={{ color: '#888' }}>/ {promo.usageLimit || '∞'}</span>
                      </div>
                      {promo.usageLimit > 0 && (
                         <div className="ag-usage-bar">
                           <div className="ag-usage-bar-fill" style={{ width: `${percentUsed}%`, background: percentUsed > 90 ? 'var(--ag-error)' : 'var(--ag-primary)' }}></div>
                         </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#666' }}>
                      {promo.applicableTours?.length > 0 ? `${promo.applicableTours.length} tours` : 'All Tours'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }} className={statusClass}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }}></span>
                        {statusStr}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => { 
                          setEditingId(promo._id); 
                          setFormData({
                            code: promo.code, description: promo.description, discountType: promo.discountType, 
                            discountValue: promo.discountValue, maxDiscountAmount: promo.maxDiscountAmount || '', 
                            minOrderAmount: promo.minOrderAmount || 0, validFrom: promo.validFrom || '', 
                            validTo: promo.validTo || '', usageLimit: promo.usageLimit || '', 
                            applicableTours: promo.applicableTours || [], isActive: promo.isActive
                          }); 
                          setShowForm(true); 
                        }} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(promo._id)} style={{ background: 'none', border: 'none', color: 'var(--ag-error)', cursor: 'pointer' }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPromotionsPage;
