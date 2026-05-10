const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Role = require('../models/Role');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { ALLOWED_PERMISSIONS } = require('../constants/permissions');

/** DB əlçatmaz və ya boş olanda giriş üçün əsas roller */
const LOGIN_FALLBACK_ROLES = [
  { slug: 'admin', label: 'Administrator', landing: 'admin' },
  { slug: 'seller', label: 'Satıcı', landing: 'seller' },
  { slug: 'cashier', label: 'Kassir', landing: 'seller' },
  { slug: 'worker', label: 'İşçi / Fəhlə', landing: 'worker' },
  { slug: 'manager', label: 'Menecer', landing: 'worker' },
  { slug: 'accountant', label: 'Mühasib', landing: 'worker' },
  { slug: 'hr', label: 'İnsan resursları (HR)', landing: 'worker' }
];

/** İcazə siyahısı — rol formu üçün */
router.get('/permission-keys', protect, authorize('admin'), (req, res) => {
  res.json({ success: true, permissions: ALLOWED_PERMISSIONS });
});

/** Giriş səhifəsi üçün aktiv rollar (icazəsiz) */
router.get('/login-options', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        success: true,
        roles: LOGIN_FALLBACK_ROLES,
        fallback: true
      });
    }

    const roles = await Role.find({ active: true }).sort({ label: 1 }).select('slug label landing').lean();
    const mapped = roles.map((r) => ({
      slug: r.slug,
      label: r.label,
      landing: r.landing
    }));

    if (!mapped.length) {
      return res.json({
        success: true,
        roles: LOGIN_FALLBACK_ROLES,
        fallback: true
      });
    }

    res.json({ success: true, roles: mapped });
  } catch (err) {
    console.error(err);
    res.json({
      success: true,
      roles: LOGIN_FALLBACK_ROLES,
      fallback: true,
      message: 'DB xətası — əsas rollar göstərilir'
    });
  }
});

/** İşçi əlavə/redaktə formu üçün (admin) */
router.get('/assign-options', protect, authorize('admin'), async (req, res) => {
  try {
    const roles = await Role.find({ active: true }).sort({ label: 1 }).select('slug label landing isBuiltIn').lean();
    res.json({ success: true, roles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const roles = await Role.find().sort({ isBuiltIn: -1, label: 1 }).lean();
    res.json({ success: true, roles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('slug')
      .trim()
      .isLength({ min: 2, max: 40 })
      .matches(/^[a-z0-9_-]+$/)
      .withMessage('Slug 2–40 simvol, yalnız a-z, 0-9, _, -'),
    body('label').trim().notEmpty().isLength({ max: 80 }),
    body('landing').isIn(['admin', 'seller', 'worker']),
    body('permissions').optional().isArray()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const slug = String(req.body.slug).toLowerCase().trim();
      const { label, landing } = req.body;
      const permissions = Array.isArray(req.body.permissions)
        ? req.body.permissions.filter((p) => ALLOWED_PERMISSIONS.includes(p))
        : [];

      const clash = await Role.findOne({ slug });
      if (clash) {
        return res.status(400).json({ success: false, message: 'Bu slug artıq mövcuddur' });
      }

      const reservedAdminDanger = slug === 'admin' && landing !== 'admin';
      if (reservedAdminDanger) {
        return res.status(400).json({ success: false, message: '"admin" slug-u yalnız admin paneli ilə işlənə bilər' });
      }

      const role = await Role.create({
        slug,
        label,
        landing,
        permissions,
        isBuiltIn: false,
        active: true
      });

      res.status(201).json({ success: true, role });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

router.put(
  '/:slug',
  protect,
  authorize('admin'),
  [
    body('label').optional().trim().notEmpty(),
    body('landing').optional().isIn(['admin', 'seller', 'worker']),
    body('permissions').optional().isArray(),
    body('active').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const slug = String(req.params.slug).toLowerCase();
      const role = await Role.findOne({ slug });
      if (!role) {
        return res.status(404).json({ success: false, message: 'Rol tapılmadı' });
      }

      if (role.isBuiltIn && req.body.slug && req.body.slug !== slug) {
        return res.status(400).json({ success: false, message: 'Daxili rolun slug-u dəyişdirilə bilməz' });
      }

      if (req.body.label != null) role.label = req.body.label;
      if (req.body.landing != null) {
        if (role.slug === 'admin' && req.body.landing !== 'admin') {
          return res.status(400).json({ success: false, message: 'Admin rolunun paneli dəyişdirilə bilməz' });
        }
        role.landing = req.body.landing;
      }
      if (req.body.permissions != null) {
        role.permissions = req.body.permissions.filter((p) => ALLOWED_PERMISSIONS.includes(p));
      }
      if (req.body.active != null && !role.isBuiltIn) {
        role.active = req.body.active;
      }

      await role.save();

      res.json({ success: true, role });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

router.delete('/:slug', protect, authorize('admin'), async (req, res) => {
  try {
    const slug = String(req.params.slug).toLowerCase();
    const role = await Role.findOne({ slug });
    if (!role) {
      return res.status(404).json({ success: false, message: 'Rol tapılmadı' });
    }
    if (role.isBuiltIn) {
      return res.status(400).json({ success: false, message: 'Daxili rol silinə bilməz' });
    }

    const usersCount = await User.countDocuments({ role: slug });
    if (usersCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Bu rol ${usersCount} istifadəçidə təyin olunub — əvvəl dəyişdirin və ya deaktiv edin`
      });
    }

    await role.deleteOne();
    res.json({ success: true, message: 'Rol silindi' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
