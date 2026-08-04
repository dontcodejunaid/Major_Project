const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_fee_management_system';

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register user (Admin only)
router.post('/register', authenticate, requireRole(['Admin']), async (req, res) => {
  const { name, email, role, password, studentId } = req.body;

  if (!name || !email || !role || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      name,
      email,
      role,
      passwordHash,
      studentId: studentId || null
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        studentId: newUser.studentId
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user details
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// GET all users (Admin only)
router.get('/', authenticate, requireRole(['Admin']), async (req, res) => {
  try {
    const users = await User.find();
    // Return users without passwordHash for security
    const sanitizedUsers = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId
    }));
    res.json(sanitizedUsers);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE user account (Admin only)
router.delete('/:id', authenticate, requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;
  if (req.user._id === id || req.user.id === id) {
    return res.status(400).json({ message: 'Access denied. You cannot delete your own admin login account.' });
  }
  try {
    const userToDel = await User.findById(id);
    if (!userToDel) {
      return res.status(404).json({ message: 'User account not found.' });
    }
    await User.findByIdAndDelete(id);
    res.json({ message: `User account for ${userToDel.name} deleted successfully.` });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
