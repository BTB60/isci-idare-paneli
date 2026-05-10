const express = require('express');
const router = express.Router();
const Permission = require('../models/Permission');
const { protect, authorize } = require('../middleware/auth');

// Get all permissions
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;
    
    const permissions = await Permission.find(query)
      .populate('workerId', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, permissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get my permissions
router.get('/my', protect, async (req, res) => {
  try {
    const permissions = await Permission.find({ workerId: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ success: true, permissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create permission request
router.post('/', protect, async (req, res) => {
  try {
    const permission = new Permission({
      ...req.body,
      workerId: req.user.id,
      status: 'pending'
    });
    await permission.save();
    res.status(201).json({ success: true, permission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update permission (approve/reject)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, approvedBy, rejectionReason } = req.body;
    const permission = await Permission.findByIdAndUpdate(
      req.params.id,
      { status, approvedBy, rejectionReason, approvedAt: status === 'approved' ? new Date() : null },
      { new: true }
    );
    res.json({ success: true, permission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
