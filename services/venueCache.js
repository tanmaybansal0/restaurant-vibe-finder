const fs = require('fs');
const path = require('path');

/**
 * A simple file-based cache for venue data and vibe analyses
 * Note: In a production environment, this would be replaced with a database
 */

// Cache directory path
const CACHE_DIR = path.join(__dirname, '..', 'cache');
const VENUE_DATA_DIR = path.join(CACHE_DIR, 'venue-data');
const VIBE_ANALYSIS_DIR = path.join(CACHE_DIR, 'vibe-analysis');

// Ensure cache directories exist
const initializeCache = () => {
  const dirs = [CACHE_DIR, VENUE_DATA_DIR, VIBE_ANALYSIS_DIR];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created cache directory: ${dir}`);
    }
  });
};

// Initialize cache on module load
initializeCache();

/**
 * Save venue data to cache
 * @param {string} venueId - Yelp business ID
 * @param {Object} venueData - Enhanced venue data
 */
const saveVenueData = (venueId, venueData) => {
  try {
    const filePath = path.join(VENUE_DATA_DIR, `${venueId}.json`);
    const dataToSave = {
      ...venueData,
      cached_at: new Date().toISOString()
    };
    
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
    return true;
  } catch (error) {
    console.error(`Error saving venue data for ${venueId}:`, error.message);
    return false;
  }
};

/**
 * Get venue data from cache
 * @param {string} venueId - Yelp business ID
 * @param {number} maxAgeDays - Maximum age of cache in days (default: 7)
 * @returns {Object|null} Venue data or null if not found or expired
 */
const getVenueData = (venueId, maxAgeDays = 7) => {
  try {
    const filePath = path.join(VENUE_DATA_DIR, `${venueId}.json`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const fileData = fs.readFileSync(filePath, 'utf8');
    const venueData = JSON.parse(fileData);
    
    // Check if cache is expired
    const cachedAt = new Date(venueData.cached_at);
    const now = new Date();
    const ageDays = (now - cachedAt) / (1000 * 60 * 60 * 24);
    
    if (ageDays > maxAgeDays) {
      console.log(`Cache expired for venue ${venueId}, age: ${ageDays.toFixed(1)} days`);
      return null;
    }
    
    return venueData;
  } catch (error) {
    console.error(`Error getting venue data for ${venueId}:`, error.message);
    return null;
  }
};

/**
 * Save vibe analysis to cache
 * @param {string} venueId - Yelp business ID
 * @param {Object} vibeAnalysis - LLM-generated vibe analysis
 */
const saveVibeAnalysis = (venueId, vibeAnalysis) => {
  try {
    const filePath = path.join(VIBE_ANALYSIS_DIR, `${venueId}.json`);
    const dataToSave = {
      venue_id: venueId,
      analysis: vibeAnalysis,
      cached_at: new Date().toISOString()
    };
    
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
    return true;
  } catch (error) {
    console.error(`Error saving vibe analysis for ${venueId}:`, error.message);
    return false;
  }
};

/**
 * Get vibe analysis from cache
 * @param {string} venueId - Yelp business ID
 * @param {number} maxAgeDays - Maximum age of cache in days (default: 30)
 * @returns {Object|null} Vibe analysis or null if not found or expired
 */
const getVibeAnalysis = (venueId, maxAgeDays = 30) => {
  try {
    const filePath = path.join(VIBE_ANALYSIS_DIR, `${venueId}.json`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const fileData = fs.readFileSync(filePath, 'utf8');
    const vibeData = JSON.parse(fileData);
    
    // Check if cache is expired
    const cachedAt = new Date(vibeData.cached_at);
    const now = new Date();
    const ageDays = (now - cachedAt) / (1000 * 60 * 60 * 24);
    
    if (ageDays > maxAgeDays) {
      console.log(`Vibe analysis cache expired for venue ${venueId}, age: ${ageDays.toFixed(1)} days`);
      return null;
    }
    
    return vibeData.analysis;
  } catch (error) {
    console.error(`Error getting vibe analysis for ${venueId}:`, error.message);
    return null;
  }
};

/**
 * Get or create vibe analysis for a venue
 * Uses cached analysis if available, otherwise generates new one
 * @param {string} venueId - Yelp business ID
 * @param {Object} venueData - Venue data (used if analysis needs to be generated)
 * @param {Function} analyzerFunc - Function to call to generate analysis if needed
 * @returns {Object} Vibe analysis
 */
const getOrCreateVibeAnalysis = async (venueId, venueData, analyzerFunc) => {
  // Try to get from cache first
  const cachedAnalysis = getVibeAnalysis(venueId);
  
  if (cachedAnalysis) {
    return cachedAnalysis;
  }
  
  // Generate new analysis
  console.log(`Generating new vibe analysis for ${venueId}`);
  const newAnalysis = await analyzerFunc(venueData);
  
  // Save to cache
  saveVibeAnalysis(venueId, newAnalysis);
  
  return newAnalysis;
};

/**
 * Clear expired cache entries
 */
const clearExpiredCache = (venueDaysMax = 7, vibeDaysMax = 30) => {
  try {
    // Clear expired venue data
    const venueFiles = fs.readdirSync(VENUE_DATA_DIR);
    let clearedCount = 0;
    
    venueFiles.forEach(file => {
      const filePath = path.join(VENUE_DATA_DIR, file);
      const fileData = fs.readFileSync(filePath, 'utf8');
      const venueData = JSON.parse(fileData);
      
      const cachedAt = new Date(venueData.cached_at);
      const now = new Date();
      const ageDays = (now - cachedAt) / (1000 * 60 * 60 * 24);
      
      if (ageDays > venueDaysMax) {
        fs.unlinkSync(filePath);
        clearedCount++;
      }
    });
    
    // Clear expired vibe analyses
    const vibeFiles = fs.readdirSync(VIBE_ANALYSIS_DIR);
    
    vibeFiles.forEach(file => {
      const filePath = path.join(VIBE_ANALYSIS_DIR, file);
      const fileData = fs.readFileSync(filePath, 'utf8');
      const vibeData = JSON.parse(fileData);
      
      const cachedAt = new Date(vibeData.cached_at);
      const now = new Date();
      const ageDays = (now - cachedAt) / (1000 * 60 * 60 * 24);
      
      if (ageDays > vibeDaysMax) {
        fs.unlinkSync(filePath);
        clearedCount++;
      }
    });
    
    console.log(`Cleared ${clearedCount} expired cache entries`);
    return clearedCount;
  } catch (error) {
    console.error('Error clearing expired cache:', error.message);
    return 0;
  }
};

module.exports = {
  saveVenueData,
  getVenueData,
  saveVibeAnalysis,
  getVibeAnalysis,
  getOrCreateVibeAnalysis,
  clearExpiredCache
};