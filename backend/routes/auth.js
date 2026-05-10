const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Role = require('../models/Role');
const { resolveRoleAssignment } = require('../utils/roles');
const { protect } = require('../middleware/auth');
const { splitDisplayName, baseUsernameFromEmail, assignUniqueUsername } = require('../utils/userHelpers');
const { getJwtSecret } = require('../utils/jwtSecret');

const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_LOGIN_WINDOW_MS || '', 10) || 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_LOGIN_RATE_MAX || '', 10) || (process.env.NODE_ENV === 'production' ? 25 : 150),
  message: {
    success: false,
    message: 'Çox sayda giriş cəhdi. Bir müddət sonra yenidən cəhd edin.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const registerLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_REGISTER_WINDOW_MS || '', 10) || 60 * 60 * 1000,
  max: parseInt(process.env.AUTH_REGISTER_RATE_MAX || '', 10) || (process.env.NODE_ENV === 'production' ? 15 : 80),
  message: {
    success: false,
    message: 'Bu IP-dən çox qeydiyyat cəhdi. Sonra yenidən yoxlayın.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/** Production-da ictimai POST /register yalnız ALLOW_PUBLIC_REGISTER=1 olarsa */
function publicRegisterAllowed(req, res, next) {
  if (process.env.NODE_ENV !== 'production') return next();
  const ok =
    process.env.ALLOW_PUBLIC_REGISTER === '1' || process.env.ALLOW_PUBLIC_REGISTER === 'true';
  if (!ok) {
    return res.status(403).json({
      success: false,
      message: 'İctimi qeydiyyat söndürülüb. Administrator yaradın və ya ALLOW_PUBLIC_REGISTER aktiv edin.'
    });
  }
  next();
}

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  publicRegisterAllowed,
  registerLimiter,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Şifrə ən azı 8 simvol olmalıdır'),
    body('role').notEmpty().withMessage('Role is required')
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, role, phone, position, dailySalary, username: reqUsername } = req.body;
    const roleSlug = String(role || 'worker')
      .trim()
      .toLowerCase();
    const roleDoc = await Role.findOne({ slug: roleSlug, active: true });
    const builtIns = ['admin', 'manager', 'seller', 'cashier', 'worker', 'accountant', 'hr'];
    if (!roleDoc && !builtIns.includes(roleSlug)) {
      return res.status(400).json({ success: false, message: 'Naməlum və ya deaktiv rol' });
    }
    const { firstName, lastName } = splitDisplayName(name);

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    let username = reqUsername && String(reqUsername).trim()
      ? String(reqUsername).trim().slice(0, 30)
      : await assignUniqueUsername(User, baseUsernameFromEmail(email));
    username = await assignUniqueUsername(User, username);

    const { slug, roleLanding, permissions } = await resolveRoleAssignment(roleSlug);

    user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      role: slug,
      roleLanding,
      position: position || 'İşçi',
      dailySalary: dailySalary ?? 0,
      status: 'active',
      permissions,
      emailVerified: true
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      getJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    const json = user.toJSON();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: json.id,
        name: json.name,
        email: json.email,
        role: json.role,
        roleLanding: json.roleLanding,
        position: json.position,
        dailySalary: json.dailySalary
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user (email or username + password)
// @access  Public
router.post('/login', loginLimiter, [
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const identifier = String(req.body.identifier || req.body.email || '').trim();
    const { password } = req.body;
    const requestedRole = req.body.role != null ? String(req.body.role).trim().toLowerCase() : null;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Email və ya istifadəçi adı tələb olunur'
      });
    }

    let user;
    try {
      user = await User.findByCredentials(identifier, password);
    } catch (err) {
      const msg = err.message === 'Account is locked. Please try again later.'
        ? err.message
        : 'Yanlış istifadəçi adı/email və ya şifrə';
      return res.status(400).json({ success: false, message: msg });
    }

    if (requestedRole && requestedRole !== String(user.role).toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Seçdiyiniz rol bu hesabla uyğun gəlmir'
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      getJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    const json = user.toJSON();

    res.json({
      success: true,
      token,
      user: {
        id: json.id,
        name: json.name,
        email: json.email,
        role: json.role,
        roleLanding: json.roleLanding,
        position: json.position,
        dailySalary: json.dailySalary,
        avatar: json.avatar
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const json = user.toJSON();
    res.json({
      success: true,
      user: {
        id: json.id,
        name: json.name,
        email: json.email,
        role: json.role,
        roleLanding: json.roleLanding,
        position: json.position,
        dailySalary: json.dailySalary,
        phone: json.phone,
        avatar: json.avatar,
        status: json.status
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/auth/update-password
// @desc    Update password
// @access  Private
router.put('/update-password', protect, [
  body('currentPassword').exists().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Yeni şifrə ən azı 8 simvol olmalıdır')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
