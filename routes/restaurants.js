const express = require('express');
const axios = require('axios');
const router = express.Router();
const reservationChecker = require('../services/reservationChecker');
const vibeMapper = require('../services/vibeMap');

// Yelp API endpoint
const YELP_API_URL = 'https://api.yelp.com/v3/businesses/search';

// Get restaurant recommendations based on vibe
router.post('/recommendations', async (req, res) => {
  try {
    const { 
      vibe, 
      location = 'New York, NY', 
      radius = 5000, 
      price, 
      cuisine,
      reservationDate,
      reservationTime,
      partySize = 2 
    } = req.body;
    
    // Get vibe parameters for Yelp
    const vibeParams = vibeMapper.getYelpParams(vibe);
    const attributesParam = vibeMapper.getYelpAttributesString(vibe);
    
    // Make request to Yelp API
    const response = await axios.get(YELP_API_URL, {
      headers: {
        'Authorization': `Bearer ${process.env.YELP_API_KEY}`
      },
      params: {
        term: cuisine || 'restaurants',
        location: location,
        radius: radius,
        price: price, // '1,2,3,4' format for price range
        attributes: attributesParam,
        sort_by: 'rating',
        limit: 20 // Get more than 5 so we have options when filtering for reservations
      }
    });
    
    // Process the restaurants
    const restaurants = response.data.businesses.map(business => ({
      name: business.name,
      rating: business.rating,
      price: business.price,
      address: business.location.address1,
      phone: business.phone,
      categories: business.categories.map(cat => cat.title),
      image_url: business.image_url,
      url: business.url
    }));
    
    // If reservation date and time are provided, check availability
    if (reservationDate && reservationTime) {
      console.log(`Checking reservation availability for ${reservationDate} at ${reservationTime} for ${partySize} people`);
      
      // Check availability for each restaurant
      const restaurantsWithAvailability = [];
      
      for (const restaurant of restaurants) {
        // Only check a limited number to avoid long processing times
        if (restaurantsWithAvailability.length >= 5) break;
        
        const availability = await reservationChecker.checkAvailability(
          restaurant.name,
          partySize,
          reservationDate,
          reservationTime
        );
        
        // If available or we don't have enough restaurants yet, add it
        if (availability.available || restaurantsWithAvailability.length < 5) {
          restaurantsWithAvailability.push({
            ...restaurant,
            availability
          });
        }
      }
      
      // Sort with available restaurants first
      restaurantsWithAvailability.sort((a, b) => {
        if (a.availability.available && !b.availability.available) return -1;
        if (!a.availability.available && b.availability.available) return 1;
        return b.rating - a.rating; // Then by rating
      });
      
      // Return top 5 restaurants with availability info
      res.json({
        message: `Found restaurants matching ${vibe} vibe in ${location} with reservation details`,
        date: reservationDate,
        time: reservationTime,
        partySize: partySize,
        restaurants: restaurantsWithAvailability.slice(0, 5)
      });
    } else {
      // If no reservation details, just return top 5 restaurants
      res.json({
        message: `Found restaurants matching ${vibe} vibe in ${location}`,
        restaurants: restaurants.slice(0, 5)
      });
    }
  } catch (error) {
    console.error('Error fetching restaurant recommendations:', error.message);
    res.status(500).json({ error: 'Failed to fetch restaurant recommendations' });
  }
});

module.exports = router;