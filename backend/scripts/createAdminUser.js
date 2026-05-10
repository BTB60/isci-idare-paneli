/**
 * İlk administrator yaradılması (production-da ALLOW_PUBLIC_REGISTER söndükdən sonra).
 *
 * İstifadə:
 *   node scripts/createAdminUser.js admin@firma.az SecilmisSifre123 "Ad Soyad"
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const { resolveRoleAssignment } = require('../utils/roles');
const {
  splitDisplayName,
  baseUsernameFromEmail,
  assignUniqueUsername
} = require('../utils/userHelpers');

async function main() {
  const [, , emailArg, passwordArg, nameArg] = process.argv;
  if (!emailArg || !passwordArg || !nameArg) {
    console.error(
      'İstifadə: node scripts/createAdminUser.js <email> <şifrə> "Tam ad"\n' +
        'Şifrə ən azı 8 simvol olmalıdır.'
    );
    process.exit(1);
  }
  if (passwordArg.length < 8) {
    console.error('Şifrə ən azı 8 simvol olmalıdır.');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/555_insaat';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 });

  const email = String(emailArg).trim().toLowerCase();
  const exists = await User.findOne({ email });
  if (exists) {
    console.error('Bu email ilə istifadəçi artıq var.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const { firstName, lastName } = splitDisplayName(nameArg);
  const username = await assignUniqueUsername(User, baseUsernameFromEmail(email));
  const { slug, roleLanding, permissions } = await resolveRoleAssignment('admin');

  await User.create({
    username,
    email,
    password: passwordArg,
    firstName,
    lastName,
    role: slug,
    roleLanding,
    position: 'Administrator',
    dailySalary: 0,
    status: 'active',
    permissions,
    emailVerified: true
  });

  console.log(`Administrator yaradıldı: ${email} (${username})`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
