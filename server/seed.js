/**
 * HOSPITAL DIGITAL ASSET MANAGEMENT SYSTEM
 * Seed Script — generates realistic Indian hospital data
 *
 * Creates:
 *   40 Doctors        (various departments)
 *   30 Lab Technicians
 *   40 Receptionists
 *    5 Staff (admin-facing)
 *   30 Patients       (assigned to random doctors)
 *
 * Run: node server/seed.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import User from './models/User.js';
import Patient from './models/Patient.js';

// ── Helpers ────────────────────────────────────────────────────────────────────
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pad = (n) => String(n).padStart(2, '0');

// ── Data banks ─────────────────────────────────────────────────────────────────
const FIRST_NAMES = [
    'Aarav', 'Aditya', 'Akash', 'Amit', 'Anand', 'Arjun', 'Ashwin', 'Deepak', 'Dinesh', 'Ganesh',
    'Harish', 'Harsha', 'Karan', 'Kartik', 'Lokesh', 'Mahesh', 'Manoj', 'Mohan', 'Naveen', 'Nikhil',
    'Pavan', 'Praveen', 'Rahul', 'Rajesh', 'Rakesh', 'Ram', 'Ravi', 'Rohit', 'Sachin', 'Sanjay',
    'Aanya', 'Anitha', 'Anjali', 'Archana', 'Bhavya', 'Deepa', 'Divya', 'Gayathri', 'Geetha', 'Harini',
    'Ishita', 'Janavi', 'Kavitha', 'Keerthana', 'Lakshmi', 'Lavanya', 'Meena', 'Meera', 'Monica', 'Nithya',
    'Padmavathi', 'Pooja', 'Preethi', 'Priya', 'Radha', 'Rekha', 'Saranya', 'Savitha', 'Shreya', 'Sindhu',
    'Sudha', 'Sujatha', 'Supriya', 'Swathi', 'Uma', 'Usha', 'Vanitha', 'Vijaya', 'Yamini', 'Sneha',
    'Vijay', 'Suresh', 'Balaji', 'Selvam', 'Murugan', 'Kannan', 'Saravanan', 'Kumaran', 'Siva', 'Bala'
];

const LAST_NAMES = [
    'Sharma', 'Verma', 'Gupta', 'Kumar', 'Singh', 'Patel', 'Nair', 'Menon', 'Pillai', 'Iyer',
    'Nadar', 'Chettiar', 'Murugan', 'Rajendran', 'Krishnamurthy', 'Subramaniam', 'Venkatesh',
    'Raghavan', 'Balachandran', 'Natarajan', 'Rajan', 'Chandrasekaran', 'Annamalai', 'Sundaram',
    'Karunakaran', 'Parthasarathy', 'Govindarajan', 'Ramachandran', 'Srinivasan', 'Balakrishnan',
    'Pandey', 'Mishra', 'Tiwari', 'Yadav', 'Joshi', 'Shah', 'Mehta', 'Desai', 'Rao', 'Reddy',
    'Naidu', 'Gowda', 'Hegde', 'Shastri', 'Prasad', 'Trivedi', 'Saxena', 'Agarwal', 'Bhatia', 'Malhotra'
];

const DEPARTMENTS_DOCTOR = [
    'General Medicine', 'Internal Medicine', 'Neurology', 'Neurosurgery', 'Psychiatry',
    'Cardiology', 'Cardiothoracic Surgery', 'Orthopedics', 'Rheumatology', 'Pediatrics',
    'Pediatric Surgery', 'Gynecology', 'Obstetrics', 'Endocrinology', 'Gastroenterology',
    'Nephrology', 'Pulmonology', 'Hematology', 'Oncology', 'Ophthalmology',
    'ENT', 'Dermatology', 'Dentistry', 'Emergency Medicine', 'Anesthesiology'
];

const DEPARTMENTS_TECH = [
    'Radiology Department', 'MRI Department', 'CT Scan Department',
    'Pathology / Laboratory', 'Ultrasound Department'
];

const DEPARTMENTS_RECEPTION = ['Front Desk', 'Emergency Reception', 'OPD Reception', 'IPD Reception'];
const DEPARTMENTS_STAFF = ['Administration', 'HR Department', 'Finance', 'IT Department', 'Operations'];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const GENDERS = ['Male', 'Female'];
const ADMISSION = ['In-Patient', 'Out-Patient', 'Discharged'];
const STATUSES = ['Pending', 'Completed'];
const ALLERGIES_LIST = ['Penicillin', 'Sulfa drugs', 'Aspirin', 'Ibuprofen', 'Latex', 'None', 'No known allergies', 'Dust', 'Pollen'];
const MEDICAL_HIST = [
    'Hypertension', 'Diabetes Mellitus Type 2', 'Asthma', 'Chronic Kidney Disease',
    'Hypothyroidism', 'Coronary Artery Disease', 'COPD', 'Migraine', 'None', 'Epilepsy',
    'Anemia', 'Rheumatoid Arthritis', 'Osteoporosis', 'Depression', 'Anxiety Disorder'
];
const REPORT_TYPES = ['Blood Test', 'MRI Scan', 'X-Ray', 'CT Scan', 'Ultrasound', 'ECG', 'Urine Test', 'Biopsy'];

const INDIAN_CITIES = [
    'Chennai, Tamil Nadu', 'Coimbatore, Tamil Nadu', 'Madurai, Tamil Nadu',
    'Mumbai, Maharashtra', 'Pune, Maharashtra', 'Delhi', 'Bengaluru, Karnataka',
    'Hyderabad, Telangana', 'Kolkata, West Bengal', 'Kochi, Kerala',
    'Thiruvananthapuram, Kerala', 'Ahmedabad, Gujarat', 'Jaipur, Rajasthan',
    'Lucknow, Uttar Pradesh', 'Chandigarh'
];

// ── Name generator ─────────────────────────────────────────────────────────────
const usedNames = new Set();
function uniqueName(prefix = '') {
    let name;
    let attempts = 0;
    do {
        name = `${prefix}${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`;
        attempts++;
    } while (usedNames.has(name) && attempts < 200);
    usedNames.add(name);
    return name;
}

const RUN_ID = Date.now().toString().slice(-5); // last 5 digits of timestamp for uniqueness
const usedEmails = new Set();

function makeEmail(name, domain = 'hospital.com') {
    const base = name.toLowerCase()
        .replace(/\s+/g, '.')
        .replace(/[^a-z.]/g, '');
    let email = `${base}.${RUN_ID}@${domain}`;
    let i = 2;
    while (usedEmails.has(email)) {
        email = `${base}${i}.${RUN_ID}@${domain}`;
        i++;
    }
    usedEmails.add(email);
    return email;
}

function phone() {
    const prefixes = ['9', '8', '7', '6'];
    return `+91 ${rand(prefixes)}${randInt(100000000, 999999999)}`;
}

function dob(minAge = 18, maxAge = 75) {
    const now = new Date();
    const year = now.getFullYear() - randInt(minAge, maxAge);
    const month = randInt(1, 12);
    const day = randInt(1, 28);
    return new Date(`${year}-${pad(month)}-${pad(day)}`);
}

function futureDate(daysAhead = 30) {
    const d = new Date();
    d.setDate(d.getDate() + randInt(7, daysAhead));
    return d;
}

// ─────────────────────────────────────────────────────────────────────────────
async function seed() {
    console.log('\n🌱  Hospital Seed Script Starting...');
    console.log('────────────────────────────────────────');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅  Connected to MongoDB');

    const DEFAULT_PASSWORD = 'Hospital@123';

    // ── 1. Create DOCTORS ──────────────────────────────────────────────────────
    console.log('\n👨‍⚕️  Creating 40 Doctors...');
    const doctors = [];
    for (let i = 0; i < 40; i++) {
        const name = uniqueName('Dr. ');
        const dept = rand(DEPARTMENTS_DOCTOR);
        try {
            const doc = await User.create({
                name,
                email: makeEmail(name, 'hospital.com'),
                password: DEFAULT_PASSWORD,
                role: 'doctor',
                department: dept,
                specialization: dept,
                contactNumber: phone(),
                isActive: true,
                isAvailable: Math.random() > 0.2
            });
            doctors.push(doc);
            process.stdout.write(`  ✔ ${name} (${dept})\n`);
        } catch (e) {
            console.warn(`  ⚠ Skipped doctor ${name}: ${e.message}`);
        }
    }
    console.log(`  → Created ${doctors.length} doctors`);

    // ── 2. Create LAB TECHNICIANS ──────────────────────────────────────────────
    console.log('\n🔬  Creating 30 Lab Technicians...');
    const technicians = [];
    for (let i = 0; i < 30; i++) {
        const name = uniqueName();
        const dept = rand(DEPARTMENTS_TECH);
        try {
            const tech = await User.create({
                name,
                email: makeEmail(name, 'hospital.com'),
                password: DEFAULT_PASSWORD,
                role: 'technician',
                department: dept,
                contactNumber: phone(),
                isActive: true,
                isAvailable: Math.random() > 0.15
            });
            technicians.push(tech);
            process.stdout.write(`  ✔ ${name} (${dept})\n`);
        } catch (e) {
            console.warn(`  ⚠ Skipped technician ${name}: ${e.message}`);
        }
    }
    console.log(`  → Created ${technicians.length} technicians`);

    // ── 3. Create RECEPTIONISTS ────────────────────────────────────────────────
    console.log('\n🗂️  Creating 40 Receptionists...');
    const receptionists = [];
    for (let i = 0; i < 40; i++) {
        const name = uniqueName();
        const dept = rand(DEPARTMENTS_RECEPTION);
        try {
            const rec = await User.create({
                name,
                email: makeEmail(name, 'hospital.com'),
                password: DEFAULT_PASSWORD,
                role: 'receptionist',
                department: dept,
                contactNumber: phone(),
                isActive: true,
                isAvailable: true
            });
            receptionists.push(rec);
            process.stdout.write(`  ✔ ${name} (${dept})\n`);
        } catch (e) {
            console.warn(`  ⚠ Skipped receptionist ${name}: ${e.message}`);
        }
    }
    console.log(`  → Created ${receptionists.length} receptionists`);

    // ── 4. Create STAFF ────────────────────────────────────────────────────────
    console.log('\n🏥  Creating 5 Staff...');
    const staffMembers = [];
    for (let i = 0; i < 5; i++) {
        const name = uniqueName();
        const dept = rand(DEPARTMENTS_STAFF);
        try {
            const s = await User.create({
                name,
                email: makeEmail(name, 'hospital.com'),
                password: DEFAULT_PASSWORD,
                role: 'staff',
                department: dept,
                contactNumber: phone(),
                isActive: true
            });
            staffMembers.push(s);
            process.stdout.write(`  ✔ ${name} (${dept})\n`);
        } catch (e) {
            console.warn(`  ⚠ Skipped staff ${name}: ${e.message}`);
        }
    }
    console.log(`  → Created ${staffMembers.length} staff`);

    // ── 5. Create PATIENTS ────────────────────────────────────────────────────
    console.log('\n🧑‍⚕️  Creating 30 Patients...');
    const creatorPool = [...receptionists];
    let patientCount = 0;

    // Get current patient count to generate non-colliding MRNs
    const existingPatientCount = await Patient.countDocuments();
    const year = new Date().getFullYear();

    for (let i = 0; i < 30; i++) {
        const name = uniqueName();
        const gender = rand(GENDERS);
        const assignedDoc = doctors.length > 0 ? rand(doctors) : null;
        const createdByUser = creatorPool.length > 0 ? rand(creatorPool) : null;
        const techAssigned = technicians.length > 0 ? rand(technicians) : null;
        const mrnSeq = existingPatientCount + patientCount + 1;
        const mrn = `MRN${year}${String(mrnSeq).padStart(6, '0')}${RUN_ID}`;

        try {
            await Patient.create({
                medicalRecordNumber: mrn,
                fullName: name,
                dateOfBirth: dob(18, 75),
                gender,
                contactNumber: phone(),
                email: makeEmail(name, 'gmail.com'),
                address: `${randInt(1, 999)}, ${rand(['MG Road', 'Anna Salai', 'Gandhi Nagar', 'Nehru Street', 'Rajaji Road'])}, ${rand(INDIAN_CITIES)}`,
                bloodGroup: rand(BLOOD_GROUPS),
                allergies: rand(ALLERGIES_LIST),
                medicalHistory: rand(MEDICAL_HIST),
                assignedDoctor: assignedDoc?._id || null,
                doctorName: assignedDoc?.name || null,
                assignedTechnician: techAssigned?._id || null,
                technicianName: techAssigned?.name || null,
                requestedReport: rand(REPORT_TYPES),
                nextVisitDate: futureDate(45),
                admissionStatus: rand(ADMISSION),
                status: rand(STATUSES),
                createdBy: createdByUser?._id || null,
            });
            patientCount++;
            process.stdout.write(`  ✔ Patient [${mrn}]: ${name} → ${assignedDoc?.name || 'Unassigned'}\n`);
        } catch (e) {
            console.warn(`  ⚠ Skipped patient ${name}: ${e.message}`);
        }
    }
    console.log(`  → Created ${patientCount} patients`);

    // ── Summary ────────────────────────────────────────────────────────────────
    console.log('\n────────────────────────────────────────');
    console.log('🎉  Seed Complete! Summary:');
    console.log(`    👨‍⚕️  Doctors       : ${doctors.length}`);
    console.log(`    🔬  Technicians   : ${technicians.length}`);
    console.log(`    🗂️  Receptionists : ${receptionists.length}`);
    console.log(`    🏥  Staff         : ${staffMembers.length}`);
    console.log(`    🧑‍⚕️  Patients      : ${patientCount}`);
    console.log('\n📋  Default Login Password for all seeded accounts: Hospital@123');
    console.log('────────────────────────────────────────\n');

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌  Seed failed:', err);
    mongoose.disconnect();
    process.exit(1);
});
