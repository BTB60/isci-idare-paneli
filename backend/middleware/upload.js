const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { AppError } = require('./errorHandler');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    // Determine subfolder based on file type
    if (file.fieldname === 'avatar') {
      uploadPath += 'avatars/';
    } else if (file.fieldname === 'document') {
      uploadPath += 'documents/';
    } else if (file.fieldname === 'photo' || file.fieldname === 'checkInPhoto') {
      uploadPath += 'photos/';
    } else if (file.fieldname === 'evidence') {
      uploadPath += 'evidence/';
    } else if (file.fieldname === 'attachment') {
      uploadPath += 'attachments/';
    } else {
      uploadPath += 'others/';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    const mimeType = file.mimetype;
    
    if (allowedTypes.includes(mimeType)) {
      cb(null, true);
    } else {
      cb(new AppError(`File type ${mimeType} is not allowed`, 400, 'INVALID_FILE_TYPE'), false);
    }
  };
};

// File type configurations
const fileTypes = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ],
  all: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ]
};

// Create upload middleware
const createUpload = (options = {}) => {
  const {
    fieldName = 'file',
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = fileTypes.all,
    multiple = false,
    maxCount = 5
  } = options;

  const upload = multer({
    storage,
    fileFilter: fileFilter(allowedTypes),
    limits: {
      fileSize: maxSize
    }
  });

  if (multiple) {
    return upload.array(fieldName, maxCount);
  }
  
  return upload.single(fieldName);
};

// Pre-configured upload middlewares
const uploads = {
  // Avatar upload
  avatar: createUpload({
    fieldName: 'avatar',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: fileTypes.images
  }),

  // Document upload
  document: createUpload({
    fieldName: 'document',
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: fileTypes.all
  }),

  // Multiple documents
  documents: createUpload({
    fieldName: 'documents',
    maxSize: 20 * 1024 * 1024,
    allowedTypes: fileTypes.all,
    multiple: true,
    maxCount: 10
  }),

  // Photo upload (attendance, etc.)
  photo: createUpload({
    fieldName: 'photo',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: fileTypes.images
  }),

  // Evidence upload (penalties, etc.)
  evidence: createUpload({
    fieldName: 'evidence',
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [...fileTypes.images, 'video/mp4', 'video/quicktime']
  }),

  // Task attachment
  attachment: createUpload({
    fieldName: 'attachment',
    maxSize: 20 * 1024 * 1024,
    allowedTypes: fileTypes.all
  }),

  // Multiple attachments
  attachments: createUpload({
    fieldName: 'attachments',
    maxSize: 20 * 1024 * 1024,
    allowedTypes: fileTypes.all,
    multiple: true,
    maxCount: 5
  })
};

// Error handler for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large',
        code: 'FILE_TOO_LARGE'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files',
        code: 'TOO_MANY_FILES'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name',
        code: 'UNEXPECTED_FIELD'
      });
    }
  }
  next(err);
};

module.exports = {
  uploads,
  createUpload,
  handleUploadError,
  fileTypes
};
