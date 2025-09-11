import express from "express";

const router = express.Router();
import OTP from "../models/otp.js";
import User from "../models/user.js";
import generateOTP from "../utils/otp.js";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

router.get("/test", (req, res) => {
  res.json({ message: "Auth route working" });
});

router.post("/send-otp", async (req, res) => {
  const { mobile, deviceId } = req.body;

  console.log("Incoming body:", req.body); // optional debug
  console.log('Twilio From number:', process.env.TWILIO_PHONE_NUMBER);


  if (!mobile || !deviceId) {
    return res
      .status(400)
      .json({ message: "Mobile number and deviceId are required" });
  }
  const { otp, otpExpiry } = generateOTP();

  try {
    let otpEntry = await OTP.findOne({ mobile });
    if (otpEntry) {
      otpEntry.otp = otp;
      otpEntry.otpExpiry = otpExpiry;
      otpEntry.deviceId = deviceId;
    } else {
      otpEntry = new OTP({ mobile, otp, otpExpiry, deviceId });
    }
    await otpEntry.save();

    // ✅ Send SMS via Twilio
    await client.messages.create({
      body: `Hi! Your FarmerApp verification code is ${otp}. It will expire in 5 minutes.`,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      to: `+91${mobile}`,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Server error" });
  }
});
// routes/auth.js
router.post("/verify-otp", async (req, res) => {
  const { mobile, otp } = req.body;
  if (!mobile || !otp) {
    return res.status(400).json({ message: "Mobile number and OTP are required" });
  }

  try {
    const otpEntry = await OTP.findOne({ mobile });
    if (!otpEntry) {
      return res.status(400).json({ message: "No OTP request found for this mobile number" });
    }

    if (otpEntry.otp !== parseInt(otp, 10)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (otpEntry.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Find or create user
    let user = await User.findOne({ mobile });
    if (!user) {
      user = new User({ mobile, isVerified: true });
      await user.save();
    } else {
      user.isVerified = true;
      await user.save();
    }

    await OTP.deleteOne({ mobile });

    // Determine if profile is complete
    const profileComplete = !!(
      user.firstName &&
      user.lastName &&
      user.education &&
      user.email &&
      user.gender &&
      user.state &&
      user.district &&
      user.placeName
    );

    res.json({
      message: "OTP verified successfully",
      userId: user._id,
      profileComplete   // <-- key flag for frontend
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// routes/auth.js
router.post("/register", async (req, res) => {
  const {
    userId,
    firstName,
    lastName,
    education,
    email,
    gender,
    state,
    district,
    placeName,
  } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.firstName = firstName;
    user.lastName = lastName;
    user.education = education;
    user.email = email;
    user.gender = gender;
    user.state = state;
    user.district = district;
    user.placeName = placeName;
    user.isVerified = true;

    await user.save();
    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
