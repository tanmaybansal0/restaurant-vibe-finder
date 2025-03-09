const axios = require('axios');

// This module will handle reservation checking across different platforms

// OpenTable API service
const checkOpenTableAvailability = async (restaurantId, partySize, date, time) => {
  try {
    // Note: OpenTable doesn't have a public API, but for demonstration purposes
    // we'll implement what such a request might look like
    const response = await axios.get('https://api.opentable.com/availability', {
      params: {
        restaurant_id: restaurantId,
        party_size: partySize,
        date: date,  // Format: YYYY-MM-DD
        time: time   // Format: HH:MM (24-hour)
      },
      headers: {
        'Authorization': `Bearer ${process.env.OPENTABLE_API_KEY}`
      }
    });
    
    return {
      platform: 'OpenTable',
      available: response.data.available,
      times: response.data.available_times || [],
      reservationUrl: `https://www.opentable.com/restaurant/profile/${restaurantId}/reserve?date=${date}&time=${time}&party=${partySize}`
    };
  } catch (error) {
    console.error(`OpenTable API error: ${error.message}`);
    // Return unavailable when API fails
    return {
      platform: 'OpenTable',
      available: false,
      error: error.message
    };
  }
};

// Resy API service
const checkResyAvailability = async (venueId, partySize, date, time) => {
  try {
    // Note: Resy doesn't have a public API, but for demonstration purposes
    // we'll implement what such a request might look like
    const response = await axios.get('https://api.resy.com/api/4/find', {
      params: {
        venue_id: venueId,
        party_size: partySize,
        day: date,  // Format: YYYY-MM-DD
        time: time  // Format: HH:MM (24-hour)
      },
      headers: {
        'Authorization': `Bearer ${process.env.RESY_API_KEY}`,
        'X-Resy-Auth-Token': process.env.RESY_AUTH_TOKEN
      }
    });
    
    return {
      platform: 'Resy',
      available: response.data.results.length > 0,
      times: response.data.results.map(r => r.config.time_slot),
      reservationUrl: `https://resy.com/restaurants/${venueId}?date=${date}&seats=${partySize}`
    };
  } catch (error) {
    console.error(`Resy API error: ${error.message}`);
    // Return unavailable when API fails
    return {
      platform: 'Resy',
      available: false,
      error: error.message
    };
  }
};

// SevenRooms API service
const checkSevenRoomsAvailability = async (venueId, partySize, date, time) => {
  try {
    // Note: SevenRooms doesn't have a public API, but for demonstration purposes
    // we'll implement what such a request might look like
    const response = await axios.get('https://api.sevenrooms.com/availability/check', {
      params: {
        venue_id: venueId,
        party_size: partySize,
        date: date,  // Format: YYYY-MM-DD
        time: time   // Format: HH:MM (24-hour)
      },
      headers: {
        'Authorization': `Bearer ${process.env.SEVENROOMS_API_KEY}`
      }
    });
    
    return {
      platform: 'SevenRooms',
      available: response.data.availability,
      times: response.data.available_times || [],
      reservationUrl: `https://sevenrooms.com/reservations/${venueId}?party=${partySize}&date=${date}&time=${time}`
    };
  } catch (error) {
    console.error(`SevenRooms API error: ${error.message}`);
    // Return unavailable when API fails
    return {
      platform: 'SevenRooms',
      available: false,
      error: error.message
    };
  }
};

// This function finds restaurants in our database that match IDs from external APIs
const findReservationIds = async (restaurantName) => {
  // In a real implementation, you would query a database that maps 
  // restaurant names to their IDs in different reservation systems
  
  // For demonstration, we'll use a mock mapping
  const reservationMappings = {
    'Carbone': {
      openTableId: '123456',
      resyId: 'carbone-nyc',
      sevenRoomsId: 'carbonenyc'
    },
    'Lilia': {
      openTableId: null, // Not on OpenTable
      resyId: 'lilia-brooklyn',
      sevenRoomsId: null
    },
    'Le Bernardin': {
      openTableId: '789012',
      resyId: null,
      sevenRoomsId: 'lebernardinyc'
    }
    // Add more restaurants as needed
  };
  
  // Normalize restaurant name for lookup
  const normalizedName = restaurantName.toLowerCase().trim();
  
  // Look for exact or partial matches
  for (const [name, ids] of Object.entries(reservationMappings)) {
    if (name.toLowerCase().includes(normalizedName) || 
        normalizedName.includes(name.toLowerCase())) {
      return ids;
    }
  }
  
  // Return null if no match found
  return {
    openTableId: null,
    resyId: null,
    sevenRoomsId: null
  };
};

// Main function to check availability across all platforms
const checkAvailability = async (restaurantName, partySize, date, time) => {
  try {
    // Find reservation IDs for the restaurant
    const ids = await findReservationIds(restaurantName);
    
    // Track results from all platforms
    const results = {
      restaurantName,
      date,
      time,
      partySize,
      platforms: []
    };
    
    // Check OpenTable if ID exists
    if (ids.openTableId) {
      const openTableResult = await checkOpenTableAvailability(
        ids.openTableId, partySize, date, time
      );
      results.platforms.push(openTableResult);
    }
    
    // Check Resy if ID exists
    if (ids.resyId) {
      const resyResult = await checkResyAvailability(
        ids.resyId, partySize, date, time
      );
      results.platforms.push(resyResult);
    }
    
    // Check SevenRooms if ID exists
    if (ids.sevenRoomsId) {
      const sevenRoomsResult = await checkSevenRoomsAvailability(
        ids.sevenRoomsId, partySize, date, time
      );
      results.platforms.push(sevenRoomsResult);
    }
    
    // Mark as available if any platform has availability
    results.available = results.platforms.some(platform => platform.available);
    
    return results;
  } catch (error) {
    console.error(`Error checking availability: ${error.message}`);
    return {
      restaurantName,
      available: false,
      error: error.message
    };
  }
};

module.exports = {
  checkAvailability,
  checkOpenTableAvailability,
  checkResyAvailability,
  checkSevenRoomsAvailability
};