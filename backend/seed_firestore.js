const bcrypt = require('bcryptjs');
const { User, Student, FeeStructure, Deadline, Payment, Receipt, AuditLog } = require('./db');
const { MISC_FEE_HEADS } = require('./utils/excelSync');

async function seedToFirestore() {
  console.log('🚀 Seeding comprehensive datasets to Firebase Firestore Cloud Database...');

  // 1. Staff & Admin Users
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);
  const staffPasswordHash = await bcrypt.hash('staff123', salt);

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

  console.log('✅ Admin and Staff accounts seeded in Firestore.');

  // 2. Fee Structures
  const kcetMiscComponents = MISC_FEE_HEADS.map(name => {
    if (name === 'College Admission Regn. Fee') return { name, amount: 100 };
    if (name === 'Internal Examination Fee') return { name, amount: 100 };
    if (name === 'College Sports Fee') return { name, amount: 100 };
    if (name === 'Reading Room Fee') return { name, amount: 100 };
    if (name === 'Teachers Day Flag') return { name, amount: 40 };
    return { name, amount: 0 };
  });
  const kcetMiscTotal = kcetMiscComponents.reduce((s, c) => s + c.amount, 0);

  const mgmtMiscComponents = MISC_FEE_HEADS.map(name => {
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

  const snqMiscComponents = MISC_FEE_HEADS.map(name => {
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

  for (const fs of structures) {
    await FeeStructure.create(fs);
  }
  console.log('✅ Quota structures seeded in Firestore.');

  // 3. Deadlines
  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + 25);
  await Deadline.create({
    academicYear: '2025-26',
    dueDate: deadlineDate.toISOString().split('T')[0],
    finePerDay: 50
  });

  // 4. Students
  const studentsList = [
    {
      usn: '1GC22CS001',
      name: 'Rahul Sharma',
      branch: 'Computer Science',
      semester: '5th',
      quota: 'KCET',
      batch: '2025-26',
      email: 'rahul@student.edu',
      payments: [
        { amount: 30000, mode: 'Online', ref: 'TXN981023719', daysAgo: 10, remarks: 'First installment paid via UPI' }
      ]
    },
    {
      usn: '1GC22EC045',
      name: 'Ananya Murthy',
      branch: 'Electronics & Communication',
      semester: '5th',
      quota: 'Management',
      batch: '2025-26',
      email: 'ananya@student.edu',
      payments: [
        { amount: 110000, mode: 'Demand Draft', ref: 'DD-554201', daysAgo: 15, remarks: 'Semester 1 fee - DD from SBI' },
        { amount: 110000, mode: 'Online', ref: 'TXN11209485', daysAgo: 2, remarks: 'Final installment cleared' }
      ]
    },
    {
      usn: '1GC22IS012',
      name: 'Sameer Khan',
      branch: 'Information Science',
      semester: '5th',
      quota: 'SNQ',
      batch: '2025-26',
      email: 'sameer@student.edu',
      payments: [
        { amount: 28500, mode: 'Cash', ref: 'CASH-3891', daysAgo: 8, remarks: 'Full fee paid by cash.' }
      ]
    },
    {
      usn: '1GC22CS088',
      name: 'Sneha Patel',
      branch: 'Computer Science',
      semester: '5th',
      quota: 'KCET',
      batch: '2025-26',
      email: 'sneha.patel@student.edu',
      payments: [
        { amount: 58240, mode: 'Online', ref: 'TXN44892011', daysAgo: 12, remarks: 'Full KCET fee paid online.' }
      ]
    },
    {
      usn: '1GC22ME014',
      name: 'Aditya Varma',
      branch: 'Mechanical Engineering',
      semester: '5th',
      quota: 'KCET',
      batch: '2025-26',
      email: 'aditya.v@student.edu',
      payments: [
        { amount: 25000, mode: 'Cash', ref: 'CASH-8812', daysAgo: 6, remarks: 'Part payment' }
      ]
    },
    {
      usn: '1GC22CV032',
      name: 'Kavya Reddy',
      branch: 'Civil Engineering',
      semester: '5th',
      quota: 'Management',
      batch: '2025-26',
      email: 'kavya.r@student.edu',
      payments: [
        { amount: 100000, mode: 'Online', ref: 'TXN77890123', daysAgo: 20, remarks: 'First installment via NetBanking' }
      ]
    },
    {
      usn: '1GC22AI005',
      name: 'Vikram Joshi',
      branch: 'Artificial Intelligence & DS',
      semester: '5th',
      quota: 'KCET',
      batch: '2025-26',
      email: 'vikram.j@student.edu',
      payments: []
    },
    {
      usn: '1GC22IS049',
      name: 'Zoya Fatima',
      branch: 'Information Science',
      semester: '5th',
      quota: 'SNQ',
      batch: '2025-26',
      email: 'zoya.f@student.edu',
      payments: [
        { amount: 28500, mode: 'Online', ref: 'TXN55219034', daysAgo: 4, remarks: 'SNQ annual quota completed' }
      ]
    },
    {
      usn: '1GC23CS019',
      name: 'Rohan Gupta',
      branch: 'Computer Science',
      semester: '3rd',
      quota: 'KCET',
      batch: '2025-26',
      email: 'rohan.g@student.edu',
      payments: [
        { amount: 35000, mode: 'Online', ref: 'TXN19873421', daysAgo: 1, remarks: 'Initial fee tranche' }
      ]
    },
    {
      usn: '1GC23EC011',
      name: 'Meera Nair',
      branch: 'Electronics & Communication',
      semester: '3rd',
      quota: 'Management',
      batch: '2025-26',
      email: 'meera.n@student.edu',
      payments: []
    },
    {
      usn: '1GC23AI022',
      name: 'Arjun Deshmukh',
      branch: 'Artificial Intelligence & DS',
      semester: '3rd',
      quota: 'KCET',
      batch: '2025-26',
      email: 'arjun.d@student.edu',
      payments: [
        { amount: 58240, mode: 'Online', ref: 'TXN88992211', daysAgo: 7, remarks: 'KCET 100% Paid' }
      ]
    },
    {
      usn: '1GC21CS102',
      name: 'Pooja Hegde',
      branch: 'Computer Science',
      semester: '7th',
      quota: 'Management',
      batch: '2025-26',
      email: 'pooja.h@student.edu',
      payments: [
        { amount: 220000, mode: 'Demand Draft', ref: 'DD-992100', daysAgo: 18, remarks: 'Full final year clearance' }
      ]
    }
  ];

  let receiptCounter = 1;

  for (const studData of studentsList) {
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

    for (const p of studData.payments) {
      const receiptNo = `REC-${String(receiptCounter++).padStart(6, '0')}`;
      const payDate = new Date(Date.now() - p.daysAgo * 24 * 60 * 60 * 1000).toISOString();

      const pay = await Payment.create({
        studentId: student._id,
        amount: p.amount,
        date: payDate,
        mode: p.mode,
        referenceNo: p.ref,
        collectedBy: 'Dr. Ramesh Kumar (Finance Officer)',
        receiptNo,
        remarks: p.remarks
      });

      await Receipt.create({
        receiptNo,
        studentId: student._id,
        paymentId: pay._id,
        type: 'staff',
        generatedAt: payDate
      });

      await Receipt.create({
        receiptNo,
        studentId: student._id,
        paymentId: pay._id,
        type: 'student',
        generatedAt: payDate
      });
    }
  }

  // 5. Audit Logs
  await AuditLog.create({
    action: 'FIRESTORE_CONNECTED',
    details: 'Connected to Firebase Firestore Cloud Database for project clgfee-9227a.',
    performedBy: 'System',
    timestamp: new Date().toISOString()
  });

  console.log('🎉 Cloud Firestore has been completely seeded and configured!');
}

seedToFirestore().then(() => process.exit(0)).catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
