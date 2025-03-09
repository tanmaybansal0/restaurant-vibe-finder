const axios = require('axios');

// Yelp API configuration
const YELP_API_BASE_URL = 'https://api.yelp.com/v3';
const BUSINESS_SEARCH_ENDPOINT = `${YELP_API_BASE_URL}/businesses/search`;
const BUSINESS_DETAILS_ENDPOINT = `${YELP_API_BASE_URL}/businesses`;
const BUSINESS_REVIEWS_ENDPOINT = `${YELP_API_BASE_URL}/businesses`;

/**
 * Search for businesses based on criteria
 */
const searchBusinesses = async (params) => {
  try {
    // Ensure required parameters are present
    if (!params.location) {
      throw new Error('Location parameter is required for Yelp search');
    }
    
    // Enforce stricter category filtering
    let term = params.term || '';
    let categories = params.categories || '';
    
    // Add type info to the term to further refine results
    if (categories.includes('bar') || categories === 'cocktailbars' || categories === 'wine_bars' || 
        categories === 'beerbar' || categories === 'pubs') {
      term += ' bar';
    } else if (categories.includes('restaurant') || params.type === 'restaurant') {
      term += ' restaurant';
    }
    
    console.log(`Searching Yelp with params:`, {
      ...params,
      term,
      categories
    });
    
    const response = await axios.get(BUSINESS_SEARCH_ENDPOINT, {
      headers: {
        'Authorization': `Bearer ${process.env.YELP_API_KEY}`
      },
      params: {
        term,
        location: params.location,
        categories,
        // Only include price if it's a non-empty string
        ...(params.price && params.price !== '' ? { price: params.price } : {}),
        limit: params.limit || 20,
        offset: params.offset || 0,
        sort_by: params.sort_by || 'best_match',
        attributes: params.attributes || '',
        radius: params.radius || 5000
      }
    });
    
    // Check if we got valid businesses data
    if (!response.data || !response.data.businesses) {
      console.error('Unexpected Yelp API response:', response.data);
      throw new Error('Unexpected response format from Yelp API');
    }
    
    // Apply additional filtering to ensure we only get the right type of venue
    let businesses = response.data.businesses;
    
    // For bars, filter out places that don't have bar-related categories
    if (categories.includes('bar') || categories === 'cocktailbars' || categories === 'wine_bars' || 
        categories === 'beerbar' || categories === 'pubs') {
      businesses = businesses.filter(business => {
        const categoryTitles = business.categories.map(c => c.title.toLowerCase());
        return categoryTitles.some(c => 
          c.includes('bar') || c.includes('pub') || c.includes('lounge') || 
          c.includes('beer') || c.includes('wine') || c.includes('cocktail'));
      });
    } 
    // For restaurants, filter out places that are primarily bars
    else if (categories.includes('restaurant') || params.type === 'restaurant') {
      businesses = businesses.filter(business => {
        const categoryTitles = business.categories.map(c => c.title.toLowerCase());
        // If it has restaurant somewhere in its categories, it's likely a restaurant
        return categoryTitles.some(c => c.includes('restaurant') || 
                                        c.includes('food') || 
                                        c.includes('cafe'));
      });
    }
    
    // If we ended up filtering everything out, return the original results
    if (businesses.length === 0) {
      businesses = response.data.businesses;
    }
    
    return businesses;
  } catch (error) {
    console.error('Error searching Yelp businesses:', error.message);
    if (error.response) {
      console.error('Yelp API response error data:', error.response.data);
      console.error('Yelp API response status:', error.response.status);
    }
    
    // Provide fallback data that respects the requested category
    if (process.env.NODE_ENV === 'development') {
      console.log('Using fallback test data due to API error');
      return getFallbackBusinesses(params.categories, params.type);
    }
    
    throw error;
  }
};

/**
 * Get detailed information about a specific business
 */
const getBusinessDetails = async (businessId) => {
  try {
    if (!businessId) {
      throw new Error('Business ID is required to fetch details');
    }
    
    const response = await axios.get(`${BUSINESS_DETAILS_ENDPOINT}/${businessId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.YELP_API_KEY}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching details for business ${businessId}:`, error.message);
    
    // Provide a fallback for testing
    if (process.env.NODE_ENV === 'development') {
      return getFallbackBusinessDetails(businessId);
    }
    
    throw error;
  }
};

/**
 * Get reviews for a specific business
 */
const getBusinessReviews = async (businessId) => {
  try {
    if (!businessId) {
      throw new Error('Business ID is required to fetch reviews');
    }
    
    const response = await axios.get(`${BUSINESS_REVIEWS_ENDPOINT}/${businessId}/reviews`, {
      headers: {
        'Authorization': `Bearer ${process.env.YELP_API_KEY}`
      },
      params: {
        limit: 50 // Maximum allowed by Yelp API
      }
    });
    
    return response.data.reviews;
  } catch (error) {
    console.error(`Error fetching reviews for business ${businessId}:`, error.message);
    
    // Provide a fallback for testing
    if (process.env.NODE_ENV === 'development') {
      return getFallbackReviews(businessId);
    }
    
    throw error;
  }
};

/**
 * Get comprehensive business data including details and reviews
 */
const getEnhancedBusinessData = async (businessId) => {
  try {
    // Fetch business details and reviews in parallel
    const [details, reviews] = await Promise.all([
      getBusinessDetails(businessId),
      getBusinessReviews(businessId)
    ]);
    
    // Combine into a single enhanced business object
    return {
      ...details,
      reviews,
      // Extract other useful details
      environment: {
        noiseLevel: details.attributes?.noise_level,
        ambience: details.attributes?.ambience,
        lighting: 'moderate', // Placeholder as this isn't directly available in Yelp data
        crowdedness: getCrowdednessFromReviews(reviews)
      }
    };
  } catch (error) {
    console.error(`Error fetching enhanced data for business ${businessId}:`, error.message);
    
    // Provide a fallback for testing
    if (process.env.NODE_ENV === 'development') {
      return getFallbackEnhancedData(businessId);
    }
    
    throw error;
  }
};

// Helper function to extract crowdedness info from reviews
function getCrowdednessFromReviews(reviews) {
  // Analyze reviews for mentions of crowdedness
  // This is a placeholder implementation
  return 'moderate';
}

// Fallback data for testing when API is unavailable
function getFallbackBusinesses(categories, type) {
  // Determine if we should return bar or restaurant data
  const isBar = type === 'bar' || 
               (categories && (categories.includes('bar') || 
                               categories === 'cocktailbars' || 
                               categories === 'wine_bars' || 
                               categories === 'beerbar' || 
                               categories === 'pubs'));

  if (isBar) {
    return [
      {
        id: 'bar-test-1',
        name: 'Cocktail Lounge NYC',
        rating: 4.5,
        price: '$$$',
        categories: [{ title: 'Cocktail Bar' }, { title: 'Lounge' }],
        image_url: 'https://s3-media1.fl.yelpcdn.com/bphoto/placeholder.jpg',
        location: { address1: '123 Bar Ave, New York, NY 10001' },
        coordinates: { latitude: 40.7128, longitude: -74.0060 }
      },
      {
        id: 'bar-test-2',
        name: 'Wine & Spirits',
        rating: 4.2,
        price: '$$',
        categories: [{ title: 'Wine Bar' }, { title: 'Cocktail Bar' }],
        image_url: 'https://s3-media2.fl.yelpcdn.com/bphoto/placeholder2.jpg',
        location: { address1: '456 Wines St, New York, NY 10002' },
        coordinates: { latitude: 40.7218, longitude: -73.9960 }
      },
      {
        id: 'bar-test-3',
        name: 'Craft Beer Pub',
        rating: 4.3,
        price: '$$',
        categories: [{ title: 'Beer Bar' }, { title: 'Gastropub' }],
        image_url: 'https://s3-media3.fl.yelpcdn.com/bphoto/placeholder3.jpg',
        location: { address1: '789 Brew St, New York, NY 10003' },
        coordinates: { latitude: 40.7318, longitude: -73.9860 }
      },
      {
        id: 'bar-test-4',
        name: 'Speakeasy Lounge',
        rating: 4.7,
        price: '$$$$',
        categories: [{ title: 'Cocktail Bar' }, { title: 'Speakeasy' }],
        image_url: 'https://s3-media4.fl.yelpcdn.com/bphoto/placeholder4.jpg',
        location: { address1: '101 Hidden St, New York, NY 10004' },
        coordinates: { latitude: 40.7418, longitude: -73.9760 }
      },
      {
        id: 'bar-test-5',
        name: 'Rooftop Bar & Lounge',
        rating: 4.4,
        price: '$$$',
        categories: [{ title: 'Lounge' }, { title: 'Cocktail Bar' }],
        image_url: 'https://s3-media5.fl.yelpcdn.com/bphoto/placeholder5.jpg',
        location: { address1: '222 Sky Ln, New York, NY 10005' },
        coordinates: { latitude: 40.7518, longitude: -73.9660 }
      }
    ];
  } else {
    // Return restaurant data
    return [
      {
        id: 'restaurant-test-1',
        name: 'Italian Trattoria',
        rating: 4.5,
        price: '$$$',
        categories: [{ title: 'Italian' }, { title: 'Restaurant' }],
        image_url: 'https://s3-media1.fl.yelpcdn.com/bphoto/placeholder.jpg',
        location: { address1: '123 Pasta Ave, New York, NY 10001' },
        coordinates: { latitude: 40.7128, longitude: -74.0060 }
      },
      {
        id: 'restaurant-test-2',
        name: 'Sushi Place',
        rating: 4.2,
        price: '$$',
        categories: [{ title: 'Japanese' }, { title: 'Sushi Bars' }, { title: 'Restaurant' }],
        image_url: 'https://s3-media2.fl.yelpcdn.com/bphoto/placeholder2.jpg',
        location: { address1: '456 Fish St, New York, NY 10002' },
        coordinates: { latitude: 40.7218, longitude: -73.9960 }
      },
      {
        id: 'restaurant-test-3',
        name: 'French Bistro',
        rating: 4.7,
        price: '$$$$',
        categories: [{ title: 'French' }, { title: 'Fine Dining' }, { title: 'Restaurant' }],
        image_url: 'https://s3-media3.fl.yelpcdn.com/bphoto/placeholder3.jpg',
        location: { address1: '789 Gourmet Ave, New York, NY 10003' },
        coordinates: { latitude: 40.7318, longitude: -73.9860 }
      },
      {
        id: 'restaurant-test-4',
        name: 'Taco Shop',
        rating: 4.0,
        price: '$',
        categories: [{ title: 'Mexican' }, { title: 'Restaurant' }],
        image_url: 'https://s3-media4.fl.yelpcdn.com/bphoto/placeholder4.jpg',
        location: { address1: '101 Salsa St, New York, NY 10004' },
        coordinates: { latitude: 40.7418, longitude: -73.9760 }
      },
      {
        id: 'restaurant-test-5',
        name: 'Burger Joint',
        rating: 4.3,
        price: '$$',
        categories: [{ title: 'American' }, { title: 'Burgers' }, { title: 'Restaurant' }],
        image_url: 'https://s3-media5.fl.yelpcdn.com/bphoto/placeholder5.jpg',
        location: { address1: '222 Patty Ln, New York, NY 10005' },
        coordinates: { latitude: 40.7518, longitude: -73.9660 }
      }
    ];
  }
}

function getFallbackBusinessDetails(businessId) {
  // Determine if this is a bar or restaurant based on ID
  const isBar = businessId.startsWith('bar-');
  
  if (isBar) {
    return {
      id: businessId,
      name: 'Test Bar',
      rating: 4.5,
      price: '$$$',
      categories: [{ title: 'Cocktail Bar' }, { title: 'Wine Bar' }],
      image_url: 'https://s3-media1.fl.yelpcdn.com/bphoto/placeholder.jpg',
      photos: [
        'https://s3-media1.fl.yelpcdn.com/bphoto/placeholder1.jpg',
        'https://s3-media2.fl.yelpcdn.com/bphoto/placeholder2.jpg'
      ],
      location: { 
        address1: '123 Bar Ave',
        city: 'New York',
        state: 'NY',
        zip_code: '10001'
      },
      coordinates: { latitude: 40.7128, longitude: -74.0060 },
      phone: '+12125551234',
      url: 'https://www.yelp.com/biz/test-business',
      hours: [
        {
          open: [
            { day: 0, start: '1600', end: '0200' },
            { day: 1, start: '1600', end: '0200' },
            { day: 2, start: '1600', end: '0200' },
            { day: 3, start: '1600', end: '0200' },
            { day: 4, start: '1600', end: '0300' },
            { day: 5, start: '1600', end: '0300' },
            { day: 6, start: '1600', end: '0200' }
          ]
        }
      ],
      attributes: {
        noise_level: 'average',
        ambience: 'trendy'
      }
    };
  } else {
    return {
      id: businessId,
      name: 'Test Restaurant',
      rating: 4.5,
      price: '$$$',
      categories: [{ title: 'Italian' }, { title: 'Restaurant' }],
      image_url: 'https://s3-media1.fl.yelpcdn.com/bphoto/placeholder.jpg',
      photos: [
        'https://s3-media1.fl.yelpcdn.com/bphoto/placeholder1.jpg',
        'https://s3-media2.fl.yelpcdn.com/bphoto/placeholder2.jpg'
      ],
      location: { 
        address1: '123 Test Ave',
        city: 'New York',
        state: 'NY',
        zip_code: '10001'
      },
      coordinates: { latitude: 40.7128, longitude: -74.0060 },
      phone: '+12125551234',
      url: 'https://www.yelp.com/biz/test-business',
      hours: [
        {
          open: [
            { day: 0, start: '1100', end: '2200' },
            { day: 1, start: '1100', end: '2200' },
            { day: 2, start: '1100', end: '2200' },
            { day: 3, start: '1100', end: '2200' },
            { day: 4, start: '1100', end: '2300' },
            { day: 5, start: '1100', end: '2300' },
            { day: 6, start: '1100', end: '2200' }
          ]
        }
      ],
      attributes: {
        noise_level: 'average',
        ambience: 'romantic'
      }
    };
  }
}

function getFallbackReviews(businessId) {
  // Determine if this is a bar or restaurant based on ID
  const isBar = businessId.startsWith('bar-');
  
  if (isBar) {
    return [
      {
        id: 'review1',
        rating: 5,
        text: 'This bar has an amazing atmosphere! The lighting is perfect for an evening out, and the staff is attentive without being intrusive. The cocktails are creative and delicious - definitely try their signature Old Fashioned variation.',
        time_created: '2024-02-15 18:30:22',
        user: { name: 'Alex M.' }
      },
      {
        id: 'review2',
        rating: 4,
        text: 'Great drinks and atmosphere. It can get a bit crowded on weekend evenings, but the vibe is worth it. The wine selection is impressive and they have knowledgeable sommeliers who provide excellent recommendations.',
        time_created: '2024-01-20 19:15:42',
        user: { name: 'Taylor S.' }
      },
      {
        id: 'review3',
        rating: 5,
        text: 'One of the coziest bars in the city. The dim lighting and jazz music create a wonderful atmosphere. Their craft beer selection is excellent and constantly rotating with seasonal offerings!',
        time_created: '2023-12-10 20:45:11',
        user: { name: 'Jordan T.' }
      }
    ];
  } else {
    return [
      {
        id: 'review1',
        rating: 5,
        text: 'This restaurant has an amazing ambiance! The lighting is perfect for a romantic dinner, and the staff is attentive without being intrusive. The pasta is authentic and delicious - definitely try the homemade fettuccine.',
        time_created: '2024-02-15 18:30:22',
        user: { name: 'John D.' }
      },
      {
        id: 'review2',
        rating: 4,
        text: 'Great food and atmosphere. It can get a bit crowded on weekend evenings, but the intimate setting makes it perfect for date night. The wine selection is impressive and pairs wonderfully with their dishes.',
        time_created: '2024-01-20 19:15:42',
        user: { name: 'Sarah M.' }
      },
      {
        id: 'review3',
        rating: 5,
        text: 'One of the coziest Italian spots in the city. The dim lighting and quiet background music create a wonderful atmosphere. Their tiramisu is to die for!',
        time_created: '2023-12-10 20:45:11',
        user: { name: 'Michael T.' }
      }
    ];
  }
}

function getFallbackEnhancedData(businessId) {
  // Determine if this is a bar or restaurant based on ID
  const isBar = businessId.startsWith('bar-');
  
  if (isBar) {
    const details = getFallbackBusinessDetails(businessId);
    const reviews = getFallbackReviews(businessId);
    
    return {
      ...details,
      reviews,
      environment: {
        noiseLevel: 'moderate to loud',
        ambience: 'trendy',
        lighting: 'dim',
        crowdedness: 'busy'
      }
    };
  } else {
    const details = getFallbackBusinessDetails(businessId);
    const reviews = getFallbackReviews(businessId);
    
    return {
      ...details,
      reviews,
      environment: {
        noiseLevel: 'moderate',
        ambience: 'romantic',
        lighting: 'dim',
        crowdedness: 'moderate'
      }
    };
  }
}

module.exports = {
  searchBusinesses,
  getBusinessDetails,
  getBusinessReviews,
  getEnhancedBusinessData
};