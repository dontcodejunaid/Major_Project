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

    // 2. Create Default Fee Structures with all 28 Misc Particulars and 14 University particulars
    const { MISC_FEE_HEADS, UNIV_FEE_HEADS, syncDayBookExcel } = require('./utils/excelSync');

    const defaultMiscComponents = MISC_FEE_HEADS.map(name => ({ name, amount: 0 }));
    
    // KCET Misc Total = 440
    const kcetMiscComponents = MISC_FEE_HEADS.map((name, i) => {
      // Seed nominal breakdown for demonstration
      if (name === 'College Admission Regn. Fee') return { name, amount: 100 };
      if (name === 'Internal Examination Fee') return { name, amount: 100 };
      if (name === 'College Sports Fee') return { name, amount: 100 };
      if (name === 'Reading Room Fee') return { name, amount: 100 };
      if (name === 'Teachers Day Flag') return { name, amount: 40 };
      return { name, amount: 0 };
    });
    const kcetMiscTotal = kcetMiscComponents.reduce((s, c) => s + c.amount, 0);

    // Management Misc Total = 15,750
    const mgmtMiscComponents = MISC_FEE_HEADS.map((name, i) => {
      if (name === 'College Admission Regn. Fee') return { name, amount: 2000 };
      if (name === 'Admission Application Fee') return { name, amount: 1000 };
      if (name === 'Internal Examination Fee') return { name, amount: 1000 };
      if (name === 'College Maintenance Fee') return { name, amount: 2000 };
      if (name === 'ERP Software fee') return { name, amount: 1000 };
      if (name === 'College Sports Fee') return { name, amount: 1000 };
      if (name === 'Department Association Fee') return { name, amount: 1000 };
      if (name === 'Reading Room Fee') return { name, amount: 500 };
      if (name === 'Medical Fee') return { name, amount: 500 };
      if (name === 'Magazine Fee') return { name, amount: 500 };
      if (name === 'Identity Card Fee') return { name, amount: 250 };
      if (name === 'Library Fee') return { name, amount: 1000 };
      if (name === 'College Day Fee') return { name, amount: 1000 };
      if (name === 'Laboratory Equipment Maintenance Fee') return { name, amount: 1000 };
      if (name === 'Computer Facilities Fee') return { name, amount: 1000 };
      if (name === 'Internet Facility Fee') return { name, amount: 1000 };
      return { name, amount: 0 };
    });
    const mgmtMiscTotal = mgmtMiscComponents.reduce((s, c) => s + c.amount, 0);

    // SNQ Misc Total = 3,500
    const snqMiscComponents = MISC_FEE_HEADS.map((name, i) => {
      if (name === 'College Admission Regn. Fee') return { name, amount: 500 };
      if (name === 'Internal Examination Fee') return { name, amount: 500 };
      if (name === 'College Maintenance Fee') return { name, amount: 500 };
      if (name === 'ERP Software fee') return { name, amount: 500 };
      if (name === 'College Sports Fee') return { name, amount: 500 };
      if (name === 'Reading Room Fee') return { name, amount: 500 };
      if (name === 'Library Fee') return { name, amount: 500 };
      return { name, amount: 0 };
    });
    const snqMiscTotal = snqMiscComponents.reduce((s, c) => s + c.amount, 0);

    const structures = [
      {
        academicYear: '2025-26',
        quota: 'KCET',
        components: [
          { name: 'Tuition Fee', amount: 48000 },
          { name: 'University Registration Fee', amount: 3000 },
          { name: 'Renewal of Registration Fee', amount: 0 },
          { name: 'Eligibility Fee-(Karnataka Students)', amount: 1000 },
          { name: 'E-Resource Consortium Fee', amount: 1500 },
          { name: 'E-Learning Fee', amount: 1000 },
          { name: 'University Sports fee', amount: 500 },
          { name: 'University sports development fee', amount: 500 },
          { name: 'University career guidance', amount: 250 },
          { name: 'University students / teachers Devt.', amount: 250 },
          { name: 'University development fund', amount: 1000 },
          { name: 'University cultural activities fee', amount: 500 },
          { name: 'Red Cross Membership Fee', amount: 100 },
          { name: 'Women Cell Fee', amount: 100 },
          { name: 'NSS Fee', amount: 100 },
          { name: 'Total Miscelleneous Fee', amount: kcetMiscTotal }
        ],
        miscBreakdown: kcetMiscComponents,
        totalAmount: 58240
      },
      {
        academicYear: '2025-26',
        quota: 'Management',
        components: [
          { name: 'Tuition Fee', amount: 180000 },
          { name: 'University Registration Fee', amount: 5000 },
          { name: 'Renewal of Registration Fee', amount: 0 },
          { name: 'Eligibility Fee-(Karnataka Students)', amount: 2000 },
          { name: 'E-Resource Consortium Fee', amount: 3000 },
          { name: 'E-Learning Fee', amount: 2000 },
          { name: 'University Sports fee', amount: 1500 },
          { name: 'University sports development fee', amount: 1500 },
          { name: 'University career guidance', amount: 1000 },
          { name: 'University students / teachers Devt.', amount: 1000 },
          { name: 'University development fund', amount: 5000 },
          { name: 'University cultural activities fee', amount: 1500 },
          { name: 'Red Cross Membership Fee', amount: 250 },
          { name: 'Women Cell Fee', amount: 250 },
          { name: 'NSS Fee', amount: 250 },
          { name: 'Total Miscelleneous Fee', amount: mgmtMiscTotal }
        ],
        miscBreakdown: mgmtMiscComponents,
        totalAmount: 220000
      },
      {
        academicYear: '2025-26',
        quota: 'SNQ',
        components: [
          { name: 'Tuition Fee', amount: 18000 },
          { name: 'University Registration Fee', amount: 2000 },
          { name: 'Renewal of Registration Fee', amount: 0 },
          { name: 'Eligibility Fee-(Karnataka Students)', amount: 500 },
          { name: 'E-Resource Consortium Fee', amount: 1000 },
          { name: 'E-Learning Fee', amount: 800 },
          { name: 'University Sports fee', amount: 400 },
          { name: 'University sports development fee', amount: 400 },
          { name: 'University career guidance', amount: 200 },
          { name: 'University students / teachers Devt.', amount: 200 },
          { name: 'University development fund', amount: 800 },
          { name: 'University cultural activities fee', amount: 400 },
          { name: 'Red Cross Membership Fee', amount: 100 },
          { name: 'Women Cell Fee', amount: 100 },
          { name: 'NSS Fee', amount: 100 },
          { name: 'Total Miscelleneous Fee', amount: snqMiscTotal }
        ],
        miscBreakdown: snqMiscComponents,
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
