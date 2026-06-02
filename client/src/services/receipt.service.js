import { jsPDF } from 'jspdf';

/**
 * Premium Receipt Generation Service
 * Generates high-fidelity PDF tickets for confirmed bookings.
 * Branding: LOXLEY & MARCH • VOYAGES
 */

const COMPANY_NAME = "LOXLEY & MARCH";
const COMPANY_SUBTITLE = "VOYAGES";
const COMPANY_TAGLINE = "Crafting Extraordinary Journeys Since 2019";
const PRIMARY_COLOR = "#aa3bff"; // Brand purple
const SECONDARY_COLOR = "#0f172a"; // Dark navy
const SUCCESS_COLOR = "#22c55e"; // Green
const MUTED_COLOR = "#6b7280"; // Muted text

const COMPANY_ADDRESS = "14 Expedition House, Kensington, London, W8 4PT";
const COMPANY_EMAIL = "voyages@loxleyandmarch.com";
const COMPANY_PHONE = "+44 20 7946 0823";
const COMPANY_WEBSITE = "www.loxleyandmarch.com";

/**
 * Generate a human-readable booking reference from payment intent ID
 */
const generateBookingRef = (paymentIntentId) => {
  return 'LM-' + paymentIntentId.slice(-8).toUpperCase();
};

/**
 * Generate a visual barcode from booking reference
 */
const generateBarcode = (text) => {
  const charCodes = text.split('').map(c => c.charCodeAt(0));
  let barcode = '';
  charCodes.forEach(code => {
    const bits = (code % 256).toString(2).padStart(8, '0');
    bits.split('').forEach((bit, i) => {
      barcode += bit === '1' ? '█' : ' ';
    });
  });
  return barcode;
};

export const generateTicket = async (bookingData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const isMultiListing = Array.isArray(bookingData);
  const bookings = isMultiListing ? bookingData : [bookingData];

  // Helper functions
  const addSectionHeader = (y, text) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(PRIMARY_COLOR);
    doc.text(text.toUpperCase(), 40, y);
    doc.setDrawColor(229, 231, 235); // Light border
    doc.line(40, y + 2, 170, y + 2);
  };

  const addRow = (y, label, value, labelColor = SECONDARY_COLOR, valueColor = SECONDARY_COLOR) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(labelColor);
    doc.text(label, 40, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(valueColor);
    doc.text(value || 'N/A', 100, y);
  };

  // PAGE HEADER
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 210, 50, 'F');

  // Company name header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(SECONDARY_COLOR);
  doc.text(COMPANY_NAME, 40, 12);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(PRIMARY_COLOR);
  doc.text("• " + COMPANY_SUBTITLE + " •", 40, 18);

  // Tagline
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(MUTED_COLOR);
  doc.text(COMPANY_TAGLINE, 40, 23);

  // Decorative line
  doc.setDrawColor(PRIMARY_COLOR);
  doc.setLineWidth(0.5);
  doc.line(40, 28, 170, 28);

  // Booking status
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(SUCCESS_COLOR);
  doc.text("✓ BOOKING CONFIRMED", 40, 38);

  let currentY = 58;

  // Process each booking
  bookings.forEach((booking, index) => {
    if (index > 0 && currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    const bookingRef = generateBookingRef(booking.paymentIntentId || booking._id);
    const issueDate = new Date(booking.createdAt).toLocaleDateString('en-US', 
      { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

    // Booking reference and date
    addRow(currentY, "Booking Reference:", bookingRef);
    addRow(currentY + 6, "Issue Date:", issueDate);
    currentY += 16;

    // TOUR DETAILS SECTION
    addSectionHeader(currentY, "Tour Details");
    currentY += 10;
    
    const tourTitle = booking.tourId?.title || 'Tour';
    const category = booking.tourId?.categoryId?.name || 'Category';
    const duration = booking.tourId?.duration || 'N/A';
    const city = booking.tourId?.city || booking.city || 'City';
    const country = booking.tourId?.country || booking.country || 'Country';

    addRow(currentY, "Tour Name:", tourTitle);
    addRow(currentY + 6, "Category:", category);
    addRow(currentY + 12, "Duration:", duration + ' hours');
    addRow(currentY + 18, "Meeting Point:", city + ", " + country);
    currentY += 28;

    // BOOKING DETAILS SECTION
    addSectionHeader(currentY, "Booking Details");
    currentY += 10;

    const tourDate = new Date(booking.bookingDate || booking.availabilityId?.date).toLocaleDateString('en-US',
      { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const guestCount = booking.slotsBooked || 1;

    addRow(currentY, "Tour Date:", tourDate);
    addRow(currentY + 6, "Departure Time:", "As per operator schedule");
    addRow(currentY + 12, "Guests:", guestCount + " person(s)");
    addRow(currentY + 18, "Booking Status:", "Confirmed");
    currentY += 28;

    // GUEST INFORMATION SECTION
    addSectionHeader(currentY, "Guest Information");
    currentY += 10;

    const userName = booking.userId?.name || 'Guest';
    const userEmail = booking.userId?.email || 'N/A';
    const bookingMadeDate = new Date(booking.createdAt).toLocaleDateString('en-US',
      { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    addRow(currentY, "Lead Guest:", userName);
    addRow(currentY + 6, "Email:", userEmail);
    addRow(currentY + 12, "Booking Made:", bookingMadeDate);
    currentY += 22;

    // PAYMENT SUMMARY SECTION
    addSectionHeader(currentY, "Payment Summary");
    currentY += 10;

    const pricePerPerson = booking.pricePerSlot || booking.tourId?.price || 0;
    const subtotal = pricePerPerson * guestCount;
    const discount = booking.discount || 0;
    const totalPrice = booking.totalPrice || subtotal;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(MUTED_COLOR);
    
    addRow(currentY, "Price per person:", "₹" + pricePerPerson.toLocaleString());
    addRow(currentY + 5, "Number of guests:", guestCount.toString());
    addRow(currentY + 10, "Subtotal:", "₹" + subtotal.toLocaleString());
    
    if (discount > 0) {
      doc.setTextColor(SUCCESS_COLOR);
      addRow(currentY + 15, "Promo Discount:", "-₹" + discount.toLocaleString(), SUCCESS_COLOR);
      currentY += 20;
    } else {
      currentY += 15;
    }

    // Total payment line
    doc.setDrawColor(229, 231, 235);
    doc.line(40, currentY, 170, currentY);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(PRIMARY_COLOR);
    doc.text("TOTAL PAID:", 40, currentY + 6);
    doc.text("₹" + totalPrice.toLocaleString(), 170, currentY + 6, { align: 'right' });

    currentY += 12;

    // Payment reference
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(MUTED_COLOR);
    addRow(currentY, "Payment Reference:", booking.paymentIntentId || 'N/A');
    addRow(currentY + 5, "Payment Method:", "Online Payment (Stripe)");
    currentY += 15;

    // IMPORTANT INFORMATION SECTION
    addSectionHeader(currentY, "Important Information");
    currentY += 10;

    const importantInfo = [
      "• Please arrive 15 minutes early",
      "• Carry a valid photo ID",
      "• This ticket is non-transferable",
      "• Subject to weather conditions",
      "• Contact operator for any changes"
    ];

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(SECONDARY_COLOR);
    
    importantInfo.forEach((info, i) => {
      doc.text(info, 40, currentY + (i * 5));
    });
    currentY += 30;

    // BARCODE SECTION
    addSectionHeader(currentY, "Booking Code");
    currentY += 10;

    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(SECONDARY_COLOR);
    const barcode = generateBarcode(bookingRef);
    // Create a visual barcode representation
    let barcodeX = 40;
    const barcodeChars = bookingRef.split('');
    barcodeChars.forEach((char, i) => {
      const barHeight = i % 3 === 0 ? 12 : (i % 3 === 1 ? 10 : 8);
      const barWidth = 2;
      doc.setFillColor(26, 26, 46); // Dark color
      doc.rect(barcodeX, currentY + (12 - barHeight) / 2, barWidth, barHeight, 'F');
      barcodeX += barWidth + 1;
    });

    currentY += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(SECONDARY_COLOR);
    doc.text(bookingRef, 105, currentY, { align: 'center' });
    currentY += 10;
  });

  // FOOTER - on all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(40, 280, 170, 280);

    // Company details
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(MUTED_COLOR);
    doc.text(COMPANY_ADDRESS + " • " + COMPANY_EMAIL, 40, 285);
    doc.text(COMPANY_PHONE + " • " + COMPANY_WEBSITE, 40, 288);

    // Thank you message
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(MUTED_COLOR);
    doc.text("Thank you for choosing Loxley & March • Voyages", 105, 293, { align: 'center' });

    // Page number
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(MUTED_COLOR);
    doc.text(`Page ${i} of ${pageCount}`, 105, 297, { align: 'center' });
  }

  // Generate filename
  const bookingRef = generateBookingRef(bookings[0].paymentIntentId || bookings[0]._id);
  const filename = `LoxleyMarch_Booking_${bookingRef}.pdf`;

  doc.save(filename);
};
