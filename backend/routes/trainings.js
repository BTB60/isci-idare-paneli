const express = require('express');
const router = express.Router();
const Training = require('../models/Training');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const trainings = await Training.find()
      .populate('participants', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, trainings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/my', protect, async (req, res) => {
  try {
    const trainings = await Training.find({ participants: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ success: true, trainings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const training = new Training(req.body);
    await training.save();
    res.status(201).json({ success: true, training });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const training = await Training.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, training });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await Training.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Training deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
