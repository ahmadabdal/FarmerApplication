import mongoose from "mongoose";


const userSchema = new mongoose.Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    education: { type: String },
    email: { type: String },        
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    state: { type: String },
    district: { type: String },
    placeName: { type: String },

    // Existing fields
    mobile: { type: String, required: true, unique: true },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
