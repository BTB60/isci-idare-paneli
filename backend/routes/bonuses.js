const express = require('express');
const router = express.Router();
const Bonus = require('../models/Bonus');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const bonuses = await Bonus.find()
      .populate('workerId', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, bonuses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/my', protect, async (req, res) => {
  try {
    const bonuses = await Bonus.find({ workerId: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ success: true, bonuses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const bonus = new Bonus(req.body);
    await bonus.save();
    res.status(201).json({ success: true, bonus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const bonus = await Bonus.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, bonus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Bonus.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Bonus deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
