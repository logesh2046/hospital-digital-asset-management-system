import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

// Mock Data


export default function TechnicianDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // State
    const [patients, setPatients] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Navigation State
    const [currentView, setCurrentView] = useState('upload');

    // Form State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [reportType, setReportType] = useState('Blood Test');
    const [selectedFile, setSelectedFile] = useState(null);
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };

                // Fetch Patients
                const patientsRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients`, { headers });
                if (patientsRes.ok) {
                    const patientsData = await patientsRes.json();
                    setPatients(patientsData);
                }

                // Fetch Reports
                const reportsRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reports`, { headers });
                if (reportsRes.ok) {
                    const reportsData = await reportsRes.json();
                    setReports(reportsData);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Handlers
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handlePatientSearch = (e) => {
        setSearchTerm(e.target.value);
        setShowPatientDropdown(true);
        setSelectedPatient(null);
    };

    const selectPatient = (patient) => {
        setSelectedPatient(patient);
        setSearchTerm(patient.fullName);
        setShowPatientDropdown(false);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleUploadReport = async () => {
        if (!selectedPatient || !selectedFile) {
            alert('Please select a patient and a file.');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('patientId', selectedPatient._id);
        formData.append('title', `${reportType} Report`);
        formData.append('fileCategory', reportType);
        formData.append('file', selectedFile);

        // Technicians might not add doctor notes, but we can add a default description
        formData.append('description', `Uploaded by Technician: ${reportType}`);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reports/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                alert('Report uploaded successfully!');
                // Reset form
                setSelectedFile(null);
                setSelectedPatient(null);
                setSearchTerm('');
                if (fileInputRef.current) fileInputRef.current.value = '';

                // Refresh reports
                const reportsRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reports`, { headers: { 'Authorization': `Bearer ${token}` } });
                const newReports = await reportsRes.json();
                setReports(newReports);
            } else {
                const errorData = await response.json();
                alert(`Upload failed: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('An error occurred during upload.');
        } finally {
            setUploading(false);
        }
    };

    // Derived State for UI
    const filteredPatients = patients.filter(p =>
        p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.medicalRecordNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const reportsToday = reports.filter(r => {
        const today = new Date();
        const reportDate = new Date(r.createdAt);
        return reportDate.toDateString() === today.toDateString();
    }).length;

    const myUploadsCount = reports.filter(r => r.uploadedBy === user?._id).length; // Assuming user object has _id shorthand or similar from auth context, otherwise might need check



    return (
        <div className="flex h-screen bg-[#f3f4f6] text-slate-800">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-xl font-bold text-[#0065a3] leading-snug">
                        MediVault<br />DAM
                    </h1>
                </div>

                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-1 px-3">
                        <li>
                            <button onClick={() => setCurrentView('upload')} className={`w-full text-left flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${currentView === 'upload' ? 'text-white bg-[#0065a3] shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
                                Upload Report
                            </button>
                        </li>
                        <li>
                            <button onClick={() => setCurrentView('patients')} className={`w-full text-left flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${currentView === 'patients' ? 'text-white bg-[#0065a3] shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
                                Receptionist Added Patients
                            </button>
                        </li>
                    </ul>


                </nav>

                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-[#0065a3] text-white flex items-center justify-center font-bold">
                            {user?.name?.[0]?.toUpperCase() || 'T'}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-700">{user?.name || 'Technician'}</span>
                            <span className="text-xs text-gray-400">Lab Technician</span>
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
                    <h1 className="text-xl font-bold text-slate-700">Technician Dashboard</h1>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
                    {/* Top Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Reports Uploaded Today</p>
                            <h3 className="text-3xl font-bold text-slate-800">{reportsToday}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Reports</p>
                            <h3 className="text-3xl font-bold text-slate-800">{reports.length}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Active Patients</p>
                            <h3 className="text-3xl font-bold text-slate-800">{patients.length}</h3>
                        </div>
                    </div>

                    {currentView === 'upload' && (
                        <div className="flex flex-col gap-8">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                                {/* Upload Form (Left - 8 cols) */}
                                <div className="lg:col-span-8 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                        <h2 className="text-lg font-bold text-[#0065a3]">Upload New Diagnostic Report</h2>
                                        <p className="text-sm text-gray-500 mt-1">Select patient details and attach files.</p>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    Select Patient
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={searchTerm}
                                                        onChange={handlePatientSearch}
                                                        onFocus={() => setShowPatientDropdown(true)}
                                                        placeholder="Search by ID or Name..."
                                                        className="w-full pl-10 pr-4 py-2.5 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all"
                                                    />
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>

                                                    {showPatientDropdown && searchTerm && (
                                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                            {filteredPatients.length > 0 ? (
                                                                filteredPatients.map(patient => (
                                                                    <div
                                                                        key={patient._id}
                                                                        onClick={() => selectPatient(patient)}
                                                                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                                                                    >
                                                                        <div className="font-semibold text-slate-700">{patient.fullName}</div>
                                                                        <div className="text-xs text-gray-500">{patient.medicalRecordNumber}</div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="px-4 py-2 text-sm text-gray-500">No patients found.</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    Report Type
                                                </label>
                                                <select
                                                    value={reportType}
                                                    onChange={(e) => setReportType(e.target.value)}
                                                    className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all bg-white"
                                                >
                                                    <option>Blood Test</option>
                                                    <option>MRI Scan</option>
                                                    <option>CT Scan</option>
                                                    <option>X-Ray</option>
                                                    <option>Other</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            </label>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            <div
                                                onClick={handleUploadClick}
                                                className={`border-2 border-dashed ${selectedFile ? 'border-[#0065a3] bg-blue-50/30' : 'border-gray-300'} rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer group bg-slate-50/50`}
                                            >
                                                <div className="w-12 h-12 bg-blue-50 text-[#0065a3] rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                    </svg>
                                                </div>
                                                {selectedFile ? (
                                                    <div>
                                                        <p className="text-sm font-medium text-[#0065a3]">{selectedFile.name}</p>
                                                        <p className="text-xs text-gray-500 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
                                                        <p className="text-xs text-gray-500 mt-1">PDF, JPG, DICOM (Max 50MB)</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>



                                        <div className="pt-4 flex gap-4">
                                            <button
                                                onClick={handleUploadReport}
                                                disabled={uploading}
                                                className={`flex-1 bg-[#0065a3] hover:bg-[#005080] text-white font-semibold py-3 rounded-md transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                </svg>
                                                {uploading ? 'Uploading...' : 'Upload Report'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Uploads (Right - 4 cols) */}
                                <div className="lg:col-span-4 bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex flex-col h-full">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-lg font-bold text-[#0065a3]">Recent Uploads</h2>
                                        <a href="#" className="text-sm font-semibold text-[#0065a3] hover:underline">View All</a>
                                    </div>

                                    <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px]">
                                        {loading && <p className="text-center text-gray-500 text-sm py-4">Loading uploads...</p>}
                                        {!loading && reports.length === 0 && <p className="text-center text-gray-500 text-sm py-4">No recent uploads.</p>}
                                        {reports.slice(0, 10).map((report) => (
                                            <div key={report._id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group">
                                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex-shrink-0 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-700 truncate">{report.title}</p>
                                                    <p className="text-xs text-gray-500">{report.patient?.fullName || 'Unknown'} • {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-600`}>
                                                    Done
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Recently Added Patients */}
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-bold text-[#0065a3]">Recently Added Patients</h2>
                                    <button onClick={() => setCurrentView('patients')} className="text-sm font-semibold text-[#0065a3] hover:underline">View All Patients</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Name</th>
                                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">MRN</th>
                                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</th>
                                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {[...patients].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5).map(patient => {
                                                const hasReport = reports.some(r => (r.patient?._id || r.patient) === patient._id);
                                                return (
                                                    <tr key={patient._id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="py-4 px-4 text-sm font-medium text-slate-700">{patient.fullName}</td>
                                                        <td className="py-4 px-4 text-sm text-gray-600 font-mono">{patient.medicalRecordNumber}</td>
                                                        <td className="py-4 px-4 text-sm text-gray-600 capitalize">{patient.gender}</td>
                                                        <td className="py-4 px-4 text-sm text-gray-600">{patient.contactNumber}</td>
                                                        <td className="py-4 px-4">
                                                            {hasReport ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">Uploaded</span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">Not Uploaded</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4 text-right">
                                                            <button
                                                                onClick={() => {
                                                                    selectPatient(patient);
                                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                }}
                                                                className="text-xs font-semibold text-[#0065a3] bg-blue-50 px-3 py-1.5 rounded-md hover:bg-[#0065a3] hover:text-white transition-colors"
                                                            >
                                                                Upload Report
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                            {patients.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="py-4 text-center text-sm text-gray-500">No patients available</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentView === 'patients' && (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden p-6">
                            <h2 className="text-lg font-bold text-[#0065a3] mb-4">Receptionist Added Patients Details</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/50">
                                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Name</th>
                                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">MRN</th>
                                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</th>
                                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date of Birth</th>
                                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {[...patients].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(patient => {
                                            const isNew = (new Date() - new Date(patient.createdAt)) < 24 * 60 * 60 * 1000;
                                            const hasReport = reports.some(r => (r.patient?._id || r.patient) === patient._id);
                                            return (
                                                <tr key={patient._id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-slate-700">{patient.fullName}</span>
                                                            {isNew && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">New</span>}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-gray-600 font-mono">{patient.medicalRecordNumber}</td>
                                                    <td className="py-4 px-4 text-sm text-gray-600 capitalize">{patient.gender}</td>
                                                    <td className="py-4 px-4 text-sm text-gray-600">{new Date(patient.dateOfBirth).toLocaleDateString()}</td>
                                                    <td className="py-4 px-4 text-sm text-gray-600">{patient.contactNumber}</td>
                                                    <td className="py-4 px-4">
                                                        {hasReport ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">Uploaded</span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">Not Uploaded</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <button onClick={() => { selectPatient(patient); setCurrentView('upload'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-xs font-semibold text-[#0065a3] bg-blue-50 px-3 py-1.5 rounded-md hover:bg-[#0065a3] hover:text-white transition-colors">
                                                            Upload Report
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main >
        </div >
    )
}
