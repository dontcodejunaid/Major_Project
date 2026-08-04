const express = require('express');
const router = express.Router();
const { Deadline, AuditLog } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET all deadlines
router.get('/', authenticate, async (req, res) => {
  try {
    const deadlines = await Deadline.find();
    res.json(deadlines);
  } catch (error) {
    console.error('Fetch deadlines error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET deadline for a batch
router.get('/batch/:batch', authenticate, async (req, res) => {
  const { batch } = req.params;

  try {
    const deadline = await Deadline.findOne({ academicYear: batch });
    if (!deadline) {
      return res.status(404).json({ message: 'Deadline not set for this academic year' });
    }
    res.json(deadline);
  } catch (error) {
    console.error('Fetch deadline by batch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST create or update deadline (Admin only)
router.post('/', authenticate, requireRole(['Admin']), async (req, res) => {
  const { academicYear, dueDate, finePerDay } = req.body;

  if (!academicYear || !dueDate || finePerDay === undefined) {
    return res.status(400).json({ message: 'Academic year, due date, and fine per day are required' });
  }

  try {
    // Check if deadline already exists for this year
    const existing = await Deadline.findOne({ academicYear });
    let deadline;

    if (existing) {
      // Update
      deadline = await Deadline.findByIdAndUpdate(existing._id, {
        dueDate,
        finePerDay: Number(finePerDay)
      });
      
      // Log Action
      await AuditLog.create({
        action: 'UPDATE_DEADLINE',
        details: `Updated deadline for ${academicYear}. New due date: ${dueDate}, fine: ₹${finePerDay}/day.`,
        performedBy: req.user.name,
        timestamp: new Date().toISOString()
      });
    } else {
      // Create new
      deadline = await Deadline.create({
        academicYear,
        dueDate,
        finePerDay: Number(finePerDay)
      });

      // Log Action
      await AuditLog.create({
        action: 'CREATE_DEADLINE',
        details: `Created deadline for ${academicYear}. Due date: ${dueDate}, fine: ₹${finePerDay}/day.`,
        performedBy: req.user.name,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      message: 'Deadline saved successfully',
      deadline
    });
  } catch (error) {
    console.error('Save deadline error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
