/**
 * Maps vibe keywords to search parameters for different platforms
 */

// Maps user-friendly vibe terms to Yelp API attributes
const yelpVibeMap = {
    'romantic': {
      attributes: ['romantic', 'intimate'],
      categories: ['wine_bars', 'french', 'italian', 'newamerican'],
      keywords: ['candlelight', 'intimate', 'romantic', 'date night']
    },
    'lively': {
      attributes: ['lively', 'loud'],
      categories: ['bars', 'newamerican', 'tapas', 'spanish'],
      keywords: ['energetic', 'bustling', 'vibrant', 'happening']
    },
    'cozy': {
      attributes: ['cozy', 'casual'],
      categories: ['cafes', 'bistro', 'gastropubs', 'italian'],
      keywords: ['warm', 'homey', 'comfortable', 'relaxed']
    },
    'upscale': {
      attributes: ['upscale', 'classy'],
      categories: ['french', 'newamerican', 'steak', 'japanese'],
      keywords: ['fine dining', 'elegant', 'refined', 'sophisticated']
    },
    'trendy': {
      attributes: ['hot_and_new', 'trending'],
      categories: ['newamerican', 'cocktailbars', 'asian', 'fusion'],
      keywords: ['hotspot', 'popular', 'instagram', 'chic']
    },
    'quiet': {
      attributes: ['quiet'],
      categories: ['wine_bars', 'french', 'japanese', 'tearooms'],
      keywords: ['peaceful', 'quiet conversation', 'calm', 'serene']
    },
    'outdoor': {
      attributes: ['outdoor_seating', 'restaurants_outdoor_seating'],
      categories: ['restaurants', 'bars', 'cafes', 'wineries'],
      keywords: ['patio', 'rooftop', 'garden', 'al fresco']
    },
    'casual': {
      attributes: ['casual'],
      categories: ['pizza', 'sandwiches', 'burgers', 'tacos'],
      keywords: ['relaxed', 'laid-back', 'informal', 'everyday']
    },
    'hipster': {
      attributes: ['hipster'],
      categories: ['coffee', 'vegan', 'breweries', 'barbers'],
      keywords: ['artisanal', 'craft', 'local', 'sustainable']
    },
    'classic': {
      attributes: ['traditional_cuisine'],
      categories: ['italian', 'french', 'steak', 'seafood'],
      keywords: ['old-school', 'established', 'timeless', 'iconic']
    }
  };
  
  // Map vibe to search parameters for Yelp
  const getYelpParams = (vibe) => {
    const lowerVibe = vibe.toLowerCase();
    
    // If exact match
    if (yelpVibeMap[lowerVibe]) {
      return yelpVibeMap[lowerVibe];
    }
    
    // Try to find partial matches
    for (const [mappedVibe, params] of Object.entries(yelpVibeMap)) {
      // Check if the requested vibe includes or is included in any of our mapped vibes
      if (lowerVibe.includes(mappedVibe) || mappedVibe.includes(lowerVibe)) {
        return params;
      }
      
      // Check against keywords
      const matchesKeyword = params.keywords.some(keyword => 
        lowerVibe.includes(keyword) || keyword.includes(lowerVibe)
      );
      
      if (matchesKeyword) {
        return params;
      }
    }
    
    // Default to returning empty parameters if no match
    return {
      attributes: [],
      categories: [],
      keywords: []
    };
  };
  
  // Get formatted attributes string for Yelp API
  const getYelpAttributesString = (vibe) => {
    const params = getYelpParams(vibe);
    return params.attributes.join(',');
  };
  
  module.exports = {
    getYelpParams,
    getYelpAttributesString,
    yelpVibeMap
  };