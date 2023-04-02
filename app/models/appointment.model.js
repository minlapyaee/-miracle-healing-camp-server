const mongoose = require("mongoose");

const { Schema } = mongoose;

const appointmentSchema = new Schema({
  requested_by: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
  },
  first_name: {
    type: String,
  },
  last_name: {
    type: String,
  },
  dob_day: {
    type: String,
  },
  dob_month: {
    type: String,
  },
  dob_year: {
    type: String,
  },
  gender: {
    type: String,
  },
  phone_number: {
    type: String,
  },
  email: {
    type: String,
  },
  appointment_before: {
    type: String,
  },
  feel_streeed: {
    type: String,
  },
  past_two_weeks: {
    type: String,
  },
  having_hard_time_to_sleep: {
    type: String,
  },
  appointment_time: {
    type: Date,
  },
  appointment_date: {
    type: Date,
  },
  status: {
    type: String
  },
  feedback: {
    type: String,
  },
  createdAt: {
    type: Date,
    immutable: true, // it will not let it change anymore
    default: () => Date.now(),
  },
});

module.exports = mongoose.model("Appointment", appointmentSchema);
