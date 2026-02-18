const mongoose = require("mongoose");

const quotationSchema = new mongoose.Schema({
  quotationId: String,
  fullName: String,
  email: String,
  phone: String,
  companyName: String,
  services: [
    {
      name: String,
      price: Number,
      quantity: Number
    }
  ],
  subtotal: Number,
  gst: Number,
  totalAmount: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Quotation", quotationSchema);
