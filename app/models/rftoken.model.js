const mongoose = require('mongoose');

const { Schema } = mongoose;

const refreshTokenSchema = new Schema({
  rftoken_id: {
    type: String,
    index: true,
    required: true,
    auto: true,
  },
  refresh_token: {
    type: String,
    required: [true, 'refresh_token not provided.'],
  },
  user_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
  },
});

module.exports = mongoose.model('RF_Token', refreshTokenSchema);
