const mongoose = require("mongoose");

const { Schema } = mongoose;

const customerAudit = new Schema({
  created_by: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
  },
  customer_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Customer",
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

module.exports = mongoose.model("CustomerAudit", customerAudit);
