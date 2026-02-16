const express = require("express");
const router = express.Router();

router.post("/mock", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, message: "Amount required" });
    }

    const paymentId =
      "MOCK_" + Math.random().toString(36).substr(2, 9).toUpperCase();

    res.json({
      success: true,
      paymentId,
      amount,
      status: "paid"
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Mock payment failed" });
  }
});

module.exports = router;
