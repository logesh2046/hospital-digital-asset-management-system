import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

export default function DoctorDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeView, setActiveView] = useState('patients');
    const [patients, setPatients] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);

    // Availability State
    const [isAvailable, setIsAvailable] = useState(user?.isAvailable !== false);

    const toggleAvailability = async () => {
        try {
            const token = localStorage.getItem('token');
            const newStatus = !isAvailable;
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/availability`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isAvailable: newStatus })
            });

            if (response.ok) {
                setIsAvailable(newStatus);
                const storedUser = JSON.parse(localStorage.getItem('user'));
                if (storedUser) {
                    storedUser.isAvailable = newStatus;
                    localStorage.setItem('user', JSON.stringify(storedUser));
                }
            }
        } catch (error) {
            console.error('Error toggling availability:', error);
        }
    };

    // Quick Prescribe State
    const [prescribeForm, setPrescribeForm] = useState({
        patientId: '',
        name: '',
        email: '',
        medicalNotes: '',
        nextVisit: '',
        doctorNotes: ''
    });
    const fileInputRef = useRef(null);

    const handlePrescribeChange = (e) => {
        const { name, value } = e.target;
        setPrescribeForm(prev => ({ ...prev, [name]: value }));

        // Auto-fill name if email matches
        if (name === 'email') {
            const foundPatient = patients.find(p => p.email?.toLowerCase() === value.toLowerCase());
            if (foundPatient) {
                setPrescribeForm(prev => ({ ...prev, patientId: foundPatient._id, name: foundPatient.fullName, email: value }));
            }
        }
    };

    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handlePrescribeSubmit = async () => {
        let patient = null;

        if (prescribeForm.patientId) {
            patient = patients.find(p => p._id === prescribeForm.patientId);
        } else if (prescribeForm.email) {
            patient = patients.find(p => p.email?.toLowerCase() === prescribeForm.email.toLowerCase());
        }

        if (!patient) {
            alert('Patient not found. Please select a valid patient from the list or ensure their email is correct.');
            return;
        }

        const formData = new FormData();
        formData.append('patientId', patient._id);
        formData.append('medicalNotes', prescribeForm.medicalNotes);
        formData.append('nextVisitDate', prescribeForm.nextVisit);
        // Medicines not yet in UI, sending empty array
        formData.append('medicines', JSON.stringify([]));

        if (selectedFile) {
            formData.append('file', selectedFile);
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/prescriptions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                alert('Prescription created successfully!');
                setPrescribeForm({
                    patientId: '',
                    name: '',
                    email: '',
                    medicalNotes: '',
                    nextVisit: '',
                    doctorNotes: ''
                });
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                const err = await response.json();
                alert(`Error: ${err.message}`);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to submit prescription.');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };

                if (activeView === 'overview' || activeView === 'patients' || activeView === 'completed') {
                    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients`, { headers });
                    if (response.ok) {
                        const data = await response.json();
                        setPatients(data);
                    }
                }

                if (activeView === 'reports' || activeView === 'completed_reports') {
                    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reports`, { headers });
                    if (response.ok) {
                        const data = await response.json();
                        setReports(data);
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeView]);

    const baseFilteredPatients = patients.filter(p =>
        p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.medicalRecordNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pendingPatients = baseFilteredPatients.filter(p => p.status !== 'Completed');
    const completedPatients = baseFilteredPatients.filter(p => p.status === 'Completed');

    const baseFilteredReports = reports.filter(r =>
        r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.patient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pendingReports = baseFilteredReports.filter(r => r.status !== 'Reviewed');
    const completedReports = baseFilteredReports.filter(r => r.status === 'Reviewed');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const metrics = {
        assignedToday: patients.filter(p => new Date(p.createdAt) >= todayStart).length,
        viewedToday: patients.filter(p => p.status === 'Completed' && p.lastVisit && new Date(p.lastVisit) >= todayStart).length,
        remainingOverall: patients.filter(p => p.status !== 'Completed').length
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleMarkAsCompleted = async (patientId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients/${patientId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'Completed', lastVisit: new Date().toISOString() })
            });

            if (response.ok) {
                // Instantly update UI instead of re-fetching
                setPatients(prev => prev.map(p => p._id === patientId ? { ...p, status: 'Completed', lastVisit: new Date().toISOString() } : p));
            } else {
                alert('Failed to mark patient as completed');
            }
        } catch (error) {
            console.error(error);
            alert('Error updating patient status');
        }
    };

    const handleMarkReportAsViewed = async (reportId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reports/${reportId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'Reviewed' })
            });

            if (response.ok) {
                // Instantly update UI
                setReports(prev => prev.map(r => r._id === reportId ? { ...r, status: 'Reviewed' } : r));
            } else {
                alert('Failed to mark report as viewed');
            }
        } catch (error) {
            console.error(error);
            alert('Error updating report status');
        }
    };

    return (
        <div className="flex h-screen bg-[#f8fafc] text-slate-800">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="p-6 border-b border-gray-100 flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#0065a3] rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">M</div>
                    <span className="text-xl font-bold text-[#0065a3] tracking-tight">MediVault</span>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    <div className="px-3 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Main</div>
                    <button onClick={() => setActiveView('overview')} className={`flex w-full items-center px-3 py-2.5 text-sm font-medium rounded-lg shadow-sm transition-all group ${activeView === 'overview' ? 'text-white bg-[#0065a3]' : 'text-slate-600 hover:text-[#0065a3] hover:bg-blue-50/50'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`mr-3 ${activeView === 'overview' ? 'text-white' : 'text-slate-400 group-hover:text-[#0065a3]'}`}><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
                        Overview
                    </button>
                    <button onClick={() => setActiveView('patients')} className={`flex w-full items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all group ${activeView === 'patients' ? 'text-white bg-[#0065a3]' : 'text-slate-600 hover:text-[#0065a3] hover:bg-blue-50/50'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`mr-3 ${activeView === 'patients' ? 'text-white' : 'text-slate-400 group-hover:text-[#0065a3]'}`}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        Pending Patients
                    </button>
                    <button onClick={() => setActiveView('completed')} className={`flex w-full items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all group mt-1 ${activeView === 'completed' ? 'text-white bg-[#0065a3]' : 'text-slate-600 hover:text-[#0065a3] hover:bg-blue-50/50'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`mr-3 ${activeView === 'completed' ? 'text-white' : 'text-slate-400 group-hover:text-[#0065a3]'}`}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>
                        Viewed Patients
                    </button>


                    <div className="px-3 mb-2 mt-8 text-xs font-bold text-gray-400 uppercase tracking-wider">Clinical</div>
                    <button onClick={() => setActiveView('reports')} className={`flex w-full items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all group ${activeView === 'reports' ? 'text-white bg-[#0065a3]' : 'text-slate-600 hover:text-[#0065a3] hover:bg-blue-50/50'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`mr-3 ${activeView === 'reports' ? 'text-white' : 'text-slate-400 group-hover:text-[#0065a3]'}`}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                        Pending Reports & Labs
                    </button>
                    <button onClick={() => setActiveView('completed_reports')} className={`flex w-full items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all group mt-1 ${activeView === 'completed_reports' ? 'text-white bg-[#0065a3]' : 'text-slate-600 hover:text-[#0065a3] hover:bg-blue-50/50'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`mr-3 ${activeView === 'completed_reports' ? 'text-white' : 'text-slate-400 group-hover:text-[#0065a3]'}`}><rect width="18" height="18" x="3" y="3" rx="2" /><path d="m9 12 2 2 4-4" /></svg>
                        Viewed Reports
                    </button>

                </nav>

                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="relative">
                            <img
                                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=100&h=100"
                                alt="User Avatar"
                                className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
                            />
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">{user?.name || 'Dr. Unknown'}</span>
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{user?.role === 'doctor' ? (user?.specialization || user?.department || 'General Physician') : user?.role || 'Doctor'}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 py-2 rounded-md transition-colors flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative">
                {/* Header */}
                <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-4 z-10 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">{activeView === 'patients' ? 'Assigned Patients' : activeView === 'completed' ? 'Viewed Patients' : activeView === 'reports' ? 'Reports & Labs' : activeView === 'completed_reports' ? 'Viewed Reports' : 'Dashboard Overview'}</h1>
                        <p className="text-sm text-gray-500">{activeView === 'patients' ? 'Manage your patient list and daily appointments' : activeView === 'completed' ? 'History of patients you have already seen and treated' : activeView === 'reports' ? 'Review unread patient diagnosis reports' : activeView === 'completed_reports' ? 'History of reports you have already reviewed' : 'Welcome back to your dashboard'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 border-r border-gray-200 pr-4 mr-1">
                            <span className={`text-sm font-bold ${isAvailable ? 'text-green-600' : 'text-gray-400'}`}>
                                {isAvailable ? 'Available for Patients' : 'Not Available'}
                            </span>
                            <button
                                onClick={toggleAvailability}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}
                                title={isAvailable ? "Set as Not Available" : "Set as Available"}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search patients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-[#0065a3]/20 w-64 transition-all"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <button className="bg-[#0065a3] hover:bg-[#005080] text-white p-2 rounded-full shadow-sm transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </header>

                <div className="max-w-[1600px] mx-auto p-4 sm:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Main Table (8 cols) */}
                        {/* Main Table (8 cols) */}
                        <div className="lg:col-span-8">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {(activeView === 'patients' || activeView === 'completed') && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-100">
                                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Patient Name</th>
                                                    <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                                                    <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Age/Sex</th>
                                                    <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                                    <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {loading ? (
                                                    <tr><td colSpan="6" className="py-8 text-center text-gray-500">Loading patients...</td></tr>
                                                ) : (activeView === 'patients' ? pendingPatients : completedPatients).length > 0 ? (activeView === 'patients' ? pendingPatients : completedPatients).map((patient, idx) => (
                                                    <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#0065a3] flex items-center justify-center font-bold text-sm shadow-sm">
                                                                    {patient.fullName.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <span className="block text-sm font-bold text-slate-700 group-hover:text-[#0065a3] transition-colors">{patient.fullName}</span>
                                                                    <span className="text-xs text-gray-400">Last: {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 text-xs font-mono text-gray-500">{patient.medicalRecordNumber}</td>
                                                        <td className="py-4 px-4 text-sm text-gray-600">
                                                            {patient.dateOfBirth ? Math.floor((new Date() - new Date(patient.dateOfBirth)) / 31557600000) : 'N/A'} / {patient.gender?.charAt(0)}
                                                        </td>
                                                        <td className="py-4 px-4 text-xs text-gray-500">{patient.contactNumber}</td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex flex-col gap-1 items-start">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider
                                                                ${patient.admissionStatus === 'Critical' ? 'bg-red-50 text-red-700 border-red-100' :
                                                                        patient.admissionStatus === 'Out-Patient' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                            'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                                                    {patient.admissionStatus}
                                                                </span>
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider
                                                                ${patient.status === 'Completed' ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                                                    {patient.status || 'Pending'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {patient.status !== 'Completed' && (
                                                                    <button
                                                                        title="Mark as Completed"
                                                                        onClick={() => handleMarkAsCompleted(patient._id)}
                                                                        className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-2.5 py-1.5 rounded-md hover:bg-green-100 transition-colors uppercase tracking-wider cursor-pointer"
                                                                    >
                                                                        Done
                                                                    </button>
                                                                )}
                                                                <button
                                                                    title="Select for Prescription"
                                                                    onClick={() => {
                                                                        setPrescribeForm(prev => ({
                                                                            ...prev,
                                                                            patientId: patient._id,
                                                                            name: patient.fullName,
                                                                            email: patient.email || ''
                                                                        }));
                                                                    }}
                                                                    className="text-xs font-semibold text-[#0065a3] bg-blue-50 px-3 py-1.5 rounded-md hover:bg-[#0065a3] hover:text-white transition-colors select-none"
                                                                >
                                                                    Select
                                                                </button>
                                                                <button title="View Reports" className="p-1.5 text-gray-400 hover:text-[#0065a3] hover:bg-blue-50 rounded-md transition-colors">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="6" className="py-12 text-center text-gray-400 text-sm">
                                                            No patients found matching "{searchTerm}"
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {(activeView === 'reports' || activeView === 'completed_reports') && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-100">
                                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Report Title</th>
                                                    <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Patient</th>
                                                    <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type / Status</th>
                                                    <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {loading ? (
                                                    <tr><td colSpan="5" className="py-8 text-center text-gray-500">Loading reports...</td></tr>
                                                ) : (activeView === 'reports' ? pendingReports : completedReports).length > 0 ? (activeView === 'reports' ? pendingReports : completedReports).map((report, idx) => (
                                                    <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-blue-50 p-2 rounded text-[#0065a3]">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                                </div>
                                                                <span className="text-sm font-bold text-slate-700">{report.title}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 text-sm text-gray-600">{report.patient?.fullName || 'Unknown'}</td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex flex-col gap-1 items-start">
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-gray-50 text-gray-600 border-gray-200 uppercase tracking-wider">
                                                                    {report.fileCategory}
                                                                </span>
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider
                                                                ${report.status === 'Reviewed' ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                                                    {report.status || 'Pending'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 text-xs text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</td>
                                                        <td className="py-4 px-6 text-right cursor-default">
                                                            <div className="flex items-center justify-end gap-3">
                                                                <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${(report.filePath || '').replace(/\\/g, '/').replace(/^server\//, '')}`} target="_blank" rel="noopener noreferrer" className="text-white hover:bg-blue-600 bg-[#0065a3] px-3 py-1.5 rounded-md transition-colors text-xs font-semibold shadow-sm">
                                                                    View
                                                                </a>
                                                                {report.status !== 'Reviewed' && (
                                                                    <button
                                                                        title="Mark as Reviewed"
                                                                        onClick={() => handleMarkReportAsViewed(report._id)}
                                                                        className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-2.5 py-1.5 rounded-md hover:bg-green-100 transition-colors uppercase tracking-wider cursor-pointer"
                                                                    >
                                                                        Done
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="5" className="py-12 text-center text-gray-400 text-sm">
                                                            No reports found matching "{searchTerm}"
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeView === 'overview' && (
                                    <div className="p-8">
                                        <div className="mb-8 border-b border-gray-100 pb-6">
                                            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 mb-2">Welcome Back, Dr. {user?.name}</h2>
                                            <p className="text-gray-500 font-medium">Here is your daily workflow overview. Have a great day.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="bg-gradient-to-br from-[#0065a3] to-blue-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-white/10 w-24 h-24 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
                                                <h3 className="text-blue-100 text-sm font-bold uppercase tracking-wider mb-2 relative z-10">Assigned Today</h3>
                                                <div className="flex items-end gap-3 relative z-10">
                                                    <span className="text-5xl font-black text-white">{metrics.assignedToday}</span>
                                                    <span className="text-blue-200 text-sm font-medium mb-1">Patients</span>
                                                </div>
                                            </div>

                                            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-white/10 w-24 h-24 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
                                                <h3 className="text-emerald-100 text-sm font-bold uppercase tracking-wider mb-2 relative z-10">Viewed Today</h3>
                                                <div className="flex items-end gap-3 relative z-10">
                                                    <span className="text-5xl font-black text-white">{metrics.viewedToday}</span>
                                                    <span className="text-emerald-200 text-sm font-medium mb-1">Completed</span>
                                                </div>
                                            </div>

                                            <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-white/10 w-24 h-24 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
                                                <h3 className="text-orange-100 text-sm font-bold uppercase tracking-wider mb-2 relative z-10">Remaining Active</h3>
                                                <div className="flex items-end gap-3 relative z-10">
                                                    <span className="text-5xl font-black text-white">{metrics.remainingOverall}</span>
                                                    <span className="text-orange-200 text-sm font-medium mb-1">Pending</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Widgets (4 cols) */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Quick Consult Widget */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
                                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                                    <div className="bg-blue-50 p-1.5 rounded-md text-[#0065a3]">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></svg>
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Quick Prescribe</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Patient Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={prescribeForm.email}
                                                onChange={handlePrescribeChange}
                                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all"
                                                placeholder="patient@example.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Patient Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={prescribeForm.name}
                                                onChange={handlePrescribeChange}
                                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all"
                                                placeholder="Auto-filled or type name"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Medical Notes</label>
                                        <textarea
                                            name="medicalNotes"
                                            value={prescribeForm.medicalNotes}
                                            onChange={handlePrescribeChange}
                                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all h-28 resize-none"
                                            placeholder="Type clinical observations, prescriptions..."
                                        ></textarea>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Next Visit Date
                                            </label>
                                            <input
                                                type="date"
                                                name="nextVisit"
                                                value={prescribeForm.nextVisit}
                                                onChange={handlePrescribeChange}
                                                className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Doctor Notes
                                            </label>
                                            <textarea
                                                name="doctorNotes"
                                                value={prescribeForm.doctorNotes}
                                                onChange={handlePrescribeChange}
                                                rows="1"
                                                className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all resize-none"
                                                placeholder="Optional clinical notes..."
                                            ></textarea>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => fileInputRef.current.click()}
                                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-slate-600 font-semibold py-2.5 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                                {selectedFile ? selectedFile.name : 'Attach File (Optional)'}
                                            </button>
                                            {selectedFile && (
                                                <button onClick={() => setSelectedFile(null)} className="text-red-500 hover:text-red-700 p-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                </button>
                                            )}
                                        </div>

                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />

                                        <button
                                            onClick={handlePrescribeSubmit}
                                            className="w-full bg-[#0065a3] hover:bg-[#005080] text-white font-semibold py-3 rounded-lg transition-all shadow-sm text-sm active:scale-[0.98] flex items-center justify-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                            Create Prescription
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
