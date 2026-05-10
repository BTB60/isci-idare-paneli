/** İstifadəçi/Rol icazələri — User sxemi ilə üst-üstə düşməlidir */
const ALLOWED_PERMISSIONS = [
  'workers.view',
  'workers.create',
  'workers.edit',
  'workers.delete',
  'attendance.view',
  'attendance.manage',
  'salary.view',
  'salary.manage',
  'tasks.view',
  'tasks.create',
  'tasks.edit',
  'tasks.delete',
  'projects.view',
  'projects.manage',
  'reports.view',
  'reports.create',
  'settings.view',
  'settings.manage',
  'users.view',
  'users.manage',
  'sales.view',
  'sales.create',
  'sales.edit',
  'materials.view',
  'materials.manage',
  'permissions.view',
  'permissions.manage',
  'cash.deposit'
];

module.exports = { ALLOWED_PERMISSIONS };
