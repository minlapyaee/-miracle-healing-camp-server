const mongoose = require("mongoose");

const { Schema } = mongoose;

const maintenanceSchema = new Schema({
  status: {
    type: Boolean,
  },
  createdAt: {
    type: Date,
    immutable: true, // it will not let it change anymore
    default: () => Date.now(),
  },
});

module.exports = mongoose.model("Maintenance", maintenanceSchema);
