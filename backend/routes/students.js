const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Student, User, FeeStructure, Payment, Deadline, AuditLog } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// Calculate detailed fees for a student
const getStudentFeeDetails = async (student) => {
  // 1. Get Fee Structure
  const feeStructure = await FeeStructure.findOne({
    academicYear: student.batch || '2025-26', // Fallback to 2025-26
    quota: student.quota
  });

  const totalFee = feeStructure ? feeStructure.totalAmount : 0;
  const components = feeStructure ? feeStructure.components : [];

  // 2. Get Payments
  const studentPayments = await Payment.find({ studentId: student._id });
  const amountPaid = studentPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  // 3. Calculate Fine
  let fine = 0;
  let daysOverdue = 0;
  const balanceDueBeforeFine = Math.max(0, totalFee - amountPaid);

  if (balanceDueBeforeFine > 0) {
    const deadline = await Deadline.findOne({ academicYear: student.batch || '2025-26' });
    if (deadline && deadline.dueDate) {
      const today = new Date();
      const dueDate = new Date(deadline.dueDate);
      if (today > dueDate) {
        const diffTime = Math.abs(today - dueDate);
        daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        fine = daysOverdue * (Number(deadline.finePerDay) || 0);
      }
    }
  }

  const netPayableNow = balanceDueBeforeFine + fine;

  return {
    totalFee,
    components,
    amountPaid,
    balanceDue: balanceDueBeforeFine,
    fine,
    daysOverdue,
    netPayableNow,
    payments: studentPayments
  };
};

// GET all students (Admin and Staff can search/filter)
router.get('/', authenticate, requireRole(['Admin', 'Staff']), async (req, res) => {
  const { search, branch, semester, quota, batch } = req.query;
  const filter = {};

  if (branch) filter.branch = branch;
  if (semester) filter.semester = semester;
  if (quota) filter.quota = quota;
  if (batch) filter.batch = batch;

  if (search) {
    // Mimic mongo regex search on USN or Name
    const regex = new RegExp(search, 'i');
    filter.$or = [
      { usn: regex },
      { name: regex }
    ];
  }

  try {
    const studentsList = await Student.find(filter);
    
    // Add real-time fee summary to each student in list
    const enrichedStudents = await Promise.all(studentsList.map(async (student) => {
      const fees = await getStudentFeeDetails(student);
      return {
        ...student,
        fees: {
          totalFee: fees.totalFee,
          amountPaid: fees.amountPaid,
          balanceDue: fees.balanceDue,
          fine: fees.fine,
          netPayableNow: fees.netPayableNow
        }
      };
    }));

    res.json(enrichedStudents);
  } catch (error) {
    console.error('Fetch students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET single student details (Student can view own, Admin/Staff can view any)
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  // Students can only access their own profile
  if (req.user.role === 'Student' && req.user.studentId !== id) {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const fees = await getStudentFeeDetails(student);
    res.json({
      student,
      fees
    });
  } catch (error) {
    console.error('Fetch student details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST create student (Admin only)
router.post('/', authenticate, requireRole(['Admin']), async (req, res) => {
  const { usn, name, branch, semester, quota, batch, email } = req.body;

  if (!usn || !name || !branch || !semester || !quota || !batch || !email) {
    return res.status(400).json({ message: 'All student details are required' });
  }

  try {
    // Check if USN exists
    const existingStudent = await Student.findOne({ usn: usn.toUpperCase() });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student with this USN already exists' });
    }

    // Check if email is already taken
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // 1. Create Student
    const newStudent = await Student.create({
      usn: usn.toUpperCase(),
      name,
      branch,
      semester,
      quota,
      batch
    });

    // 2. Create Student User login account (default password is the student's USN in lowercase)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(usn.toLowerCase(), salt);

    await User.create({
      name,
      email,
      role: 'Student',
      passwordHash,
      studentId: newStudent._id
    });

    // Log Action
    await AuditLog.create({
      action: 'CREATE_STUDENT',
      details: `Created student ${name} (${usn}) and corresponding user account.`,
      performedBy: req.user.name,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      message: 'Student and login account created successfully',
      student: newStudent
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update student (Admin and Staff can edit)
router.put('/:id', authenticate, requireRole(['Admin', 'Staff']), async (req, res) => {
  const { id } = req.params;
  const { name, branch, semester, quota, batch } = req.body;

  try {
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const updatedStudent = await Student.findByIdAndUpdate(id, {
      name: name || student.name,
      branch: branch || student.branch,
      semester: semester || student.semester,
      quota: quota || student.quota,
      batch: batch || student.batch
    });

    // Also update associated User name if name was changed
    if (name) {
      const user = await User.findOne({ studentId: id });
      if (user) {
        await User.findByIdAndUpdate(user._id, { name });
      }
    }

    // Log Action
    await AuditLog.create({
      action: 'UPDATE_STUDENT',
      details: `Updated details for student ${student.name} (${student.usn}).`,
      performedBy: req.user.name,
      timestamp: new Date().toISOString()
    });

    res.json({
      message: 'Student updated successfully',
      student: updatedStudent
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE student (Admin only)
router.delete('/:id', authenticate, requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;

  try {
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await Student.findByIdAndDelete(id);

    // Also delete linked User account
    const user = await User.findOne({ studentId: id });
    if (user) {
      await User.findByIdAndDelete(user._id);
    }

    // Log Action
    await AuditLog.create({
      action: 'DELETE_STUDENT',
      details: `Deleted student ${student.name} (${student.usn}) and login account.`,
      performedBy: req.user.name,
      timestamp: new Date().toISOString()
    });

    res.json({ message: 'Student and linked account deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
module.exports.getStudentFeeDetails = getStudentFeeDetails;
