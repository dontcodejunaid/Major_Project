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

    const feeStructures = await require('../db').FeeStructure.find();
    const deadlines = await require('../db').Deadline.find();

    const feeMap = {};
    feeStructures.forEach(fs => {
      feeMap[`${fs.academicYear}_${fs.quota}`] = fs;
    });

    const deadlineMap = {};
    deadlines.forEach(dl => {
      deadlineMap[dl.academicYear] = dl;
    });

    const paymentsByStudent = {};
    paymentsList.forEach(p => {
      const sId = String(p.studentId);
      if (!paymentsByStudent[sId]) paymentsByStudent[sId] = [];
      paymentsByStudent[sId].push(p);
    });

    // Process students in-memory for instant response
    for (const student of studentsList) {
      const fs = feeMap[`${student.batch || '2025-26'}_${student.quota}`];
      const totalFee = fs ? fs.totalAmount : 0;
      const sPayments = paymentsByStudent[String(student._id)] || [];
      const amountPaid = sPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const balanceDueBeforeFine = Math.max(0, totalFee - amountPaid);
      
      let fine = 0;
      if (balanceDueBeforeFine > 0) {
        const dl = deadlineMap[student.batch || '2025-26'];
        if (dl && dl.dueDate) {
          const today = new Date();
          const dueDate = new Date(dl.dueDate);
          if (today > dueDate) {
            const diffTime = Math.abs(today - dueDate);
            const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            fine = daysOverdue * (Number(dl.finePerDay) || 0);
          }
        }
      }

      totalDues += balanceDueBeforeFine;
      totalFines += fine;

      // Group collections by branch
      const branch = student.branch || 'Other';
      branchCollections[branch] = (branchCollections[branch] || 0) + amountPaid;

      // Group collections by quota
      const quota = student.quota || 'Other';
      quotaCollections[quota] = (quotaCollections[quota] || 0) + amountPaid;
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

// GET download DAY BOOK 2026-27 Excel file (Admin and Staff)
router.get('/daybook/export', authenticate, requireRole(['Admin', 'Staff']), async (req, res) => {
  try {
    const { syncDayBookExcel, DAYBOOK_EXCEL_PATH } = require('../utils/excelSync');
    const payments = await Payment.find();
    const students = await Student.find();

    const filePath = syncDayBookExcel(payments, students);
    if (!filePath || !require('fs').existsSync(filePath)) {
      return res.status(500).json({ message: 'Failed to generate Day Book Excel file' });
    }

    res.download(filePath, 'DAY_BOOK_2026-27.xlsx');
  } catch (error) {
    console.error('Day Book Excel export error:', error);
    res.status(500).json({ message: 'Server error generating Excel file' });
  }
});

// POST trigger manual Day Book Excel sync
router.post('/daybook/sync', authenticate, requireRole(['Admin', 'Staff']), async (req, res) => {
  try {
    const { syncDayBookExcel, DAYBOOK_EXCEL_PATH } = require('../utils/excelSync');
    const payments = await Payment.find();
    const students = await Student.find();

    syncDayBookExcel(payments, students);

    // Audit Log
    await AuditLog.create({
      action: 'EXCEL_SYNC',
      details: `Day Book Excel file synchronized (${payments.length} transactions recorded).`,
      performedBy: req.user.name,
      timestamp: new Date().toISOString()
    });

    res.json({
      message: 'Day Book Excel synchronized successfully',
      filePath: DAYBOOK_EXCEL_PATH,
      totalTransactions: payments.length
    });
  } catch (error) {
    console.error('Day Book Excel sync error:', error);
    res.status(500).json({ message: 'Server error syncing Excel file' });
  }
});

module.exports = router;

