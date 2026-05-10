/**
 * Köhnə demo istifadəçiləri (əvvəlki seedDemoUsers) MongoDB-dən silir.
 * İşə salınması: npm run purge-demo-users
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), override: true });
const mongoose = require('mongoose');
const User = require('../models/User');

/** seedDemoUsers.js ilə yaradılan istifadəçilər */
const DEMO_KEYS = [
  { username: 'admin', email: 'admin@555insaat.az' },
  { username: 'seller', email: 'seller@555insaat.az' },
  { username: 'cashier', email: 'cashier@555insaat.az' },
  { username: 'worker1', email: 'worker@555insaat.az' }
];

async function purgeDemoUsers() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/555_insaat';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 });

  let total = 0;
  for (const d of DEMO_KEYS) {
    const res = await User.deleteMany({
      $or: [{ username: d.username }, { email: d.email }]
    });
    total += res.deletedCount || 0;
  }

  console.log(`Silindi: ${total} demo istifadəçi qeydi.`);
  await mongoose.disconnect();
}

if (require.main === module) {
  purgeDemoUsers().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { purgeDemoUsers, DEMO_KEYS };
