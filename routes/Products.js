const express = require("express");
const {
  createProduct,
  fetchAllProducts,
  fetchProductById,
  updateProduct,
} = require("../controllers/Product");
const productModel = require("../models/Product");

const router = express.Router();

router.get("/", fetchAllProducts);
router.post("/", createProduct);

router.get("/:id", fetchProductById);

router.patch("/:id", updateProduct);

// to add discountedPrice to products of mongoDb database

router.get("/update/test", async (req, res) => {
  const products = await productModel.find({});
  for (let product of products) {
    product.discountedPrice = Math.round(
      Number(product.price) -
        Number(product.price) * (Number(product.discountPercentage) / 100)
    );
    await product.save();
    console.log(product.title + " updated " + product.discountedPrice);
  }
  res.send("ok");
});

module.exports = router;
