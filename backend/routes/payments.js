const express = require('express');
const router = express.Router();
const { Payment, Student, Receipt, AuditLog } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET all payments (Staff and Admin)
router.get('/', authenticate, requireRole(['Admin', 'Staff']), async (req, res) => {
  try {
    const payments = await Payment.find();
    
    // Sort payments by date descending
    const sortedPayments = payments.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Attach student details
    const enrichedPayments = await Promise.all(sortedPayments.map(async (payment) => {
      const student = await Student.findById(payment.studentId);
      return {
        ...payment,
        studentName: student ? student.name : 'Unknown Student',
        studentUsn: student ? student.usn : 'N/A',
        studentQuota: student ? student.quota : 'N/A',
        studentBranch: student ? student.branch : 'N/A'
      };
    }));

    res.json(enrichedPayments);
  } catch (error) {
    console.error('Fetch payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET payments for a student
router.get('/student/:studentId', authenticate, async (req, res) => {
  const { studentId } = req.params;

  // Student can only fetch their own payments
  if (req.user.role === 'Student' && req.user.studentId !== studentId) {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const payments = await Payment.find({ studentId });
    const sortedPayments = payments.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(sortedPayments);
  } catch (error) {
    console.error('Fetch student payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET single payment by receipt number
router.get('/receipt/:receiptNo', authenticate, async (req, res) => {
  const { receiptNo } = req.params;

  try {
    const payment = await Payment.findOne({ receiptNo });
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // Student can only fetch their own payment receipt
    if (req.user.role === 'Student' && req.user.studentId !== payment.studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const student = await Student.findById(payment.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student associated with payment not found' });
    }

    res.json({
      payment,
      student
    });
  } catch (error) {
    console.error('Fetch receipt error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST collect a payment (Staff and Admin)
router.post('/', authenticate, requireRole(['Admin', 'Staff']), async (req, res) => {
  const { studentId, amount, mode, referenceNo, remarks } = req.body;

  if (!studentId || !amount || !mode) {
    return res.status(400).json({ message: 'Student, amount, and payment mode are required' });
  }

  if (Number(amount) <= 0) {
    return res.status(400).json({ message: 'Payment amount must be greater than zero' });
  }

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Generate unique receipt number
    const paymentsCount = await Payment.countDocuments();
    const receiptNo = `REC-${String(paymentsCount + 1).padStart(6, '0')}`;

    // 1. Create Payment
    const payment = await Payment.create({
      studentId,
      amount: Number(amount),
      date: new Date().toISOString(),
      mode,
      referenceNo: referenceNo || 'N/A',
      collectedBy: req.user.name,
      receiptNo,
      remarks: remarks || ''
    });

    // 2. Create Receipt records (both for audit)
    await Receipt.create({
      receiptNo,
      studentId,
      paymentId: payment._id,
      type: 'staff',
      generatedAt: new Date().toISOString()
    });

    await Receipt.create({
      receiptNo,
      studentId,
      paymentId: payment._id,
      type: 'student',
      generatedAt: new Date().toISOString()
    });

    // 3. Create Audit Log
    await AuditLog.create({
      action: 'COLLECT_FEE',
      details: `Collected ₹${amount} via ${mode} from student ${student.name} (${student.usn}). Receipt No: ${receiptNo}.`,
      performedBy: req.user.name,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      message: 'Payment recorded successfully',
      payment,
      student
    });
  } catch (error) {
    console.error('Collect payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
