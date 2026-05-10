const express = require('express');
const router = express.Router();
const ShiftChange = require('../models/ShiftChange');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const shiftChanges = await ShiftChange.find()
      .populate('workerId', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, shiftChanges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/my', protect, async (req, res) => {
  try {
    const shiftChanges = await ShiftChange.find({ workerId: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ success: true, shiftChanges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const shiftChange = new ShiftChange({
      ...req.body,
      workerId: req.user.id,
      status: 'pending'
    });
    await shiftChange.save();
    res.status(201).json({ success: true, shiftChange });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const shiftChange = await ShiftChange.findByIdAndUpdate(
      req.params.id,
      { ...req.body, approvedAt: req.body.status === 'approved' ? new Date() : null },
      { new: true }
    );
    res.json({ success: true, shiftChange });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
