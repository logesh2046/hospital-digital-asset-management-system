import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

dotenv.config({ path: '.env' });

const resetAll = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hdmas');
        console.log('MongoDB Connected');

        const newPassword = 'password123';

        const users = await User.find({});
        for (let user of users) {
            user.password = newPassword;
            await user.save(); // Presave hook will hash the password
            console.log(`Reset password for: ${user.email}`);
        }

        console.log('\nAll user passwords have been reset to: password123');
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

resetAll();
