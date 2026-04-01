import Prescription from '../models/Prescription.js';
import Patient from '../models/Patient.js';
import ActivityLog from '../models/ActivityLog.js';
import Report from '../models/Report.js';
import sendEmail from '../utils/sendEmail.js';

// @desc    Create a new prescription
// @route   POST /api/prescriptions
// @access  Private (Doctor)
const createPrescription = async (req, res) => {
    try {
        const { patientId, medicalNotes, medicines, nextVisitDate } = req.body;
        const file = req.file;

        // Role Check
        if (req.user.role !== 'doctor') {
            return res.status(403).json({ message: 'Only doctors can create prescriptions' });
        }

        // Validate Patient
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const prescription = new Prescription({
            patient: patientId,
            doctor: req.user._id,
            medicalNotes,
            medicines: JSON.parse(medicines || '[]'), // Assuming medicines are sent as JSON string
            nextVisitDate,
            filePath: file ? (file.path.startsWith('http') ? `api/redirect?url=${encodeURIComponent(file.path)}` : file.path) : undefined
        });

        await prescription.save();

        // Update Patient's next visit and assigned doctor explicitly
        patient.assignedDoctor = req.user._id;
        patient.doctorName = req.user.name;
        if (nextVisitDate) {
            patient.nextVisitDate = nextVisitDate;
        }
        await patient.save();

        console.log(`Prescription created successfully for patient: ${patient._id}, by doctor: ${req.user.name}`);

        // Send Email Notification
        if (patient.email) {
            try {
                let emailMessage = `Dear ${patient.fullName},\n\n`;
                emailMessage += `You have received a new prescription from Dr. ${req.user.name}.\n\n`;
                emailMessage += `**Medical Notes:**\n${medicalNotes}\n\n`;

                if (nextVisitDate) {
                    emailMessage += `**Next Visit Date:** ${new Date(nextVisitDate).toDateString()}\n\n`;
                }

                if (file) {
                    emailMessage += `A digital prescription file has been attached to your record.\n\n`;
                }

                emailMessage += `Please log in to your portal to view the full details and download any attachments.\n`;
                emailMessage += `http://localhost:5173/login\n\n`;
                emailMessage += `Best regards,\nMediVault Hospital Team`;

                await sendEmail({
                    email: patient.email,
                    subject: `New Prescription from Dr. ${req.user.name} - MediVault`,
                    message: emailMessage
                });
                console.log(`Prescription email sent to ${patient.email}`);
            } catch (emailError) {
                console.error('Failed to send prescription email:', emailError);
                // Continue execution; do not fail the request just because email failed
            }
        }

        await ActivityLog.create({
            user: req.user._id,
            action: 'CREATE_PRESCRIPTION',
            details: `Prescribed for ${patient.fullName}`
        });

        res.status(201).json(prescription);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get prescriptions for a patient
// @route   GET /api/prescriptions/patient/:id
// @access  Private (Doctor/Patient/Admin)
const getPatientPrescriptions = async (req, res) => {
    try {
        const prescriptions = await Prescription.find({ patient: req.params.id })
            .populate('doctor', 'name specialization')
            .sort({ createdAt: -1 });

        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export { createPrescription, getPatientPrescriptions };
