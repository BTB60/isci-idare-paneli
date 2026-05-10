const express = require('express');
const router = express.Router();
const Overtime = require('../models/Overtime');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const overtime = await Overtime.find()
      .populate('workerId', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, overtime });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/my', protect, async (req, res) => {
  try {
    const overtime = await Overtime.find({ workerId: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ success: true, overtime });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const overtime = new Overtime({
      ...req.body,
      workerId: req.user.id,
      status: 'pending'
    });
    await overtime.save();
    res.status(201).json({ success: true, overtime });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const overtime = await Overtime.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, overtime });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
