const bcrypt = require('bcryptjs');
const { User, Student, FeeStructure, Deadline, Payment, Receipt, AuditLog } = require('./db');
const { MISC_FEE_HEADS } = require('./utils/excelSync');

async function seedMassiveFirestoreData() {
  console.log('🚀 Seeding expanded realistic college dataset to Firebase Firestore & Local DB...');

  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);
  const staffPasswordHash = await bcrypt.hash('staff123', salt);

  // Check / Clean or Add Staff Accounts
  const existingUsers = await User.find({ role: { $in: ['Admin', 'Staff'] } });
  if (existingUsers.length === 0) {
    await User.create({
      name: 'System Admin',
      email: 'admin@college.edu',
      role: 'Admin',
      passwordHash: adminPasswordHash,
      studentId: null
    });

    await User.create({
      name: 'Dr. Ramesh Kumar (Finance Officer)',
      email: 'staff@college.edu',
      role: 'Staff',
      passwordHash: staffPasswordHash,
      studentId: null
    });

    await User.create({
      name: 'Priya Sundaram (Accounts Executive)',
      email: 'priya.accounts@college.edu',
      role: 'Staff',
      passwordHash: staffPasswordHash,
      studentId: null
    });
  }

  // 25 Comprehensive Students across multiple branches, quotas, years
  const comprehensiveStudents = [
    // CSE 5th Sem
    { usn: '1GC22CS001', name: 'Rahul Sharma', branch: 'Computer Science', semester: '5th', quota: 'KCET', batch: '2025-26', email: 'rahul@student.edu', paymentType: 'partial', payAmt: 30000, mode: 'Online', ref: 'TXN-UPI-9810237' },
    { usn: '1GC22CS014', name: 'Sneha Patel', branch: 'Computer Science', semester: '5th', quota: 'KCET', batch: '2025-26', email: 'sneha.p@student.edu', paymentType: 'full', payAmt: 58240, mode: 'Online', ref: 'TXN-NB-4489201' },
    { usn: '1GC22CS042', name: 'Karthik Raja', branch: 'Computer Science', semester: '5th', quota: 'Management', batch: '2025-26', email: 'karthik.r@student.edu', paymentType: 'partial', payAmt: 120000, mode: 'Demand Draft', ref: 'DD-SBI-881290' },
    { usn: '1GC22CS089', name: 'Pooja Hegde', branch: 'Computer Science', semester: '5th', quota: 'Management', batch: '2025-26', email: 'pooja.h@student.edu', paymentType: 'full', payAmt: 220000, mode: 'Demand Draft', ref: 'DD-HDFC-99210' },
    { usn: '1GC22CS105', name: 'Zoya Khan', branch: 'Computer Science', semester: '5th', quota: 'SNQ', batch: '2025-26', email: 'zoya.k@student.edu', paymentType: 'full', payAmt: 28500, mode: 'Online', ref: 'TXN-UPI-552190' },
    { usn: '1GC22CS118', name: 'Abhishek Gowda', branch: 'Computer Science', semester: '5th', quota: 'KCET', batch: '2025-26', email: 'abhishek.g@student.edu', paymentType: 'unpaid' },

    // ECE 5th & 3rd Sem
    { usn: '1GC22EC045', name: 'Ananya Murthy', branch: 'Electronics & Communication', semester: '5th', quota: 'Management', batch: '2025-26', email: 'ananya@student.edu', paymentType: 'full', payAmt: 220000, mode: 'Demand Draft', ref: 'DD-CAN-554201' },
    { usn: '1GC22EC012', name: 'Divya Bharathi', branch: 'Electronics & Communication', semester: '5th', quota: 'KCET', batch: '2025-26', email: 'divya.b@student.edu', paymentType: 'partial', payAmt: 40000, mode: 'Cash', ref: 'CASH-REC-4412' },
    { usn: '1GC23EC008', name: 'Meera Nair', branch: 'Electronics & Communication', semester: '3rd', quota: 'Management', batch: '2025-26', email: 'meera.n@student.edu', paymentType: 'unpaid' },
    { usn: '1GC23EC033', name: 'Sanjay Dutt', branch: 'Electronics & Communication', semester: '3rd', quota: 'KCET', batch: '2025-26', email: 'sanjay.d@student.edu', paymentType: 'full', payAmt: 58240, mode: 'Online', ref: 'TXN-UPI-771203' },

    // ISE 5th & 3rd Sem
    { usn: '1GC22IS012', name: 'Sameer Khan', branch: 'Information Science', semester: '5th', quota: 'SNQ', batch: '2025-26', email: 'sameer@student.edu', paymentType: 'full', payAmt: 28500, mode: 'Cash', ref: 'CASH-REC-3891' },
    { usn: '1GC22IS049', name: 'Harish Babu', branch: 'Information Science', semester: '5th', quota: 'KCET', batch: '2025-26', email: 'harish.b@student.edu', paymentType: 'partial', payAmt: 25000, mode: 'Online', ref: 'TXN-GPay-9988' },
    { usn: '1GC23IS027', name: 'Deepika Sen', branch: 'Information Science', semester: '3rd', quota: 'Management', batch: '2025-26', email: 'deepika.s@student.edu', paymentType: 'partial', payAmt: 150000, mode: 'Online', ref: 'TXN-NEFT-8819' },

    // AI & Data Science
    { usn: '1GC22AI005', name: 'Vikram Joshi', branch: 'Artificial Intelligence & DS', semester: '5th', quota: 'KCET', batch: '2025-26', email: 'vikram.j@student.edu', paymentType: 'unpaid' },
    { usn: '1GC23AI022', name: 'Arjun Deshmukh', branch: 'Artificial Intelligence & DS', semester: '3rd', quota: 'KCET', batch: '2025-26', email: 'arjun.d@student.edu', paymentType: 'full', payAmt: 58240, mode: 'Online', ref: 'TXN-UPI-889922' },
    { usn: '1GC23AI045', name: 'Ritu Menon', branch: 'Artificial Intelligence & DS', semester: '3rd', quota: 'Management', batch: '2025-26', email: 'ritu.m@student.edu', paymentType: 'partial', payAmt: 100000, mode: 'Demand Draft', ref: 'DD-ICICI-6612' },

    // Mechanical Engineering
    { usn: '1GC22ME014', name: 'Aditya Varma', branch: 'Mechanical Engineering', semester: '5th', quota: 'KCET', batch: '2025-26', email: 'aditya.v@student.edu', paymentType: 'partial', payAmt: 30000, mode: 'Cash', ref: 'CASH-REC-8812' },
    { usn: '1GC22ME055', name: 'Varun Tej', branch: 'Mechanical Engineering', semester: '5th', quota: 'Management', batch: '2025-26', email: 'varun.t@student.edu', paymentType: 'unpaid' },
    { usn: '1GC23ME009', name: 'Naveen Kumar', branch: 'Mechanical Engineering', semester: '3rd', quota: 'SNQ', batch: '2025-26', email: 'naveen.k@student.edu', paymentType: 'full', payAmt: 28500, mode: 'Online', ref: 'TXN-UPI-11928' },

    // Civil Engineering
    { usn: '1GC22CV032', name: 'Kavya Reddy', branch: 'Civil Engineering', semester: '5th', quota: 'Management', batch: '2025-26', email: 'kavya.r@student.edu', paymentType: 'partial', payAmt: 100000, mode: 'Online', ref: 'TXN-NB-778901' },
    { usn: '1GC22CV011', name: 'Ganesh Naik', branch: 'Civil Engineering', semester: '5th', quota: 'KCET', batch: '2025-26', email: 'ganesh.n@student.edu', paymentType: 'full', payAmt: 58240, mode: 'Demand Draft', ref: 'DD-SBI-443311' },
    { usn: '1GC23CV004', name: 'Shruti Kulkarni', branch: 'Civil Engineering', semester: '3rd', quota: 'SNQ', batch: '2025-26', email: 'shruti.k@student.edu', paymentType: 'unpaid' },

    // 7th Sem Senior Students
    { usn: '1GC21CS054', name: 'Manish Pandey', branch: 'Computer Science', semester: '7th', quota: 'KCET', batch: '2025-26', email: 'manish.p@student.edu', paymentType: 'full', payAmt: 58240, mode: 'Online', ref: 'TXN-UPI-994411' },
    { usn: '1GC21EC088', name: 'Preeti Deshpande', branch: 'Electronics & Communication', semester: '7th', quota: 'Management', batch: '2025-26', email: 'preeti.d@student.edu', paymentType: 'full', payAmt: 220000, mode: 'Demand Draft', ref: 'DD-AXIS-99221' },
    { usn: '1GC21IS003', name: 'Tanmay Bhat', branch: 'Information Science', semester: '7th', quota: 'KCET', batch: '2025-26', email: 'tanmay.b@student.edu', paymentType: 'partial', payAmt: 45000, mode: 'Cash', ref: 'CASH-REC-1129' }
  ];

  let receiptNum = 101;
  let addedCount = 0;

  for (const stud of comprehensiveStudents) {
    const existing = await Student.findOne({ usn: stud.usn });
    let studentId = existing ? existing._id : null;

    if (!existing) {
      const createdStudent = await Student.create({
        usn: stud.usn,
        name: stud.name,
        branch: stud.branch,
        semester: stud.semester,
        quota: stud.quota,
        batch: stud.batch
      });
      studentId = createdStudent._id;

      const passHash = await bcrypt.hash(stud.usn.toLowerCase(), salt);
      await User.create({
        name: stud.name,
        email: stud.email,
        role: 'Student',
        passwordHash: passHash,
        studentId: studentId
      });
      addedCount++;
    }

    // Add payments if not already recorded
    if (stud.paymentType !== 'unpaid') {
      const existingPay = await Payment.findOne({ studentId });
      if (!existingPay) {
        const receiptNo = `REC-2026-${String(receiptNum++).padStart(5, '0')}`;
        const payDate = new Date(Date.now() - Math.floor(Math.random() * 20 + 1) * 24 * 60 * 60 * 1000).toISOString();

        const pay = await Payment.create({
          studentId,
          amount: stud.payAmt,
          date: payDate,
          mode: stud.mode,
          referenceNo: stud.ref,
          collectedBy: 'Dr. Ramesh Kumar (Finance Officer)',
          receiptNo,
          remarks: stud.paymentType === 'full' ? 'Full fee settlement.' : 'Fee installment.'
        });

        await Receipt.create({
          receiptNo,
          studentId,
          paymentId: pay._id,
          type: 'staff',
          generatedAt: payDate
        });

        await Receipt.create({
          receiptNo,
          studentId,
          paymentId: pay._id,
          type: 'student',
          generatedAt: payDate
        });
      }
    }
  }

  // Record Audit Log
  await AuditLog.create({
    action: 'BULK_DATA_SYNC',
    details: `Added/synchronized ${comprehensiveStudents.length} comprehensive student records with payments to Firestore.`,
    performedBy: 'System Admin',
    timestamp: new Date().toISOString()
  });

  console.log(`🎉 Successfully synced ${comprehensiveStudents.length} total students and active transactions into Firestore!`);
}

seedMassiveFirestoreData().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
