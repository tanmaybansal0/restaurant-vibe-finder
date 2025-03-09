# Vibe Match

An AI-powered venue recommendation system that finds NYC restaurants and bars based on vibe using LLM analysis of unstructured data.

## Features

- Find venues in NYC based on natural language descriptions of your desired vibe
- Select restaurant or bar and specify cuisine or bar type
- Interactive card-swiping interface to learn your preferences
- LLM-powered analysis of venue reviews, descriptions, and attributes to understand the true atmosphere
- Personalized final recommendation based on your feedback

## How It Works

1. Our system uses the Yelp API to find venues matching basic criteria
2. An AI-powered analyzer extracts "vibe profiles" from unstructured data like reviews and descriptions
3. You swipe through cards of potential matches, telling us what you like
4. Our matching algorithm learns from your choices to deliver one perfect recommendation 

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following structure:
   ```
   YELP_API_KEY=your_yelp_api_key_here
   LLM_PROVIDER=openai  # or anthropic
   OPENAI_API_KEY=your_openai_api_key_here
   # or if using Anthropic
   # ANTHROPIC_API_KEY=your_anthropic_api_key_here
   PORT=3001
   ```
4. Run the setup script to create necessary directories and files:
   ```
   npm run setup
   ```

## Getting API Keys

### Yelp API Key
1. Create a free developer account at [Yelp Fusion](https://www.yelp.com/developers)
2. Create a new app to get your API key
3. Add the API key to your `.env` file

### LLM API Key (OpenAI or Anthropic)
1. Choose your preferred LLM provider (OpenAI or Anthropic)
2. For OpenAI, sign up at [OpenAI Platform](https://platform.openai.com) and create an API key
3. For Anthropic, sign up at [Anthropic API](https://www.anthropic.com/product) and create an API key
4. Add the appropriate key to your `.env` file

## Running the Application

Start the server:
```
npm start
```

For development with auto-restart:
```
npm run dev
```

Then open your browser and navigate to `http://localhost:3001`.

## API Endpoints

### GET /api/venues/search
Searches for venues based on type and criteria.

### GET /api/venues/:id
Gets detailed venue information with vibe analysis.

### POST /api/venues/match
Matches venues to a user's vibe description.

### POST /api/venues/recommendation
Gets the next venue recommendation in the card interface flow.

### POST /api/venues/final-recommendation
Gets the final recommendation after several swipes.

## Project Structure

- `app.js` - Main application file
- `setup.js` - Setup script to create necessary directories and files
- `routes/venues.js` - API route definitions
- `services/` - Business logic modules:
  - `yelpService.js` - Yelp API integration
  - `llmVibeAnalyzer.js` - LLM-based vibe analysis
  - `venueCache.js` - Caching system for venue data and analyses
- `public/` - Static files for the web interface
- `cache/` - Storage for cached venue data and analyses

## Future Improvements

- User accounts to save preferences and favorite venues
- More sophisticated vibe matching using custom embeddings
- Expanded venue database beyond Yelp
- Integration with reservation platforms
- Mobile app version