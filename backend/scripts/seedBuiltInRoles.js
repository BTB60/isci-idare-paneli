/**
 * Mongo-da əsas roller — admin UI-da görünür, işçi təyinində seçilir.
 */
const Role = require('../models/Role');
const User = require('../models/User');
const { BUILTIN_LANDING, resolveRoleAssignment } = require('../utils/roles');

const SLUGS = ['admin', 'manager', 'seller', 'cashier', 'worker', 'accountant', 'hr'];

const LABELS = {
  admin: 'Administrator',
  manager: 'Menecer',
  seller: 'Satıcı',
  cashier: 'Kassir',
  worker: 'İşçi / Fəhlə',
  accountant: 'Mühasib',
  hr: 'İnsan resursları (HR)'
};

async function seedBuiltInRoles(logger) {
  const log = logger && logger.info ? (m) => logger.info(m) : console.log;

  for (const slug of SLUGS) {
    const landing = BUILTIN_LANDING[slug] || 'worker';
    const permissions = User.getDefaultPermissions(slug);
    await Role.findOneAndUpdate(
      { slug },
      {
        label: LABELS[slug] || slug,
        landing,
        permissions,
        isBuiltIn: true,
        active: true
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    log(`Rol sinxron: ${slug}`);
  }
}

/** Köhnə istifadəçilər üçün roleLanding və boş icazələri doldurur */
async function migrateUsersRoleLanding(logger) {
  const log = logger && logger.info ? (m) => logger.info(m) : console.log;
  const users = await User.find({});
  let n = 0;
  for (const u of users) {
    const { roleLanding, permissions } = await resolveRoleAssignment(u.role);
    let dirty = false;
    if (u.roleLanding !== roleLanding) {
      u.roleLanding = roleLanding;
      dirty = true;
    }
    if (!u.permissions || u.permissions.length === 0) {
      u.permissions = permissions;
      dirty = true;
    }
    if (dirty) {
      await u.save();
      n++;
    }
  }
  if (n) log(`İstifadəçi rolları yeniləndi: ${n}`);
}

module.exports = { seedBuiltInRoles, migrateUsersRoleLanding };
