const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_URL = 'http://localhost:5503/api/user/update';
const USERNAME = 'alex_test_id'; // Assuming this user exists from previous context

async function testProfileUpdate() {
  try {
    const form = new FormData();
    form.append('username', USERNAME);
    form.append('about', 'This is a test about me.');
    form.append('hobbies', 'Coding, Testing');
    
    // Optional: Add a dummy file if needed, but let's test text first
    // form.append('avatar', fs.createReadStream('path/to/image.png'));

    console.log('Sending request to', API_URL);
    
    const response = await axios.post(API_URL, form, {
      headers: {
        ...form.getHeaders()
      }
    });

    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testProfileUpdate();
