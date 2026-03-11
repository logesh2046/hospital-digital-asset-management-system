import Patient from '../models/Patient.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import DeletedPatient from '../models/DeletedPatient.js';

const getPatients = async (req, res) => {
    try {
        let patients;
        // If doctor, only show assigned patients? Or all? Usually doctors can access all but focused on theirs.
        // For strict privacy, only assigned.
        if (req.user.role === 'doctor') {
            patients = await Patient.find({ assignedDoctor: req.user._id });
        } else if (req.user.role === 'technician') {
            patients = await Patient.find({ assignedTechnician: req.user._id });
        } else if (req.user.role === 'admin' || req.user.role === 'receptionist' || req.user.role === 'staff' || req.user.role === 'patient_admin') {
            patients = await Patient.find({}).populate('createdBy', 'name email');
        } else {
            return res.status(403).json({ message: 'Not authorized' });
        }
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createPatient = async (req, res) => {
    const { fullName, dateOfBirth, gender, contactNumber, doctorName, nextVisitDate, email, address } = req.body;

    try {
        // 1. Check for Duplicate Patient (by Email)
        if (email) {
            const existingPatient = await Patient.findOne({ email });
            if (existingPatient) {
                return res.status(409).json({ message: 'Patient with this email already exists.' });
            }
        }

        // 2. Find Assigned Doctor by Name
        let doctorId = null;
        if (doctorName) {
            // Case-insensitive search for doctor
            const doctor = await User.findOne({
                role: 'doctor',
                name: { $regex: new RegExp(`^${doctorName.trim()}$`, 'i') }
            });

            if (doctor) {
                doctorId = doctor._id;
            } else {
                // If doctor not found by name, try generic search or leave null
                // Ideally we should return an error if a doctor is mandatory
                console.warn(`Doctor '${doctorName}' not found.`);
            }
        }

        // 3. Check for User Account Link (if they have signed up already)
        let userId = null;
        if (email) {
            const user = await User.findOne({ email });
            if (user) {
                userId = user._id;
            }
        }

        const patient = new Patient({
            fullName,
            dateOfBirth,
            gender,
            contactNumber,
            assignedDoctor: doctorId, // Link the found doctor
            doctorName, // Raw text name
            nextVisitDate,
            email,
            address,
            user: userId,
            createdBy: req.user._id
        });

        const createdPatient = await patient.save();

        await ActivityLog.create({
            user: req.user._id,
            action: 'CREATED_PATIENT',
            details: `Created patient ${createdPatient.fullName} (Assigned to: ${doctorName || 'None'})`
        });

        res.status(201).json(createdPatient);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getPatientById = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id).populate('assignedDoctor', 'name email');
        if (patient) {
            res.json(patient);
        } else {
            res.status(404).json({ message: 'Patient not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMe = async (req, res) => {
    try {
        const patient = await Patient.findOne({ user: req.user._id }).populate('assignedDoctor', 'name email');
        if (patient) {
            res.json(patient);
        } else {
            res.status(404).json({ message: 'Patient profile not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateMe = async (req, res) => {
    try {
        const { contactNumber, address, gender, dateOfBirth, fullName } = req.body;
        const patient = await Patient.findOne({ user: req.user._id });

        if (!patient) {
            return res.status(404).json({ message: 'Patient profile not found' });
        }

        if (fullName !== undefined) patient.fullName = fullName;
        if (contactNumber !== undefined) patient.contactNumber = contactNumber;
        if (address !== undefined) patient.address = address;
        if (gender !== undefined) patient.gender = gender;
        if (dateOfBirth !== undefined) patient.dateOfBirth = dateOfBirth;

        const updatedPatient = await patient.save();

        await ActivityLog.create({
            user: req.user._id,
            action: 'UPDATE_PROFILE',
            details: `Patient ${updatedPatient.fullName} updated their profile`
        });

        res.json(updatedPatient);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updatePatient = async (req, res) => {
    try {
        const { fullName, age, gender, contactNumber, email, address, doctorName, nextVisitDate, department, status, lastVisit, technicianName, requestedReport } = req.body;
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Only logic matching update mapping. Handle age conversion if age provided (or keep same)
        if (fullName) patient.fullName = fullName;
        if (gender) patient.gender = gender;
        if (contactNumber) patient.contactNumber = contactNumber;
        if (email) patient.email = email;
        if (address) patient.address = address;
        if (status) patient.status = status;
        if (lastVisit) patient.lastVisit = lastVisit;

        let doctorId = patient.assignedDoctor;
        if (doctorName) {
            const doctor = await User.findOne({
                role: 'doctor',
                name: { $regex: new RegExp(`^${doctorName.trim()}$`, 'i') }
            });
            if (doctor) {
                doctorId = doctor._id;
            }
        }
        patient.assignedDoctor = doctorId;

        if (doctorName !== undefined) patient.doctorName = doctorName;
        if (nextVisitDate !== undefined) patient.nextVisitDate = nextVisitDate;

        let technicianId = patient.assignedTechnician;
        if (technicianName) {
            const technician = await User.findOne({
                role: 'technician',
                name: { $regex: new RegExp(`^${technicianName.trim()}$`, 'i') }
            });
            if (technician) {
                technicianId = technician._id;
            }
        }
        patient.assignedTechnician = technicianId;
        if (technicianName !== undefined) patient.technicianName = technicianName;
        if (requestedReport !== undefined) patient.requestedReport = requestedReport;

        // If age is provided separately in body, convert it to dob
        if (req.body.dateOfBirth) {
            patient.dateOfBirth = req.body.dateOfBirth;
        }

        const updatedPatient = await patient.save();

        await ActivityLog.create({
            user: req.user._id,
            action: 'UPDATE_PATIENT',
            details: `Updated patient ${updatedPatient.fullName}`
        });

        res.json(updatedPatient);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deletePatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id).populate('createdBy', 'name email role');

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const reason = req.body?.reason || 'No reason provided';

        // Archive patient record before deletion
        await DeletedPatient.create({
            originalId: patient._id.toString(),
            medicalRecordNumber: patient.medicalRecordNumber,
            fullName: patient.fullName,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            address: patient.address,
            contactNumber: patient.contactNumber,
            email: patient.email,
            bloodGroup: patient.bloodGroup,
            allergies: patient.allergies,
            medicalHistory: patient.medicalHistory,
            doctorName: patient.doctorName,
            department: patient.department,
            technicianName: patient.technicianName,
            requestedReport: patient.requestedReport,
            nextVisitDate: patient.nextVisitDate,
            admissionStatus: patient.admissionStatus,
            status: patient.status,
            lastVisit: patient.lastVisit,
            patientCreatedAt: patient.createdAt,
            createdBy: {
                name: patient.createdBy?.name || 'Unknown',
                email: patient.createdBy?.email || '',
                role: patient.createdBy?.role || ''
            },
            deletedBy: req.user._id,
            deletedByName: req.user.name,
            deletedByEmail: req.user.email,
            deletionReason: reason
        });

        await Patient.deleteOne({ _id: req.params.id });

        await ActivityLog.create({
            user: req.user._id,
            action: 'DELETE_PATIENT',
            details: `Deleted patient ${patient.fullName} – Reason: ${reason}`
        });

        res.json({ message: 'Patient removed and archived successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { getPatients, createPatient, getPatientById, updatePatient, deletePatient, getMe, updateMe };
