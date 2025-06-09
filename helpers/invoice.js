import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generateInvoicePDF = async (order, address, user) => {
  return new Promise((resolve, reject) => {
    try {
      
      const doc = new PDFDocument({ margin: 50 });
      
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 150 });
      } else {
        doc.font('Helvetica-Bold').fontSize(25).text('zance&co', 50, 45, { align: 'left' });
      }
      
      doc.font('Helvetica-Bold').fontSize(30).text('INVOICE', 400, 50, { align: 'right' });
      
      doc.font('Helvetica').fontSize(12).text(`Invoice Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 120);
      doc.text(`Order ID: ${order.orderId || order._id}`, 50, 140);
      doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 140);
      doc.text(`Payment Method: ${order.paymentMethod?.toUpperCase() || 'N/A'}`, 50, 160);
      doc.text(`Payment Status: ${order.paymentStatus || 'N/A'}`, 50, 180);
      
      doc.font('Helvetica-Bold').fontSize(14).text('Customer Details:', 50, 220);
      doc.font('Helvetica').fontSize(12).text(`Name: ${user.name}`, 50, 240);

      const formattedAddress = [
        address?.houseName || '',
        address?.street || '',
        address?.city || '',
        address?.state || '',
        address?.pincode || ''
      ].filter(Boolean).join(', ');
      
      doc.text(`Address: ${formattedAddress}`, 50, 260);
      doc.text(`Phone: ${user.phone || address?.mobile || 'N/A'}`, 50, 280);

      const tableTop = 330;
      const itemCodeX = 50;
      const descriptionX = 100;
      const quantityX = 370;
      const priceX = 440;
      const amountX = 510;
      
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Item', itemCodeX, tableTop);
      doc.text('Qty', quantityX, tableTop);
      doc.text('Price', priceX, tableTop);
      doc.text('Amount', amountX, tableTop);
 
      doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();
  
      let y = tableTop + 30;
      doc.font('Helvetica').fontSize(11);
      
      order.orderItems.forEach((item, i) => {
  
        const name = item.name;
        const nameLines = doc.widthOfString(name) > 260 ? 
          doc.heightOfString(name, { width: 260 }) / 12 : 1;
        
        doc.text(name, itemCodeX, y, { width: 260 });
        doc.text(item.quantity.toString(), quantityX, y);
        doc.text(`₹${item.finalPrice || item.discountPrice || item.basePrice}`, priceX, y);
        doc.text(`₹${(item.quantity * (item.finalPrice || item.discountPrice || item.basePrice))}`, amountX, y);
        
        y += nameLines * 15 + 10;
      });
      
   
      doc.moveTo(50, y).lineTo(550, y).stroke();
      
     
      y += 20;
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Subtotal:', 440, y);
      doc.text(`₹${order.totalPrice - (order.deliveryCharge || 0)}`, amountX, y);
      
   
      if (order.deliveryCharge) {
        y += 20;
        doc.text('Delivery Charge:', 440, y);
        doc.text(`₹${order.deliveryCharge}`, amountX, y);
      }
      
    
      if (order.coupon) {
        y += 20;
        doc.text('Discount:', 440, y);
        doc.text(`-₹${order.coupon}`, amountX, y);
      }
      
      
      y += 20;
      doc.fontSize(14);
      doc.text('Total:', 440, y);
      doc.text(`₹${order.totalPrice}`, amountX, y);
      
      doc.fontSize(10).text('Thank you for shopping with zance&co!', 50, 700, { align: 'center' });
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
};