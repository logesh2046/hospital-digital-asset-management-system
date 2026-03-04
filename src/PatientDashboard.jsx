import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import OTPModal from './OTPModal';

// Original data loading via useEffect

export default function PatientDashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [activeView, setActiveView] = React.useState('dashboard');

    const [patientData, setPatientData] = React.useState(null);
    const [reports, setReports] = React.useState([]);
    const [prescriptions, setPrescriptions] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedPrescription, setSelectedPrescription] = React.useState(null);
    const [showPrescriptionModal, setShowPrescriptionModal] = React.useState(false);

    const [showOTPModal, setShowOTPModal] = React.useState(false);
    const [selectedReport, setSelectedReport] = React.useState(null);
    const [reportAction, setReportAction] = React.useState('view');

    const [isEditingProfile, setIsEditingProfile] = React.useState(false);
    const [editProfileForm, setEditProfileForm] = React.useState({});

    const handleEditProfileSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/patients/me', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editProfileForm)
            });
            if (res.ok) {
                const updatedData = await res.json();
                setPatientData(updatedData);
                setIsEditingProfile(false);
                alert('Profile updated successfully!');
            } else {
                const err = await res.json();
                alert(err.message || 'Error updating profile');
            }
        } catch (error) {
            alert('Failed to update profile');
        }
    };

    const handleReportClick = (report, action) => {
        if (report.isProtected) {
            setSelectedReport(report);
            setReportAction(action);
            setShowOTPModal(true);
        } else {
            openReport(report.filePath, action);
        }
    };

    const openReport = (filePath, action) => {
        const url = `http://localhost:5000/${(filePath || '').replace(/\\/g, '/').replace(/^server\//, '')}`;
        if (action === 'view') {
            window.open(url, '_blank');
        } else {
            const link = document.createElement('a');
            link.href = url;
            link.download = true;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleOTPSuccess = async (tempToken, email) => {
        try {
            const res = await fetch(`http://localhost:5000/api/reports/view/${selectedReport._id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${tempToken}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();

            if (res.ok) {
                setShowOTPModal(false);
                openReport(data.url, reportAction);
            } else {
                alert(data.message || 'Verification failed');
            }
        } catch (err) {
            alert('Failed to securely access report: ' + err.message);
        }
    };

    const handleViewFullPrescription = (pres) => {
        setSelectedPrescription(pres);
        setShowPrescriptionModal(true);
    };

    const closePrescriptionModal = () => {
        setShowPrescriptionModal(false);
        setSelectedPrescription(null);
    };

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };

                const profileRes = await fetch('http://localhost:5000/api/patients/me', { headers });
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    setPatientData(profileData);

                    if (profileData && profileData._id) {
                        const patId = profileData._id;
                        const reportsRes = await fetch(`http://localhost:5000/api/reports/${patId}`, { headers });
                        if (reportsRes.ok) setReports(await reportsRes.json());

                        const presRes = await fetch(`http://localhost:5000/api/prescriptions/patient/${patId}`, { headers });
                        if (presRes.ok) setPrescriptions(await presRes.json());
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const activeMeds = prescriptions.flatMap(p => p.medicines || []);

    const doctorNotes = prescriptions.filter(p => p.medicalNotes).map(p => ({
        doctor: p.doctor?.name || 'Attending Doctor',
        date: new Date(p.createdAt).toLocaleDateString(),
        text: p.medicalNotes
    }));

    const handleShareReport = (report) => {
        const shareLink = `${window.location.origin}/shared-report/${report._id}`;
        navigator.clipboard.writeText(shareLink).then(() => {
            alert(shareLink);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert(shareLink);
        });
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

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
                            <button
                                onClick={() => setActiveView('dashboard')}
                                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeView === 'dashboard' ? 'text-white bg-[#0065a3] shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                            >
                                Dashboard
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveView('reports')}
                                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeView === 'reports' ? 'text-white bg-[#0065a3] shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                            >
                                My Reports
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveView('prescriptions')}
                                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeView === 'prescriptions' ? 'text-white bg-[#0065a3] shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                            >
                                Prescriptions
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveView('profile')}
                                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeView === 'profile' ? 'text-white bg-[#0065a3] shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                            >
                                Profile
                            </button>
                        </li>

                    </ul>
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-[#0065a3] text-white flex items-center justify-center font-bold">
                            {user?.name?.[0]?.toUpperCase() || 'P'}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-700">{user?.name}</span>
                            <span className="text-xs text-gray-400">Patient Data</span>
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
                <div className="max-w-7xl mx-auto px-8 py-8">

                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold text-slate-700">
                            {activeView === 'dashboard' && 'Patient Dashboard'}
                            {activeView === 'reports' && 'My Reports'}
                            {activeView === 'prescriptions' && 'My Prescriptions'}
                            {activeView === 'profile' && 'My Profile'}
                        </h2>
                    </div>

                    {activeView === 'dashboard' && (
                        <>
                            {/* Top Cards */}
                            <div className="grid grid-cols-3 gap-6 mb-8">
                                {/* Next Visit - Blue Card */}
                                <div className="bg-[#0065a3] text-white p-6 rounded-lg shadow-sm relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-blue-100 text-xs font-medium uppercase tracking-wide mb-1">Assigned Doctor</p>
                                        <h3 className="text-2xl font-bold mb-1 truncate">{patientData?.assignedDoctor?.name || patientData?.doctorName || 'Not Assigned'}</h3>
                                        <p className="text-blue-100 text-sm">{patientData?.nextVisitDate ? `Next Visit: ${new Date(patientData.nextVisitDate).toLocaleDateString()}` : 'No upcoming visits'}</p>
                                    </div>
                                    {/* Decorative Icon Background */}
                                    <div className="absolute right-[-10px] top-[-10px] opacity-10">
                                        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-6 14H5v-2h8v2zm0-4H5v-2h8v2zm6-4H5V5h14v4z" /></svg>
                                    </div>
                                </div>

                                {/* New Reports */}
                                <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">New Reports</p>
                                        <h3 className="text-4xl font-bold text-slate-800 mb-1">{reports.length}</h3>
                                        <p className="text-gray-400 text-xs">Ready for download</p>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-lg text-[#0065a3]">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </div>
                                </div>

                                {/* Active Prescriptions */}
                                <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Prescriptions</p>
                                        <h3 className="text-4xl font-bold text-slate-800 mb-1">{prescriptions.length}</h3>
                                        <p className="text-gray-400 text-xs">Medical Records</p>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-lg text-[#0065a3]">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-8">
                                {/* Left Column - Reports & Prescriptions (Spans 8) */}
                                <div className="col-span-8 space-y-8">

                                    {/* My Reports Table */}
                                    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-bold text-slate-800">Recent Reports</h3>
                                            <button onClick={() => setActiveView('reports')} className="text-sm font-semibold text-[#0065a3] hover:underline">View All History</button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                                        <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                                        <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Report Name</th>
                                                        <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Referred By</th>
                                                        <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {reports.slice(0, 3).map((report) => (
                                                        <tr key={report._id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="py-4 px-2 text-sm text-gray-600">{new Date(report.createdAt).toLocaleDateString()}</td>
                                                            <td className="py-4 px-2 text-sm font-medium text-[#0065a3]">{report.title}</td>
                                                            <td className="py-4 px-2 text-sm text-gray-600">{report.assignedDoctor?.name || patientData?.doctorName || patientData?.assignedDoctor?.name || 'Unknown'}</td>
                                                            <td className="py-4 px-2 flex justify-end gap-2">
                                                                <button onClick={() => handleReportClick(report, 'view')} className="text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-50 transition-colors text-center">View</button>
                                                                <button onClick={() => handleReportClick(report, 'download')} className="text-gray-400 hover:text-[#0065a3] transition-colors flex items-center" title="Download">
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                                </button>
                                                                <button onClick={() => handleShareReport(report)} className="text-gray-400 hover:text-green-600 transition-colors flex items-center ml-1" title="Share externally">
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Recent Prescriptions Table */}
                                    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-bold text-slate-800">Recent Prescriptions</h3>
                                            <button onClick={() => setActiveView('prescriptions')} className="text-sm font-semibold text-[#0065a3] hover:underline">View All</button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                                        <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                                        <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Doctor</th>
                                                        <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</th>
                                                        <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {prescriptions.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="4" className="py-4 px-2 text-sm text-gray-500 text-center">No prescriptions found</td>
                                                        </tr>
                                                    ) : (
                                                        prescriptions.slice(0, 3).map((pres, idx) => (
                                                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                                <td className="py-4 px-2 text-sm text-gray-600">{new Date(pres.createdAt).toLocaleDateString()}</td>
                                                                <td className="py-4 px-2 text-sm font-medium text-[#0065a3]">{pres.doctor?.name || pres.doctor || 'Unknown'}</td>
                                                                <td className="py-4 px-2 text-sm text-gray-600 truncate max-w-xs">{pres.medicalNotes}</td>
                                                                <td className="py-4 px-2 text-right">
                                                                    <button onClick={() => handleViewFullPrescription(pres)} className="text-xs font-semibold text-[#0065a3] bg-blue-50 px-3 py-1.5 rounded-md hover:bg-[#0065a3] hover:text-white transition-colors">
                                                                        View
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                </div>

                                {/* Right Column - Notes & Vitals (Spans 4) */}
                                <div className="col-span-4 space-y-6">

                                    {/* Doctor Notes */}
                                    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
                                        <h3 className="text-lg font-bold text-slate-800 mb-6">Doctor Notes</h3>
                                        <div className="space-y-6">
                                            {doctorNotes.length === 0 ? (
                                                <p className="text-sm text-gray-500">No recent doctor notes.</p>
                                            ) : (
                                                doctorNotes.map((note, idx) => (
                                                    <div key={idx} className="pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                                        <div className="flex justify-between items-baseline mb-2">
                                                            <h4 className="text-sm font-bold text-[#0065a3]">{note.doctor}</h4>
                                                            <span className="text-xs text-gray-400">{note.date}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 leading-relaxed bg-gray-50/50 p-3 rounded-md">
                                                            {note.text}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>



                                </div>
                            </div>
                        </>
                    )}

                    {activeView === 'reports' && (
                        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800">Full Report History</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/50">
                                            <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Report Name</th>
                                            <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Referred By</th>
                                            <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {reports.map((report) => (
                                            <tr key={report._id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4 px-2 text-sm text-gray-600">{new Date(report.createdAt).toLocaleDateString()}</td>
                                                <td className="py-4 px-2 text-sm font-medium text-[#0065a3]">{report.title}</td>
                                                <td className="py-4 px-2 text-sm text-gray-600">{report.assignedDoctor?.name || patientData?.doctorName || patientData?.assignedDoctor?.name || 'Unknown'}</td>
                                                <td className="py-4 px-2 flex justify-end gap-2">
                                                    <button onClick={() => handleReportClick(report, 'view')} className="text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-50 transition-colors text-center">View</button>
                                                    <button onClick={() => handleReportClick(report, 'download')} className="text-gray-400 hover:text-[#0065a3] transition-colors flex items-center" title="Download">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                    </button>
                                                    <button onClick={() => handleShareReport(report)} className="text-gray-400 hover:text-green-600 transition-colors flex items-center ml-1" title="Share externally">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeView === 'prescriptions' && (
                        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800">Full Prescription History</h3>
                                <button className="bg-[#0065a3] hover:bg-[#005080] text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors shadow-sm">
                                    Download All
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/50">
                                            <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Prescribed</th>
                                            <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Doctor</th>
                                            <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Medical Notes</th>
                                            <th className="py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {prescriptions.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="py-4 px-2 text-sm text-gray-500 text-center">No prescriptions found on record</td>
                                            </tr>
                                        ) : (
                                            prescriptions.map((pres, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-4 px-2 text-sm font-medium text-[#0065a3]">{new Date(pres.createdAt).toLocaleDateString()}</td>
                                                    <td className="py-4 px-2 text-sm text-gray-600">{pres.doctor?.name || pres.doctor || 'Unknown Doctor'}</td>
                                                    <td className="py-4 px-2 text-sm text-gray-600">{pres.medicalNotes}</td>
                                                    <td className="py-4 px-2 text-right">
                                                        <button onClick={() => handleViewFullPrescription(pres)} className="text-xs font-semibold text-[#0065a3] bg-blue-50 px-3 py-1.5 rounded-md hover:bg-[#0065a3] hover:text-white transition-colors">
                                                            View Full
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeView === 'profile' && (
                        <div className="max-w-3xl mx-auto">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-[#0065a3] h-32 relative">
                                    <div className="absolute -bottom-12 left-8">
                                        <img
                                            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150"
                                            alt={user?.name}
                                            className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover"
                                        />
                                    </div>
                                </div>
                                <div className="pt-16 pb-8 px-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                                            <p className="text-sm text-gray-500">{user?.email}</p>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2 capitalize">
                                                {user?.role || 'Patient'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (isEditingProfile) {
                                                    setIsEditingProfile(false);
                                                } else {
                                                    setEditProfileForm({
                                                        fullName: patientData?.fullName || '',
                                                        contactNumber: patientData?.contactNumber || '',
                                                        dateOfBirth: patientData?.dateOfBirth ? new Date(patientData.dateOfBirth).toISOString().split('T')[0] : '',
                                                        address: patientData?.address || '',
                                                        gender: patientData?.gender || ''
                                                    });
                                                    setIsEditingProfile(true);
                                                }
                                            }}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0065a3]"
                                        >
                                            {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
                                        </button>
                                    </div>

                                    <div className="border-t border-gray-100 pt-6">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                                        {isEditingProfile ? (
                                            <form onSubmit={handleEditProfileSubmit} className="space-y-4">
                                                <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                                        <input type="text" value={editProfileForm.fullName || ''} onChange={(e) => setEditProfileForm({ ...editProfileForm, fullName: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0065a3] focus:ring-[#0065a3] sm:text-sm px-3 py-2 border border-solid" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                                                        <input type="text" value={editProfileForm.contactNumber || ''} onChange={(e) => setEditProfileForm({ ...editProfileForm, contactNumber: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0065a3] focus:ring-[#0065a3] sm:text-sm px-3 py-2 border border-solid" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                                        <input type="date" value={editProfileForm.dateOfBirth || ''} onChange={(e) => setEditProfileForm({ ...editProfileForm, dateOfBirth: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0065a3] focus:ring-[#0065a3] sm:text-sm px-3 py-2 border border-solid" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Gender</label>
                                                        <select value={editProfileForm.gender || ''} onChange={(e) => setEditProfileForm({ ...editProfileForm, gender: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0065a3] focus:ring-[#0065a3] sm:text-sm px-3 py-2 border border-solid bg-white">
                                                            <option value="">Select Gender</option>
                                                            <option value="male">Male</option>
                                                            <option value="female">Female</option>
                                                            <option value="other">Other</option>
                                                        </select>
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                        <label className="block text-sm font-medium text-gray-700">Address</label>
                                                        <textarea value={editProfileForm.address || ''} onChange={(e) => setEditProfileForm({ ...editProfileForm, address: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0065a3] focus:ring-[#0065a3] sm:text-sm px-3 py-2 border border-solid" rows="3"></textarea>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-3 mt-4">
                                                    <button type="submit" className="px-4 py-2 bg-[#0065a3] text-white rounded-md text-sm font-semibold hover:bg-[#005080] transition-colors">
                                                        Save Changes
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">Contact Number</dt>
                                                    <dd className="mt-1 text-sm text-gray-900">{patientData?.contactNumber || 'N/A'}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                                                    <dd className="mt-1 text-sm text-gray-900">{patientData?.dateOfBirth ? new Date(patientData.dateOfBirth).toLocaleDateString() : 'N/A'}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                                                    <dd className="mt-1 text-sm text-gray-900">{patientData?.address || 'N/A'}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">Gender</dt>
                                                    <dd className="mt-1 text-sm text-gray-900 capitalize">{patientData?.gender || 'N/A'}</dd>
                                                </div>
                                                <div>
                                                    <dt className="text-sm font-medium text-gray-500">Medical Record Number</dt>
                                                    <dd className="mt-1 text-sm text-gray-900">{patientData?.medicalRecordNumber || 'N/A'}</dd>
                                                </div>
                                            </dl>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {/* Prescription Modal */}
            {showPrescriptionModal && selectedPrescription && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Prescription Details</h2>
                                <p className="text-xs text-gray-500 mt-1">Prescribed on {new Date(selectedPrescription.createdAt).toLocaleDateString()}</p>
                            </div>
                            <button onClick={closePrescriptionModal} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-full">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Doctor Info */}
                            <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                                <div className="w-12 h-12 bg-[#0065a3] text-white rounded-full flex items-center justify-center text-lg font-bold">
                                    {(selectedPrescription.doctor?.name || selectedPrescription.doctor || 'Dr.')[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{selectedPrescription.doctor?.name || selectedPrescription.doctor || 'Attending Doctor'}</h3>
                                    <p className="text-sm text-[#0065a3]">{selectedPrescription.doctor?.department || selectedPrescription.doctor?.specialization || 'Hospital Department'}</p>
                                </div>
                            </div>

                            {/* Medications */}
                            {(selectedPrescription.medicines?.length > 0 || selectedPrescription.medications?.length > 0) && (
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-[#0065a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                        Prescribed Medications
                                    </h3>
                                    <div className="border border-gray-100 rounded-lg overflow-hidden">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                                <tr>
                                                    <th className="px-4 py-3">Medicine</th>
                                                    <th className="px-4 py-3">Dosage</th>
                                                    <th className="px-4 py-3">Frequency</th>
                                                    <th className="px-4 py-3">Duration</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {(selectedPrescription.medicines || selectedPrescription.medications || []).map((med, i) => (
                                                    <tr key={i} className="hover:bg-gray-50/50">
                                                        <td className="px-4 py-3 font-medium text-slate-700">{med.name}</td>
                                                        <td className="px-4 py-3 text-gray-600">{med.dosage}</td>
                                                        <td className="px-4 py-3 text-gray-600">{med.frequency}</td>
                                                        <td className="px-4 py-3 text-gray-600">{med.duration}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Medical Notes */}
                            {selectedPrescription.medicalNotes && (
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-[#0065a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        Medical Notes / Advice
                                    </h3>
                                    <div className="bg-gray-50 p-4 rounded-lg text-gray-700 text-sm leading-relaxed border border-gray-100">
                                        {selectedPrescription.medicalNotes}
                                    </div>
                                </div>
                            )}

                            {/* Follow up */}
                            {selectedPrescription.nextVisitDate && (
                                <div className="flex items-center gap-3 p-4 bg-orange-50/50 text-orange-800 rounded-lg border border-orange-100">
                                    <div className="bg-orange-100 p-2 rounded-full">
                                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">Follow-up Visit Planned</p>
                                        <p className="text-xs mt-0.5">Scheduled for {new Date(selectedPrescription.nextVisitDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            )}

                            {/* Attached File */}
                            {selectedPrescription.filePath && (
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-[#0065a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                        Attached File
                                    </h3>
                                    <div className="flex flex-col gap-3">
                                        <a href={`http://localhost:5000/${selectedPrescription.filePath.replace(/\\/g, '/').replace(/^server\//, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-[#0065a3]/30 transition-colors group w-fit">
                                            <div className="bg-white p-2 rounded-md shadow-sm border border-gray-200 text-[#0065a3] group-hover:bg-[#0065a3] group-hover:text-white group-hover:border-[#0065a3] transition-colors">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 group-hover:text-[#0065a3] transition-colors">Prescription_Document</p>
                                                <p className="text-xs text-gray-500">Click to View or Download</p>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 sticky bottom-0">
                            <button onClick={closePrescriptionModal} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                                Close
                            </button>
                            <button onClick={() => window.print()} className="px-4 py-2 bg-[#0065a3] text-white rounded-md text-sm font-semibold hover:bg-[#005080] transition-colors flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Download/Print
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Email OTP Verification Modal */}
            {showOTPModal && selectedReport && (
                <OTPModal
                    reportId={selectedReport._id}
                    onClose={() => setShowOTPModal(false)}
                    onSuccess={handleOTPSuccess}
                />
            )}
        </div>
    );
}