const cron = require('node-cron');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Salary = require('../models/Salary');

const setupCronJobs = () => {
  // Daily attendance reminder at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('Running daily attendance check...');
    // Logic to send reminders to workers who haven't checked in
  });

  // Monthly salary calculation on the 1st of each month at 2:00 AM
  cron.schedule('0 2 1 * *', async () => {
    console.log('Running monthly salary calculation...');
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    
    // Get all active workers
    const workers = await User.find({ role: 'worker', status: 'active' });
    
    for (const worker of workers) {
      // Check if salary already calculated
      const existingSalary = await Salary.findOne({
        workerId: worker._id,
        month,
        year
      });
      
      if (!existingSalary) {
        // Calculate salary
        const baseSalary = worker.monthlySalary || (worker.dailySalary * (worker.workDaysPerMonth || 30));
        
        await Salary.create({
          workerId: worker._id,
          month,
          year,
          baseSalary,
          workDays: 0,
          overtimePay: 0,
          bonuses: [],
          penalties: [],
          deductions: [],
          grossSalary: baseSalary,
          netSalary: baseSalary
        });
      }
    }
    
    console.log(`Salary calculation completed for ${month}/${year}`);
  });

  // Weekly report generation every Monday at 9:00 AM
  cron.schedule('0 9 * * 1', async () => {
    console.log('Generating weekly report...');
    // Logic to generate and send weekly reports
  });

  console.log('Cron jobs scheduled successfully');
};

module.exports = { setupCronJobs };
