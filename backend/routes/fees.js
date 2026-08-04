const express = require('express');
const router = express.Router();
const { FeeStructure, AuditLog } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET all fee structures
router.get('/', authenticate, async (req, res) => {
  try {
    const structures = await FeeStructure.find();
    res.json(structures);
  } catch (error) {
    console.error('Fetch fee structures error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET fee structure for quota and batch
router.get('/quota/:quota', authenticate, async (req, res) => {
  const { quota } = req.params;
  const { batch } = req.query; // academicYear

  try {
    const structure = await FeeStructure.findOne({
      quota,
      academicYear: batch || '2025-26'
    });
    
    if (!structure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }
    
    res.json(structure);
  } catch (error) {
    console.error('Fetch quota fee structure error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST create fee structure (Admin only)
router.post('/', authenticate, requireRole(['Admin']), async (req, res) => {
  const { academicYear, quota, components } = req.body;

  if (!academicYear || !quota || !components || !Array.isArray(components)) {
    return res.status(400).json({ message: 'Invalid fee structure data' });
  }

  try {
    // Check if it already exists
    const existing = await FeeStructure.findOne({ academicYear, quota });
    if (existing) {
      return res.status(400).json({ message: 'Fee structure for this quota and year already exists' });
    }

    // Calculate total
    const totalAmount = components.reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const newStructure = await FeeStructure.create({
      academicYear,
      quota,
      components,
      totalAmount
    });

    // Log Action
    await AuditLog.create({
      action: 'CREATE_FEE_STRUCTURE',
      details: `Created fee structure for ${quota} (${academicYear}) with total ₹${totalAmount}.`,
      performedBy: req.user.name,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(newStructure);
  } catch (error) {
    console.error('Create fee structure error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update fee structure (Admin only)
router.put('/:id', authenticate, requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;
  const { components } = req.body;

  if (!components || !Array.isArray(components)) {
    return res.status(400).json({ message: 'Components array is required' });
  }

  try {
    const structure = await FeeStructure.findById(id);
    if (!structure) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }

    // Calculate total
    const totalAmount = components.reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const updatedStructure = await FeeStructure.findByIdAndUpdate(id, {
      components,
      totalAmount
    });

    // Log Action
    await AuditLog.create({
      action: 'UPDATE_FEE_STRUCTURE',
      details: `Updated fee structure for ${structure.quota} (${structure.academicYear}). New total: ₹${totalAmount}.`,
      performedBy: req.user.name,
      timestamp: new Date().toISOString()
    });

    res.json({
      message: 'Fee structure updated successfully',
      feeStructure: updatedStructure
    });
  } catch (error) {
    console.error('Update fee structure error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
