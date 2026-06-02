import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, X, Plus, MapPin } from 'lucide-react';
import { FormInput, Button, FormError, MapComponent } from '../../components';
import ImageUploader from '../../components/ImageUploader/ImageUploader';
import { createTour } from '../../services/tour.service';
import { parseApiErrors } from '../../utils/formErrors';
import '../../styles/operator.css';


const CATEGORIES = ["Adventure", "Cultural", "Nature", "Luxury", "Food", "Wellness"];
const INC_SUGGESTIONS = ["Hotel Pickup", "Guide", "Meals", "Transport"];
const EXC_SUGGESTIONS = ["Tips", "Personal Expenses", "Visa"];

const CreateTourPage = () => {
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
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState('');

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

    // Basic validation
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

    setLoading(true);
    try {
      // FIX 6: Tour model stores title, description, price, images, inclusions, exclusions directly
      // locationId and categoryId are ObjectId refs — we cannot pass name strings
      // Send the fields the schema actually accepts; omit locationId/categoryId for now
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        images: cleanImages,
        inclusions: formData.inclusions,
        exclusions: formData.exclusions,
        // NOTE: city/country/category stored as plain strings on tour for display
        // until Location/Category ObjectId resolution is implemented
        city: formData.city.trim(),
        country: formData.country.trim(),
        coordinates: formData.coordinates ? { lat: formData.coordinates.lat, lng: formData.coordinates.lng } : undefined,
        isActive: formData.isActive
      };

      await createTour(payload);
      setToast('Tour created successfully!');
      setTimeout(() => navigate('/operator/tours'), 1500);
    } catch (err) {
      const { general, fields } = parseApiErrors(err);
      setFieldErrors(fields);
      setGeneralError(general || 'Failed to create tour. Please check your inputs.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ag-dashboard-page">
      {toast && <div className="ag-toast success">{toast}</div>}

      <div className="ag-page-header">
        <div>
          <Link to="/operator/tours" className="ag-back-link"><ArrowLeft size={16} /> My Tours</Link>
          <h1 className="ag-page-title">Create New Tour</h1>
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
              <label className="ag-form-label"><MapPin size={16} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Tour Location</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--ag-text-muted)', marginBottom: '8px' }}>
                Pin Location on Map (optional but recommended) - Helps travelers find your tour and improves discoverability in map search.
              </p>

              <MapComponent
                mode="picker"
                height="320px"
                onLocationPicked={({ lat, lng, displayName }) => {
                  setFormData(prev => ({
                    ...prev,
                    coordinates: { lat, lng },
                    locationDisplayName: displayName
                  }))
                }}
              />

              {formData.coordinates && (
                <div style={{ background: 'rgba(34,197,94,0.08)', padding: '0.5rem 1rem', borderRadius: 'var(--ag-radius-md)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--ag-success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>✓ Location pinned:</span> {formData.locationDisplayName || `${formData.coordinates.lat.toFixed(4)}, ${formData.coordinates.lng.toFixed(4)}`}
                  </div>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, coordinates: null, locationDisplayName: '' }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ag-text-muted)' }}>
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
                  <span key={inc} className="ag-tag">{inc} <button type="button" onClick={() => removeTag('inclusions', inc)}><X size={14} /></button></span>
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
                  <span key={exc} className="ag-tag">{exc} <button type="button" onClick={() => removeTag('exclusions', exc)}><X size={14} /></button></span>
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
              Active (Make this tour visible to travellers immediately)
            </label>
          </div>
        </div>

        <Button type="submit" isLoading={loading} style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}>
          Create Tour
        </Button>
      </form>
    </div>
  );
};

export default CreateTourPage;
