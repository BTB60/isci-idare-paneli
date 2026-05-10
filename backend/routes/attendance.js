const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/attendance
// @desc    Get all attendance records
// @access  Private (Admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { workerId, date, startDate, endDate, status } = req.query;
    
    let query = {};
    
    if (workerId) query.worker = workerId;
    if (date) query.date = date;
    if (status) query.status = status;
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(query)
      .populate('worker', 'firstName lastName username position')
      .sort({ date: -1, createdAt: -1 });

    res.json({
      success: true,
      count: attendance.length,
      attendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/attendance/today
// @desc    Get today's attendance
// @access  Private
router.get('/today', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const attendance = await Attendance.find({ date: today })
      .populate('worker', 'firstName lastName username position')
      .sort({ createdAt: -1 });

    // Get all workers
    const workers = await User.find({ role: 'worker', status: 'active' });
    
    // Calculate stats
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const onLeave = attendance.filter(a => a.status === 'leave').length;

    res.json({
      success: true,
      date: today,
      stats: {
        total: workers.length,
        present,
        absent,
        late,
        onLeave,
        notMarked: workers.length - attendance.length
      },
      attendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/attendance
// @desc    Mark attendance
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { workerId, date, status, checkIn, checkOut, note, location } = req.body;

    // Check if attendance already exists
    let attendance = await Attendance.findOne({ worker: workerId, date });
    
    if (attendance) {
      // Update existing
      attendance.status = status;
      if (checkIn) attendance.checkIn = { time: checkIn, method: 'manual' };
      if (checkOut) attendance.checkOut = { time: checkOut, method: 'manual' };
      if (note) attendance.notes = note;
      if (location) attendance.location = location;
      
      await attendance.save();
      
      return res.json({
        success: true,
        message: 'Attendance updated successfully',
        attendance
      });
    }

    // Create new attendance
    attendance = new Attendance({
      worker: workerId,
      date,
      status,
      checkIn: checkIn ? { time: checkIn, method: 'manual' } : undefined,
      checkOut: checkOut ? { time: checkOut, method: 'manual' } : undefined,
      notes: note,
      location
    });

    await attendance.save();

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      attendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/attendance/voice-phrase
// @desc    Bugünkü səs təsdiqi üçün ifadə (işçi panelində göstərilir)
// @access  Private (worker)
router.get('/voice-phrase', protect, async (req, res) => {
  try {
    const landing = req.user.roleLanding || 'worker';
    if (landing !== 'worker') {
      return res.status(403).json({ success: false, message: 'Yalnız işçi paneli üçün (işdə olduğumu təsdiq)' });
    }
    const today = new Date().toISOString().split('T')[0];
    const { phraseForUserDay } = require('../utils/voiceAttendance');
    const phrase = phraseForUserDay(req.user.id || req.user._id, today);
    res.json({
      success: true,
      phrase,
      date: today,
      hints: [
        'Chrome və ya Edge tövsiyə olunur',
        'HTTPS və ya localhost-da mikrofon işləyir'
      ]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/attendance/checkin
// @desc    Worker check-in (method=voice ilə səs mətni təsdiqi)
// @access  Private
router.post('/checkin', protect, async (req, res) => {
  try {
    const { location, method, photo, voiceTranscript } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 5);
    const workerRef = req.user._id || req.user.id;

    const useVoice = method === 'voice';
    let voicePhraseUsed = '';
    if (useVoice) {
      const { phraseForUserDay, transcriptMatchesPhrase } = require('../utils/voiceAttendance');
      voicePhraseUsed = phraseForUserDay(req.user.id || req.user._id, today);
      if (!voiceTranscript || String(voiceTranscript).trim().length < 4) {
        return res.status(400).json({
          success: false,
          message: 'Səs mətni alınmadı. Mikrofon icazəsi və brauzeri yoxlayın.'
        });
      }
      if (!transcriptMatchesPhrase(voiceTranscript, voicePhraseUsed)) {
        return res.status(400).json({
          success: false,
          message:
            'Tanınan mətn gözlənilən ifadə ilə uyğun gəlmir. Cümleni dəqiq təkrarlayın və ya daha sakit mühitdə yenidən cəhd edin.'
        });
      }
    }

    let attendance = await Attendance.findOne({
      worker: workerRef,
      date: today
    });

    if (attendance && attendance.checkIn && attendance.checkIn.time) {
      return res.status(400).json({
        success: false,
        message: 'Bu gün üçün artıq işə başlama qeydiniz var'
      });
    }

    if (!attendance) {
      attendance = new Attendance({
        worker: workerRef,
        date: today,
        status: 'present'
      });
    }

    attendance.checkIn = {
      time: currentTime,
      location,
      method: useVoice ? 'voice' : method || 'web',
      photo,
      voiceTranscript: useVoice ? String(voiceTranscript).trim().slice(0, 800) : undefined,
      voicePhraseUsed: useVoice ? voicePhraseUsed : undefined
    };

    await attendance.save();

    res.json({
      success: true,
      message: useVoice
        ? 'Səs təsdiqi ilə işə başlama qeydə alındı'
        : 'İşə başlama qeydə alındı — bugün üçün günlük məbləğ hesablanır',
      attendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/attendance/checkout
// @desc    Worker check-out
// @access  Private
router.post('/checkout', protect, async (req, res) => {
  try {
    const { location, method, photo } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 5);

    const workerRef = req.user._id || req.user.id;

    let attendance = await Attendance.findOne({
      worker: workerRef,
      date: today
    });

    if (!attendance || !attendance.checkIn || !attendance.checkIn.time) {
      return res.status(400).json({ success: false, message: 'Not checked in yet' });
    }

    if (attendance.checkOut && attendance.checkOut.time) {
      return res.status(400).json({ success: false, message: 'Already checked out today' });
    }

    attendance.checkOut = {
      time: currentTime,
      location,
      method: method || 'web',
      photo
    };

    // Calculate work hours
    if (attendance.checkIn && attendance.checkIn.time) {
      const [inHours, inMinutes] = attendance.checkIn.time.split(':').map(Number);
      const [outHours, outMinutes] = currentTime.split(':').map(Number);
      const totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);
      attendance.workHours = Math.round(totalMinutes / 60 * 100) / 100;
    }

    await attendance.save();

    res.json({
      success: true,
      message: 'İşdən çıxış qeydə alındı',
      attendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/attendance/my
// @desc    Get my attendance records
// @access  Private
router.get('/my/records', protect, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let query = { worker: req.user._id || req.user.id };
    
    if (month && year) {
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = `${year}-${month.padStart(2, '0')}-31`;
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(query).sort({ date: -1 });

    // Calculate stats
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const onLeave = attendance.filter(a => a.status === 'leave').length;
    const totalWorkHours = attendance.reduce((sum, a) => sum + (a.workHours || 0), 0);

    res.json({
      success: true,
      stats: {
        present,
        absent,
        late,
        onLeave,
        totalWorkHours
      },
      attendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
