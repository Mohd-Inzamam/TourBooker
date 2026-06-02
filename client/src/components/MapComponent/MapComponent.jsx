import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { MapPin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import './MapComponent.css';

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 }; // India

const customIcon = L.divIcon({
  html: `<svg width="32" height="32" viewBox="0 0 24 24" fill="#aa3bff" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="#ffffff"></circle></svg>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const ChangeViewCluster = ({ markers }) => {
  const map = useMap();
  useEffect(() => {
    if (markers && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [markers, map]);
  return null;
};

const ChangeViewSingle = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], zoom);
    }
  }, [center, zoom, map]);
  return null;
};

const MapPickerEvents = ({ markerPos, setMarkerPos, onLocate }) => {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setMarkerPos({ lat, lng });
      if (onLocate) onLocate(lat, lng, map);
    }
  });

  return markerPos ? <Marker position={[markerPos.lat, markerPos.lng]} icon={customIcon} /> : null;
};

const MapComponent = ({
  mode = 'cluster',
  center = DEFAULT_CENTER,
  zoom,
  markers = [],
  singleMarker = null,
  initialMarker = null,
  onLocationPicked,
  height = '400px',
  className = ''
}) => {
  // Setup default zooms based on mode
  const defaultZoom = zoom || (mode === 'cluster' ? 5 : 13);
  const [mapCenter, setMapCenter] = useState(initialMarker || center);
  
  // Picker Mode State
  const [pickerMarker, setPickerMarker] = useState(initialMarker || center);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (mode === 'single' && singleMarker) {
      setMapCenter({ lat: singleMarker.lat, lng: singleMarker.lng });
    }
  }, [mode, singleMarker]);

  useEffect(() => {
     if (mode === 'picker' && initialMarker) {
        setPickerMarker(initialMarker);
        setMapCenter(initialMarker);
     }
  }, [mode, initialMarker]);

  // Picker Mode: Reverse Geocoding on Map Click
  const handleMapClickLocate = async (lat, lng, map) => {
    try {
      const res = await fetch(`http://localhost:5000/api/locations/geocode?address=${lat},${lng}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      const displayName = data?.success && data?.data ? data.data.displayName : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      if (onLocationPicked) {
        onLocationPicked({ lat, lng, displayName });
      }
    } catch (err) {
      console.error("Reverse geocoding failed", err);
      if (onLocationPicked) onLocationPicked({ lat, lng, displayName: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
    }
  };

  // Picker Mode: Search Suggestions via API
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (!val.trim()) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/locations/search?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        if (data.success && data.data) {
          setSuggestions(data.data.slice(0, 5));
        }
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 600); // Debounce
  };

  const handleSelectSuggestion = (suggestion) => {
    setSearchQuery(suggestion.displayName);
    setSuggestions([]);
    setPickerMarker({ lat: suggestion.lat, lng: suggestion.lng });
    
    if (mapRef.current) {
      mapRef.current.flyTo([suggestion.lat, suggestion.lng], 13);
    }

    if (onLocationPicked) {
      onLocationPicked({ lat: suggestion.lat, lng: suggestion.lng, displayName: suggestion.displayName });
    }
  };

  return (
    <div className={`ag-map-wrapper ${className}`}>
      
      {mode === 'picker' && (
        <div style={{ marginBottom: '1rem' }}>
          <div className="ag-map-instruction">
            <MapPin size={16} /> Click on the map to pin your tour location
          </div>
          <div className="ag-map-search">
            <input 
              type="text" 
              className="ag-map-search-input"
              placeholder="Search for a city, address, or landmark..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {suggestions.length > 0 && (
              <div className="ag-map-suggestions">
                {suggestions.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="ag-map-suggestion-item"
                    onClick={() => handleSelectSuggestion(item)}
                  >
                    {item.displayName}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="ag-map-container" style={{ height }}>
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={mode !== 'single'}
          dragging={mode !== 'single'}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {mode === 'single' && singleMarker && (
            <>
              <ChangeViewSingle center={mapCenter} zoom={defaultZoom} />
              <Marker position={[singleMarker.lat, singleMarker.lng]} icon={customIcon}>
                <Popup>
                  <div style={{ padding: '4px' }}>
                    <strong>{singleMarker.title}</strong>
                    {singleMarker.address && <div>{singleMarker.address}</div>}
                  </div>
                </Popup>
              </Marker>
            </>
          )}

          {mode === 'cluster' && (
            <>
              <ChangeViewCluster markers={markers} />
              {markers.length > 0 && (
                <MarkerClusterGroup chunkedLoading>
                  {markers.map((marker) => (
                    <Marker key={marker.id} position={[marker.lat, marker.lng]} icon={customIcon}>
                      <Popup className="ag-map-popup-container">
                        <div className="ag-map-popup">
                          {marker.image && (
                            <img src={marker.image} alt={marker.title} className="ag-map-popup-image" />
                          )}
                          <div className="ag-map-popup-title">{marker.title}</div>
                          <div className="ag-map-popup-meta">
                            <span>⭐ {marker.rating > 0 ? marker.rating : 'New'}</span>
                            <span className="ag-map-popup-price">₹{marker.price}</span>
                          </div>
                          <Link to={`/tours/${marker.id}`} className="ag-map-popup-link">
                            View Tour
                          </Link>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MarkerClusterGroup>
              )}
            </>
          )}

          {mode === 'picker' && (
            <MapPickerEvents 
              markerPos={pickerMarker} 
              setMarkerPos={setPickerMarker} 
              onLocate={handleMapClickLocate} 
            />
          )}

        </MapContainer>

        {mode === 'cluster' && markers.length === 0 && (
          <div className="ag-map-empty-overlay">
            No tours found in this area
          </div>
        )}
      </div>
    </div>
  );
};

export default MapComponent;
