const express = require("express");
const {
  fetchOrderByUser,
  createOrder,
  updateOrder,
  deleteOrder,
  fetchAllOrders,
  fetchOrderById
} = require("../controllers/Order");

const router = express.Router();

router.get("/own/", fetchOrderByUser);
router.get("/", fetchAllOrders);
router.get("/:id", fetchOrderById);
router.post("/", createOrder);
router.patch("/:id", updateOrder);
router.delete("/:id", deleteOrder);

module.exports = router;
