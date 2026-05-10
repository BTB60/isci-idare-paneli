function splitDisplayName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || 'User';
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : 'User';
  return { firstName, lastName };
}

function baseUsernameFromEmail(email) {
  const local = String(email || '').split('@')[0] || 'user';
  const cleaned = local.replace(/[^a-zA-Z0-9._-]/g, '');
  return (cleaned || 'user').slice(0, 28);
}

async function assignUniqueUsername(UserModel, desired) {
  const base = String(desired || 'user').slice(0, 30);
  let candidate = base;
  let n = 0;
  while (await UserModel.exists({ username: candidate })) {
    n += 1;
    const suffix = String(n);
    candidate = (base.slice(0, Math.max(1, 30 - suffix.length)) + suffix).slice(0, 30);
  }
  return candidate;
}

module.exports = {
  splitDisplayName,
  baseUsernameFromEmail,
  assignUniqueUsername
};
