/**
 * 555 Insaat - Database Models Index
 * Export all models from a single file
 */

const User = require('./User');
const Role = require('./Role');
const Attendance = require('./Attendance');
const Salary = require('./Salary');
const Project = require('./Project');
const Task = require('./Task');
const Notification = require('./Notification');
const Document = require('./Document');
const Training = require('./Training');

// Permission model
const Permission = require('./Permission');

// Shift Change model
const ShiftChange = require('./ShiftChange');

// Penalty model
const Penalty = require('./Penalty');

// Bonus model
const Bonus = require('./Bonus');

// Advance model
const Advance = require('./Advance');

// Overtime model
const Overtime = require('./Overtime');

// Sale model
const Sale = require('./Sale');

// Material model
const Material = require('./Material');

// Audit Log model
const AuditLog = require('./AuditLog');

// Settings model
const Settings = require('./Settings');

module.exports = {
  User,
  Role,
  Attendance,
  Salary,
  Project,
  Task,
  Notification,
  Document,
  Training,
  Permission,
  ShiftChange,
  Penalty,
  Bonus,
  Advance,
  Overtime,
  Sale,
  Material,
  AuditLog,
  Settings
};
