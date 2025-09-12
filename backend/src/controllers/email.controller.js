import nodemailer from 'nodemailer';

export const sendEmail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No PDF file uploaded',
      });
    }

    const { email } = req.body;
    const pdfFile = req.file;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email format',
      });
    }


    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST ,
      port: process.env.EMAIL_PORT ,
      secure: false, 
      auth: {
        user: process.env.EMAIL_USER ,
        pass: process.env.EMAIL_PASS ,
      },
    });

    // Convert the file buffer to base64
    const fileContent = pdfFile.buffer.toString('base64');

    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const mailOptions = {
      from: `"Insurance Analytics" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your Insurance Analytics Report - ${currentDate}`,
      text: `Insurance Analytics Report - ${currentDate}\n\nHello,\n\nPlease find attached your requested insurance analytics report.\n\nIf you have any questions, feel free to contact our support team.\n\nBest regards,\nInsurance Analytics Team`,
      attachments: [
        {
          filename: pdfFile.originalname || `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`,
          content: fileContent,
          encoding: 'base64',
          contentType: 'application/pdf'
        }
      ],
      html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Insurance Analytics Report</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
          body { font-family: 'Roboto', Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1976d2; padding: 25px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 500; }
          .content { padding: 30px 20px; background-color: #f9f9f9; }
          .footer { background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666666; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #1976d2;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 500;
            margin: 15px 0;
          }
          .report-details {
            background: #ffffff;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          .divider {
            height: 1px;
            background-color: #e0e0e0;
            margin: 25px 0;
          }
        </style>
      </head>
      <body style="font-family: 'Roboto', Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0;">
        <div class="container" style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div class="header" style="background-color: #1976d2; padding: 25px 20px; text-align: center; border-radius: 6px 6px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 500;">Insurance Analytics Report</h1>
          </div>
          
          <!-- Content -->
          <div class="content" style="padding: 30px 20px; background-color: #f9f9f9;">
            <p>Hello,</p>
            <p>Your requested insurance analytics report is ready for review. The report includes comprehensive insights and analysis of your insurance data as of ${currentDate}.</p>
            
            <div class="report-details" style="background: #ffffff; border-radius: 6px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <h3 style="margin-top: 0; color: #1976d2;">Report Details</h3>
              <p><strong>Date Generated:</strong> ${currentDate}</p>
              <p><strong>Report Type:</strong> Comprehensive Analytics</p>
              <p><strong>File Name:</strong> ${pdfFile.originalname || 'analytics-report.pdf'}</p>
            </div>
            
            <p>You can find the complete report attached to this email in PDF format.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" class="button" style="display: inline-block; padding: 12px 24px; background-color: #1976d2; color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: 500; margin: 15px 0;">View in Browser</a>
              <p style="font-size: 12px; color: #666666; margin-top: 10px;">Note: The button above will open the report in a new tab if your email client supports it.</p>
            </div>
            
            <div class="divider" style="height: 1px; background-color: #e0e0e0; margin: 25px 0;"></div>
            
            <p>If you have any questions or need further assistance, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>The Insurance Analytics Team</p>
          </div>
          
          <!-- Footer -->
          <div class="footer" style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666666; border-radius: 0 0 6px 6px;">
            <p>© ${new Date().getFullYear()} Insurance Analytics. All rights reserved.</p>
            <p style="margin: 5px 0 0 0; font-size: 11px; color: #999999;">This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>`
    };

    const info = await transporter.sendMail(mailOptions);

    // Only log the preview URL in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }

    res.status(200).json({
      status: 'success',
      message: 'Email sent successfully',
      previewUrl: process.env.NODE_ENV !== 'production' ? nodemailer.getTestMessageUrl(info) : null,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default {
  sendEmail,
};
