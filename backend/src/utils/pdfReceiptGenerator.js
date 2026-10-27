const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * Generate a professional Canteen Order / Payment Receipt PDF
 * @param {Object} order - Full order object with student info, items, and payment details
 * @param {stream.Writable} res - Express response stream
 */
const generateOrderReceiptPdf = async (order, res) => {
  const doc = new PDFDocument({
    margin: 40,
    size: 'A4'
  });

  doc.pipe(res);

  const canteenName = process.env.CANTEEN_NAME || 'Campus Canteen';
  const isPaid = order.payment_status === 'PAID';
  const isReview = order.payment_status === 'PENDING_VERIFICATION';

  // 1. Header Banner
  doc.rect(40, 40, 515, 80).fill('#174C3C');

  doc
    .fillColor('#FFFFFF')
    .fontSize(20)
    .font('Helvetica-Bold')
    .text(canteenName.toUpperCase(), 60, 55);

  doc
    .fillColor('#FAF8F2')
    .fontSize(9)
    .font('Helvetica')
    .text('Pre-Order & Token Management System · Official Canteen Receipt', 60, 80);

  doc
    .fontSize(9)
    .text(`Generated: ${new Date().toLocaleString('en-IN')}`, 60, 95);

  // Status Stamp on Header (Right side)
  if (isPaid) {
    doc.rect(390, 55, 145, 30).fill('#267653');
    doc
      .fillColor('#FFFFFF')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('PAID · CONFIRMED', 400, 64, { width: 125, align: 'center' });
  } else if (isReview) {
    doc.rect(370, 55, 165, 30).fill('#B45309');
    doc
      .fillColor('#FFFFFF')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('PAYMENT UNDER REVIEW', 375, 64, { width: 155, align: 'center' });
  } else {
    doc.rect(385, 55, 150, 30).fill('#DC2626');
    doc
      .fillColor('#FFFFFF')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('PAYMENT PENDING', 390, 64, { width: 140, align: 'center' });
  }

  // 2. Token & Meta Information Section
  let currentY = 135;

  // Token Box
  doc.rect(40, currentY, 160, 80).fillAndStroke('#FAF8F2', '#E2E8F0');
  doc
    .fillColor('#777F78')
    .fontSize(8)
    .font('Helvetica-Bold')
    .text('DIGITAL PICKUP TOKEN', 50, currentY + 12);

  doc
    .fillColor('#174C3C')
    .fontSize(24)
    .font('Helvetica-Bold')
    .text(`#${order.token_number}`, 50, currentY + 28);

  doc
    .fillColor('#202923')
    .fontSize(8)
    .font('Helvetica')
    .text(`Counter: ${order.pickup_counter || 'Main Billing'}`, 50, currentY + 60);

  // Receipt & Student Details Box
  doc.rect(215, currentY, 340, 80).fillAndStroke('#FFFFFF', '#E2E8F0');

  const receiptNum = order.receipt_number || `ORD-${String(order.id).padStart(6, '0')}`;
  doc
    .fillColor('#202923')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text(`Receipt #: ${receiptNum}`, 225, currentY + 10);

  doc
    .font('Helvetica')
    .fontSize(9)
    .text(`Order Date: ${new Date(order.created_at).toLocaleString('en-IN')}`, 225, currentY + 24)
    .text(`Student: ${order.student_name || 'Valued Customer'} (${order.student_email || '—'})`, 225, currentY + 38)
    .text(`Payment Method: ${order.payment_method || 'Cash at Counter'}`, 225, currentY + 52);

  if (order.transaction_ref) {
    doc.text(`UPI Ref / UTR: ${order.transaction_ref}`, 225, currentY + 66);
  } else if (isPaid && order.verified_at) {
    doc.text(`Verified: ${new Date(order.verified_at).toLocaleDateString('en-IN')}`, 225, currentY + 66);
  }

  currentY += 95;

  // 3. Watermark / Unpaid Warning Notice if not paid
  if (!isPaid) {
    doc.rect(40, currentY, 515, 28).fill('#FEF3C7');
    doc
      .fillColor('#92400E')
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .text('NOTICE: THIS IS AN UNPAID ORDER CONFIRMATION. RECEIPT WILL BE UPDATED TO PAID ONCE VERIFIED AT COUNTER.', 50, currentY + 8);
    currentY += 36;
  }

  // 4. Itemized Items Table
  doc
    .fillColor('#174C3C')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('ORDER ITEMS & BREAKDOWN', 40, currentY);

  currentY += 18;

  // Table Header
  doc.rect(40, currentY, 515, 22).fill('#174C3C');
  doc
    .fillColor('#FFFFFF')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('#', 50, currentY + 6)
    .text('Item Description', 80, currentY + 6)
    .text('Qty', 320, currentY + 6)
    .text('Price (INR)', 380, currentY + 6)
    .text('Subtotal (INR)', 470, currentY + 6);

  currentY += 22;

  // Table Rows
  const items = order.items || [];
  let rowIdx = 1;

  for (const item of items) {
    const isEven = rowIdx % 2 === 0;
    if (isEven) {
      doc.rect(40, currentY, 515, 20).fill('#FAF8F2');
    }

    const unitPrice = parseFloat(item.unit_price).toFixed(2);
    const subtotal = parseFloat(item.subtotal).toFixed(2);

    doc
      .fillColor('#202923')
      .fontSize(9)
      .font('Helvetica')
      .text(String(rowIdx), 50, currentY + 5)
      .text(item.item_name, 80, currentY + 5, { width: 230, ellipsis: true })
      .text(String(item.quantity), 320, currentY + 5)
      .text(`₹${unitPrice}`, 380, currentY + 5)
      .text(`₹${subtotal}`, 470, currentY + 5);

    currentY += 20;
    rowIdx++;
  }

  // Horizontal divider
  doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(40, currentY + 4).lineTo(555, currentY + 4).stroke();
  currentY += 12;

  // 5. Total Calculation Summary
  const grandTotal = parseFloat(order.total_amount).toFixed(2);

  doc
    .fillColor('#777F78')
    .fontSize(9)
    .font('Helvetica')
    .text('Items Subtotal:', 360, currentY)
    .fillColor('#202923')
    .text(`₹${grandTotal}`, 480, currentY);

  currentY += 16;
  doc
    .fillColor('#777F78')
    .text('Taxes & Surcharges (0%):', 360, currentY)
    .fillColor('#202923')
    .text('₹0.00', 480, currentY);

  currentY += 20;
  doc.rect(350, currentY, 205, 28).fill('#174C3C');
  doc
    .fillColor('#FFFFFF')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('TOTAL AMOUNT:', 365, currentY + 8)
    .text(`₹${grandTotal}`, 465, currentY + 8);

  currentY += 45;

  // 6. QR Code for Counter Verification
  try {
    const qrPayload = JSON.stringify({
      orderId: order.id,
      token: order.token_number,
      total: grandTotal,
      paid: isPaid
    });
    const qrBuffer = await QRCode.toBuffer(qrPayload, { width: 85, margin: 1 });
    doc.image(qrBuffer, 40, currentY, { width: 85 });

    doc
      .fillColor('#202923')
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .text('SCAN TO VERIFY AT COUNTER', 135, currentY + 10)
      .fillColor('#777F78')
      .font('Helvetica')
      .text('Canteen staff scan this digital signature to confirm receipt and dispense hot food.', 135, currentY + 24, { width: 380 })
      .text(`Order ID: #${order.id} · Token: ${order.token_number} · Status: ${order.status.toUpperCase()}`, 135, currentY + 42);
  } catch (qrErr) {
    console.warn('QR code generation note:', qrErr.message);
  }

  // 7. Footer
  doc
    .fillColor('#94A3B8')
    .fontSize(8)
    .font('Helvetica')
    .text(
      'Cloud-Based Canteen Pre-Order & Token Management System · This is an electronically generated document.',
      40,
      760,
      { align: 'center', width: 515 }
    );

  doc.end();
};

module.exports = { generateOrderReceiptPdf };
