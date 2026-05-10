const { AuditLog } = require('../models');
const { createLogger } = require('../utils/logger');

const logger = createLogger();

/**
 * Create audit log middleware
 */
const auditLog = (options = {}) => {
  return async (req, res, next) => {
    // Skip if no user
    if (!req.user) {
      return next();
    }

    const {
      action,
      entityType,
      getEntityId = () => req.params.id,
      getEntityName = () => null,
      getChanges = () => null,
      severity = 'info'
    } = options;

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to capture response
    res.json = function(data) {
      // Restore original method
      res.json = originalJson;

      // Log the action asynchronously (don't wait for it)
      (async () => {
        try {
          const entityId = getEntityId(req);
          const entityName = getEntityName(req);
          const changes = getChanges(req, data);

          await AuditLog.create({
            action,
            entity: {
              type: entityType,
              id: entityId,
              name: entityName
            },
            performedBy: req.user._id,
            performedByName: req.user.fullName || req.user.username,
            timestamp: new Date(),
            changes,
            request: {
              ip: req.ip,
              userAgent: req.headers['user-agent'],
              method: req.method,
              url: req.originalUrl,
              body: sanitizeBody(req.body),
              params: req.params,
              query: req.query
            },
            response: {
              statusCode: res.statusCode,
              success: data.success !== false,
              message: data.message
            },
            severity: res.statusCode >= 400 ? 'error' : severity
          });
        } catch (error) {
          logger.error('Audit log error:', error);
        }
      })();

      // Call original json method
      return originalJson(data);
    };

    next();
  };
};

/**
 * Sanitize request body for logging (remove sensitive data)
 */
const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = ['password', 'token', 'secret', 'creditCard', 'cvv', 'pin'];
  const sanitized = { ...body };

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });

  return sanitized;
};

/**
 * Pre-configured audit log middlewares
 */
const auditLogs = {
  // User actions
  user: {
    create: auditLog({
      action: 'create',
      entityType: 'User',
      getEntityId: (req) => req.params.id,
      getEntityName: (req) => req.body.firstName + ' ' + req.body.lastName
    }),
    update: auditLog({
      action: 'update',
      entityType: 'User',
      getEntityId: (req) => req.params.id,
      getChanges: (req) => ({
        before: req.originalDoc,
        after: req.body
      })
    }),
    delete: auditLog({
      action: 'delete',
      entityType: 'User',
      getEntityId: (req) => req.params.id,
      severity: 'warning'
    })
  },

  // Attendance actions
  attendance: {
    create: auditLog({
      action: 'create',
      entityType: 'Attendance'
    }),
    update: auditLog({
      action: 'update',
      entityType: 'Attendance'
    }),
    approve: auditLog({
      action: 'approve',
      entityType: 'Attendance'
    })
  },

  // Salary actions
  salary: {
    create: auditLog({
      action: 'create',
      entityType: 'Salary'
    }),
    update: auditLog({
      action: 'update',
      entityType: 'Salary'
    }),
    approve: auditLog({
      action: 'approve',
      entityType: 'Salary'
    }),
    pay: auditLog({
      action: 'complete',
      entityType: 'Salary'
    })
  },

  // Project actions
  project: {
    create: auditLog({
      action: 'create',
      entityType: 'Project',
      getEntityName: (req) => req.body.name
    }),
    update: auditLog({
      action: 'update',
      entityType: 'Project'
    }),
    delete: auditLog({
      action: 'delete',
      entityType: 'Project',
      severity: 'warning'
    })
  },

  // Task actions
  task: {
    create: auditLog({
      action: 'create',
      entityType: 'Task'
    }),
    update: auditLog({
      action: 'update',
      entityType: 'Task'
    }),
    assign: auditLog({
      action: 'assign',
      entityType: 'Task'
    }),
    complete: auditLog({
      action: 'complete',
      entityType: 'Task'
    })
  },

  // Permission actions
  permission: {
    create: auditLog({
      action: 'create',
      entityType: 'Permission'
    }),
    approve: auditLog({
      action: 'approve',
      entityType: 'Permission'
    }),
    reject: auditLog({
      action: 'reject',
      entityType: 'Permission'
    })
  },

  // Export action
  export: auditLog({
    action: 'export',
    entityType: 'User',
    severity: 'info'
  }),

  // Login/Logout
  login: auditLog({
    action: 'login',
    entityType: 'User',
    getEntityId: (req) => req.user?._id
  }),

  logout: auditLog({
    action: 'logout',
    entityType: 'User',
    getEntityId: (req) => req.user?._id
  })
};

module.exports = {
  auditLog,
  auditLogs,
  sanitizeBody
};
