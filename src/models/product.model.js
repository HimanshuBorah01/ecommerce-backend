import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
    },
    stock: {
      type: Number,
      required: [true, "Product stock is required"],
      default: 0,
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
      trim: true,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        fileId: {
          type: String,
          required: true,
        },
      },
    ],
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const productModel = mongoose.model("Product", productSchema);

export default productModel;
