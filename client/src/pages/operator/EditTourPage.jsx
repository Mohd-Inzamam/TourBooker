import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, X, Plus, MapPin, AlertTriangle } from 'lucide-react';
import { FormInput, Button, FormError, MapComponent } from '../../components';
import ImageUploader from '../../components/ImageUploader/ImageUploader';
import { getTourDetails, updateTour } from '../../services/tour.service';
import { parseApiErrors } from '../../utils/formErrors';
import '../../styles/operator.css';

const CATEGORIES = ["Adventure", "Cultural", "Nature", "Luxury", "Food", "Wellness"];
const INC_SUGGESTIONS = ["Hotel Pickup", "Guide", "Meals", "Transport"];
const EXC_SUGGESTIONS = ["Tips", "Personal Expenses", "Visa"];

const EditTourPage = () => {
  const { tourId } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: CATEGORIES[0],
    city: '',
    country: '',
    coordinates: null,
    locationDisplayName: '',
    images: [''],
    inclusions: [],
    exclusions: [],
    isActive: true
  });

  const [incInput, setIncInput] = useState('');
  const [excInput, setExcInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState('');

  // Fetch initial data
  useEffect(() => {
    const fetchTour = async () => {
      try {
        const res = await getTourDetails(tourId);
        const t = res.data?.data || res.data || res.tour || res;
        
        let initialImages = Array.isArray(t.images) ? t.images : t.image ? [t.image] : [];
        if (initialImages.length === 0) initialImages = [''];

        setFormData({
          title: t.title || '',
          description: t.description || '',
          price: t.price || '',
          category: t.category?.name || t.category || CATEGORIES[0],
          city: t.location?.city || t.city || '',
          country: t.location?.country || t.country || '',
          coordinates: t.coordinates || null,
          locationDisplayName: t.location?.address || t.location?.displayName || '',
          images: initialImages,
          inclusions: t.inclusions || [],
          exclusions: t.exclusions || [],
          isActive: t.isActive !== false
        });
      } catch (err) {
        setGeneralError('Failed to load tour details. Tour might not exist.');
      } finally {
        setLoading(false);
      }
    };
    fetchTour();
  }, [tourId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (generalError) setGeneralError('');
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  /* Array manipulations */

  const addTag = (type, val) => {
    if (!val.trim() || formData[type].includes(val.trim())) return;
    setFormData({ ...formData, [type]: [...formData[type], val.trim()] });
  };
  const removeTag = (type, val) => {
    setFormData({ ...formData, [type]: formData[type].filter(t => t !== val) });
  };

  const handleTagKeyDown = (e, type, inputVal, setInput) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(type, inputVal);
      setInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});
    
    const clientSideFields = {};
    if (formData.description.length < 50) {
      clientSideFields.description = 'Description must be at least 50 characters.';
    }
    const cleanImages = formData.images.filter(i => i.trim() !== '');
    if (cleanImages.length === 0) {
      clientSideFields.images = 'At least one image URL is required.';
    }

    if (Object.keys(clientSideFields).length > 0) {
      setFieldErrors(clientSideFields);
      setGeneralError('Please correct the validation errors below.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        images: cleanImages,
        location: { city: formData.city, country: formData.country, address: formData.locationDisplayName },
        coordinates: formData.coordinates ? { lat: formData.coordinates.lat, lng: formData.coordinates.lng } : undefined,
        category: { name: formData.category }
      };
      
      await updateTour(tourId, payload);
      setToast('Tour updated successfully!');
      setTimeout(() => navigate('/operator/tours'), 1500);
    } catch (err) {
      const { general, fields } = parseApiErrors(err);
      setFieldErrors(fields);
      setGeneralError(general || 'Failed to update tour. Please check your inputs.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="ag-dashboard-page"><p>Loading tour details...</p></div>;

  return (
    <div className="ag-dashboard-page">
      {toast && <div className="ag-toast success">{toast}</div>}

      <div className="ag-page-header">
        <div>
          <Link to="/operator/tours" className="ag-back-link"><ArrowLeft size={16} /> My Tours</Link>
          <h1 className="ag-page-title">Edit Tour</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {generalError && <FormError message={generalError} type="general" />}
        
        {/* SECTION 1: Basic Info */}
        <div className="ag-form-section">
          <h3>1. Basic Information</h3>
          <div className="ag-form-grid-2">
            <div className="ag-form-group">
              <FormInput 
                label="Tour Title" 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                required 
              />
              {fieldErrors.title && <FormError message={fieldErrors.title} />}
            </div>
            <div className="ag-form-group">
              <FormInput 
                label="Price (₹ per person)" 
                name="price" 
                type="number" 
                min="0"
                value={formData.price} 
                onChange={handleChange} 
                required 
              />
              {fieldErrors.price && <FormError message={fieldErrors.price} />}
            </div>
          </div>
          <div className="ag-form-group" style={{ marginTop: '16px' }}>
            <label className="ag-form-label">Description (minimum 50 chars)</label>
            <textarea 
              className={`ag-form-input ${fieldErrors.description ? 'error' : ''}`} 
              name="description" 
              rows="6" 
              value={formData.description} 
              onChange={handleChange}
              required
            ></textarea>
            {fieldErrors.description && <FormError message={fieldErrors.description} />}
          </div>
        </div>

        {/* SECTION 2: Classification */}
        <div className="ag-form-section">
          <h3>2. Classification</h3>
          <div className="ag-form-grid-2">
            <div className="ag-form-group">
              <label className="ag-form-label">Category</label>
              <select 
                className="ag-form-input" 
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {fieldErrors.category && <FormError message={fieldErrors.category} />}
            </div>
            <div className="ag-form-grid-2">
              <div className="ag-form-group">
                <FormInput label="City" name="city" value={formData.city} onChange={handleChange} required />
                {fieldErrors.city && <FormError message={fieldErrors.city} />}
              </div>
              <div className="ag-form-group">
                <FormInput label="Country" name="country" value={formData.country} onChange={handleChange} required />
                {fieldErrors.country && <FormError message={fieldErrors.country} />}
              </div>
            </div>
            
            <div className="ag-form-group" style={{ marginTop: '16px' }}>
              <label className="ag-form-label"><MapPin size={16} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> Tour Location</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--ag-text-muted)', marginBottom: '8px' }}>
                Pin Location on Map (optional but recommended) - Helps travelers find your tour and improves discoverability in map search.
              </p>
              
              {!formData.coordinates && (
                <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '0.5rem 1rem', borderRadius: 'var(--ag-radius-md)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ag-primary)', fontSize: '0.875rem' }}>
                  <AlertTriangle size={16} /> <span>This tour has no map location yet. Add one to appear in map search!</span>
                </div>
              )}
              
              <MapComponent
                mode="picker"
                height="320px"
                initialMarker={formData.coordinates || null}
                onLocationPicked={({ lat, lng, displayName }) => {
                  setFormData(prev => ({
                    ...prev,
                    coordinates: { lat, lng },
                    locationDisplayName: displayName
                  }));
                }}
              />
              
              {formData.coordinates && (
                <div style={{ background: 'rgba(34,197,94,0.08)', padding: '0.5rem 1rem', borderRadius: 'var(--ag-radius-md)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--ag-success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>✓ Location pinned:</span> {formData.locationDisplayName || `${formData.coordinates.lat?.toFixed(4) || formData.coordinates.lat || ''}, ${formData.coordinates.lng?.toFixed(4) || formData.coordinates.lng || ''}` || `${formData.city}, ${formData.country}`}
                  </div>
                  <button type="button" onClick={() => setFormData(prev => ({...prev, coordinates: null, locationDisplayName: ''}))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ag-text-muted)' }}>
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: Images */}
        <div className="ag-form-section">
          <h3>3. Images</h3>
          <div className="ag-form-group">
            <label className="ag-form-label">Tour Images</label>
            <ImageUploader 
              mode="multiple" 
              maxFiles={5} 
              existingImages={formData.images.filter(img => typeof img === 'string' && img.trim() !== '')}
              onUploadComplete={(urlsArray) => setFormData({ ...formData, images: urlsArray.map(img => img.url) })} 
            />
            <p style={{ color: 'var(--ag-text-muted)', marginTop: '8px', fontSize: '0.8rem' }}>
              Upload up to 5 images. First image will be used as cover.
            </p>
          </div>
        </div>

        {/* SECTION 4: Inclusions & Exclusions */}
        <div className="ag-form-section">
          <h3>4. Inclusions & Exclusions</h3>
          
          <div className="ag-form-grid-2">
            <div>
              <label className="ag-form-label">What's Included</label>
              <div className="ag-tag-input-wrap">
                {formData.inclusions.map(inc => (
                  <span key={inc} className="ag-tag">{inc} <button type="button" onClick={() => removeTag('inclusions', inc)}><X size={14}/></button></span>
                ))}
                <input 
                  type="text" 
                  placeholder="Type and press Enter" 
                  value={incInput}
                  onChange={(e) => setIncInput(e.target.value)}
                  onKeyDown={(e) => handleTagKeyDown(e, 'inclusions', incInput, setIncInput)}
                />
              </div>
              <div className="ag-tag-suggestions">
                {INC_SUGGESTIONS.map(sug => (
                  <button type="button" key={sug} className="ag-ghost-chip" onClick={() => addTag('inclusions', sug)}>+ {sug}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="ag-form-label">What's Not Included</label>
              <div className="ag-tag-input-wrap">
                {formData.exclusions.map(exc => (
                  <span key={exc} className="ag-tag">{exc} <button type="button" onClick={() => removeTag('exclusions', exc)}><X size={14}/></button></span>
                ))}
                <input 
                  type="text" 
                  placeholder="Type and press Enter" 
                  value={excInput}
                  onChange={(e) => setExcInput(e.target.value)}
                  onKeyDown={(e) => handleTagKeyDown(e, 'exclusions', excInput, setExcInput)}
                />
              </div>
              <div className="ag-tag-suggestions">
                {EXC_SUGGESTIONS.map(sug => (
                  <button type="button" key={sug} className="ag-ghost-chip" onClick={() => addTag('exclusions', sug)}>+ {sug}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: Visibility */}
        <div className="ag-form-section">
          <h3>5. Visibility</h3>
          <div className="ag-form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <label htmlFor="isActive" style={{ cursor: 'pointer', fontWeight: 500 }}>
              Active (Make this tour visible to travellers)
            </label>
          </div>
        </div>

        <Button type="submit" isLoading={isSubmitting} style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}>
          Update Tour
        </Button>
      </form>
    </div>
  );
};

export default EditTourPage;
