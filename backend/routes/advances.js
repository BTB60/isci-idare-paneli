const express = require('express');
const router = express.Router();
const Advance = require('../models/Advance');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const advances = await Advance.find()
      .populate('workerId', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, advances });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/my', protect, async (req, res) => {
  try {
    const advances = await Advance.find({ workerId: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ success: true, advances });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const advance = new Advance({
      ...req.body,
      workerId: req.user.id,
      status: 'pending'
    });
    await advance.save();
    res.status(201).json({ success: true, advance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const advance = await Advance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, advance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
