const http = require('http');

const API_BASE_URL = 'http://localhost:5002';
const testResults = [];

function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5002,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          path,
          method,
          status: res.statusCode,
          success: res.statusCode < 400,
          response: responseData
        });
      });
    });

    req.on('error', (e) => {
      resolve({
        path,
        method,
        status: 'ERROR',
        success: false,
        error: e.message
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAllAPIs() {
  console.log('🔍 Testing API Connectivity...\n');

  // Test health endpoint
  const healthTest = await testEndpoint('/api/health');
  testResults.push(healthTest);
  console.log(`✅ Health Check: ${healthTest.success ? 'PASS' : 'FAIL'} (${healthTest.status})`);

  // Test OTP send endpoint
  const otpSendTest = await testEndpoint('/api/otp/send', 'POST', {
    email: 'test@example.com',
    type: 'signup'
  });
  testResults.push(otpSendTest);
  console.log(`✅ OTP Send: ${otpSendTest.success ? 'PASS' : 'FAIL'} (${otpSendTest.status})`);

  // Test OTP verify endpoint
  const otpVerifyTest = await testEndpoint('/api/otp/verify', 'POST', {
    email: 'test@example.com',
    otp: '123456',
    type: 'signup'
  });
  testResults.push(otpVerifyTest);
  console.log(`✅ OTP Verify: ${otpVerifyTest.status < 500 ? 'PASS' : 'FAIL'} (${otpVerifyTest.status})`);

  // Test auth register endpoint
  const registerTest = await testEndpoint('/api/auth/register', 'POST', {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'TestPassword123'
  });
  testResults.push(registerTest);
  console.log(`✅ Auth Register: ${registerTest.status < 500 ? 'PASS' : 'FAIL'} (${registerTest.status})`);

  // Test auth login endpoint
  const loginTest = await testEndpoint('/api/auth/login', 'POST', {
    email: 'test@example.com',
    password: 'wrongpassword'
  });
  testResults.push(loginTest);
  console.log(`✅ Auth Login: ${loginTest.status < 500 ? 'PASS' : 'FAIL'} (${loginTest.status})`);

  console.log('\n📊 API Connectivity Summary:');
  const passCount = testResults.filter(r => r.success || (r.status >= 200 && r.status < 500)).length;
  const totalCount = testResults.length;
  
  console.log(`✅ Endpoints Working: ${passCount}/${totalCount}`);
  console.log(`🔗 Backend Status: ${passCount === totalCount ? 'FULLY CONNECTED' : 'PARTIALLY CONNECTED'}`);
  
  if (passCount < totalCount) {
    console.log('\n❌ Failed Endpoints:');
    testResults.forEach(result => {
      if (!result.success && result.status >= 500) {
        console.log(`   - ${result.method} ${result.path}: ${result.status} ${result.error || ''}`);
      }
    });
  }
}

testAllAPIs();
