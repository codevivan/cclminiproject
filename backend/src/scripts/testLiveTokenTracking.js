const { pool, query } = require('../config/db');
const http = require('http');

const makeRequest = (options, postData) => {
  return new Promise((resolve, reject) => {
    const opts = { ...options, headers: { ...(options.headers || {}) } };
    const payload = postData ? JSON.stringify(postData) : null;
    if (payload) {
      opts.headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
};

async function runTests() {
  console.log('====================================================');
  console.log('🧪 LIVE TOKEN TRACKING & OWNER DASHBOARD VERIFICATION');
  console.log('====================================================\n');

  try {
    // 1. Check or seed Owner & Student credentials
    const [owners] = await query('SELECT id, email FROM users WHERE role = "OWNER" LIMIT 1');
    const [students] = await query('SELECT id, email FROM users WHERE role = "STUDENT" LIMIT 1');
    const [menuItems] = await query('SELECT id, name, price FROM menu_items WHERE is_available = TRUE LIMIT 2');

    if (!owners) {
      console.error('❌ No Owner found in MySQL. Please seed or setup Owner first.');
      process.exit(1);
    }
    if (!students) {
      console.error('❌ No Student found in MySQL.');
      process.exit(1);
    }
    if (!menuItems) {
      console.error('❌ No available menu items found.');
      process.exit(1);
    }

    console.log(`👤 Using Owner: ${owners.email} (id: ${owners.id})`);
    console.log(`🎓 Using Student: ${students.email} (id: ${students.id})`);
    console.log(`🍱 Using Menu Item: ${menuItems.name} (₹${menuItems.price})`);

    // Reset password for owner & student to known password for automated login test
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('Test@123', 10);
    await query('UPDATE users SET password_hash = ? WHERE id IN (?, ?)', [hash, owners.id, students.id]);

    // 2. Login as Student
    console.log('\n--- Test 1: Student Login ---');
    const studentLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: students.email, password: 'Test@123' });

    console.log('Student login response:', studentLogin.status, studentLogin.data || studentLogin.raw);
    if (studentLogin.status !== 200 || !studentLogin.data?.token) {
      throw new Error(`Student login failed with status ${studentLogin.status}: ${JSON.stringify(studentLogin.data || studentLogin.raw)}`);
    }
    const studentToken = studentLogin.data.token;
    console.log('✅ Student logged in successfully. Token acquired.');

    // 3. Login as Owner
    console.log('\n--- Test 2: Owner Login ---');
    const ownerLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/owner-login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: owners.email, password: 'Test@123' });

    if (ownerLogin.status !== 200 || !ownerLogin.data?.token) {
      throw new Error(`Owner login failed: ${JSON.stringify(ownerLogin.data)}`);
    }
    const ownerToken = ownerLogin.data.token;
    console.log('✅ Owner logged in successfully. Token acquired.');

    // 4. Student places an order
    console.log('\n--- Test 3: Student Places an Order ---');
    const orderPayload = {
      items: [
        { id: menuItems.id, quantity: 2 }
      ],
      notes: 'Less spicy please',
      payment_method: 'Cash'
    };

    const orderRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      }
    }, orderPayload);

    if (orderRes.status !== 201 || !orderRes.data?.order?.id) {
      throw new Error(`Failed to place order: ${JSON.stringify(orderRes.data)}`);
    }
    const createdOrder = orderRes.data.order;
    console.log(`✅ Order created successfully!`);
    console.log(`   Order ID: ${createdOrder.id}`);
    console.log(`   Token Number: #${createdOrder.token_number}`);
    console.log(`   Status: ${createdOrder.status}`);
    console.log(`   Payment Method: ${createdOrder.payment_method}`);
    console.log(`   Payment Status: ${createdOrder.payment_status} (preserved, not auto-verified)`);

    // 5. Verify order persisted in MySQL
    console.log('\n--- Test 4: MySQL Persistence Verification ---');
    const [dbOrder] = await query('SELECT * FROM orders WHERE id = ?', [createdOrder.id]);
    if (!dbOrder) throw new Error('Order not found in MySQL database!');
    console.log(`✅ Verified in MySQL: Token #${dbOrder.token_number}, Status: "${dbOrder.status}", Amount: ₹${dbOrder.total_amount}`);

    const dbItems = await query('SELECT * FROM order_items WHERE order_id = ?', [createdOrder.id]);
    if (dbItems.length === 0) throw new Error('Order items missing in MySQL!');
    console.log(`✅ Verified in MySQL: ${dbItems.length} order items saved.`);

    // 6. Owner Dashboard fetches orders (GET /api/orders)
    console.log('\n--- Test 5: Owner Dashboard Live Orders Feed ---');
    const ownerOrdersRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });

    if (ownerOrdersRes.status !== 200 || !Array.isArray(ownerOrdersRes.data?.orders)) {
      throw new Error(`Owner fetch orders failed: ${JSON.stringify(ownerOrdersRes.data)}`);
    }
    const foundOrder = ownerOrdersRes.data.orders.find(o => o.id === createdOrder.id);
    if (!foundOrder) throw new Error(`Created order #${createdOrder.token_number} not found in Owner orders feed!`);
    console.log(`✅ Order #${foundOrder.token_number} appears in Owner feed with student: ${foundOrder.student_name}`);

    // 7. Test Status Progression: PLACED -> CONFIRMED -> PREPARING -> READY_FOR_PICKUP -> COMPLETED
    const transitions = [
      { input: 'CONFIRMED', expected: 'confirmed', label: '1. Confirmed' },
      { input: 'PREPARING', expected: 'preparing', label: '2. Preparing' },
      { input: 'READY_FOR_PICKUP', expected: 'ready', label: '3. Ready for Pickup' },
      { input: 'COMPLETED', expected: 'completed', label: '4. Completed' }
    ];

    for (const step of transitions) {
      console.log(`\n--- Test 6: Owner updates status to ${step.label} (${step.input}) ---`);
      const updateRes = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: `/api/orders/${createdOrder.id}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ownerToken}`
        }
      }, { status: step.input });

      if (updateRes.status !== 200 || updateRes.data?.newStatus !== step.expected) {
        throw new Error(`Failed to update status to ${step.input}: ${JSON.stringify(updateRes.data)}`);
      }
      console.log(`✅ Owner update response: ${updateRes.data.message}`);

      // Verify in MySQL
      const [checkRow] = await query('SELECT status, status_updated_by, updated_at FROM orders WHERE id = ?', [createdOrder.id]);
      if (checkRow.status !== step.expected) {
        throw new Error(`MySQL status mismatch: expected ${step.expected}, found ${checkRow.status}`);
      }
      if (checkRow.status_updated_by !== owners.id) {
        throw new Error(`MySQL status_updated_by mismatch: expected ${owners.id}, found ${checkRow.status_updated_by}`);
      }
      console.log(`✅ MySQL record confirmed: status="${checkRow.status}", updated_by=${checkRow.status_updated_by}`);

      // Verify Student sees the updated status
      const studentOrdersRes = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/orders/my-orders',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });
      const studentView = studentOrdersRes.data?.orders?.find(o => o.id === createdOrder.id);
      if (!studentView || studentView.status !== step.expected) {
        throw new Error(`Student view not updated: expected ${step.expected}, found ${studentView?.status}`);
      }
      console.log(`✅ Student dashboard receives updated status: "${studentView.status}"`);
    }

    // 8. Test Security: Student attempts to update status (Must be 403 Forbidden)
    console.log('\n--- Test 7: Security - Student Attempts Owner Actions ---');
    const studentTamper = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/orders/${createdOrder.id}/status`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      }
    }, { status: 'cancelled' });

    if (studentTamper.status === 403) {
      console.log('✅ Student update rejected with 403 Forbidden (Only Owner can update status).');
    } else {
      throw new Error(`Security failed: Student got status ${studentTamper.status} instead of 403`);
    }

    // Student attempts to view all orders
    const studentAllOrders = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    if (studentAllOrders.status === 403) {
      console.log('✅ Student viewing all orders rejected with 403 Forbidden.');
    } else {
      throw new Error(`Security failed: Student view all orders got status ${studentAllOrders.status} instead of 403`);
    }

    // 9. Verify Dashboard Statistics
    console.log('\n--- Test 8: Real Dashboard Stats from MySQL ---');
    const statsRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/orders/stats',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });

    if (statsRes.status !== 200 || !statsRes.data?.stats) {
      throw new Error(`Failed to fetch stats: ${JSON.stringify(statsRes.data)}`);
    }
    const s = statsRes.data.stats;
    console.log('✅ Owner Dashboard Stats fetched from MySQL:');
    console.log(`   Today Orders: ${s.todayOrders}`);
    console.log(`   Pending Orders: ${s.pendingOrders}`);
    console.log(`   Preparing Orders: ${s.preparingOrders}`);
    console.log(`   Ready Orders: ${s.readyOrders}`);
    console.log(`   Completed Orders: ${s.completedOrders}`);
    console.log(`   Confirmed Revenue: ₹${s.todayRevenue}`);
    console.log(`   Available Menu Items: ${s.availableMenuItems} / ${s.totalMenuItems}`);

    console.log('\n====================================================');
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test Error:', err);
    process.exit(1);
  }
}

runTests();
