const http = require('http');

const testEmail = `test-${Date.now()}@example.com`;

// Test sending OTP
const sendOtpRequest = http.request({
  hostname: 'localhost',
  port: 5002,
  path: '/api/otp/send',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
}, (response) => {
  let data = '';
  response.on('data', (chunk) => {
    data += chunk;
  });
  
  response.on('end', () => {
    console.log('OTP Send Response:', response.statusCode, data);
    
    // After sending OTP, try to verify (this will fail with invalid OTP, but we just want to test the endpoint)
    const verifyData = JSON.stringify({
      email: testEmail,
      otp: '123456',
      type: 'signup'
    });
    
    const verifyReq = http.request({
      hostname: 'localhost',
      port: 5002,
      path: '/api/otp/verify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(verifyData)
      },
    }, (verifyRes) => {
      let verifyResponse = '';
      verifyRes.on('data', (chunk) => {
        verifyResponse += chunk;
      });
      
      verifyRes.on('end', () => {
        console.log('OTP Verify Response:', verifyRes.statusCode, verifyResponse);
      });
    });
    
    verifyReq.on('error', (e) => {
      console.error('Verify request error:', e.message);
    });
    
    verifyReq.write(verifyData);
    verifyReq.end();
  });
});

sendOtpRequest.on('error', (e) => {
  console.error('Send OTP request error:', e.message);
});

// Send the request to generate OTP
const postData = JSON.stringify({
  email: testEmail,
  type: 'signup'
});

sendOtpRequest.setHeader('Content-Length', Buffer.byteLength(postData));
sendOtpRequest.write(postData);
sendOtpRequest.end();

console.log(`Testing OTP flow with email: ${testEmail}`);
