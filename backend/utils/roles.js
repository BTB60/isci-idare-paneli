const User = require('../models/User');
const Role = require('../models/Role');

/** Daxili rollar üçün giriş paneli (UI yönləndirməsi) */
const BUILTIN_LANDING = {
  admin: 'admin',
  manager: 'worker',
  seller: 'seller',
  cashier: 'seller',
  worker: 'worker',
  accountant: 'worker',
  hr: 'worker'
};

function landingForSlug(slug, roleDocLanding) {
  if (roleDocLanding && ['admin', 'seller', 'worker'].includes(roleDocLanding)) {
    return roleDocLanding;
  }
  if (slug && BUILTIN_LANDING[slug]) return BUILTIN_LANDING[slug];
  return 'worker';
}

/**
 * Rol təyinatı: Mongo Role varsa oradan, yoxsa built-in icazələr.
 */
async function resolveRoleAssignment(roleSlug) {
  const slug = String(roleSlug || 'worker').trim().toLowerCase();
  const doc = await Role.findOne({ slug, active: true }).lean();
  const roleLanding = landingForSlug(slug, doc && doc.landing);
  let permissions = [];
  if (doc && Array.isArray(doc.permissions) && doc.permissions.length) {
    permissions = [...doc.permissions];
  } else {
    permissions = User.getDefaultPermissions(slug);
    if (!permissions.length && slug !== 'admin') {
      permissions = User.getDefaultPermissions('worker');
    }
  }
  return { slug, roleLanding, permissions };
}

/**
 * authorize('admin','seller',...) üçün — istifadəçi bu “qapı” rollarından birinə uyğundurmu
 */
function userMatchesRoleGate(user, gateRole) {
  if (!user || !gateRole) return false;
  if (user.role === gateRole) return true;

  const landing =
    user.roleLanding || landingForSlug(user.role, null);

  if (gateRole === 'admin') {
    return user.role === 'admin';
  }

  if (gateRole === 'seller' || gateRole === 'cashier') {
    return landing === 'seller' || user.role === 'seller' || user.role === 'cashier';
  }

  if (gateRole === 'worker') {
    return landing === 'worker';
  }

  return false;
}

module.exports = {
  BUILTIN_LANDING,
  landingForSlug,
  resolveRoleAssignment,
  userMatchesRoleGate
};
