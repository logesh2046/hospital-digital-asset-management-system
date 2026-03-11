import DeletedPatient from '../models/DeletedPatient.js';

// GET all deleted patients (patient_admin and admin only)
export const getDeletedPatients = async (req, res) => {
    try {
        const deletedPatients = await DeletedPatient.find()
            .sort({ deletedAt: -1 });
        res.json(deletedPatients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
