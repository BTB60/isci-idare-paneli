const express = require('express');
const router = express.Router();
const Penalty = require('../models/Penalty');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const penalties = await Penalty.find()
      .populate('workerId', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, penalties });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/my', protect, async (req, res) => {
  try {
    const penalties = await Penalty.find({ workerId: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ success: true, penalties });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const penalty = new Penalty({
      ...req.body,
      status: 'active'
    });
    await penalty.save();
    res.status(201).json({ success: true, penalty });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const penalty = await Penalty.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, penalty });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Penalty.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Penalty deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
