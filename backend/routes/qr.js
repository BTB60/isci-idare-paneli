const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Generate QR code for worker attendance
router.get('/worker/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const worker = await User.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    const qrData = JSON.stringify({
      workerId: worker._id,
      name: worker.name,
      timestamp: new Date().toISOString(),
      type: 'attendance'
    });

    const qrCode = await QRCode.toDataURL(qrData);
    
    res.json({
      success: true,
      qrCode,
      worker: {
        id: worker._id,
        name: worker.name
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Scan QR code (check-in)
router.post('/scan', protect, async (req, res) => {
  try {
    const { qrData, location } = req.body;
    const data = JSON.parse(qrData);
    
    // Verify the QR data
    if (data.type !== 'attendance' || !data.workerId) {
      return res.status(400).json({ success: false, message: 'Invalid QR code' });
    }

    // Here you would mark attendance
    // This is handled by the attendance route
    res.json({
      success: true,
      message: 'QR code scanned successfully',
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
