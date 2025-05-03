import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generateInvoicePDF = async (order, address, user) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({ margin: 50 });
      
      // Buffer to store PDF
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      // Add logo image
      const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 150 });
      } else {
        // If logo doesn't exist, write the company name instead
        doc.font('Helvetica-Bold').fontSize(25).text('zance&co', 50, 45, { align: 'left' });
      }
      
      // Add "INVOICE" header
      doc.font('Helvetica-Bold').fontSize(30).text('INVOICE', 400, 50, { align: 'right' });
      
      // Add invoice details
      doc.font('Helvetica').fontSize(12).text(`Invoice Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 120);
      doc.text(`Order ID: ${order.orderId || order._id}`, 50, 140);
      doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 140);
      doc.text(`Payment Method: ${order.paymentMethod?.toUpperCase() || 'N/A'}`, 50, 160);
      doc.text(`Payment Status: ${order.paymentStatus || 'N/A'}`, 50, 180);
      
      // Add customer details
      doc.font('Helvetica-Bold').fontSize(14).text('Customer Details:', 50, 220);
      doc.font('Helvetica').fontSize(12).text(`Name: ${user.name}`, 50, 240);
      
      // Format address properly
      const formattedAddress = [
        address?.houseName || '',
        address?.street || '',
        address?.city || '',
        address?.state || '',
        address?.pincode || ''
      ].filter(Boolean).join(', ');
      
      doc.text(`Address: ${formattedAddress}`, 50, 260);
      doc.text(`Phone: ${user.phone || address?.mobile || 'N/A'}`, 50, 280);
      
      // Add order items table
      const tableTop = 330;
      const itemCodeX = 50;
      const descriptionX = 100;
      const quantityX = 370;
      const priceX = 440;
      const amountX = 510;
      
      // Add table headers
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Item', itemCodeX, tableTop);
      doc.text('Qty', quantityX, tableTop);
      doc.text('Price', priceX, tableTop);
      doc.text('Amount', amountX, tableTop);
      
      // Add horizontal line below headers
      doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();
      
      // Add table rows for items
      let y = tableTop + 30;
      doc.font('Helvetica').fontSize(11);
      
      order.orderItems.forEach((item, i) => {
        // If item name is too long, handle text wrapping
        const name = item.name;
        const nameLines = doc.widthOfString(name) > 260 ? 
          doc.heightOfString(name, { width: 260 }) / 12 : 1;
        
        doc.text(name, itemCodeX, y, { width: 260 });
        doc.text(item.quantity.toString(), quantityX, y);
        doc.text(`₹${item.finalPrice || item.discountPrice || item.basePrice}`, priceX, y);
        doc.text(`₹${(item.quantity * (item.finalPrice || item.discountPrice || item.basePrice))}`, amountX, y);
        
        y += nameLines * 15 + 10;
      });
      
      // Add horizontal line below items
      doc.moveTo(50, y).lineTo(550, y).stroke();
      
      // Add subtotal
      y += 20;
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Subtotal:', 440, y);
      doc.text(`₹${order.totalPrice - (order.deliveryCharge || 0)}`, amountX, y);
      
      // Add delivery charge if applicable
      if (order.deliveryCharge) {
        y += 20;
        doc.text('Delivery Charge:', 440, y);
        doc.text(`₹${order.deliveryCharge}`, amountX, y);
      }
      
      // Add discount if applicable
      if (order.coupon) {
        y += 20;
        doc.text('Discount:', 440, y);
        doc.text(`-₹${order.coupon}`, amountX, y);
      }
      
      // Add total
      y += 20;
      doc.fontSize(14);
      doc.text('Total:', 440, y);
      doc.text(`₹${order.totalPrice}`, amountX, y);
      
      // Add footer
      doc.fontSize(10).text('Thank you for shopping with zance&co!', 50, 700, { align: 'center' });
      
      // Finalize the PDF
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
};