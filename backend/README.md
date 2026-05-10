# 555 Insaat - Backend API

## 🚀 Deployment Guide

### 1. Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# MONGODB_URI=mongodb://localhost:27017/555_insaat

# Run development server
npm run dev
```

### 2. Deploy to Vercel (Recommended - Free)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy:**
```bash
cd backend
vercel
```

4. **Set Environment Variables in Vercel Dashboard:**
- Go to your project settings
- Add environment variables:
  - `MONGODB_URI` - Your MongoDB Atlas connection string
  - `JWT_SECRET` - A secure random string
  - `NODE_ENV` - production

### 3. Deploy to Railway (Alternative)

1. Create account at [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Add environment variables in Railway dashboard
4. Deploy automatically

### 4. Deploy to Render (Alternative)

1. Create account at [render.com](https://render.com)
2. Create new Web Service
3. Connect your repository
4. Add environment variables
5. Deploy

### 5. MongoDB Atlas Setup

1. Create account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create new cluster (free tier available)
3. Create database user
4. Whitelist your IP (0.0.0.0/0 for all IPs)
5. Get connection string and add to environment variables

## 📁 Project Structure

```
backend/
├── server.js           # Main server file
├── package.json        # Dependencies
├── .env               # Environment variables (not in git)
├── .env.example       # Example environment file
├── vercel.json        # Vercel deployment config
├── Procfile           # Heroku deployment config
├── routes/            # API routes
│   ├── auth.js
│   ├── workers.js
│   ├── attendance.js
│   └── ...
├── models/            # Database models
│   ├── User.js
│   ├── Attendance.js
│   └── ...
├── middleware/        # Express middleware
│   ├── auth.js
│   ├── errorHandler.js
│   └── ...
└── utils/             # Utility functions
    ├── logger.js
    ├── socket.js
    └── cronJobs.js
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/update-password` - Update password

### Workers
- `GET /api/workers` - Get all workers
- `POST /api/workers` - Create worker
- `PUT /api/workers/:id` - Update worker
- `DELETE /api/workers/:id` - Delete worker

### Attendance
- `GET /api/attendance` - Get all attendance
- `GET /api/attendance/today` - Get today's attendance
- `POST /api/attendance` - Mark attendance
- `POST /api/attendance/checkin` - Check in
- `POST /api/attendance/checkout` - Check out

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard stats
- `GET /api/dashboard/worker` - Get worker dashboard

### And more...

## 🔒 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for JWT tokens | Yes |
| `PORT` | Server port (default: 5000) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `CORS_ORIGIN` | Allowed CORS origins | No |

## 📝 Notes

- The backend uses JWT for authentication
- Passwords are hashed with bcrypt
- All API responses follow the format: `{ success: boolean, data: any }`
- Rate limiting is enabled (100 requests per 15 minutes)
- File uploads are supported via Multer
