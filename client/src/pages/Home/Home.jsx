import React, { useState } from 'react';

const Home = () => {
  const [hoveredCity, setHoveredCity] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>

      {/* Section 1 — Hero Search Section */}
      <section style={{
        position: 'relative',
        width: '100%',
        minHeight: '600px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.7)), url("https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2000&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white',
        textAlign: 'center',
        padding: '80px 24px'
      }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '16px', maxWidth: '800px', lineHeight: 1.15, textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
          Find unforgettable tours and experiences
        </h1>
        <p style={{ fontSize: '1.25rem', marginBottom: '48px', opacity: 0.95, textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
          Discover guided tours, activities, and adventures around the world
        </p>

        <div style={{
          display: 'flex',
          gap: '8px',
          background: 'white',
          padding: '8px',
          borderRadius: 'var(--ag-radius-xl, 16px)',
          width: '100%',
          maxWidth: '700px',
          boxShadow: 'var(--ag-shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1))',
          alignItems: 'center'
        }}>
          <div className="ag-input-container" style={{ flex: 1 }}>
            <span style={{ position: 'absolute', left: '16px', color: 'var(--text-muted, #64748b)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            <input
              type="text"
              className="ag-input"
              placeholder="Search by city, e.g. Paris"
              style={{ paddingLeft: '48px', border: 'none', background: 'transparent', boxShadow: 'none', fontSize: '1.05rem', minHeight: '48px' }}
            />
          </div>
          <button className="ag-btn ag-btn-primary" style={{ padding: '0 32px', minHeight: '48px', fontSize: '1rem', borderRadius: 'var(--ag-radius-lg, 12px)' }}>
            Explore
          </button>
        </div>
      </section>

      {/* Section 2 — Popular Cities */}
      <section style={{ padding: '80px 24px', width: '100%', maxWidth: '1280px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '32px', color: 'var(--text-primary, #0f172a)' }}>Popular destinations</h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '24px'
        }}>
          {[
            { name: 'Paris', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=600&q=80' },
            { name: 'Rome', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80' },
            { name: 'Tokyo', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=80' },
            { name: 'New York', img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=600&q=80' },
            { name: 'Dubai', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80' },
            { name: 'Bali', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80' }
          ].map(city => (
            <div
              key={city.name}
              style={{
                position: 'relative',
                height: '260px',
                borderRadius: 'var(--ag-radius-lg, 12px)',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
                transform: hoveredCity === city.name ? 'translateY(-6px)' : 'translateY(0)',
                zIndex: hoveredCity === city.name ? 10 : 1
              }}
              onMouseEnter={() => setHoveredCity(city.name)}
              onMouseLeave={() => setHoveredCity(null)}
            >
              <img src={city.img} alt={city.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(15,23,42,0.8), transparent 60%)',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '20px'
              }}>
                <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '700', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{city.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3 — Featured Tours */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-surface, #ffffff)', borderTop: '1px solid var(--border-color, #e2e8f0)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
        <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '40px', color: 'var(--text-primary, #0f172a)' }}>Featured tours</h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '32px'
          }}>
            {[
              { id: 1, title: 'Ancient Rome & Colosseum Guided Tour', price: '$89', rating: '4.9', reviews: 128, location: 'Rome, Italy', img: 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?auto=format&fit=crop&w=600&q=80' },
              { id: 2, title: 'Louvre Museum Skip-the-Line Access', price: '$55', rating: '4.8', reviews: 342, location: 'Paris, France', img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=600&q=80' },
              { id: 3, title: 'Mount Fuji Full-Day Scenic Tour', price: '$120', rating: '5.0', reviews: 94, location: 'Tokyo, Japan', img: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=600&q=80' },
              { id: 4, title: 'Desert Safari with BBQ Dinner', price: '$75', rating: '4.7', reviews: 215, location: 'Dubai, UAE', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80' }
            ].map((tour) => (
              <div key={tour.id} className="ag-tour-card">
                <div className="ag-card-rating">
                  <span className="ag-star-icon">★</span> {tour.rating} ({tour.reviews})
                </div>
                <div className="ag-card-image">
                  <img src={tour.img} alt={tour.title} />
                  <div className="ag-card-price">{tour.price}</div>
                </div>
                <div className="ag-card-content">
                  <div className="ag-card-meta">
                    <div className="ag-card-meta-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      {tour.location}
                    </div>
                  </div>
                  <h3 className="ag-card-title">{tour.title}</h3>
                  <div className="ag-card-footer">
                    <button className="ag-btn ag-btn-secondary ag-card-action">View details</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 — Why book with us */}
      <section style={{ padding: '100px 24px', width: '100%', maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '64px', color: 'var(--text-primary, #0f172a)' }}>Why travelers choose us</h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '48px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ padding: '24px', background: 'var(--primary-light, rgba(170, 59, 255, 0.1))', color: 'var(--primary, #aa3bff)', borderRadius: '50%', marginBottom: '24px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>Verified operators</h3>
            <p style={{ color: 'var(--text-secondary, #64748b)', lineHeight: 1.6, fontSize: '1rem' }}>Every tour operator is strictly vetted to ensure safety, quality, and an unforgettable experience.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ padding: '24px', background: 'var(--primary-light, rgba(170, 59, 255, 0.1))', color: 'var(--primary, #aa3bff)', borderRadius: '50%', marginBottom: '24px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>Secure bookings</h3>
            <p style={{ color: 'var(--text-secondary, #64748b)', lineHeight: 1.6, fontSize: '1rem' }}>Book with confidence using our bank-level encrypted payment system and flexible cancellation policies.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ padding: '24px', background: 'var(--primary-light, rgba(170, 59, 255, 0.1))', color: 'var(--primary, #aa3bff)', borderRadius: '50%', marginBottom: '24px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>Best price guarantee</h3>
            <p style={{ color: 'var(--text-secondary, #64748b)', lineHeight: 1.6, fontSize: '1rem' }}>We promise you'll get the lowest price available. Find it cheaper elsewhere? We'll match it.</p>
          </div>
        </div>
      </section>

      {/* Section 5 — Footer */}
      <footer style={{ background: 'var(--bg-surface, #ffffff)', borderTop: '1px solid var(--border-color, #e2e8f0)', padding: '64px 24px 32px' }}>
        <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
            <div style={{ gridColumn: '1 / -1', '@media(minWidth: 768px)': { gridColumn: 'span 2' }, maxWidth: '300px' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', background: 'linear-gradient(135deg, var(--primary, #aa3bff), #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '16px', letterSpacing: '-0.5px' }}>
                Wanderlust
              </h2>
              <p style={{ color: 'var(--text-secondary, #64748b)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Making world-class tours and unforgettable experiences accessible for everyone.
              </p>
            </div>
            <div>
              <h4 style={{ fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary, #0f172a)' }}>Company</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><a href="#" style={{ color: 'var(--text-secondary, #64748b)', textDecoration: 'none', fontSize: '0.95rem' }}>About us</a></li>
                <li><a href="#" style={{ color: 'var(--text-secondary, #64748b)', textDecoration: 'none', fontSize: '0.95rem' }}>Careers</a></li>
                <li><a href="#" style={{ color: 'var(--text-secondary, #64748b)', textDecoration: 'none', fontSize: '0.95rem' }}>Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary, #0f172a)' }}>Support</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><a href="#" style={{ color: 'var(--text-secondary, #64748b)', textDecoration: 'none', fontSize: '0.95rem' }}>Help Center</a></li>
                <li><a href="#" style={{ color: 'var(--text-secondary, #64748b)', textDecoration: 'none', fontSize: '0.95rem' }}>Safety</a></li>
                <li><a href="#" style={{ color: 'var(--text-secondary, #64748b)', textDecoration: 'none', fontSize: '0.95rem' }}>Cancellation options</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary, #0f172a)' }}>Legal</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><a href="#" style={{ color: 'var(--text-secondary, #64748b)', textDecoration: 'none', fontSize: '0.95rem' }}>Terms of Service</a></li>
                <li><a href="#" style={{ color: 'var(--text-secondary, #64748b)', textDecoration: 'none', fontSize: '0.95rem' }}>Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color, #e2e8f0)', paddingTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', color: 'var(--text-muted, #94a3b8)', fontSize: '0.875rem' }}>
            <p>© 2026 Wanderlust, Inc. All rights reserved.</p>
            <div style={{ display: 'flex', gap: '24px' }}>
              <span style={{ cursor: 'pointer' }}>US$ USD</span>
              <span style={{ cursor: 'pointer' }}>English (US)</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
