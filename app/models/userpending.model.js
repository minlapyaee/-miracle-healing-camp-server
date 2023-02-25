const mongoose = require("mongoose");

const { Schema } = mongoose;

const userPendingSchema = new Schema({
  fullname: {
    type: String,
    required: [true, "fullname not provided."],
  },
  email: {
    type: String,
    unique: [true, "email already exists in database!"],
    lowercase: true,
    trim: true,
    required: [true, "email not provided"],
    validate: {
      validator(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: "{VALUE} is not a valid email!",
    },
  },
  password: {
    type: String,
    required: true,
    minlength: [6, "Minimum password length is 6 characters"],
  },
  otp_code: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "client",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("UserPending", userPendingSchema);
