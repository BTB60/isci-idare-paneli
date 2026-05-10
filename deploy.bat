@echo off
echo ==========================================
echo 555 Insaat - Backend Deployment Script
echo ==========================================
echo.

cd backend

echo Installing dependencies...
call npm install

echo.
echo Checking if Vercel CLI is installed...
vercel --version >nul 2>&1
if errorlevel 1 (
    echo Vercel CLI not found. Installing...
    call npm install -g vercel
)

echo.
echo ==========================================
echo Deployment Options:
echo ==========================================
echo 1. Deploy to Vercel (Recommended)
echo 2. Deploy to Railway
echo 3. Deploy to Render
echo 4. Local Development
echo 5. Exit
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto vercel
if "%choice%"=="2" goto railway
if "%choice%"=="3" goto render
if "%choice%"=="4" goto local
if "%choice%"=="5" goto exit

goto end

:vercel
echo.
echo Deploying to Vercel...
echo Please make sure you have:
echo 1. Created a Vercel account at vercel.com
echo 2. Created a MongoDB Atlas database
echo 3. Updated the MONGODB_URI in .env file
echo.
pause
call vercel --prod
goto end

:railway
echo.
echo Deploying to Railway...
echo Please visit railway.app and connect your GitHub repository
echo Make sure to add environment variables in Railway dashboard
echo.
pause
goto end

:render
echo.
echo Deploying to Render...
echo Please visit render.com and create a new Web Service
echo Make sure to add environment variables in Render dashboard
echo.
pause
goto end

:local
echo.
echo Starting local development server...
echo Make sure MongoDB is running locally or update MONGODB_URI
echo.
call npm run dev
goto end

:exit
echo Exiting...

:end
cd ..
pause
