import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const createAdmin = async () => {
    try {
        console.log('Connecting to MongoDB...');
        // This will use the MONGO_URI in your .env file
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const email = 'admin@kmch.com';
        const password = 'AdminPassword123!';

        // Check if admin already exists
        let adminUser = await User.findOne({ email });

        if (adminUser) {
            console.log(`⚠️ Admin user ${email} already exists! Updating role to admin just in case.`);
            adminUser.role = 'admin';
            await adminUser.save();
        } else {
            console.log(`Creating new Admin user: ${email}`);
            adminUser = await User.create({
                name: 'System Admin',
                email: email,
                password: password,
                role: 'admin',
                department: 'Administration',
                contactNumber: '0000000000',
                isActive: true
            });
            console.log('✅ Admin user created successfully!');
            console.log('-----------------------------------');
            console.log(`Email: ${email}`);
            console.log(`Password: ${password}`);
            console.log('-----------------------------------');
        }

    } catch (error) {
        console.error('❌ Error creating admin:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit();
    }
};

createAdmin();
