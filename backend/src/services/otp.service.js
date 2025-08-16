import OTP from '../models/otp.model.js';
import config from '../config/config.js';


const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  
  return otp;
};

const createOTP = async (email, type, expiryMinutes = 10) => {
  // Invalidate previous OTPs for this email and type
  await OTP.updateMany(
    { email, type, isUsed: false },
    { $set: { isUsed: true } }
  );

  const otp = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

  const otpDoc = await OTP.create({
    email,
    otp,
    type,
    expiresAt,
  });

  return otpDoc;
};

const sendOTP = async (email, type = 'verification') => {
  const otpDoc = await createOTP(email, type);
  
  // In production, you would send an actual email here
  if (config.env === 'production') {
    await sendEmail({
      to: email,
      subject: `Your OTP for ${type}`,
      text: `Your OTP is ${otpDoc.otp}. It will expire in 10 minutes.`,
      html: `
        <div>
          <h2>Your Verification Code</h2>
          <p>Your OTP is: <strong>${otpDoc.otp}</strong></p>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    });
  } else {
    // In development, log the OTP to console
    console.log(`OTP for ${email} (${type}): ${otpDoc.otp}`);
  }

  return otpDoc;
};

const verifyOTP = async (email, otp, type) => {
  const otpDoc = await OTP.findValidOtp(email, otp, type);
  
  if (!otpDoc) {
    return false;
  }
  
  // Mark OTP as used
  otpDoc.isUsed = true;
  await otpDoc.save();
  
  return true;
};

export default {
  generateOTP,
  createOTP,
  sendOTP,
  verifyOTP,
};
