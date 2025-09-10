import express from 'express';


const router = express.Router();
import OTP from '../models/otp.js';
import User from '../models/user.js';
import generateOTP from '../utils/otp.js';


router.get("/test", (req, res) => {
  res.json({ message: "Auth route working" });
});

router.post('/send-otp', async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) {
    return res.status(400).json({ message: 'Mobile number is required' });
  }

  const { otp, otpExpiry } = generateOTP();

  try {
    let otpEntry = await OTP.findOne({ mobile });
    if (otpEntry) {
      otpEntry.otp = otp;
      otpEntry.otpExpiry = otpExpiry;
    } else {
      otpEntry = new OTP({ mobile, otp, otpExpiry });
    }
    await otpEntry.save();

    // Here you would integrate with an SMS service to send the OTP
    console.log(`Sending OTP ${otp} to mobile ${mobile}`);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/verify-otp', async (req, res) => {
    const { mobile, otp } = req.body; 
    if (!mobile || !otp) {
      return res.status(400).json({ message: 'Mobile number and OTP are required' });
    }
  
    try {
      const otpEntry = await OTP.findOne({ mobile });
      if (!otpEntry) {
        return res.status(400).json({ message: 'No OTP request found for this mobile number' });
      }
  
      if (otpEntry.otp !== parseInt(otp, 10)) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }
  
      if (otpEntry.otpExpiry < Date.now()) {
        return res.status(400).json({ message: 'OTP has expired' });
      }
  
      let user = await User.findOne({ mobile });
      if (!user) {
        user = new User({ mobile });
        await user.save();
      }
  
      await OTP.deleteOne({ mobile });
  
      res.json({ message: 'OTP verified successfully', userId: user._id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
export default router;  
 