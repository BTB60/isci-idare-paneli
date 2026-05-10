const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Task = require('../models/Task');
const Permission = require('../models/Permission');
const ShiftChange = require('../models/ShiftChange');
const { protect, authorize } = require('../middleware/auth');

function displayUserName(u) {
  if (!u) return 'Unknown';
  if (typeof u.name === 'string' && u.name) return u.name;
  const fn = u.firstName || '';
  const ln = u.lastName || '';
  const full = `${fn} ${ln}`.trim();
  return full || u.username || u.email || 'Unknown';
}

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private (Admin)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Worker stats
    const totalWorkers = await User.countDocuments({ role: 'worker' });
    const activeWorkers = await User.countDocuments({ role: 'worker', status: 'active' });

    // Today's attendance
    const todayAttendance = await Attendance.find({ date: today });
    const presentToday = todayAttendance.filter(a => a.status === 'present').length;
    const absentToday = todayAttendance.filter(a => a.status === 'absent').length;
    const lateToday = todayAttendance.filter(a => a.status === 'late').length;

    // Pending requests
    const pendingPermissions = await Permission.countDocuments({ status: 'pending' });
    const pendingShiftChanges = await ShiftChange.countDocuments({ status: 'pending' });

    // Tasks
    const totalTasks = await Task.countDocuments();
    const pendingTasks = await Task.countDocuments({ status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ status: 'in-progress' });
    const completedTasks = await Task.countDocuments({ status: 'completed' });

    res.json({
      success: true,
      stats: {
        workers: {
          total: totalWorkers,
          active: activeWorkers,
          inactive: totalWorkers - activeWorkers
        },
        attendance: {
          today: {
            present: presentToday,
            absent: absentToday,
            late: lateToday,
            notMarked: activeWorkers - todayAttendance.length
          }
        },
        pendingRequests: {
          permissions: pendingPermissions,
          shiftChanges: pendingShiftChanges,
          total: pendingPermissions + pendingShiftChanges
        },
        tasks: {
          total: totalTasks,
          pending: pendingTasks,
          inProgress: inProgressTasks,
          completed: completedTasks
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/dashboard/recent-activities
// @desc    Get recent activities
// @access  Private (Admin)
router.get('/recent-activities', protect, authorize('admin'), async (req, res) => {
  try {
    // Get recent attendance
    const recentAttendance = await Attendance.find()
      .populate('workerId', 'firstName lastName username email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent tasks
    const recentTasks = await Task.find()
      .populate('assignedTo', 'firstName lastName username email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Combine and format activities
    const activities = [
      ...recentAttendance.map(a => ({
        type: 'attendance',
        description: `${displayUserName(a.workerId)} marked ${a.status}`,
        date: a.createdAt
      })),
      ...recentTasks.map(t => ({
        type: 'task',
        description: `Task "${t.title}" ${t.status}`,
        date: t.createdAt
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    res.json({
      success: true,
      activities
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/dashboard/top-workers
// @desc    Get top performing workers
// @access  Private (Admin)
router.get('/top-workers', protect, authorize('admin'), async (req, res) => {
  try {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`;

    // Get all workers
    const workers = await User.find({ roleLanding: 'worker', status: 'active' });

    // Get attendance for each worker
    const workerStats = await Promise.all(
      workers.map(async (worker) => {
        const attendance = await Attendance.find({
          workerId: worker._id,
          date: { $gte: startDate, $lte: endDate }
        });

        const present = attendance.filter(a => a.status === 'present').length;
        const late = attendance.filter(a => a.status === 'late').length;
        const totalWorkHours = attendance.reduce((sum, a) => sum + (a.workHours || 0), 0);

        // Calculate efficiency (simple formula)
        const efficiency = attendance.length > 0 
          ? Math.round(((present + (late * 0.5)) / attendance.length) * 100)
          : 0;

        return {
          id: worker._id,
          name: worker.name,
          position: worker.position,
          present,
          late,
          totalWorkHours: Math.round(totalWorkHours * 10) / 10,
          efficiency
        };
      })
    );

    // Sort by efficiency and get top 5
    const topWorkers = workerStats
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 5);

    res.json({
      success: true,
      topWorkers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/dashboard/worker
// @desc    Get worker dashboard data
// @access  Private (Worker)
router.get('/worker', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Today's attendance
    const todayAttendance = await Attendance.findOne({
      workerId: req.user.id,
      date: today
    });

    // Monthly attendance stats
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`;

    const monthlyAttendance = await Attendance.find({
      workerId: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    });

    const present = monthlyAttendance.filter(a => a.status === 'present').length;
    const absent = monthlyAttendance.filter(a => a.status === 'absent').length;
    const late = monthlyAttendance.filter(a => a.status === 'late').length;
    const totalWorkHours = monthlyAttendance.reduce((sum, a) => sum + (a.workHours || 0), 0);

    // My tasks
    const myTasks = await Task.find({ assignedTo: req.user.id });
    const pendingTasks = myTasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = myTasks.filter(t => t.status === 'in-progress').length;
    const completedTasks = myTasks.filter(t => t.status === 'completed').length;

    // Pending requests
    const pendingPermissions = await Permission.countDocuments({
      workerId: req.user.id,
      status: 'pending'
    });

    const pendingShiftChanges = await ShiftChange.countDocuments({
      workerId: req.user.id,
      status: 'pending'
    });

    res.json({
      success: true,
      today: {
        checkedIn: todayAttendance?.checkIn?.time || null,
        checkedOut: todayAttendance?.checkOut?.time || null,
        status: todayAttendance?.status || 'not-marked'
      },
      monthlyStats: {
        present,
        absent,
        late,
        totalWorkHours: Math.round(totalWorkHours * 10) / 10
      },
      tasks: {
        total: myTasks.length,
        pending: pendingTasks,
        inProgress: inProgressTasks,
        completed: completedTasks
      },
      pendingRequests: {
        permissions: pendingPermissions,
        shiftChanges: pendingShiftChanges
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
