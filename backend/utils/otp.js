// utils/otp.js
const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  const otpExpiry = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
  return { otp, otpExpiry };

}
export default generateOTP;
