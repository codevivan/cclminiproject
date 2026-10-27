const http = require('http');

const API_BASE = 'http://localhost:5000/api';

// Helper to make HTTP requests with cookie support
function request(method, path, body = null, cookies = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const postData = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(cookies ? { 'Cookie': cookies } : {}),
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      const setCookies = res.headers['set-cookie'] || [];
      const cookieHeader = setCookies.map(c => c.split(';')[0]).join('; ');

      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          cookies: cookieHeader || cookies,
          body: json
        });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('RUNNING ADMIN DASHBOARD 10-SCENARIO INTEGRATION TEST');
  console.log('====================================================');

  try {
    // 0. Authenticate Admin and Student
    console.log('\n[AUTH SETUP]');
    const adminLogin = await request('POST', '/auth/login', {
      email: 'admin@canteen.edu',
      password: 'Admin@12345'
    });
    console.log('Admin login status:', adminLogin.status, adminLogin.body.success ? '✓ SUCCESS' : 'FAILED');
    const adminCookies = adminLogin.cookies;

    // Register a fresh test student
    const studentEmail = 'student_suite_' + Date.now() + '@canteen.edu';
    const studentRegister = await request('POST', '/auth/register', {
      name: 'Suite Student',
      email: studentEmail,
      password: 'StudentPassword123!'
    });
    console.log('Student registration status:', studentRegister.status, studentRegister.body.success ? '✓ SUCCESS' : 'FAILED');
    const studentCookies = studentRegister.cookies;

    // Reset Canteen Status to open first
    await request('PUT', '/admin/canteen-status', {
      status: 'open',
      notice: 'Test suite: Canteen open',
      opening_time: '08:00',
      closing_time: '20:00'
    }, adminCookies);

    // -----------------------------------------------------------------
    // Scenario 1: Admin adds a food item and it appears on Student Dashboard
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 1: Admin adds a food item ---');
    const newDish = {
      name: 'Test Paneer Tikka Wrap ' + Date.now().toString().slice(-4),
      description: 'Char-grilled cottage cheese wrapped in fresh flatbread',
      price: 110,
      category: 'Meals',
      prep_time_minutes: 12,
      is_available: true,
      is_featured: true,
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'
    };

    const addRes = await request('POST', '/menu', newDish, adminCookies);
    console.log('Add item response:', addRes.status, addRes.body.success ? '✓ Item created' : 'Failed');
    const createdItemId = addRes.body.data.id;

    // Student fetches menu and verifies item appears
    const studentMenuRes = await request('GET', '/menu', null, studentCookies);
    const itemInMenu = studentMenuRes.body.data.find(i => i.id === createdItemId);
    if (itemInMenu && itemInMenu.name === newDish.name) {
      console.log('✓ PASS Scenario 1: Item successfully appeared on Student Menu:', itemInMenu.name);
    } else {
      throw new Error('FAIL Scenario 1: Item did not appear on student menu.');
    }

    // -----------------------------------------------------------------
    // Scenario 2: Admin changes a price and the new price is displayed
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 2: Admin updates price ---');
    const newPrice = 135;
    const updateRes = await request('PUT', `/menu/${createdItemId}`, {
      price: newPrice,
      name: itemInMenu.name,
      category: itemInMenu.category
    }, adminCookies);
    console.log('Update price response:', updateRes.status, updateRes.body.success ? '✓ Price updated' : 'Failed');

    const updatedMenuRes = await request('GET', '/menu', null, studentCookies);
    const updatedItem = updatedMenuRes.body.data.find(i => i.id === createdItemId);
    if (updatedItem && parseFloat(updatedItem.price) === newPrice) {
      console.log(`✓ PASS Scenario 2: Student menu reflects updated price: ₹${updatedItem.price}`);
    } else {
      throw new Error('FAIL Scenario 2: Updated price not reflected.');
    }

    // -----------------------------------------------------------------
    // Scenario 3: Admin deletes a food item without breaking past orders
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 3: Delete food item preserving past orders ---');
    // First, place an order containing this food item
    const orderBeforeDelete = await request('POST', '/orders', {
      items: [{ id: createdItemId, quantity: 2 }],
      payment_method: 'Cash',
      notes: 'Testing item deletion safety'
    }, studentCookies);
    const pastOrderId = orderBeforeDelete.body.order.id;
    console.log(`Placed order #${pastOrderId} containing item #${createdItemId}`);

    // Now Admin deletes the item
    const deleteRes = await request('DELETE', `/menu/${createdItemId}`, null, adminCookies);
    console.log('Delete item response:', deleteRes.status, deleteRes.body.success ? '✓ Item deleted' : 'Failed');

    // Verify order and its item details still exist intact
    const verifyPastOrder = await request('GET', `/orders/${pastOrderId}`, null, studentCookies);
    if (verifyPastOrder.body.success && verifyPastOrder.body.order.items.length === 1) {
      console.log('✓ PASS Scenario 3: Past order details and receipt preserved completely:', {
        orderId: verifyPastOrder.body.order.id,
        token: verifyPastOrder.body.order.token_number,
        item_name: verifyPastOrder.body.order.items[0].item_name,
        quantity: verifyPastOrder.body.order.items[0].quantity,
        subtotal: verifyPastOrder.body.order.items[0].subtotal
      });
    } else {
      throw new Error('FAIL Scenario 3: Past order was broken or items lost.');
    }

    // -----------------------------------------------------------------
    // Scenario 4: A new student order appears in the Live Order Tracker
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 4: Student places order -> Appears in Live Order Tracker ---');
    // Find an existing available menu item
    const menuList = (await request('GET', '/menu?availableOnly=true', null, studentCookies)).body.data;
    const sampleItem = menuList[0];
    const newStudentOrder = await request('POST', '/orders', {
      items: [{ id: sampleItem.id, quantity: 1 }],
      payment_method: 'UPI',
      transaction_ref: 'UTR-LIVE-TEST-99'
    }, studentCookies);
    const testOrderId = newStudentOrder.body.order.id;
    const testToken = newStudentOrder.body.order.token_number;
    console.log(`Student placed order #${testOrderId} with Token #${testToken}`);

    // Admin fetches Live Order Tracker
    const trackerRes = await request('GET', '/orders', null, adminCookies);
    const foundInTracker = trackerRes.body.orders.find(o => o.id === testOrderId);
    if (foundInTracker && foundInTracker.token_number === testToken) {
      console.log(`✓ PASS Scenario 4: Order #${testOrderId} Token #${testToken} is visible in Admin Live Order Tracker!`);
    } else {
      throw new Error('FAIL Scenario 4: Order not found in Admin Live Order Tracker.');
    }

    // -----------------------------------------------------------------
    // Scenario 5: Admin changes order to Preparing & Student sees update
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 5: Admin updates status to Preparing ---');
    const prepUpdate = await request('PATCH', `/orders/${testOrderId}/status`, { status: 'preparing' }, adminCookies);
    console.log('Admin update to preparing:', prepUpdate.status, prepUpdate.body.success ? '✓' : 'Failed');

    const studentOrderCheck1 = await request('GET', `/orders/${testOrderId}`, null, studentCookies);
    if (studentOrderCheck1.body.order.status === 'preparing') {
      console.log('✓ PASS Scenario 5: Student sees updated status: "preparing"');
    } else {
      throw new Error('FAIL Scenario 5: Status not reflected on student side.');
    }

    // -----------------------------------------------------------------
    // Scenario 6: Admin changes order to Ready for Pickup & Student sees update
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 6: Admin updates status to Ready for Pickup ---');
    const readyUpdate = await request('PATCH', `/orders/${testOrderId}/status`, { status: 'ready' }, adminCookies);
    console.log('Admin update to ready:', readyUpdate.status, readyUpdate.body.success ? '✓' : 'Failed');

    const studentOrderCheck2 = await request('GET', `/orders/${testOrderId}`, null, studentCookies);
    if (studentOrderCheck2.body.order.status === 'ready') {
      console.log('✓ PASS Scenario 6: Student sees updated status: "ready"');
    } else {
      throw new Error('FAIL Scenario 6: Status not reflected on student side.');
    }

    // -----------------------------------------------------------------
    // Scenario 7: Admin marks order Completed
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 7: Admin marks order Completed ---');
    const completeUpdate = await request('PATCH', `/orders/${testOrderId}/status`, { status: 'completed' }, adminCookies);
    console.log('Admin update to completed:', completeUpdate.status, completeUpdate.body.success ? '✓' : 'Failed');

    const studentOrderCheck3 = await request('GET', `/orders/${testOrderId}`, null, studentCookies);
    if (studentOrderCheck3.body.order.status === 'completed') {
      console.log('✓ PASS Scenario 7: Order successfully completed and verified in DB.');
    } else {
      throw new Error('FAIL Scenario 7: Order not marked completed.');
    }

    // -----------------------------------------------------------------
    // Scenario 8: Admin pauses ordering & Students CANNOT place new orders
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 8: Admin pauses ordering -> Students blocked ---');
    const pauseRes = await request('PUT', '/admin/canteen-status', {
      status: 'paused',
      notice: 'Kitchen is at peak rush. Temporarily pausing new orders.',
      opening_time: '08:00',
      closing_time: '20:00'
    }, adminCookies);
    console.log('Canteen status updated:', pauseRes.body.message);

    // Student attempts to place order while paused
    const blockedOrderRes = await request('POST', '/orders', {
      items: [{ id: sampleItem.id, quantity: 1 }],
      payment_method: 'Cash'
    }, studentCookies);
    console.log('Student order attempt status:', blockedOrderRes.status, blockedOrderRes.body.message);

    if (blockedOrderRes.status === 403 && blockedOrderRes.body.message.includes('paused')) {
      console.log('✓ PASS Scenario 8: Backend successfully blocked new order with HTTP 403 and clear notice.');
    } else {
      throw new Error('FAIL Scenario 8: Order was not blocked during paused status.');
    }

    // -----------------------------------------------------------------
    // Scenario 9: Admin reopens ordering & Students can place orders again
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 9: Admin reopens ordering -> Students can order ---');
    const reopenRes = await request('PUT', '/admin/canteen-status', {
      status: 'open',
      notice: 'Welcome! Online food pre-orders are open today.',
      opening_time: '08:00',
      closing_time: '20:00'
    }, adminCookies);
    console.log('Canteen status reopened:', reopenRes.body.message);

    const allowedOrderRes = await request('POST', '/orders', {
      items: [{ id: sampleItem.id, quantity: 1 }],
      payment_method: 'Cash'
    }, studentCookies);
    if (allowedOrderRes.status === 201 && allowedOrderRes.body.success) {
      console.log(`✓ PASS Scenario 9: Student successfully placed order #${allowedOrderRes.body.order.id} Token #${allowedOrderRes.body.order.token_number} after reopening!`);
    } else {
      throw new Error('FAIL Scenario 9: Student could not place order after reopening.');
    }

    // -----------------------------------------------------------------
    // Scenario 10: Student CANNOT access Admin APIs or change settings
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 10: Student access to Admin APIs is strictly rejected ---');

    // 10a: Student tries to update canteen status
    const studentStatusAttempt = await request('PUT', '/admin/canteen-status', {
      status: 'closed'
    }, studentCookies);
    console.log('Student PUT /api/admin/canteen-status status:', studentStatusAttempt.status);

    // 10b: Student tries to change an order status
    const studentOrderStatusAttempt = await request('PATCH', `/orders/${testOrderId}/status`, {
      status: 'cancelled'
    }, studentCookies);
    console.log('Student PATCH /api/orders/:id/status status:', studentOrderStatusAttempt.status);

    // 10c: Student tries to add a menu item
    const studentMenuItemAttempt = await request('POST', '/menu', {
      name: 'Unauthorized Item',
      price: 50,
      category: 'Meals'
    }, studentCookies);
    console.log('Student POST /api/menu status:', studentMenuItemAttempt.status);

    // 10d: Student tries to view all users
    const studentUsersAttempt = await request('GET', '/admin/users', null, studentCookies);
    console.log('Student GET /api/admin/users status:', studentUsersAttempt.status);

    if (
      studentStatusAttempt.status === 403 &&
      studentOrderStatusAttempt.status === 403 &&
      studentMenuItemAttempt.status === 403 &&
      studentUsersAttempt.status === 403
    ) {
      console.log('✓ PASS Scenario 10: All unauthorized student attempts were strictly rejected with HTTP 403 Forbidden!');
    } else {
      throw new Error('FAIL Scenario 10: Security leak - student accessed admin APIs.');
    }

    console.log('\n====================================================');
    console.log('ALL 10 SCENARIOS PASSED WITH 100% SUCCESS!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILURE:', err.message);
    process.exit(1);
  }
}

runTestSuite();
