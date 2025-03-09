const axios = require('axios');

/**
 * Service for analyzing venue data using LLM APIs to extract vibe information
 */

// Configure which LLM provider to use
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai'; // 'openai', 'anthropic', etc.

/**
 * Analyze business data and extract vibe information using an LLM
 * @param {Object} businessData - Enhanced business data from Yelp
 * @returns {Object} Vibe profile for the business
 */
const analyzeBusinessVibe = async (businessData) => {
  try {
    // Prepare the prompt for the LLM
    const prompt = createVibeAnalysisPrompt(businessData);
    
    // Send to appropriate LLM based on configuration
    let vibeAnalysis;
    
    switch (LLM_PROVIDER.toLowerCase()) {
      case 'openai':
        vibeAnalysis = await analyzeWithOpenAI(prompt);
        break;
      case 'anthropic':
        vibeAnalysis = await analyzeWithAnthropic(prompt);
        break;
      default:
        vibeAnalysis = await analyzeWithOpenAI(prompt); // Default to OpenAI
    }
    
    // Parse the LLM response to extract structured vibe data
    return parseVibeAnalysis(vibeAnalysis);
  } catch (error) {
    console.error('Error analyzing business vibe:', error.message);
    // Return a basic fallback analysis in case of failure
    return createFallbackVibeAnalysis(businessData);
  }
};

/**
 * Create a prompt for the LLM to analyze the business vibe
 */
const createVibeAnalysisPrompt = (businessData) => {
  // Extract relevant information from business data
  const name = businessData.name || 'Unknown Venue';
  const categories = businessData.categories || [];
  const reviews = businessData.reviews || [];
  const price = businessData.price || '';
  
  // Format categories
  let categoryNames = '';
  if (Array.isArray(categories)) {
    categoryNames = categories.map(cat => typeof cat === 'object' ? cat.title : cat).join(', ');
  } else if (typeof categories === 'string') {
    categoryNames = categories;
  }
  
  // Format reviews (limit to 5 most recent to keep prompt size reasonable)
  let formattedReviews = '';
  if (Array.isArray(reviews) && reviews.length > 0) {
    formattedReviews = reviews.slice(0, 5).map(review => {
      const text = review.text || '';
      const rating = review.rating || 0;
      return `"${text}" - ${rating} stars`;
    }).join('\n\n');
  } else {
    formattedReviews = "No reviews available.";
  }
  
  // Create the prompt
  return `
You are a restaurant and bar vibe analysis expert. Please analyze the following venue and create a detailed vibe profile.

VENUE INFORMATION:
Name: ${name}
Categories: ${categoryNames}
Price Range: ${price || 'Unknown'}

REVIEWS:
${formattedReviews}

Based on this information, please create a detailed vibe analysis with the following:

1. Primary Vibe: What's the dominant atmosphere of this place? (e.g., romantic, lively, cozy, upscale, trendy, quiet)

2. Ambience Factors: Analyze lighting, noise level, crowdedness, decor style, music, etc.

3. Suitable For: What occasions or gatherings is this place best suited for? (e.g., date night, business meetings, family gatherings, solo dining, friends meetup)

4. Keywords: Provide 10-15 keywords that best capture the vibe of this place

5. Similar Venue Types: What other types of venues have a similar vibe?

6. Unique Attributes: What makes this place's vibe stand out from similar venues?

Format your response as a JSON object with the following structure:
{
  "primaryVibe": "string",
  "secondaryVibes": ["string", "string"],
  "ambienceFactors": {
    "lighting": "string",
    "noiseLevel": "string",
    "crowdedness": "string",
    "decor": "string",
    "music": "string"
  },
  "suitableFor": ["string", "string"],
  "vibeKeywords": ["string", "string"],
  "similarVenueTypes": ["string", "string"],
  "uniqueAttributes": ["string", "string"]
}
`;
};

/**
 * Analyze vibe using OpenAI's API
 */
const analyzeWithOpenAI = async (prompt) => {
  try {
    // For testing or when no API key is available, return mock data
    if (!process.env.OPENAI_API_KEY || process.env.NODE_ENV === 'development') {
      console.log('Using mock OpenAI response for vibe analysis');
      return JSON.stringify({
        "primaryVibe": "romantic",
        "secondaryVibes": ["intimate", "upscale"],
        "ambienceFactors": {
          "lighting": "dim",
          "noiseLevel": "quiet",
          "crowdedness": "moderate",
          "decor": "elegant",
          "music": "soft jazz"
        },
        "suitableFor": ["date night", "special occasions", "business dinners"],
        "vibeKeywords": ["intimate", "romantic", "candlelit", "quiet", "elegant", "sophisticated", "refined", "upscale", "exclusive", "private"],
        "similarVenueTypes": ["wine bars", "fine dining", "cocktail lounges"],
        "uniqueAttributes": ["handcrafted cocktails", "exceptional service", "intimate seating arrangements"]
      });
    }
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: 'You are a restaurant and bar vibe expert.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    // Return a fallback response for development
    return JSON.stringify({
      "primaryVibe": "casual",
      "secondaryVibes": ["relaxed", "friendly"],
      "ambienceFactors": {
        "lighting": "moderate",
        "noiseLevel": "moderate",
        "crowdedness": "moderate",
        "decor": "modern",
        "music": "contemporary"
      },
      "suitableFor": ["casual dining", "friends gathering", "family meals"],
      "vibeKeywords": ["casual", "relaxed", "comfortable", "friendly", "welcoming", "cozy", "pleasant", "unpretentious", "laid-back", "easygoing"],
      "similarVenueTypes": ["casual bistros", "cafes", "neighborhood eateries"],
      "uniqueAttributes": ["comfortable atmosphere", "friendly service", "approachable menu"]
    });
  }
};

/**
 * Analyze vibe using Anthropic's API
 */
const analyzeWithAnthropic = async (prompt) => {
  try {
    // For testing or when no API key is available, return mock data
    if (!process.env.ANTHROPIC_API_KEY || process.env.NODE_ENV === 'development') {
      console.log('Using mock Anthropic response for vibe analysis');
      return JSON.stringify({
        "primaryVibe": "trendy",
        "secondaryVibes": ["energetic", "contemporary"],
        "ambienceFactors": {
          "lighting": "mood lighting",
          "noiseLevel": "lively",
          "crowdedness": "bustling",
          "decor": "modern industrial",
          "music": "upbeat contemporary"
        },
        "suitableFor": ["friends outing", "casual dates", "after-work drinks"],
        "vibeKeywords": ["trendy", "energetic", "modern", "stylish", "hip", "vibrant", "lively", "social", "buzzing", "contemporary"],
        "similarVenueTypes": ["cocktail bars", "gastropubs", "modern eateries"],
        "uniqueAttributes": ["creative menu", "lively atmosphere", "engaging environment"]
      });
    }
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        messages: [
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    return response.data.content[0].text;
  } catch (error) {
    console.error('Anthropic API error:', error.message);
    // Return a fallback response for development
    return JSON.stringify({
      "primaryVibe": "upscale",
      "secondaryVibes": ["sophisticated", "elegant"],
      "ambienceFactors": {
        "lighting": "refined",
        "noiseLevel": "quiet",
        "crowdedness": "spacious",
        "decor": "luxurious",
        "music": "gentle classical"
      },
      "suitableFor": ["business meetings", "special occasions", "fine dining"],
      "vibeKeywords": ["upscale", "elegant", "sophisticated", "refined", "luxurious", "high-end", "polished", "exclusive", "premium", "quality"],
      "similarVenueTypes": ["fine dining establishments", "luxury restaurants", "upscale lounges"],
      "uniqueAttributes": ["premium service", "elegant presentation", "refined atmosphere"]
    });
  }
};

/**
 * Parse the LLM response to extract structured vibe data
 */
const parseVibeAnalysis = (analysisText) => {
  try {
    // Extract JSON from response (in case there's additional text)
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // If no JSON found, attempt to parse the entire response
    return JSON.parse(analysisText);
  } catch (error) {
    console.error('Error parsing vibe analysis:', error.message);
    // Return a basic structure if parsing fails
    return {
      primaryVibe: 'appealing',
      secondaryVibes: [],
      ambienceFactors: {},
      suitableFor: [],
      vibeKeywords: ['comfortable', 'pleasant', 'nice', 'enjoyable', 'welcoming'],
      similarVenueTypes: [],
      uniqueAttributes: []
    };
  }
};

/**
 * Create a fallback vibe analysis if LLM processing fails
 */
const createFallbackVibeAnalysis = (businessData) => {
  // Extract basic category information
  let categories = [];
  if (businessData.categories) {
    if (Array.isArray(businessData.categories)) {
      categories = businessData.categories.map(cat => typeof cat === 'object' ? cat.title : cat);
    } else if (typeof businessData.categories === 'string') {
      categories = [businessData.categories];
    }
  }
  
  // Determine primary vibe based on categories and price
  let primaryVibe = 'casual';
  let vibeKeywords = [...categories, 'enjoyable', 'pleasant'];
  
  // Look for key terms in categories to determine vibe
  const lowerCategories = categories.map(c => c.toLowerCase());
  
  if (lowerCategories.some(cat => ['fine dining', 'french', 'steakhouse', 'japanese'].includes(cat))) {
    primaryVibe = 'upscale';
    vibeKeywords = [...vibeKeywords, 'elegant', 'refined', 'sophisticated'];
  } else if (lowerCategories.some(cat => ['bar', 'nightlife', 'cocktail'].includes(cat))) {
    primaryVibe = 'lively';
    vibeKeywords = [...vibeKeywords, 'energetic', 'vibrant', 'social'];
  } else if (lowerCategories.some(cat => ['cafe', 'bakery', 'coffee'].includes(cat))) {
    primaryVibe = 'cozy';
    vibeKeywords = [...vibeKeywords, 'comfortable', 'relaxed', 'warm'];
  } else if (businessData.price === '$$$$' || businessData.price === '$$$') {
    primaryVibe = 'upscale';
    vibeKeywords = [...vibeKeywords, 'elegant', 'refined', 'sophisticated'];
  } else if (businessData.price === '$') {
    primaryVibe = 'casual';
    vibeKeywords = [...vibeKeywords, 'affordable', 'relaxed', 'laid-back'];
  }
  
  return {
    primaryVibe,
    secondaryVibes: ['pleasant'],
    ambienceFactors: {
      lighting: 'moderate',
      noiseLevel: 'moderate',
      crowdedness: 'moderate',
      decor: 'appealing',
      music: 'suitable'
    },
    suitableFor: ['dining', 'casual meetups'],
    vibeKeywords: Array.from(new Set(vibeKeywords)).slice(0, 10),
    similarVenueTypes: [],
    uniqueAttributes: []
  };
};

/**
 * Match a user's vibe description to venues
 * @param {string} userVibeDescription - User's free-form description of desired vibe
 * @param {Array} venueProfiles - Array of venue profiles with vibe data
 * @returns {Array} Ranked list of matching venues
 */
const matchUserVibeToVenues = async (userVibeDescription, venueProfiles) => {
  try {
    // For testing or development, return a mock ranking
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock venue matching in development mode');
      // Create a simple ranking based on shuffling the venues
      return venueProfiles.map((venue, index) => ({
        venueId: venue.id,
        venueName: venue.name,
        matchScore: 100 - (index * (100 / venueProfiles.length)),
        matchReasons: ['Matches your vibe preferences'],
        rank: index + 1
      })).sort((a, b) => a.rank - b.rank);
    }
    
    // Create prompt for matching
    const prompt = createVibeMatchingPrompt(userVibeDescription, venueProfiles);
    
    // Get matching results from LLM
    let matchingResults;
    
    switch (LLM_PROVIDER.toLowerCase()) {
      case 'openai':
        matchingResults = await analyzeWithOpenAI(prompt);
        break;
      case 'anthropic':
        matchingResults = await analyzeWithAnthropic(prompt);
        break;
      default:
        matchingResults = await analyzeWithOpenAI(prompt);
    }
    
    // Parse and return results
    return parseMatchingResults(matchingResults, venueProfiles);
  } catch (error) {
    console.error('Error matching user vibe to venues:', error.message);
    // Return a basic sorting as fallback
    return venueProfiles.map((profile, index) => ({
      venueId: profile.id,
      venueName: profile.name,
      matchScore: 100 - index, // Simple descending score
      matchReasons: ['Based on your preferences'],
      rank: index + 1
    })).sort((a, b) => a.rank - b.rank);
  }
};

/**
 * Create a prompt for the LLM to match user vibe to venues
 */
const createVibeMatchingPrompt = (userVibeDescription, venueProfiles) => {
  // Format venue profiles
  const formattedVenues = venueProfiles.map((venue, index) => {
    // Get vibe analysis from venue
    const vibeAnalysis = venue.vibeAnalysis || {};
    const primaryVibe = vibeAnalysis.primaryVibe || venue.primaryVibe || 'unknown';
    const secondaryVibes = vibeAnalysis.secondaryVibes || [];
    const keywords = vibeAnalysis.vibeKeywords || venue.vibeKeywords || [];
    const suitableFor = vibeAnalysis.suitableFor || [];
    
    return `
Venue ${index + 1}: ${venue.name}
Primary Vibe: ${primaryVibe}
Secondary Vibes: ${secondaryVibes.join(', ')}
Keywords: ${keywords.join(', ')}
Suitable For: ${suitableFor.join(', ')}
`;
  }).join('\n');
  
  return `
You are a restaurant and bar recommendation expert. Match the following user's vibe description to the most suitable venues.

USER'S DESIRED VIBE:
"${userVibeDescription}"

AVAILABLE VENUES:
${formattedVenues}

For each venue, provide:
1. A match score from 0-100
2. A brief explanation of why it matches or doesn't match the user's desired vibe
3. Rank the venues from best match to worst match

Format your response as a JSON array with the following structure:
[
  {
    "venueIndex": 1,
    "matchScore": 85,
    "matchReasons": ["reason1", "reason2"],
    "rank": 1
  },
  ...
]
`;
};

/**
 * Parse matching results from LLM
 */
const parseMatchingResults = (matchingText, venueProfiles) => {
  try {
    // Extract JSON from response
    const jsonMatch = matchingText.match(/\[[\s\S]*\]/);
    let matchingData = [];
    
    if (jsonMatch) {
      matchingData = JSON.parse(jsonMatch[0]);
    } else {
      // If no JSON found, create a simple ranking
      matchingData = venueProfiles.map((venue, index) => ({
        venueIndex: index + 1,
        matchScore: 100 - (index * 10),
        matchReasons: ["Based on your preferences"],
        rank: index + 1
      }));
    }
    
    // Map results to include actual venue data
    return matchingData.map(match => {
      const venueIndex = match.venueIndex - 1;
      if (venueIndex >= 0 && venueIndex < venueProfiles.length) {
        return {
          venueId: venueProfiles[venueIndex].id,
          venueName: venueProfiles[venueIndex].name,
          matchScore: match.matchScore,
          matchReasons: match.matchReasons,
          rank: match.rank
        };
      } else {
        // Handle out-of-bounds indices
        return {
          venueId: 'unknown',
          venueName: 'Unknown Venue',
          matchScore: 0,
          matchReasons: ["Venue not found"],
          rank: 999
        };
      }
    }).sort((a, b) => a.rank - b.rank).filter(match => match.venueId !== 'unknown');
  } catch (error) {
    console.error('Error parsing matching results:', error);
    // Return a basic ranking as fallback
    return venueProfiles.map((profile, index) => ({
      venueId: profile.id,
      venueName: profile.name,
      matchScore: 100 - index,
      matchReasons: ['Based on your preferences'],
      rank: index + 1
    })).sort((a, b) => a.rank - b.rank);
  }
};

// Make all functions explicitly available in the module exports
module.exports = {
  analyzeBusinessVibe,
  matchUserVibeToVenues,
  analyzeWithOpenAI,
  analyzeWithAnthropic,
  parseVibeAnalysis,
  createFallbackVibeAnalysis,
  createVibeAnalysisPrompt,
  createVibeMatchingPrompt,
  parseMatchingResults
};