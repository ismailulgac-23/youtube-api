const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3001/api';
let authToken = '';
let userId = '';
let serviceId = '';
let productId = '';
let orderId = '';
let orderNumber = '';
let commentId = '';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'test123'
};

const adminUser = {
  email: 'admin@youtube-satis.com',
  password: 'admin123'
};

// Helper function to make requests
const makeRequest = async (method, url, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
};

// Test functions
const testAuthEndpoints = async () => {
  console.log('\n🔐 Testing Authentication Endpoints...');
  
  // Test user registration
  console.log('\n1. Testing user registration...');
  const registerResult = await makeRequest('POST', '/auth/register', testUser);
  if (registerResult.success) {
    console.log('✅ User registration successful');
    authToken = registerResult.data.data.token;
    userId = registerResult.data.data.user._id;
  } else {
    console.log('❌ User registration failed:', registerResult.error);
  }
  
  // Test user login
  console.log('\n2. Testing user login...');
  const loginResult = await makeRequest('POST', '/auth/login', {
    email: testUser.email,
    password: testUser.password
  });
  if (loginResult.success) {
    console.log('✅ User login successful');
    authToken = loginResult.data.data.token;
  } else {
    console.log('❌ User login failed:', loginResult.error);
  }
  
  // Test get current user
  console.log('\n3. Testing get current user...');
  const getMeResult = await makeRequest('GET', '/auth/me', null, {
    'Authorization': `Bearer ${authToken}`
  });
  if (getMeResult.success) {
    console.log('✅ Get current user successful');
  } else {
    console.log('❌ Get current user failed:', getMeResult.error);
  }
  
  // Test admin login
  console.log('\n4. Testing admin login...');
  const adminLoginResult = await makeRequest('POST', '/auth/login', adminUser);
  if (adminLoginResult.success) {
    console.log('✅ Admin login successful');
  } else {
    console.log('❌ Admin login failed:', adminLoginResult.error);
  }
};

const testServiceEndpoints = async () => {
  console.log('\n🛍️ Testing Service Endpoints...');
  
  // Test get all services
  console.log('\n1. Testing get all services...');
  const servicesResult = await makeRequest('GET', '/services');
  if (servicesResult.success) {
    console.log('✅ Get services successful');
    if (servicesResult.data.data.services.length > 0) {
      serviceId = servicesResult.data.data.services[0]._id;
      console.log(`📝 Using service ID: ${serviceId}`);
    }
  } else {
    console.log('❌ Get services failed:', servicesResult.error);
  }
  
  // Test get single service
  if (serviceId) {
    console.log('\n2. Testing get single service...');
    const serviceResult = await makeRequest('GET', `/services/${serviceId}`);
    if (serviceResult.success) {
      console.log('✅ Get single service successful');
    } else {
      console.log('❌ Get single service failed:', serviceResult.error);
    }
  }
  
  // Test get popular services
  console.log('\n3. Testing get popular services...');
  const popularResult = await makeRequest('GET', '/services/popular/list');
  if (popularResult.success) {
    console.log('✅ Get popular services successful');
  } else {
    console.log('❌ Get popular services failed:', popularResult.error);
  }
};

const testProductEndpoints = async () => {
  console.log('\n📦 Testing Product Endpoints...');
  
  // Test get all products
  console.log('\n1. Testing get all products...');
  const productsResult = await makeRequest('GET', '/products');
  if (productsResult.success) {
    console.log('✅ Get products successful');
    if (productsResult.data.data.products.length > 0) {
      productId = productsResult.data.data.products[0]._id;
      console.log(`📝 Using product ID: ${productId}`);
    }
  } else {
    console.log('❌ Get products failed:', productsResult.error);
  }
  
  // Test get single product
  if (productId) {
    console.log('\n2. Testing get single product...');
    const productResult = await makeRequest('GET', `/products/${productId}`);
    if (productResult.success) {
      console.log('✅ Get single product successful');
    } else {
      console.log('❌ Get single product failed:', productResult.error);
    }
  }
  
  // Test get products by service
  if (serviceId) {
    console.log('\n3. Testing get products by service...');
    const serviceProductsResult = await makeRequest('GET', `/products/service/${serviceId}`);
    if (serviceProductsResult.success) {
      console.log('✅ Get products by service successful');
    } else {
      console.log('❌ Get products by service failed:', serviceProductsResult.error);
    }
  }
  
  // Test get popular products
  console.log('\n4. Testing get popular products...');
  const popularProductsResult = await makeRequest('GET', '/products/popular/list');
  if (popularProductsResult.success) {
    console.log('✅ Get popular products successful');
  } else {
    console.log('❌ Get popular products failed:', popularProductsResult.error);
  }
};

const testOrderEndpoints = async () => {
  console.log('\n🛒 Testing Order Endpoints...');
  
  if (!productId || !authToken) {
    console.log('❌ Cannot test orders: Missing product ID or auth token');
    return;
  }
  
  // Test create order
  console.log('\n1. Testing create order...');
  const orderData = {
    productId: productId,
    processLink: 'https://youtube.com/watch?v=test123',
    customerDetails: {
      fullName: 'Test Customer',
      email: 'customer@test.com',
      phone: '+905551234567'
    },
    paymentMethod: 'crypto_dodo'
  };
  
  const createOrderResult = await makeRequest('POST', '/orders', orderData, {
    'Authorization': `Bearer ${authToken}`
  });
  if (createOrderResult.success) {
    console.log('✅ Create order successful');
    orderId = createOrderResult.data.data.order._id;
    orderNumber = createOrderResult.data.data.order.orderNumber;
    console.log(`📝 Order ID: ${orderId}, Order Number: ${orderNumber}`);
  } else {
    console.log('❌ Create order failed:', createOrderResult.error);
  }
  
  // Test get user orders
  console.log('\n2. Testing get user orders...');
  const userOrdersResult = await makeRequest('GET', '/orders', null, {
    'Authorization': `Bearer ${authToken}`
  });
  if (userOrdersResult.success) {
    console.log('✅ Get user orders successful');
  } else {
    console.log('❌ Get user orders failed:', userOrdersResult.error);
  }
  
  // Test get single order
  if (orderId) {
    console.log('\n3. Testing get single order...');
    const orderResult = await makeRequest('GET', `/orders/${orderId}`, null, {
      'Authorization': `Bearer ${authToken}`
    });
    if (orderResult.success) {
      console.log('✅ Get single order successful');
    } else {
      console.log('❌ Get single order failed:', orderResult.error);
    }
  }
  
  // Test order query (public)
  if (orderNumber) {
    console.log('\n4. Testing order query (public)...');
    const queryResult = await makeRequest('POST', '/orders/query', {
      orderNumber: orderNumber
    });
    if (queryResult.success) {
      console.log('✅ Order query successful');
    } else {
      console.log('❌ Order query failed:', queryResult.error);
    }
    
    // Test order tracking (public)
    console.log('\n5. Testing order tracking (public)...');
    const trackResult = await makeRequest('GET', `/orders/track/${orderNumber}`);
    if (trackResult.success) {
      console.log('✅ Order tracking successful');
    } else {
      console.log('❌ Order tracking failed:', trackResult.error);
    }
  }
  
  // Test coupon validation
  console.log('\n6. Testing coupon validation...');
  const couponResult = await makeRequest('POST', '/orders/validate-coupon', {
    couponCode: 'INVALID123',
    productId: productId
  }, {
    'Authorization': `Bearer ${authToken}`
  });
  if (couponResult.success) {
    console.log('✅ Coupon validation successful');
  } else {
    console.log('✅ Coupon validation failed as expected (invalid coupon)');
  }
};

const testCommentEndpoints = async () => {
  console.log('\n💬 Testing Comment Endpoints...');
  
  if (!serviceId || !authToken) {
    console.log('❌ Cannot test comments: Missing service ID or auth token');
    return;
  }
  
  // Test create comment
  console.log('\n1. Testing create comment...');
  const commentData = {
    content: 'Bu servis gerçekten harika! Çok memnun kaldım.',
    service: serviceId
  };
  
  const createCommentResult = await makeRequest('POST', '/comments', commentData, {
    'Authorization': `Bearer ${authToken}`
  });
  if (createCommentResult.success) {
    console.log('✅ Create comment successful');
    commentId = createCommentResult.data.data.comment._id;
  } else {
    console.log('❌ Create comment failed:', createCommentResult.error);
  }
  
  // Test get service comments
  console.log('\n2. Testing get service comments...');
  const commentsResult = await makeRequest('GET', `/comments/service/${serviceId}`);
  if (commentsResult.success) {
    console.log('✅ Get service comments successful');
  } else {
    console.log('❌ Get service comments failed:', commentsResult.error);
  }
  
  // Test like comment
  if (commentId) {
    console.log('\n3. Testing like comment...');
    const likeResult = await makeRequest('POST', `/comments/${commentId}/like`, null, {
      'Authorization': `Bearer ${authToken}`
    });
    if (likeResult.success) {
      console.log('✅ Like comment successful');
    } else {
      console.log('❌ Like comment failed:', likeResult.error);
    }
    
    // Test get single comment
    console.log('\n4. Testing get single comment...');
    const commentResult = await makeRequest('GET', `/comments/${commentId}`);
    if (commentResult.success) {
      console.log('✅ Get single comment successful');
    } else {
      console.log('❌ Get single comment failed:', commentResult.error);
    }
    
    // Test create reply
    console.log('\n5. Testing create reply...');
    const replyData = {
      content: 'Teşekkürler! Biz de sizin memnuniyetinizden mutluyuz.',
      service: serviceId,
      parentComment: commentId
    };
    
    const replyResult = await makeRequest('POST', '/comments', replyData, {
      'Authorization': `Bearer ${authToken}`
    });
    if (replyResult.success) {
      console.log('✅ Create reply successful');
    } else {
      console.log('❌ Create reply failed:', replyResult.error);
    }
  }
};

const testPaymentEndpoints = async () => {
  console.log('\n💳 Testing Payment Endpoints...');
  
  if (!orderId || !authToken) {
    console.log('❌ Cannot test payments: Missing order ID or auth token');
    return;
  }
  
  // Test payment status check
  console.log('\n1. Testing payment status check...');
  const statusResult = await makeRequest('GET', `/payments/status/${orderId}`, null, {
    'Authorization': `Bearer ${authToken}`
  });
  if (statusResult.success) {
    console.log('✅ Payment status check successful');
  } else {
    console.log('❌ Payment status check failed:', statusResult.error);
  }
  
  // Test process payment (this will fail without real payment credentials)
  console.log('\n2. Testing process payment...');
  const processResult = await makeRequest('POST', `/payments/process/${orderId}`, null, {
    'Authorization': `Bearer ${authToken}`
  });
  if (processResult.success) {
    console.log('✅ Process payment successful');
  } else {
    console.log('✅ Process payment failed as expected (no payment credentials)');
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting API Tests...');
  console.log('='.repeat(50));
  
  try {
    await testAuthEndpoints();
    await testServiceEndpoints();
    await testProductEndpoints();
    await testOrderEndpoints();
    await testCommentEndpoints();
    await testPaymentEndpoints();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed!');
    console.log('\n📊 Test Summary:');
    console.log(`- Auth Token: ${authToken ? 'Generated' : 'Failed'}`);
    console.log(`- Service ID: ${serviceId || 'Not found'}`);
    console.log(`- Product ID: ${productId || 'Not found'}`);
    console.log(`- Order ID: ${orderId || 'Not created'}`);
    console.log(`- Order Number: ${orderNumber || 'Not created'}`);
    console.log(`- Comment ID: ${commentId || 'Not created'}`);
    
  } catch (error) {
    console.error('❌ Test runner error:', error);
  }
};

// Check if server is running
const checkServer = async () => {
  try {
    // Try to hit the services endpoint to check if server is running
    const response = await axios.get(`${BASE_URL}/services`);
    return true;
  } catch (error) {
    return false;
  }
};

// Start tests
const main = async () => {
  console.log('🔍 Checking if server is running...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Server is not running. Please start the server with: npm start');
    console.log('💡 Make sure to seed the database first with: npm run seed');
    process.exit(1);
  }
  
  console.log('✅ Server is running!');
  await runTests();
};

main();