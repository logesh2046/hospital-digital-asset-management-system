import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

export default function TechnicianManagement() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const [patients, setPatients] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Navigation State
    const [currentView, setCurrentView] = useState('availability');

    // Form state
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [requestedReport, setRequestedReport] = useState('');
    const [assignedTechnician, setAssignedTechnician] = useState('');

    const [patientSearchTerm, setPatientSearchTerm] = useState('');
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);

    const filteredPatients = patients.filter(p =>
        p.fullName.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
        p.medicalRecordNumber.toLowerCase().includes(patientSearchTerm.toLowerCase())
    );

    const handlePatientSearch = (e) => {
        setPatientSearchTerm(e.target.value);
        setShowPatientDropdown(true);
    };

    const selectPatient = (patient) => {
        setSelectedPatientId(patient._id);
        setPatientSearchTerm('');
        setShowPatientDropdown(false);
        if (patient.requestedReport) {
            setRequestedReport(patient.requestedReport);
            setAssignedTechnician('');
        }
    };

    const clearSelectedPatient = () => {
        setSelectedPatientId('');
        setRequestedReport('');
        setAssignedTechnician('');
    };

    const fetchPatients = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setPatients(data);
            }
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };

    const fetchStaff = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/staff`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStaffList(data.staff);
            }
        } catch (error) {
            console.error('Error fetching staff:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
        fetchStaff();
    }, []);

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!selectedPatientId || !requestedReport || !assignedTechnician) {
            alert('Please select a patient, report type, and technician.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients/${selectedPatientId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    technicianId: assignedTechnician,
                    technicianName: availableTechnicians.find(t => t._id === assignedTechnician)?.name,
                    requestedReport: requestedReport
                })
            });

            if (response.ok) {
                alert('Technician assigned successfully!');
                fetchPatients(); // Refresh list to get new assignments
                setSelectedPatientId('');
                setRequestedReport('');
                setAssignedTechnician('');
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.message}`);
            }
        } catch (error) {
            console.error(`Error assigning technician:`, error);
            alert(`Failed to assign technician.`);
        }
    };

    // Filter technicians based on the requested report and availability
    const getTechniciansForReport = (reportType) => {
        const technicians = staffList.filter(s => s.role === 'technician' && s.isAvailable !== false);
        switch (reportType) {
            case 'X-Ray': return technicians.filter(t => t.department === 'Radiology Department');
            case 'MRI Scan': return technicians.filter(t => t.department === 'MRI Department');
            case 'CT Scan': return technicians.filter(t => t.department === 'CT Scan Department');
            case 'Blood Test': return technicians.filter(t => t.department === 'Pathology / Laboratory');
            case 'Ultrasound': return technicians.filter(t => t.department === 'Ultrasound Department');
            default: return technicians;
        }
    };

    const availableTechnicians = getTechniciansForReport(requestedReport);

    return (
        <div className="flex h-screen bg-[#f3f4f6] text-slate-800">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
                <div className="p-6 flex items-center gap-3 border-b border-gray-100">
                    <div className="w-8 h-8 bg-indigo-600 rounded-md flex-shrink-0 flex items-center justify-center text-white font-bold">M</div>
                    <span className="text-lg font-bold text-indigo-600">MediVault</span>
                </div>

                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-1 px-3">
                        <li>
                            <button onClick={() => setCurrentView('availability')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${currentView === 'availability' ? 'text-white bg-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
                                Availability Status
                            </button>
                        </li>
                        <li>
                            <button onClick={() => setCurrentView('assignment')} className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${currentView === 'assignment' ? 'text-white bg-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
                                Technician Assignment
                            </button>
                        </li>
                        <li>
                            <button onClick={() => navigate('/')} className={`w-full flex items-center px-3 py-2 mt-1 text-sm font-medium rounded-md transition-colors text-gray-600 hover:text-indigo-600 hover:bg-indigo-50`}>
                                Back to Dashboard
                            </button>
                        </li>
                    </ul>
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-700">{user?.name || user?.email || 'Manager'}</span>
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
                <div className="bg-white border-b border-gray-200 px-8 py-5">
                    <h1 className="text-xl font-bold text-slate-700">Technician Management & Assignment</h1>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
                    {/* Technician Status Cards */}
                    {currentView === 'availability' && (
                        <div className="mb-8">
                            <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <span className="bg-indigo-600 text-white px-2.5 py-1 rounded text-sm uppercase tracking-wider">Lab Technician Availability Status</span>
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {staffList.filter(s => s.role === 'technician').length === 0 && !loading && (
                                    <div className="col-span-fulltext-sm text-gray-500">No technicians found.</div>
                                )}
                                {staffList.filter(s => s.role === 'technician').map(tech => (
                                    <div key={tech._id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between items-start hover:shadow-md transition-shadow">
                                        <div className="w-full">
                                            <h3 className="font-bold text-indigo-700 text-sm truncate w-full" title={tech.name}>{tech.name}</h3>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate">{tech.department}</p>
                                        </div>
                                        <div className="mt-4 flex w-full justify-between items-center">
                                            {tech.isAvailable !== false ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase tracking-wider">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                    Available
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-200 uppercase tracking-wider">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                                    Unavailable
                                                </span>
                                            )}
                                            <span className="text-xs text-indigo-400 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">
                                                {patients.filter(p => p.technicianName === tech.name || (p.assignedTechnician && p.assignedTechnician === tech._id)).length} Assigned
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentView === 'assignment' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                            {/* Assignment Form */}
                            <div className="lg:col-span-5 flex flex-col gap-6">
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm sticky top-6">
                                    <div className="px-6 py-4 border-b border-gray-100">
                                        <h2 className="text-lg font-bold text-indigo-600 mb-1">Assign Lab Technician</h2>
                                        <p className="text-xs text-gray-500">Select a patient and the required report to see available technicians.</p>
                                    </div>
                                    <div className="p-6">
                                        <form className="space-y-5" onSubmit={handleAssign}>

                                            {/* Patient Selection */}
                                            <div>
                                                <label className="block text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1.5">
                                                    Select Patient <span className="text-red-500">*</span>
                                                </label>
                                                {!selectedPatientId ? (
                                                    <div className="relative">
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                placeholder="Search patient by name or ID..."
                                                                value={patientSearchTerm}
                                                                onChange={handlePatientSearch}
                                                                onFocus={() => setShowPatientDropdown(true)}
                                                                className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                                                            />
                                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                                            </div>
                                                        </div>
                                                        {showPatientDropdown && (
                                                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                                {filteredPatients.length > 0 ? (
                                                                    filteredPatients.map(p => (
                                                                        <div
                                                                            key={p._id}
                                                                            onClick={() => selectPatient(p)}
                                                                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                                                                        >
                                                                            <p className="font-semibold text-sm text-slate-700">{p.fullName}</p>
                                                                            <p className="text-xs text-gray-500 mt-0.5">ID: {p.medicalRecordNumber} | Requested: {p.requestedReport || 'None'}</p>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="px-4 py-3 text-sm text-gray-500">No patients found.</div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 p-3 rounded-md">
                                                        <div>
                                                            <p className="text-sm font-bold text-indigo-700">{patients.find(p => p._id === selectedPatientId)?.fullName}</p>
                                                            <p className="text-xs text-indigo-500">ID: {patients.find(p => p._id === selectedPatientId)?.medicalRecordNumber}</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={clearSelectedPatient}
                                                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white px-2 py-1 rounded shadow-sm"
                                                        >
                                                            Change Patient
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Report Type */}
                                            <div>
                                                <label className="block text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1.5">
                                                    Requested Report <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={requestedReport}
                                                        onChange={(e) => {
                                                            setRequestedReport(e.target.value);
                                                            setAssignedTechnician(''); // Reset technician on report change
                                                        }}
                                                        required
                                                        className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all appearance-none bg-white"
                                                    >
                                                        <option value="">-- Select Report Type --</option>
                                                        <option value="Blood Test">Blood Test</option>
                                                        <option value="MRI Scan">MRI Scan</option>
                                                        <option value="CT Scan">CT Scan</option>
                                                        <option value="X-Ray">X-Ray</option>
                                                        <option value="Ultrasound">Ultrasound</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Technician Selection */}
                                            <div>
                                                <label className="block text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1.5">
                                                    Assign Technician <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={assignedTechnician}
                                                        onChange={(e) => setAssignedTechnician(e.target.value)}
                                                        required
                                                        disabled={!requestedReport}
                                                        className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all appearance-none"
                                                    >
                                                        <option value="">
                                                            {requestedReport ? '-- Select Technician --' : 'Select Report Type First'}
                                                        </option>
                                                        {availableTechnicians
                                                            .sort((a, b) => {
                                                                const countA = patients.filter(p => p.technicianName === a.name || (p.assignedTechnician && p.assignedTechnician === a._id)).length;
                                                                const countB = patients.filter(p => p.technicianName === b.name || (p.assignedTechnician && p.assignedTechnician === b._id)).length;
                                                                return countA - countB;
                                                            })
                                                            .map(tech => {
                                                                const count = patients.filter(p => p.technicianName === tech.name || (p.assignedTechnician && p.assignedTechnician === tech._id)).length;
                                                                return (
                                                                    <option key={tech._id} value={tech._id}>
                                                                        {tech.name} ({count} {count === 1 ? 'Patient' : 'Patients'} Assigned)
                                                                    </option>
                                                                );
                                                            })}
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                    </div>
                                                </div>
                                            </div>

                                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-md transition-all shadow-md active:scale-[0.98]">
                                                Confirm Assignment
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>

                            {/* Assignment History / Patient List */}
                            <div className="lg:col-span-7">
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full max-h-[800px]">
                                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                        <h2 className="text-lg font-bold text-indigo-600">Lab Assignments Record</h2>
                                    </div>
                                    <div className="overflow-y-auto flex-1 p-0">
                                        <table className="w-full text-left">
                                            <thead className="sticky top-0 bg-white z-10 border-b border-gray-100 shadow-sm">
                                                <tr>
                                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient ID</th>
                                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Requested Scan</th>
                                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Technician</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {loading ? (
                                                    <tr>
                                                        <td colSpan="4" className="py-8 text-center text-gray-500">Loading assignments...</td>
                                                    </tr>
                                                ) : (
                                                    patients
                                                        .filter(p => p.requestedReport || p.technicianName)
                                                        .map((patient) => (
                                                            <tr key={patient._id} className="hover:bg-gray-50 transition-colors">
                                                                <td className="py-3 px-4 text-xs font-bold text-indigo-600">{patient.medicalRecordNumber}</td>
                                                                <td className="py-3 px-4 text-sm font-medium text-slate-700">{patient.fullName}</td>
                                                                <td className="py-3 px-4 text-sm text-gray-600 font-medium">
                                                                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold border border-blue-100">
                                                                        {patient.requestedReport || 'N/A'}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 px-4 text-sm text-gray-600 font-semibold">{patient.technicianName || 'Pending'}</td>
                                                            </tr>
                                                        ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
