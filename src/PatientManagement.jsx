import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

export default function PatientManagement() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    const calculateAge = (dob) => {
        if (!dob) return '';
        const birthDate = new Date(dob);
        if (isNaN(birthDate.getTime())) return '';
        const difference = Date.now() - birthDate.getTime();
        const ageDate = new Date(difference);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const [formData, setFormData] = useState({
        fullName: '',
        dateOfBirth: '',
        age: '',
        gender: '',
        contactNumber: '',
        email: '',
        address: '',
        doctorName: '',
        department: '',
        nextVisitDate: ''
    });

    const [editId, setEditId] = useState(null);
    const [viewPatient, setViewPatient] = useState(null);

    const fetchPatients = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setPatients(data);
            }
        } catch (error) {
            console.error('Error fetching patients:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'dateOfBirth') {
                updated.age = calculateAge(value).toString();
            }
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            const url = editId ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients/${editId}` : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients`;
            const method = editId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : new Date().toISOString(),
                    age: formData.age || calculateAge(formData.dateOfBirth),
                    gender: formData.gender,
                    contactNumber: formData.contactNumber,
                    email: formData.email,
                    address: formData.address,
                    doctorName: formData.doctorName,
                    department: formData.department,
                    nextVisitDate: formData.nextVisitDate
                })
            });

            if (response.ok) {
                alert(`Patient ${editId ? 'updated' : 'registered'} successfully!`);
                handleCancelEdit(); // clears form and editId
                fetchPatients(); // Refresh list
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.message}`);
            }
        } catch (error) {
            console.error(`Error saving patient:`, error);
            alert(`Failed to ${editId ? 'update' : 'create'} patient record.`);
        }
    };



    const handleEdit = (patient) => {
        setFormData({
            fullName: patient.fullName || '',
            dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
            age: calculateAge(patient.dateOfBirth).toString(),
            gender: patient.gender || '',
            contactNumber: patient.contactNumber || '',
            email: patient.email || '',
            address: patient.address || '',
            doctorName: patient.doctorName || patient.assignedDoctor?.name || patient.assignedDoctor || '',
            department: patient.department || '',
            nextVisitDate: patient.nextVisitDate ? new Date(patient.nextVisitDate).toISOString().split('T')[0] : ''
        });
        setEditId(patient._id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setFormData({
            fullName: '',
            dateOfBirth: '',
            age: '',
            gender: '',
            contactNumber: '',
            email: '',
            address: '',
            doctorName: '',
            department: '',
            nextVisitDate: ''
        });
        setEditId(null);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this patient?')) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                fetchPatients();
            } else {
                alert('Failed to delete patient');
            }
        } catch (error) {
            console.error('Error deleting patient:', error);
        }
    };

    const handleView = (patient) => {
        setViewPatient(patient);
    };

    return (
        <div className="flex h-screen bg-[#f3f4f6] text-slate-800">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
                <div className="p-6 flex items-center gap-3 border-b border-gray-100">
                    <div className="w-8 h-8 bg-[#0065a3] rounded-md flex-shrink-0 flex items-center justify-center text-white font-bold">M</div>
                    <span className="text-lg font-bold text-[#0065a3]">MediVault</span>
                </div>

                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-1 px-3">

                        <li>
                            <a href="#" className="flex items-center px-3 py-2 text-sm font-medium text-white bg-[#0065a3] rounded-md shadow-sm">
                                Patients
                            </a>
                        </li>
                        <li>

                        </li>
                    </ul>


                </nav>

                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 mb-3">

                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-700">{user?.name || user?.email || 'Staff Member'}</span>
                            <span className="text-xs text-gray-400 capitalize">{user?.role || 'Staff'}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 py-2 rounded-md transition-colors flex items-center justify-center gap-2"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {/* Page Header */}
                <div className="bg-white border-b border-gray-200 px-8 py-5">
                    <h1 className="text-xl font-bold text-slate-700">Patient Management</h1>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">


                        <div className="lg:col-span-5 flex flex-col gap-6">
                            {/* Total Registered Card */}
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-[#0065a3]">Total Registered</h2>
                                    <p className="text-xs text-gray-500">Active patients in the system</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-[#0065a3] font-bold text-xl">
                                    {patients.length}
                                </div>
                            </div>

                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm sticky top-6">
                                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg font-bold text-[#0065a3] mb-1">{editId ? 'Update Patient Details' : 'Register New Patient'}</h2>
                                        <p className="text-xs text-gray-500">{editId ? 'Modify existing record' : 'Enter details to create a medical record.'}</p>
                                    </div>
                                    {editId && (
                                        <button onClick={handleCancelEdit} type="button" className="text-xs text-red-500 hover:text-red-700 font-semibold border border-red-200 hover:bg-red-50 transition px-3 py-1 rounded">Cancel Edit</button>
                                    )}
                                </div>

                                <div className="p-6">
                                    <form className="space-y-5" onSubmit={handleSubmit}>
                                        {/* Row 1: ID & Date */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-[#0065a3] uppercase tracking-wide mb-1.5">Patient ID</label>
                                                <input
                                                    type="text"
                                                    value="Auto-generated"
                                                    disabled
                                                    className="w-full px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-gray-500 text-sm font-medium cursor-not-allowed"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-[#0065a3] uppercase tracking-wide mb-1.5">Date</label>
                                                <input
                                                    type="text"
                                                    value={new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    disabled
                                                    className="w-full px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-gray-500 text-sm font-medium cursor-not-allowed"
                                                />
                                            </div>
                                        </div>


                                        {/* Full Name */}
                                        <div>
                                            <label className="block text-xs font-bold text-[#0065a3] uppercase tracking-wide mb-1.5">
                                                Full Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="fullName"
                                                value={formData.fullName}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="e.g. Johnathan Doe"
                                                className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#0065a3] uppercase tracking-wide mb-1.5">
                                                Doctor Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="doctorName"
                                                value={formData.doctorName}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="e.g. Dr. John Doe"
                                                className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#0065a3] uppercase tracking-wide mb-2">
                                                Department
                                            </label>
                                            <div className="relative">
                                                <select
                                                    name="department"
                                                    value={formData.department}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all appearance-none bg-white"
                                                >
                                                    <option value="">Select Department</option>
                                                    <option value="Cardiology">Cardiology</option>
                                                    <option value="Neurology">Neurology</option>
                                                    <option value="Orthopedics">Orthopedics</option>
                                                    <option value="Pediatrics">Pediatrics</option>
                                                    <option value="Dermatology">Dermatology</option>
                                                    <option value="General Medicine">General Medicine</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                        </div>


                                        {/* DOB, Age & Gender */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-[#0065a3] uppercase tracking-wide mb-1.5">
                                                    Date of Birth <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    name="dateOfBirth"
                                                    value={formData.dateOfBirth}
                                                    max={new Date().toISOString().split('T')[0]} // Prevents future dates
                                                    onChange={handleInputChange}
                                                    required
                                                    className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-[#0065a3] uppercase tracking-wide mb-1.5">
                                                    Age
                                                </label>
                                                <input
                                                    type="number"
                                                    name="age"
                                                    value={formData.age}
                                                    disabled
                                                    placeholder="Automated"
                                                    className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-500 bg-gray-50 placeholder-gray-400 cursor-not-allowed"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-[#0065a3] uppercase tracking-wide mb-1.5">
                                                    Gender <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        name="gender"
                                                        value={formData.gender}
                                                        onChange={handleInputChange}
                                                        required
                                                        className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all appearance-none bg-white"
                                                    >
                                                        <option value="" disabled>Select</option>
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contact & Address */}
                                        <div>
                                            <label className="block text-xs font-bold text-[#0065a3] uppercase tracking-wide mb-1.5">
                                                Contact & Address <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="contactNumber"
                                                value={formData.contactNumber}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="Contact Number"
                                                className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all mb-3"
                                            />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="Patient Email"
                                                className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all mb-3"
                                            />
                                            <textarea
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                rows="3"
                                                placeholder="Full Address"
                                                className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all resize-none"
                                            ></textarea>
                                        </div>

                                        <button type="submit" className="w-full bg-[#0065a3] hover:bg-[#005080] text-white font-semibold py-3 rounded-md transition-all shadow-md active:scale-[0.98]">
                                            {editId ? 'Update Medical Record' : 'Create Medical Record'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>

                        {/* Patient List (Right) */}
                        <div className="lg:col-span-7">
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full max-h-[800px]">
                                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                                    <h2 className="text-lg font-bold text-[#0065a3]">Patient Directory</h2>
                                    <div className="flex gap-2">
                                        <button className="p-2 text-gray-400 hover:text-[#0065a3] bg-gray-50 rounded-md">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                            </svg>
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-[#0065a3] bg-gray-50 rounded-md">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-y-auto flex-1">
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">
                                            <tr className="border-b border-gray-100">
                                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Age/Sex</th>
                                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan="5" className="py-8 text-center text-gray-500">Loading patients...</td>
                                                </tr>
                                            ) : (
                                                patients.map((patient) => (
                                                    <tr key={patient.medicalRecordNumber || patient._id} className="hover:bg-gray-50/50 transition-colors group">
                                                        <td className="py-3 px-4 text-xs font-bold text-[#0065a3]">{patient.medicalRecordNumber}</td>
                                                        <td className="py-3 px-4 text-sm font-medium text-slate-700">{patient.fullName}</td>
                                                        <td className="py-3 px-4 text-sm text-gray-500">{calculateAge(patient.dateOfBirth)} / {patient.gender === 'Male' ? 'M' : patient.gender === 'Female' ? 'F' : 'O'}</td>
                                                        <td className="py-3 px-4 text-xs text-gray-500 font-mono">{patient.contactNumber}</td>
                                                        <td className="py-3 px-4 text-right">
                                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => handleView(patient)} className="text-xs font-semibold text-[#0065a3] hover:underline">View</button>
                                                                <span className="text-gray-300">|</span>
                                                                <button onClick={() => handleEdit(patient)} className="text-xs font-semibold text-gray-500 hover:text-[#0065a3]">Edit</button>
                                                                <span className="text-gray-300">|</span>
                                                                <button onClick={() => handleDelete(patient._id)} className="text-xs font-semibold text-red-500 hover:text-red-700">Delete</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* View Patient Modal */}
            {viewPatient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-[#0065a3] text-white">
                            <h2 className="text-xl font-bold">Patient Details</h2>
                            <button onClick={() => setViewPatient(null)} className="text-white hover:text-gray-200 transition-colors bg-white/10 rounded-full p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-8">
                            <div><p className="text-xs text-[#0065a3] uppercase tracking-wider font-bold mb-1">Medical Record No.</p><p className="text-base text-gray-800 font-medium">{viewPatient.medicalRecordNumber}</p></div>
                            <div><p className="text-xs text-[#0065a3] uppercase tracking-wider font-bold mb-1">Full Name</p><p className="text-base text-gray-800 font-medium">{viewPatient.fullName}</p></div>
                            <div><p className="text-xs text-[#0065a3] uppercase tracking-wider font-bold mb-1">Age / Gender</p><p className="text-base text-gray-800 font-medium">{calculateAge(viewPatient.dateOfBirth)} / {viewPatient.gender}</p></div>
                            <div><p className="text-xs text-[#0065a3] uppercase tracking-wider font-bold mb-1">Contact Number</p><p className="text-base text-gray-800 font-medium">{viewPatient.contactNumber}</p></div>
                            <div className="col-span-2 sm:col-span-1"><p className="text-xs text-[#0065a3] uppercase tracking-wider font-bold mb-1">Email</p><p className="text-base text-gray-800 font-medium break-words">{viewPatient.email || 'N/A'}</p></div>
                            <div className="col-span-2 sm:col-span-1"><p className="text-xs text-[#0065a3] uppercase tracking-wider font-bold mb-1">Address</p><p className="text-base text-gray-800 font-medium">{viewPatient.address || 'N/A'}</p></div>
                            <div><p className="text-xs text-[#0065a3] uppercase tracking-wider font-bold mb-1">Assigned Doctor</p><p className="text-base text-gray-800 font-medium">{viewPatient.doctorName || viewPatient.assignedDoctor?.name || 'N/A'}</p></div>
                            <div><p className="text-xs text-[#0065a3] uppercase tracking-wider font-bold mb-1">Next Visit Date</p><p className="text-base text-gray-800 font-medium">{viewPatient.nextVisitDate ? new Date(viewPatient.nextVisitDate).toLocaleDateString() : 'N/A'}</p></div>
                            <div><p className="text-xs text-[#0065a3] uppercase tracking-wider font-bold mb-1">Registration Date</p><p className="text-base text-gray-800 font-medium">{new Date(viewPatient.createdAt).toLocaleDateString()}</p></div>
                        </div>
                        <div className="bg-gray-50/50 px-6 py-4 flex justify-end border-t border-gray-100">
                            <button onClick={() => setViewPatient(null)} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md font-semibold hover:bg-gray-50 transition-colors shadow-sm">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
