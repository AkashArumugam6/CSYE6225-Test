const express = require('express');
const bcrypt = require('bcryptjs');
const basicAuth = require('basic-auth');
const User = require('../models/User');
const router = express.Router();

// Utility function for basic auth
const auth = async (req, res, next) => {
    const credentials = basicAuth(req);
    if (!credentials) {
        return res.status(401).send('Access denied. No credentials provided.');
    }

    const user = await User.findOne({ where: { email: credentials.name } });
    if (!user) {
        return res.status(401).send('Access denied. Invalid email or password.');
    }

    const validPassword = await bcrypt.compare(credentials.pass, user.password_hash);
    if (!validPassword) {
        return res.status(401).send('Access denied. Invalid email or password.');
    }

    req.user = user;  // Attach user to request object
    next();
};

// Create a new user (unauthenticated route)
router.post('/v1/user', async (req, res) => {
    const { first_name, last_name, password, email } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        return res.status(400).send('User with this email already exists.');
    }

    // Hash the password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user in the database
    const user = await User.create({
        first_name,
        last_name,
        email,
        password_hash
    });

    return res.status(201).json({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        account_created: user.account_created,
        account_updated: user.account_updated
    });
});

// Get user information (authenticated route)
router.get('/v1/user/self', auth, async (req, res) => {
    const user = req.user;
    return res.status(200).json({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        account_created: user.account_created,
        account_updated: user.account_updated
    });
});

// Update user information (authenticated route)
router.put('/v1/user/self', auth, async (req, res) => {
    const { first_name, last_name, password } = req.body;

    if (!first_name || !last_name || !password) {
        return res.status(400).send('Invalid request payload.');
    }

    const user = req.user;
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Update user data
    await user.update({
        first_name,
        last_name,
        password_hash,
        account_updated: new Date()
    });

    return res.status(204).send();  // No content response
});

module.exports = router;
