const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin', 'seller'), async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate('sellerId', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/my', protect, authorize('seller'), async (req, res) => {
  try {
    const sales = await Sale.find({ sellerId: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ success: true, sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, authorize('seller'), async (req, res) => {
  try {
    const sale = new Sale({
      ...req.body,
      sellerId: req.user.id
    });
    await sale.save();
    res.status(201).json({ success: true, sale });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, sale });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
