const express = require('express');
const router = express.Router();
const Salary = require('../models/Salary');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/salary
// @desc    Get all salary records
// @access  Private (Admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { month, year, workerId } = req.query;
    let query = {};
    
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (workerId) query.workerId = workerId;

    const salaries = await Salary.find(query)
      .populate('workerId', 'name position')
      .sort({ year: -1, month: -1 });

    res.json({ success: true, count: salaries.length, salaries });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/salary/my
// @desc    Get my salary records
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = { workerId: req.user.id };
    
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const salaries = await Salary.find(query).sort({ year: -1, month: -1 });
    res.json({ success: true, salaries });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/salary/calculate
// @desc    Calculate salary for a worker
// @access  Private (Admin)
router.post('/calculate', protect, authorize('admin'), async (req, res) => {
  try {
    const { workerId, month, year } = req.body;

    const worker = await User.findById(workerId);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    // Check if salary already exists
    let salary = await Salary.findOne({ workerId, month, year });
    
    if (salary) {
      return res.status(400).json({ success: false, message: 'Salary already calculated for this month' });
    }

    // Calculate salary (simplified - you can expand this)
    const baseSalary = worker.monthlySalary || (worker.dailySalary * (worker.workDaysPerMonth || 30));
    
    salary = new Salary({
      workerId,
      month,
      year,
      baseSalary,
      workDays: 0, // Calculate from attendance
      overtimePay: 0,
      bonuses: [],
      penalties: [],
      deductions: [],
      grossSalary: baseSalary,
      netSalary: baseSalary
    });

    await salary.save();

    res.status(201).json({ success: true, salary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
