const axios = require('axios');

const API_BASE_URL = 'http://localhost:5002/api';

async function testOtpFlow() {
  try {
    const testEmail = `test-${Date.now()}@example.com`;
    
    console.log('1. Sending OTP...');
    const sendOtpResponse = await axios.post(`${API_BASE_URL}/otp/send`, {
      email: testEmail,
      type: 'signup'
    });
    console.log('OTP sent successfully');
    
    // In a real test, you would get the OTP from the email or console output
    // For this test, we'll assume the OTP is '123456'
    const testOtp = '123456';
    
    console.log('\n2. Verifying OTP...');
    try {
      const verifyOtpResponse = await axios.post(`${API_BASE_URL}/otp/verify`, {
        email: testEmail,
        otp: testOtp,
        type: 'signup'
      });
      console.log('OTP verified successfully:', verifyOtpResponse.data);
    } catch (error) {
      console.error('OTP verification failed:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testOtpFlow();
