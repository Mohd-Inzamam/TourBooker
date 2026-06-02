const Tour = require('../models/tour.model');
const Location = require('../models/location.model');
const Availability = require('../models/availability.model');
const User = require('../models/user.model');
const { geocodeAddress } = require('../services/geocoding.service');
const INVALID_HTML_REGEX = /<[^>]*>/g;

// =======================
// OPERATOR FUNCTIONALITIES
// =======================

exports.createTour = async (req, res) => {
  try {
    // Block unapproved operators from creating tours
    if (req.user.role === 'operator' && !req.user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your operator account must be approved by an admin before you can create tours.'
      });
    }

    const hasInvalidMarkup = Object.values(req.body || {}).some((value) => {
      if (typeof value === 'string') return INVALID_HTML_REGEX.test(value);
      if (Array.isArray(value)) return value.some((item) => typeof item === 'string' && INVALID_HTML_REGEX.test(item));
      return false;
    });
    if (hasInvalidMarkup) {
      return res.status(400).json({ success: false, message: 'Invalid characters in input' });
    }

    // Set isActive based on operator approval status
    // FIX: default to true if operator is approved and no value provided
    const isActive = req.user.isApproved ? (req.body.isActive !== false) : false;
    
    const tourData = { ...req.body, operatorId: req.user.id, isActive };
    const tour = await Tour.create(tourData);
    
    // Fire geocoding async (non-blocking) after tour is saved
    let addressStr = '';
    if (tourData.location && (tourData.location.address || (tourData.location.city && tourData.location.country))) {
      addressStr = tourData.location.address || `${tourData.location.city}, ${tourData.location.country}`;
    } else if (tourData.city && tourData.country) {
      addressStr = `${tourData.city}, ${tourData.country}`;
    }

    if (addressStr) {
      geocodeAddress(addressStr).then(async (result) => {
        if (result) {
          // Save coordinates to Location document
          let locId = tour.locationId;
          let locationDoc;
          if (locId) {
            locationDoc = await Location.findById(locId);
          }
          if (!locationDoc) {
             locationDoc = await Location.create({
               name: result.displayName.split(',')[0],
               address: result.displayName,
               city: result.city,
               state: result.state,
               country: result.country,
               coordinates: { type: 'Point', coordinates: [result.lng, result.lat] },
               placeId: result.placeId,
               displayName: result.displayName
             });
             locId = locationDoc._id;
          } else {
             locationDoc.coordinates = { type: 'Point', coordinates: [result.lng, result.lat] };
             locationDoc.placeId = result.placeId;
             locationDoc.displayName = result.displayName;
             await locationDoc.save();
          }

          // Denormalize on Tour
          await Tour.findByIdAndUpdate(tour._id, {
            locationId: locId,
            coordinates: { lat: result.lat, lng: result.lng },
            city: result.city,
            country: result.country
          });
        }
      }).catch(console.error);
    }
    
    res.status(201).json({ success: true, data: { tour } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Failed to create tour' });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const hasInvalidMarkup = Object.values(req.body || {}).some((value) => {
      if (typeof value === 'string') return INVALID_HTML_REGEX.test(value);
      if (Array.isArray(value)) return value.some((item) => typeof item === 'string' && INVALID_HTML_REGEX.test(item));
      return false;
    });
    if (hasInvalidMarkup) {
      return res.status(400).json({ success: false, message: 'Invalid characters in input' });
    }

    let tour = await Tour.findById(req.params.tourId);

    if (!tour) return res.status(404).json({ success: false, message: 'Tour not found' });

    if (tour.operatorId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this tour' });
    }

    // If operator is not approved, they cannot activate tours
    if (req.user.role === 'operator' && !req.user.isApproved && req.body.isActive === true) {
       return res.status(403).json({ success: false, message: 'You cannot activate tours until your account is approved.' });
    }

    tour = await Tour.findByIdAndUpdate(req.params.tourId, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: { tour } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Failed to update tour' });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.tourId);
    if (!tour) return res.status(404).json({ success: false, message: 'Tour not found' });

    if (tour.operatorId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this tour' });
    }

    await tour.deleteOne();
    res.status(200).json({ success: true, message: 'Tour deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Failed to delete tour' });
  }
};

exports.manualGeocodeTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.tourId).populate('locationId');
    if (!tour) return res.status(404).json({ success: false, message: 'Tour not found' });
    
    if (tour.operatorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to geocode this tour' });
    }

    let addressStr = '';
    if (tour.locationId && tour.locationId.address) {
      addressStr = tour.locationId.address;
    } else if (tour.city && tour.country) {
      addressStr = `${tour.city}, ${tour.country}`;
    }

    if (!addressStr) {
      return res.status(400).json({ success: false, message: 'Tour has no location address or city/country defined to geocode' });
    }

    const result = await geocodeAddress(addressStr);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Geocoding failed to find matching coordinates for this address' });
    }

    let locationDoc;
    if (tour.locationId) {
       locationDoc = tour.locationId;
       locationDoc.coordinates = { type: 'Point', coordinates: [result.lng, result.lat] };
       locationDoc.placeId = result.placeId;
       locationDoc.displayName = result.displayName;
       await locationDoc.save();
    } else {
       locationDoc = await Location.create({
         name: result.displayName.split(',')[0],
         address: result.displayName,
         city: result.city,
         state: result.state,
         country: result.country,
         coordinates: { type: 'Point', coordinates: [result.lng, result.lat] },
         placeId: result.placeId,
         displayName: result.displayName
       });
    }

    const updatedTour = await Tour.findByIdAndUpdate(tour._id, {
      locationId: locationDoc._id,
      coordinates: { lat: result.lat, lng: result.lng },
      city: result.city,
      country: result.country
    }, { new: true });

    res.status(200).json({ success: true, data: { tour: updatedTour } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to geocode tour' });
  }
};

exports.addAvailability = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.tourId);

    if (!tour) return res.status(404).json({ success: false, message: 'Tour not found' });

    if (tour.operatorId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to add availability to this tour' });
    }

    const { date, totalSlots, priceOverride } = req.body;
    const slotDate = new Date(date);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (slotDate <= startOfToday) {
      return res.status(400).json({ success: false, message: 'Booking date must be in the future' });
    }

    const slotStart = new Date(slotDate);
    slotStart.setHours(0, 0, 0, 0);
    const slotEnd = new Date(slotDate);
    slotEnd.setHours(23, 59, 59, 999);

    const duplicate = await Availability.findOne({
      tourId: req.params.tourId,
      date: {
        $gte: slotStart,
        $lte: slotEnd
      }
    });
    if (duplicate) {
      return res.status(400).json({ success: false, message: 'A slot already exists for this date' });
    }

    const availability = await Availability.create({
      tourId: req.params.tourId,
      date,
      totalSlots,
      availableSlots: totalSlots,
      ...(priceOverride ? { priceOverride } : {}),
      isActive: true
    });

    res.status(201).json({ success: true, data: { availability } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Failed to add availability' });
  }
};

exports.getMyTours = async (req, res) => {
  try {
    const tours = await Tour.find({ operatorId: req.user.id }).populate('categoryId locationId');
    res.status(200).json({
      success: true,
      status: 'success',
      results: tours.length,
      data: { tours }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch your tours' });
  }
};

// =======================
// USER FUNCTIONALITIES
// =======================

exports.getAllTours = async (req, res) => {
  try {
    // Fetch list of approved operators
    const approvedOps = await User.find({ 
      role: 'operator', 
      isApproved: true,
      isActive: true
    }).select('_id').lean();
    const approvedOperatorIds = approvedOps.map(o => o._id);

    const { city, minPrice, maxPrice, rating, category, sort, page, limit } = req.query;
    
    // RELAXED FILTER: Show all active tours. 
    // We only restrict by operator approval in production if needed, 
    // but per user request, travellers should see all tours.
    let queryObj = { isActive: true };
    
    // Optional: add operator approval check back if specifically requested in query
    if (req.query.onlyApproved === 'true') {
      queryObj.operatorId = { $in: approvedOperatorIds };
    }

    if (city) {
      const locations = await Location.find({ city: { $regex: city, $options: 'i' } }).select('_id');
      const locationIds = locations.map(loc => loc._id);
      queryObj.locationId = { $in: locationIds };
    }

    const { nearLat, nearLng, radiusKm } = req.query;
    if (nearLat && nearLng) {
      const lat = parseFloat(nearLat);
      const lng = parseFloat(nearLng);
      const limitKm = parseFloat(radiusKm) || 50;
      
      const nearbyLocations = await Location.find({
        coordinates: {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: limitKm * 1000 // convert to meters
          }
        }
      }).select('_id');
      
      const nearbyLocationIds = nearbyLocations.map(loc => loc._id);
      
      // Merge with existing location constraints if applying multiple filters
      if (queryObj.locationId && queryObj.locationId.$in) {
         // Intersection of ID sets
         const existingIds = queryObj.locationId.$in.map(id => id.toString());
         queryObj.locationId.$in = nearbyLocationIds.filter(id => existingIds.includes(id.toString()));
      } else {
         queryObj.locationId = { $in: nearbyLocationIds };
      }
    }

    if (minPrice || maxPrice) {
      queryObj.price = {};
      if (minPrice) queryObj.price.$gte = Number(minPrice);
      if (maxPrice) queryObj.price.$lte = Number(maxPrice);
    }
    if (rating) {
      queryObj.ratingAverage = { $gte: Number(rating) };
    }
    if (category) {
      queryObj.categoryId = category;
    }

    const dateParam = req.query.date;
    const minSlotsParam = req.query.minSlots;

    // RELAXED FILTER: Only filter by availability if a DATE is provided 
    // OR if the user specifically requested MORE than 1 slot.
    if (dateParam || (minSlotsParam && Number(minSlotsParam) > 1)) {
      const slotsReq = Number(minSlotsParam) || 1;
      const availQuery = { isActive: true, availableSlots: { $gte: slotsReq } };

      if (dateParam) {
        const d = new Date(dateParam);
        const start = new Date(d.setHours(0, 0, 0, 0));
        const end = new Date(d.setHours(23, 59, 59, 999));
        availQuery.date = { $gte: start, $lte: end };
      }

      const matchingAvails = await Availability.find(availQuery).select('tourId');

      if (matchingAvails.length === 0) {
        return res.status(200).json({
          success: true,
          results: 0,
          pagination: { total: 0, page: Number(page) || 1, limit: Number(limit) || 10, pages: 0 },
          data: { tours: [] }
        });
      }

      queryObj._id = { $in: matchingAvails.map(a => a.tourId) };
    }

    let query = Tour.find(queryObj).populate('categoryId locationId');

    if (sort) {
      query = query.sort(sort.split(',').join(' '));
    } else {
      query = query.sort('-createdAt');
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    query = query.skip(skip).limit(limitNum);

    const [tours, total] = await Promise.all([query, Tour.countDocuments(queryObj)]);

    res.status(200).json({
      success: true,
      results: tours.length,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      },
      data: { tours }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch tours' });
  }
};

exports.getTourDetails = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.tourId).populate('categoryId locationId operatorId');
    if (!tour) return res.status(404).json({ success: false, message: 'Tour not found' });
    res.status(200).json({ success: true, data: { tour } });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid tour ID format' });
    }
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch tour details' });
  }
};

exports.getTourAvailability = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const availabilities = await Availability.find({
      tourId: req.params.tourId,
      date: { $gte: today },
      availableSlots: { $gt: 0 },
      isActive: true
    }).sort('date');

    const mapped = availabilities.map(a => {
      const doc = a.toObject();
      return {
        ...doc,
        spotsLeft: doc.availableSlots,
        isAlmostFull: doc.availableSlots <= 3,
        formattedDate: new Date(doc.date).toISOString()
      };
    });

    res.status(200).json({
      success: true,
      results: mapped.length,
      data: { availabilities: mapped }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch availability' });
  }
};
