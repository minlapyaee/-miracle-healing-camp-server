const mongoose = require("mongoose");

const { Schema } = mongoose;

const appointmentAudit = new Schema({
  created_by: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
  },
  appointment_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Appointment",
  },
  reason: {
    type: String,
  },
  createdAt: {
    type: Date,
    immutable: true, // it will not let it change anymore
    default: () => Date.now(),
  },
});

module.exports = mongoose.model("apoointmentAudit", appointmentAudit);
