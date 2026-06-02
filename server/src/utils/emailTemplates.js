const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const generateBaseTemplate = (title, content) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #333333;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f5; padding: 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              
              <!-- Header Bar -->
              <tr>
                <td style="background-color: #aa3bff; padding: 24px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">TourBooker</h1>
                </td>
              </tr>
              
              <!-- Body Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  ${content}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; color: #64748b; font-size: 14px;">&copy; ${new Date().getFullYear()} TourBooker. All rights reserved.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// 1. Booking Confirmation Email
exports.bookingConfirmationEmail = ({ userName, tourTitle, bookingDate, slotsBooked, totalPrice, paymentIntentId }) => {
  const content = `
    <h2 style="color: #1e293b; margin-top: 0;">Hi ${userName},</h2>
    
    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; background-color: #dcfce7; padding: 16px; border-radius: 50%; margin-bottom: 15px;">
        <span style="font-size: 32px;">✅</span>
      </div>
      <h3 style="color: #22c55e; margin: 0; font-size: 20px;">Booking Confirmed!</h3>
    </div>
    
    <p style="line-height: 1.6;">Thank you for booking with TourBooker. Your reservation is completely confirmed. Please find your booking details below:</p>
    
    <table width="100%" cellpadding="12" cellspacing="0" border="0" style="margin: 30px 0; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #f8fafc;">
      <tr>
        <td style="border-bottom: 1px solid #e2e8f0;"><strong style="color:#475569;">Tour:</strong></td>
        <td style="border-bottom: 1px solid #e2e8f0; text-align: right;">${tourTitle}</td>
      </tr>
      <tr>
        <td style="border-bottom: 1px solid #e2e8f0;"><strong style="color:#475569;">Date:</strong></td>
        <td style="border-bottom: 1px solid #e2e8f0; text-align: right;">${new Date(bookingDate).toLocaleDateString()}</td>
      </tr>
      <tr>
        <td style="border-bottom: 1px solid #e2e8f0;"><strong style="color:#475569;">Slots:</strong></td>
        <td style="border-bottom: 1px solid #e2e8f0; text-align: right;">${slotsBooked}</td>
      </tr>
      <tr>
        <td style="border-bottom: 1px solid #e2e8f0;"><strong style="color:#475569;">Total Paid:</strong></td>
        <td style="border-bottom: 1px solid #e2e8f0; text-align: right; color: #aa3bff; font-weight: bold;">₹${totalPrice}</td>
      </tr>
      <tr>
        <td><strong style="color:#475569;">Reference ID:</strong></td>
        <td style="text-align: right; font-family: monospace; color: #64748b;">${paymentIntentId}</td>
      </tr>
    </table>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${CLIENT_URL}/my-bookings" style="display: inline-block; background-color: #aa3bff; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">View My Bookings</a>
    </div>
    
    <p style="background-color: #fffbeb; color: #b45309; padding: 15px; border-radius: 6px; font-size: 14px; text-align: center; margin-bottom: 0;">
      <strong>Note:</strong> Please show this email at the tour meeting point as proof of your booking.
    </p>
  `;
  return generateBaseTemplate('Your Booking is Confirmed! 🎉', content);
};

// 2. Booking Cancellation Email
exports.bookingCancellationEmail = ({ userName, tourTitle, bookingDate, totalPrice, refundNote }) => {
  const content = `
    <h2 style="color: #1e293b; margin-top: 0;">Hi ${userName},</h2>
    
    <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="color: #991b1b; margin: 0;">Your booking has been successfully cancelled as requested.</p>
    </div>
    
    <table width="100%" cellpadding="12" cellspacing="0" border="0" style="margin: 30px 0; border: 1px solid #e2e8f0; border-radius: 8px;">
      <tr>
        <td style="border-bottom: 1px solid #e2e8f0;"><strong style="color:#475569;">Tour:</strong></td>
        <td style="border-bottom: 1px solid #e2e8f0; text-align: right;">${tourTitle}</td>
      </tr>
      <tr>
        <td style="border-bottom: 1px solid #e2e8f0;"><strong style="color:#475569;">Date:</strong></td>
        <td style="border-bottom: 1px solid #e2e8f0; text-align: right;">${new Date(bookingDate).toLocaleDateString()}</td>
      </tr>
      <tr>
        <td><strong style="color:#475569;">Amount Paid:</strong></td>
        <td style="text-align: right; color: #aa3bff; font-weight: bold;">₹${totalPrice}</td>
      </tr>
    </table>
    
    <p style="line-height: 1.6; color: #475569;"><strong>Refund Note:</strong> ${refundNote}</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${CLIENT_URL}/tours" style="display: inline-block; background-color: #f1f5f9; color: #334155; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; border: 1px solid #cbd5e1;">Explore More Tours</a>
    </div>
  `;
  return generateBaseTemplate('Booking Cancellation Confirmed', content);
};

// 3. Welcome Email
exports.welcomeEmail = ({ userName, role }) => {
  let roleSpecificContent = '';

  if (role === 'operator') {
    roleSpecificContent = `
      <p style="line-height: 1.6;">As a Tour Operator, you'll be able to host tours and manage bookings on our platform. <strong>Please note:</strong> Your account requires administrative approval before you can start publishing tours.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${CLIENT_URL}/operator/dashboard" style="display: inline-block; background-color: #aa3bff; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">Go to Operator Dashboard</a>
      </div>
    `;
  } else {
    roleSpecificContent = `
      <p style="line-height: 1.6;">We're excited to help you discover and book incredible experiences safely and easily.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${CLIENT_URL}/tours" style="display: inline-block; background-color: #aa3bff; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">Explore Tours</a>
      </div>
    `;
  }

  const content = `
    <div style="text-align: center; margin-bottom: 25px;">
      <span style="font-size: 40px;">👋</span>
    </div>
    <h2 style="color: #1e293b; margin-top: 0; text-align: center;">Welcome to TourBooker, ${userName}!</h2>
    <p style="line-height: 1.6; text-align: center;">We are thrilled to have you join our community.</p>
    ${roleSpecificContent}
  `;
  return generateBaseTemplate('Welcome to TourBooker! 👋', content);
};

// 4. Operator Approved Email
exports.operatorApprovedEmail = ({ operatorName }) => {
  const content = `
    <h2 style="color: #1e293b; margin-top: 0;">Congratulations ${operatorName}!</h2>
    
    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; background-color: #dcfce7; padding: 16px; border-radius: 50%; margin-bottom: 15px;">
        <span style="font-size: 32px;">✅</span>
      </div>
      <h3 style="color: #22c55e; margin: 0; font-size: 20px;">Your Account is Approved</h3>
    </div>
    
    <p style="line-height: 1.6;">Good news! The administrative team has reviewed and approved your operator account.</p>
    <p style="line-height: 1.6;">You can now log in, create your tour itineraries, and publish them to our marketplace to start receiving bookings.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${CLIENT_URL}/operator/dashboard" style="display: inline-block; background-color: #aa3bff; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">Go to Operator Dashboard</a>
    </div>
  `;
  return generateBaseTemplate('Your Operator Account is Approved! ✅', content);
};

// 5. Operator Rejected Email
exports.operatorRejectedEmail = ({ operatorName, reason }) => {
  const content = `
    <h2 style="color: #1e293b; margin-top: 0;">Hello ${operatorName},</h2>
    
    <p style="line-height: 1.6;">Thank you for your interest in becoming a Tour Operator on TourBooker. We have reviewed your application.</p>
    
    <p style="line-height: 1.6;">Unfortunately, we are unable to approve your account at this time.</p>
    
    ${reason ? `
    <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; margin: 20px 0; border-radius: 6px;">
      <strong style="color: #475569; display: block; margin-bottom: 5px;">Reason:</strong>
      <span style="color: #334155;">${reason}</span>
    </div>
    ` : ''}
    
    <p style="line-height: 1.6;">If you believe this was a mistake or you have updated your credentials, please contact our support team.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${CLIENT_URL}/contact" style="display: inline-block; background-color: #f1f5f9; color: #334155; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; border: 1px solid #cbd5e1;">Contact Support</a>
    </div>
  `;
  return generateBaseTemplate('Update on Your Operator Application', content);
};

// 6. Password Reset Email
exports.passwordResetEmail = ({ userName, resetLink }) => {
  const content = `
    <h2 style="color: #1e293b; margin-top: 0;">Hi ${userName},</h2>
    
    <p style="line-height: 1.6;">We received a request to reset the password for your TourBooker account.</p>
    
    <p style="line-height: 1.6;">You can reset your password by clicking the button below:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" style="display: inline-block; background-color: #aa3bff; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">Reset My Password</a>
    </div>
    
    <p style="background-color: #fffbeb; color: #b45309; padding: 15px; border-radius: 6px; font-size: 14px; text-align: center; margin-bottom: 0;">
      <strong>Security Notice:</strong> This link expires in 1 hour. If you didn't request this password reset, ignore this email.
    </p>
  `;
  return generateBaseTemplate('Password Reset Request', content);
};

// 7. New Booking Alert Email (For Operators)
exports.newBookingAlertEmail = ({ operatorName, tourTitle, userName, bookingDate, slotsBooked }) => {
  const content = `
    <h2 style="color: #1e293b; margin-top: 0;">Hello ${operatorName},</h2>
    
    <p style="line-height: 1.6;">Great news! You just received a new confirmed booking for your tour.</p>
    
    <table width="100%" cellpadding="12" cellspacing="0" border="0" style="margin: 30px 0; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #f8fafc;">
      <tr>
        <td style="border-bottom: 1px solid #e2e8f0;"><strong style="color:#475569;">Tour:</strong></td>
        <td style="border-bottom: 1px solid #e2e8f0; text-align: right; color: #aa3bff; font-weight: bold;">${tourTitle}</td>
      </tr>
      <tr>
        <td style="border-bottom: 1px solid #e2e8f0;"><strong style="color:#475569;">Customer Name:</strong></td>
        <td style="border-bottom: 1px solid #e2e8f0; text-align: right;">${userName}</td>
      </tr>
      <tr>
        <td style="border-bottom: 1px solid #e2e8f0;"><strong style="color:#475569;">Date of Tour:</strong></td>
        <td style="border-bottom: 1px solid #e2e8f0; text-align: right;">${new Date(bookingDate).toLocaleDateString()}</td>
      </tr>
      <tr>
        <td><strong style="color:#475569;">Travelers:</strong></td>
        <td style="text-align: right;">${slotsBooked}</td>
      </tr>
    </table>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${CLIENT_URL}/operator/bookings" style="display: inline-block; background-color: #aa3bff; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">Manage Bookings</a>
    </div>
  `;
  // Using backticks here strictly because of the template literal inside the function return statement below
  return generateBaseTemplate(`New Booking Received for ${tourTitle}`, content);
};
