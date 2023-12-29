const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const paymentMethods = {
  values: ["cash", "card"],
  message: "enum validator failed for Payment Methods",
};

const orderSchema = new Schema(
  {
    items: {
      type: [Schema.Types.Mixed],
      required: true,
    },
    totalAmount: {
      type: Number,
    },
    totalItems: {
      type: Number,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: paymentMethods,
    },
    paymentStatus: {
      type: String,
      default: "pending",
    },
    status: {
      type: String,
      default: "pending",
    },
    selectedAddress: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

const virtual = orderSchema.virtual("id");
virtual.get(function () {
  return this._id;
});
orderSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  },
});

const orderModel = model("Order", orderSchema);

module.exports = orderModel;
