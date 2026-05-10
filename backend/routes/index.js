// Route index file - exports all routes
const auth = require('./auth');
const workers = require('./workers');
const attendance = require('./attendance');
const dashboard = require('./dashboard');
const salary = require('./salary');
const tasks = require('./tasks');
const projects = require('./projects');
const permissions = require('./permissions');
const shiftChanges = require('./shiftChanges');
const penalties = require('./penalties');
const bonuses = require('./bonuses');
const reports = require('./reports');
const notifications = require('./notifications');
const documents = require('./documents');
const trainings = require('./trainings');
const advances = require('./advances');
const overtime = require('./overtime');
const sales = require('./sales');
const materials = require('./materials');
const auditLogs = require('./auditLogs');
const settings = require('./settings');
const qr = require('./qr');
const users = require('./users');

module.exports = {
  auth,
  workers,
  attendance,
  dashboard,
  salary,
  tasks,
  projects,
  permissions,
  shiftChanges,
  penalties,
  bonuses,
  reports,
  notifications,
  documents,
  trainings,
  advances,
  overtime,
  sales,
  materials,
  auditLogs,
  settings,
  qr,
  users
};
