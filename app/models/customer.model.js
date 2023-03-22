const mongoose = require("mongoose");

const { Schema } = mongoose;

const customerSchema = new Schema({
  created_by: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
  },
  status: {
    type: String, // Pending, Verified, Expired
  },
  image: {
    type: String,
  },
  createdAt: {
    type: Date,
    immutable: true, // it will not let it change anymore
    default: () => Date.now(),
  },
});

module.exports = mongoose.model("Customer", customerSchema);
