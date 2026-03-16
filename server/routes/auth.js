const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../db');

const router = express.Router();

router.post('/login',
    [
        body('email').isEmail().withMessage('Please enter a valid email address.'),
        body('password').notEmpty().withMessage('Password is required.'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            const user = rows[0];

            if (!user) {
                return res.status(401).json({ message: 'Invalid email or password.' });
            }

            const match = await bcrypt.compare(password, user.password_hash);
            if (!match) {
                return res.status(401).json({ message: 'Invalid email or password.' });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role, name: user.name },
                process.env.JWT_SECRET || 'hackathon_secret',
                { expiresIn: '1d' }
            );

            res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error during login.' });
        }
    }
);

// We define a mock OTP reset since there is no real email service.
router.post('/reset-password-otp',
    [
        body('email').isEmail().withMessage('Please enter a valid email address.'),
        body('otp').isLength({ min: 4 }).withMessage('OTP must be at least 4 digits.')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        // In a real app we would check the OTP code in the database.
        // Here we just return success so the frontend flow can continue.
        res.json({ message: 'OTP verified successfully.' });
    }
);

// Register a new user
router.post('/register',
    [
        body('email').isEmail().withMessage('Please enter a valid email address.'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
        body('name').notEmpty().withMessage('Name is required.'),
        body('role').isIn(['manager', 'staff']).withMessage('Invalid role selected.')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, name, role } = req.body;

        try {
            // Check if email already exists
            const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
            if (existing.length > 0) {
                return res.status(400).json({ message: 'Email is already in use.' });
            }

            // Hash password
            const saltRounds = 10;
            const password_hash = await bcrypt.hash(password, saltRounds);

            // Insert new user
            const [result] = await db.query(
                'INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)',
                [email, password_hash, role, name]
            );

            // Generate token directly to auto-login
            const token = jwt.sign(
                { id: result.insertId, email, role, name },
                process.env.JWT_SECRET || 'hackathon_secret',
                { expiresIn: '1d' }
            );

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: { id: result.insertId, email, name, role }
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error during registration.' });
        }
    }
);

module.exports = router;
