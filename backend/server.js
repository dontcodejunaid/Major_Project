const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { User, Student, FeeStructure, Deadline, Payment, Receipt, AuditLog } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes Mount
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/deadlines', require('./routes/deadlines'));
app.use('/api/reports', require('./routes/reports'));

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Database Seeder
const seedDatabase = async () => {
  try {
    const usersCount = await User.countDocuments();
    if (usersCount > 0) {
      console.log('Database already has users. Skipping seeder.');
      return;
    }

    console.log('Seeding database with default mock data...');

    // 1. Create Default Users (Admin & Staff)
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('admin123', salt);
    const staffPasswordHash = await bcrypt.hash('staff123', salt);
    const studentPasswordHash = await bcrypt.hash('student123', salt); // fallback student password

    const seededAdmin = await User.create({
      name: 'System Admin',
      email: 'admin@college.edu',
      role: 'Admin',
      passwordHash: adminPasswordHash,
      studentId: null
    });

    const seededStaff = await User.create({
      name: 'Accounts Office Staff',
      email: 'staff@college.edu',
      role: 'Staff',
      passwordHash: staffPasswordHash,
      studentId: null
    });

    console.log('Seeded Admin & Staff users.');

    // 2. Create Default Fee Structures
    const structures = [
      {
        academicYear: '2025-26',
        quota: 'KCET',
        components: [
          { name: 'Tuition Fee', amount: 48000 },
          { name: 'University Fee', amount: 4000 },
          { name: 'Sports Fee', amount: 1000 },
          { name: 'Library Fee', amount: 1240 },
          { name: 'Lab Fee', amount: 2000 },
          { name: 'Development Fee', amount: 1000 },
          { name: 'Exam Fee', amount: 500 },
          { name: 'Miscellaneous', amount: 500 }
        ],
        totalAmount: 58240
      },
      {
        academicYear: '2025-26',
        quota: 'Management',
        components: [
          { name: 'Tuition Fee', amount: 180000 },
          { name: 'University Fee', amount: 15000 },
          { name: 'Sports Fee', amount: 5000 },
          { name: 'Library Fee', amount: 4000 },
          { name: 'Lab Fee', amount: 6000 },
          { name: 'Development Fee', amount: 8000 },
          { name: 'Exam Fee', amount: 1000 },
          { name: 'Miscellaneous', amount: 1000 }
        ],
        totalAmount: 220000
      },
      {
        academicYear: '2025-26',
        quota: 'SNQ',
        components: [
          { name: 'Tuition Fee', amount: 18000 },
          { name: 'University Fee', amount: 4000 },
          { name: 'Sports Fee', amount: 1000 },
          { name: 'Library Fee', amount: 1500 },
          { name: 'Lab Fee', amount: 2000 },
          { name: 'Development Fee', amount: 1000 },
          { name: 'Exam Fee', amount: 500 },
          { name: 'Miscellaneous', amount: 500 }
        ],
        totalAmount: 28500
      }
    ];

    for (const fsData of structures) {
      await FeeStructure.create(fsData);
    }
    console.log('Seeded Quota Fee Structures.');

    // 3. Create Deadlines
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 30); // 30 days from now is the due date
    const seededDeadline = await Deadline.create({
      academicYear: '2025-26',
      dueDate: deadlineDate.toISOString().split('T')[0],
      finePerDay: 50
    });
    console.log('Seeded Deadlines.');

    // 4. Create Mock Students & accounts
    const mockStudents = [
      {
        usn: '1GC22CS001',
        name: 'Rahul Sharma',
        branch: 'Computer Science',
        semester: '5th',
        quota: 'KCET',
        batch: '2025-26',
        email: 'rahul@student.edu'
      },
      {
        usn: '1GC22EC045',
        name: 'Ananya Murthy',
        branch: 'Electronics & Communication',
        semester: '5th',
        quota: 'Management',
        batch: '2025-26',
        email: 'ananya@student.edu'
      },
      {
        usn: '1GC22IS012',
        name: 'Sameer Khan',
        branch: 'Information Science',
        semester: '5th',
        quota: 'SNQ',
        batch: '2025-26',
        email: 'sameer@student.edu'
      }
    ];

    for (const studData of mockStudents) {
      const student = await Student.create({
        usn: studData.usn,
        name: studData.name,
        branch: studData.branch,
        semester: studData.semester,
        quota: studData.quota,
        batch: studData.batch
      });

      const passHash = await bcrypt.hash(studData.usn.toLowerCase(), salt);
      await User.create({
        name: studData.name,
        email: studData.email,
        role: 'Student',
        passwordHash: passHash,
        studentId: student._id
      });

      // 5. Seed some initial payments
      if (studData.usn === '1GC22CS001') {
        // Rahul paid half of KCET fee
        const payAmt = 30000;
        const receiptNo = 'REC-000001';
        
        const pay = await Payment.create({
          studentId: student._id,
          amount: payAmt,
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          mode: 'Online',
          referenceNo: 'TXN981023719',
          collectedBy: 'Accounts Office Staff',
          receiptNo,
          remarks: 'First installment paid online.'
        });

        await Receipt.create({
          receiptNo,
          studentId: student._id,
          paymentId: pay._id,
          type: 'staff',
          generatedAt: new Date().toISOString()
        });
        
        await Receipt.create({
          receiptNo,
          studentId: student._id,
          paymentId: pay._id,
          type: 'student',
          generatedAt: new Date().toISOString()
        });
      } else if (studData.usn === '1GC22IS012') {
        // Sameer paid SNQ fee in full
        const payAmt = 28500;
        const receiptNo = 'REC-000002';

        const pay = await Payment.create({
          studentId: student._id,
          amount: payAmt,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          mode: 'Cash',
          referenceNo: 'CASH-3891',
          collectedBy: 'Accounts Office Staff',
          receiptNo,
          remarks: 'Full fee paid by cash.'
        });

        await Receipt.create({
          receiptNo,
          studentId: student._id,
          paymentId: pay._id,
          type: 'staff',
          generatedAt: new Date().toISOString()
        });
        
        await Receipt.create({
          receiptNo,
          studentId: student._id,
          paymentId: pay._id,
          type: 'student',
          generatedAt: new Date().toISOString()
        });
      }
    }
    console.log('Seeded Students, Accounts, and Payments.');

    // 6. Create Audit Logs
    await AuditLog.create({
      action: 'SYSTEM_STARTUP',
      details: 'System backend initialized and default mock databases seeded.',
      performedBy: 'System Seeder',
      timestamp: new Date().toISOString()
    });
    console.log('Seeded Audit Logs.');

  } catch (err) {
    console.error('Database seeder error:', err);
  }
};

// Start Express Server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await seedDatabase();
});
