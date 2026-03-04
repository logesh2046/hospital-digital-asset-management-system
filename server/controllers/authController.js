import User from '../models/User.js';
import Patient from '../models/Patient.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public (or Admin only depending on requirements)
const registerUser = async (req, res) => {
    const { name, email, password, role, department } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'patient',
            department
        });

        // If user is a patient, aggressively link to existing patient record
        if (user.role === 'patient') {
            let patient = await Patient.findOne({ email: user.email });
            if (!patient) {
                // Try to find by exact name (case insensitive) if email match failed
                patient = await Patient.findOne({ fullName: { $regex: new RegExp(`^${user.name}$`, 'i') } });
            }
            if (patient) {
                patient.user = user._id;
                // If the patient didn't have an email on file, add it now from signup
                if (!patient.email) {
                    patient.email = user.email;
                }
                await patient.save();
            }
        }

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
    let { email, password } = req.body;

    try {
        if (email) email = email.trim().toLowerCase();
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { registerUser, loginUser };
