const mongoose = require("mongoose");

const { Schema } = mongoose;

const appointmentSchema = new Schema({
  requested_by: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
  },
  requested_to: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
  },
  date: {
    type: Date,
  },
  time: {
    type: Date,
  },
  createdAt: {
    type: Date,
    immutable: true, // it will not let it change anymore
    default: () => Date.now(),
  },
});

module.exports = mongoose.model("Appointment", appointmentSchema);
