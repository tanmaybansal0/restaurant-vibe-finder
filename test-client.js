const axios = require('axios');

async function testApi() {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Current time + 3 hours for dinner reservation (in 24-hour format)
    let hours = today.getHours() + 3;
    // If after midnight, adjust to next day
    if (hours >= 24) {
      hours -= 24;
    }
    const timeStr = `${String(hours).padStart(2, '0')}:00`;
    
    console.log(`Searching for restaurants with reservations for ${dateStr} at ${timeStr}`);
    
    const response = await axios.post('http://localhost:3000/api/restaurants/recommendations', {
      vibe: 'romantic',
      location: 'New York, NY',
      cuisine: 'Italian',
      price: '3,4', // This means $$-$$ restaurants
      reservationDate: dateStr,
      reservationTime: timeStr,
      partySize: 2
    });
    
    console.log('Restaurant recommendations:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testApi();