const express = require('express');
const router = express.Router();
const { Student, Payment, AuditLog } = require('../db');
const { getStudentFeeDetails } = require('./students');
const { authenticate, requireRole } = require('../middleware/auth');

// GET analytics aggregates (Admin only)
router.get('/analytics', authenticate, requireRole(['Admin']), async (req, res) => {
  try {
    const studentsList = await Student.find();
    const paymentsList = await Payment.find();

    let totalCollected = 0;
    let totalDues = 0;
    let totalFines = 0;

    const branchCollections = {};
    const quotaCollections = {};
    const modeCollections = { Cash: 0, DD: 0, Online: 0 };

    // Process payments for payment mode split and total collections
    paymentsList.forEach(payment => {
      const amt = Number(payment.amount) || 0;
      totalCollected += amt;
      
      const mode = payment.mode || 'Cash';
      modeCollections[mode] = (modeCollections[mode] || 0) + amt;
    });

    // Process students for fee-details and balance summary
    for (const student of studentsList) {
      const details = await getStudentFeeDetails(student);
      totalDues += details.balanceDue;
      totalFines += details.fine;

      // Group collections by branch
      const branch = student.branch || 'Other';
      branchCollections[branch] = (branchCollections[branch] || 0) + details.amountPaid;

      // Group collections by quota
      const quota = student.quota || 'Other';
      quotaCollections[quota] = (quotaCollections[quota] || 0) + details.amountPaid;
    }

    // Format splits for recharts
    const branchData = Object.keys(branchCollections).map(name => ({
      name,
      amount: branchCollections[name]
    }));

    const quotaData = Object.keys(quotaCollections).map(name => ({
      name,
      amount: quotaCollections[name]
    }));

    const modeData = Object.keys(modeCollections).map(name => ({
      name,
      amount: modeCollections[name]
    }));

    // Prepare last 10 payments for recent activity table
    const sortedPayments = paymentsList
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    const recentActivity = await Promise.all(sortedPayments.map(async (payment) => {
      const student = await Student.findById(payment.studentId);
      return {
        _id: payment._id,
        receiptNo: payment.receiptNo,
        studentId: payment.studentId,
        studentName: student ? student.name : 'Unknown Student',
        studentUsn: student ? student.usn : 'N/A',
        amount: payment.amount,
        date: payment.date,
        mode: payment.mode,
        collectedBy: payment.collectedBy
      };
    }));

    res.json({
      summary: {
        totalCollected,
        totalDues,
        totalFines,
        activeStudents: studentsList.length
      },
      branchData,
      quotaData,
      modeData,
      recentActivity
    });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET system audit logs (Admin only)
router.get('/audit-logs', authenticate, requireRole(['Admin']), async (req, res) => {
  try {
    const logs = await AuditLog.find();
    // Sort logs by timestamp descending
    const sortedLogs = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(sortedLogs);
  } catch (error) {
    console.error('Fetch audit logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
