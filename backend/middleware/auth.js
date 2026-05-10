const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { createLogger } = require('../utils/logger');
const { userMatchesRoleGate } = require('../utils/roles');
const { getJwtSecret, getJwtRefreshSecret } = require('../utils/jwtSecret');

const logger = createLogger();

/**
 * Protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, getJwtSecret());

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user is active
      if (user.status !== 'active' && user.status !== 'on_leave') {
        return res.status(401).json({
          success: false,
          message: 'Account is not active'
        });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      logger.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Optional auth - doesn't require token but attaches user if present
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, getJwtSecret());
        const user = await User.findById(decoded.id).select('-password');
        if (user && (user.status === 'active' || user.status === 'on_leave')) {
          req.user = user;
        }
      } catch (error) {
        // Invalid token, continue without user
      }
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Authorize by role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    const ok = roles.some((gate) => userMatchesRoleGate(req.user, gate));
    if (!ok) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

/**
 * Authorize by permission
 */
const hasPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has any of the required permissions
    const userPerms = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    const hasRequiredPermission = permissions.some((permission) =>
      userPerms.includes(permission)
    );

    if (!hasRequiredPermission) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};

/**
 * Check if user owns resource or is admin
 */
const ownerOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Admin can access anything
    if (req.user.role === 'admin') {
      return next();
    }

    try {
      const resourceUserId = await getResourceUserId(req);
      
      if (resourceUserId && resourceUserId.toString() === req.user._id.toString()) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    } catch (error) {
      logger.error('Owner check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  };
};

/**
 * Rate limit by user role
 */
const rateLimitByRole = (options = {}) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const userId = req.user ? req.user._id.toString() : req.ip;
    const now = Date.now();
    const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    const maxRequests = options.maxRequests || 100;
    
    // Different limits for different roles
    let limit = maxRequests;
    if (req.user) {
      switch (req.user.role) {
        case 'admin':
          limit = options.adminLimit || 1000;
          break;
        case 'manager':
          limit = options.managerLimit || 500;
          break;
        default:
          limit = maxRequests;
      }
    }
    
    const userRequests = requests.get(userId) || [];
    
    // Remove old requests outside window
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= limit) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later'
      });
    }
    
    validRequests.push(now);
    requests.set(userId, validRequests);
    
    next();
  };
};

/**
 * Check account status
 */
const checkAccountStatus = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }

  const user = req.user;

  // Check if password needs to be changed
  if (user.passwordChangedAt) {
    const passwordAge = Date.now() - new Date(user.passwordChangedAt).getTime();
    const maxPasswordAge = 90 * 24 * 60 * 60 * 1000; // 90 days
    
    if (passwordAge > maxPasswordAge) {
      return res.status(403).json({
        success: false,
        message: 'Password expired, please change your password',
        code: 'PASSWORD_EXPIRED'
      });
    }
  }

  // Check if email is verified (for non-admin users)
  if (!user.emailVerified && user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  next();
};

/**
 * Generate tokens
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    getJwtRefreshSecret(),
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );

  return { accessToken, refreshToken };
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, getJwtRefreshSecret());
  } catch (error) {
    return null;
  }
};

/**
 * Set token cookie
 */
const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

/**
 * Clear token cookie
 */
const clearTokenCookie = (res) => {
  res.clearCookie('token');
};

module.exports = {
  protect,
  optionalAuth,
  authorize,
  hasPermission,
  ownerOrAdmin,
  rateLimitByRole,
  checkAccountStatus,
  generateTokens,
  verifyRefreshToken,
  setTokenCookie,
  clearTokenCookie
};
