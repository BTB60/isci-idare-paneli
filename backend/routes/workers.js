const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Role = require('../models/Role');
const { resolveRoleAssignment } = require('../utils/roles');
const { protect, authorize } = require('../middleware/auth');
const { splitDisplayName, baseUsernameFromEmail, assignUniqueUsername } = require('../utils/userHelpers');

// @route   GET /api/workers
// @desc    List workers (admin: all; others: worker+seller only)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { role, status, position, search } = req.query;

    let query = {};

    if (req.user.role !== 'admin') {
      if (role) {
        query.role = role;
      } else {
        query.roleLanding = { $in: ['worker', 'seller'] };
      }
    } else if (role) {
      query.role = role;
    }

    if (status) query.status = status;
    if (position) query.position = position;

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }

    const workers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    const mapped = workers.map((w) => w.toJSON());

    res.json({
      success: true,
      count: mapped.length,
      workers: mapped
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/workers/stats/overview
router.get('/stats/overview', protect, authorize('admin'), async (req, res) => {
  try {
    const totalWorkers = await User.countDocuments({ roleLanding: 'worker' });
    const activeWorkers = await User.countDocuments({ roleLanding: 'worker', status: 'active' });
    const inactiveWorkers = await User.countDocuments({ roleLanding: 'worker', status: 'inactive' });
    const sellerDesk = await User.countDocuments({ roleLanding: 'seller' });

    res.json({
      success: true,
      stats: {
        totalWorkers,
        activeWorkers,
        inactiveWorkers,
        sellers: sellerDesk,
        cashiers: sellerDesk
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/workers/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const worker = await User.findById(req.params.id).select('-password');

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    if (req.user.role !== 'admin') {
      const okLanding = ['worker', 'seller'].includes(worker.roleLanding || '');
      if (!okLanding) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    res.json({
      success: true,
      worker: worker.toJSON()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/workers
router.post('/', protect, authorize('admin'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').notEmpty().withMessage('Role is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      name,
      email,
      password,
      role,
      phone,
      position,
      dailySalary,
      monthlySalary,
      workDaysPerMonth,
      emergencyContact,
      address,
      idNumber,
      username: reqUsername
    } = req.body;

    const roleSlug = String(role || 'worker')
      .trim()
      .toLowerCase();

    const roleDoc = await Role.findOne({ slug: roleSlug, active: true });
    const builtIns = ['admin', 'manager', 'seller', 'cashier', 'worker', 'accountant', 'hr'];
    if (!roleDoc && !builtIns.includes(roleSlug)) {
      return res.status(400).json({
        success: false,
        message: 'Naməlum və ya deaktiv rol — əvvəl “Rollar” səhifəsində yaradın və ya mövcud slug seçin'
      });
    }

    const { slug, roleLanding, permissions } = await resolveRoleAssignment(roleSlug);

    const { firstName, lastName } = splitDisplayName(name);

    let existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Worker with this email already exists' });
    }

    let username = reqUsername && String(reqUsername).trim()
      ? String(reqUsername).trim().slice(0, 30)
      : await assignUniqueUsername(User, baseUsernameFromEmail(email));
    username = await assignUniqueUsername(User, username);

    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      role: slug,
      roleLanding,
      phone,
      position: position || 'İşçi',
      dailySalary: dailySalary ?? 0,
      monthlySalary,
      workDaysPerMonth,
      emergencyContact,
      address,
      idNumber,
      status: 'active',
      permissions,
      emailVerified: true
    });

    await user.save();

    res.status(201).json({
      success: true,
      worker: user.toJSON()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/workers/:id
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      position,
      dailySalary,
      monthlySalary,
      workDaysPerMonth,
      emergencyContact,
      address,
      idNumber,
      status,
      role,
      username: reqUsername
    } = req.body;

    let worker = await User.findById(req.params.id);

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    if (name) {
      const { firstName, lastName } = splitDisplayName(name);
      worker.firstName = firstName;
      worker.lastName = lastName;
    }
    if (email) worker.email = email;
    if (phone !== undefined) worker.phone = phone;
    if (position) worker.position = position;
    if (dailySalary !== undefined) worker.dailySalary = dailySalary;
    if (monthlySalary !== undefined) worker.monthlySalary = monthlySalary;
    if (workDaysPerMonth !== undefined) worker.workDaysPerMonth = workDaysPerMonth;
    if (emergencyContact) worker.emergencyContact = emergencyContact;
    if (address) worker.address = address;
    if (idNumber !== undefined) worker.idNumber = idNumber;
    if (status) worker.status = status;
    if (role) {
      const roleSlug = String(role).trim().toLowerCase();
      const roleDoc = await Role.findOne({ slug: roleSlug, active: true });
      const builtIns = ['admin', 'manager', 'seller', 'cashier', 'worker', 'accountant', 'hr'];
      if (!roleDoc && !builtIns.includes(roleSlug)) {
        return res.status(400).json({
          success: false,
          message: 'Naməlum və ya deaktiv rol'
        });
      }
      const resolved = await resolveRoleAssignment(roleSlug);
      worker.role = resolved.slug;
      worker.roleLanding = resolved.roleLanding;
      worker.permissions = resolved.permissions;
    }

    if (reqUsername && String(reqUsername).trim()) {
      const nu = String(reqUsername).trim().slice(0, 30);
      const clash = await User.findOne({ username: nu, _id: { $ne: worker._id } });
      if (!clash) {
        worker.username = nu;
      }
    }

    await worker.save();

    res.json({
      success: true,
      worker: worker.toJSON()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/workers/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const worker = await User.findById(req.params.id);

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    await worker.deleteOne();

    res.json({
      success: true,
      message: 'Worker deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
