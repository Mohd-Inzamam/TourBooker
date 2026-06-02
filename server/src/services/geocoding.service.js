const delay = (ms) => new Promise(r => setTimeout(r, ms));

exports.geocodeAddress = async (addressString) => {
  try {
    await delay(1000); // Nominatim 1 request/second compliance
    
    const params = new URLSearchParams({
      q: addressString,
      format: 'json',
      limit: '1',
      addressdetails: '1'
    });
    
    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TourBooker/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API returned ${response.status}`);
    }

    const data = await response.json();
    if (!data || data.length === 0) return null;

    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: result.display_name,
      placeId: result.place_id.toString(),
      city: result.address?.city || result.address?.town || result.address?.village || '',
      country: result.address?.country || '',
      state: result.address?.state || ''
    };
  } catch (error) {
    console.error("Geocoding failed:", error.message);
    return null;
  }
};

exports.reverseGeocode = async (lat, lng) => {
  try {
    await delay(1000);
    
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      addressdetails: '1'
    });
    
    const url = `https://nominatim.openstreetmap.org/reverse?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TourBooker/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API returned ${response.status}`);
    }

    const data = await response.json();
    if (!data || data.error) return null;

    return {
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lon),
      displayName: data.display_name,
      placeId: data.place_id ? data.place_id.toString() : '',
      city: data.address?.city || data.address?.town || data.address?.village || '',
      country: data.address?.country || '',
      state: data.address?.state || ''
    };
  } catch (error) {
    console.error("Reverse Geocoding failed:", error.message);
    return null;
  }
};

exports.searchPlaces = async (query) => {
  try {
    await delay(1000);
    
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '5',
      addressdetails: '1'
    });
    
    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TourBooker/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API returned ${response.status}`);
    }

    const data = await response.json();
    return data.map(item => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      placeId: item.place_id.toString(),
      city: item.address?.city || item.address?.town || item.address?.village || '',
      country: item.address?.country || '',
      state: item.address?.state || ''
    }));
  } catch (error) {
    console.error("Search Places failed:", error.message);
    return [];
  }
};
