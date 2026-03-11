import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

export default function PatientAdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [patients, setPatients] = useState([]);
    const [deletedPatients, setDeletedPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletedLoading, setDeletedLoading] = useState(false);
    const [activeView, setActiveView] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [viewPatient, setViewPatient] = useState(null);
    const [editPatient, setEditPatient] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    const handleLogout = () => { logout(); navigate('/login'); };

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setPatients(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchDeletedPatients = async () => {
        setDeletedLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/deleted-patients`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setDeletedPatients(await res.json());
        } catch (e) { console.error(e); }
        finally { setDeletedLoading(false); }
    };

    useEffect(() => { fetchPatients(); }, []);
    useEffect(() => { if (activeView === 'deleted') fetchDeletedPatients(); }, [activeView]);

    // ── Derived Stats ──────────────────────────────────────────
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const totalPatients = patients.length;
    const todayNewPatients = patients.filter(p => new Date(p.createdAt) >= todayStart);
    const pendingPatients = patients.filter(p => p.status !== 'Completed');
    const completedPatients = patients.filter(p => p.status === 'Completed');

    const todayByReceptionist = todayNewPatients.reduce((acc, p) => {
        const name = p.createdBy?.name || 'Unknown Staff';
        const email = p.createdBy?.email || '';
        const key = name + '|' + email;
        if (!acc[key]) acc[key] = { name, email, patients: [] };
        acc[key].patients.push(p);
        return acc;
    }, {});

    const filteredPatients = patients.filter(p =>
        p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.medicalRecordNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.createdBy?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ── Edit handlers ─────────────────────────────────────────
    const openEdit = (p) => {
        setEditPatient(p);
        setEditForm({
            fullName: p.fullName || '',
            gender: p.gender || '',
            contactNumber: p.contactNumber || '',
            email: p.email || '',
            address: p.address || '',
            doctorName: p.doctorName || '',
            admissionStatus: p.admissionStatus || 'Out-Patient',
            status: p.status || 'Pending',
            bloodGroup: p.bloodGroup || '',
        });
    };

    const handleEditSave = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients/${editPatient._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(editForm)
            });
            if (res.ok) {
                setEditPatient(null);
                fetchPatients();
            } else {
                const e = await res.json();
                alert(e.message || 'Failed to update.');
            }
        } catch { alert('Connection error.'); }
    };

    // ── Delete (with reason) ──────────────────────────────────
    const openDeleteModal = (p) => { setDeleteTarget(p); setDeleteReason(''); };

    const handleConfirmDelete = async () => {
        if (!deleteReason.trim()) { alert('Please enter a reason for deletion.'); return; }
        setDeleteLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients/${deleteTarget._id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ reason: deleteReason })
            });
            if (res.ok) {
                setPatients(prev => prev.filter(p => p._id !== deleteTarget._id));
                setDeleteTarget(null);
                setDeleteReason('');
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(`Failed to delete patient: ${errData.message || res.statusText || 'Unknown error'}`);
            }
        } catch { alert('Connection error.'); }
        finally { setDeleteLoading(false); }
    };

    // ── Sub-components ────────────────────────────────────────
    const StatCard = ({ label, value, icon, gradient, sub }) => (
        <div className={`relative rounded-2xl p-6 overflow-hidden shadow-lg ${gradient}`}>
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10 blur-xl" />
            <div className="relative z-10">
                <div className="text-white/80 text-xs font-bold uppercase tracking-widest mb-3">{label}</div>
                <div className="text-5xl font-black text-white mb-1">{value}</div>
                {sub && <div className="text-white/60 text-sm font-medium">{sub}</div>}
            </div>
            <div className="absolute bottom-4 right-4 opacity-20 text-white text-5xl">{icon}</div>
        </div>
    );

    const admissionBadge = (s) => {
        if (s === 'Critical') return 'bg-red-50 text-red-700';
        if (s === 'Out-Patient') return 'bg-emerald-50 text-emerald-700';
        return 'bg-blue-50 text-blue-700';
    };

    const navItems = [
        { key: 'overview', label: 'Overview', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg> },
        { key: 'today', label: "Today's Patients", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg> },
        { key: 'all', label: 'All Patients', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
        { key: 'deleted', label: 'Deleted Patients', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg> },
    ];

    return (
        <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans">

            {/* ── Sidebar ─────────────────────────────────── */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 shadow-sm z-20">
                <div className="p-6 border-b border-gray-100 flex items-center gap-2">
                    <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow">P</div>
                    <span className="text-xl font-bold text-violet-700 tracking-tight">PatientAdmin</span>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    <div className="px-3 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Menu</div>
                    {navItems.map(item => (
                        <button
                            key={item.key}
                            onClick={() => setActiveView(item.key)}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all group ${activeView === item.key ? 'text-white bg-violet-600 shadow-sm' : 'text-slate-600 hover:text-violet-600 hover:bg-violet-50'}`}
                        >
                            <span className={activeView === item.key ? 'text-white' : 'text-slate-400 group-hover:text-violet-600'}>{item.icon}</span>
                            {item.label}
                            {item.key === 'deleted' && deletedPatients.length > 0 && (
                                <span className="ml-auto bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{deletedPatients.length}</span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 mb-3 px-1">
                        <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-bold text-slate-700 truncate">{user?.name || 'Admin'}</span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Patient Admin</span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 py-2 rounded-md transition-colors flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* ── Main ────────────────────────────────────── */}
            <main className="flex-1 overflow-y-auto">
                <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-4 z-10 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">
                            {activeView === 'overview' ? 'Dashboard Overview' : activeView === 'today' ? "Today's Admissions" : activeView === 'deleted' ? 'Deleted Patient Records' : 'All Patients'}
                        </h1>
                        <p className="text-sm text-gray-400">Patient Management Admin Panel</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {activeView === 'all' && (
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search patients or staff..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm w-64 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all border-none"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                        )}
                        <button onClick={fetchPatients} className="p-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow transition-all" title="Refresh">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
                        </button>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto p-6 sm:p-8 space-y-8">

                    {/* ──── OVERVIEW ──── */}
                    {activeView === 'overview' && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                                <StatCard label="Total Patients" value={totalPatients} gradient="bg-gradient-to-br from-violet-600 to-purple-700" sub="All time registered" icon="👥" />
                                <StatCard label="Today's Admissions" value={todayNewPatients.length} gradient="bg-gradient-to-br from-blue-500 to-blue-700" sub={new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })} icon="📋" />
                                <StatCard label="Pending Patients" value={pendingPatients.length} gradient="bg-gradient-to-br from-amber-500 to-orange-600" sub="Awaiting doctor review" icon="⏳" />
                                <StatCard label="Completed Patients" value={completedPatients.length} gradient="bg-gradient-to-br from-emerald-500 to-green-700" sub="Successfully treated" icon="✅" />
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base font-bold text-slate-800">Today's Registrations by Staff</h2>
                                        <p className="text-sm text-gray-400">Which receptionist created patient records today</p>
                                    </div>
                                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">{todayNewPatients.length} New Today</span>
                                </div>
                                <div className="p-6">
                                    {Object.keys(todayByReceptionist).length === 0 ? (
                                        <div className="py-10 text-center text-gray-400 text-sm">No patients registered today yet.</div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {Object.values(todayByReceptionist).map((rec, idx) => (
                                                <div key={idx} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm flex-shrink-0">{rec.name.charAt(0).toUpperCase()}</div>
                                                        <div>
                                                            <div className="text-sm font-bold text-slate-700">{rec.name}</div>
                                                            <div className="text-xs text-gray-400 truncate max-w-[160px]">{rec.email}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Patients Added</span>
                                                        <span className="text-lg font-black text-violet-600">{rec.patients.length}</span>
                                                    </div>
                                                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                                        {rec.patients.map((p, i) => (
                                                            <div key={i} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border border-gray-100">
                                                                <span className="font-semibold text-slate-600 truncate max-w-[120px]">{p.fullName}</span>
                                                                <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${p.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-50 text-orange-600'}`}>{p.status || 'Pending'}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <h2 className="text-base font-bold text-slate-800">Recently Added Patients</h2>
                                    <p className="text-sm text-gray-400">Last 5 patients registered in the system</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead><tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="py-3.5 px-6 text-xs font-bold text-gray-500 uppercase">Patient Name</th>
                                            <th className="py-3.5 px-4 text-xs font-bold text-gray-500 uppercase">MRN</th>
                                            <th className="py-3.5 px-4 text-xs font-bold text-gray-500 uppercase">Doctor</th>
                                            <th className="py-3.5 px-4 text-xs font-bold text-gray-500 uppercase">Created By</th>
                                            <th className="py-3.5 px-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                            <th className="py-3.5 px-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                                        </tr></thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {loading ? <tr><td colSpan="6" className="py-8 text-center text-gray-400">Loading...</td></tr>
                                                : patients.slice().reverse().slice(0, 5).map((p, i) => (
                                                    <tr key={i} className="hover:bg-violet-50/30 transition-colors">
                                                        <td className="py-4 px-6"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs flex-shrink-0">{p.fullName?.charAt(0)}</div><span className="text-sm font-semibold text-slate-700">{p.fullName}</span></div></td>
                                                        <td className="py-4 px-4 text-xs font-mono text-gray-500">{p.medicalRecordNumber}</td>
                                                        <td className="py-4 px-4 text-sm text-gray-600">{p.doctorName || '—'}</td>
                                                        <td className="py-4 px-4"><div className="flex flex-col"><span className="text-sm font-semibold text-slate-700">{p.createdBy?.name || 'Unknown'}</span><span className="text-xs text-gray-400">{p.createdBy?.email || ''}</span></div></td>
                                                        <td className="py-4 px-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{p.status || 'Pending'}</span></td>
                                                        <td className="py-4 px-4 text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ──── TODAY'S PATIENTS ──── */}
                    {activeView === 'today' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <StatCard label="Registered Today" value={todayNewPatients.length} gradient="bg-gradient-to-br from-blue-500 to-blue-700" sub={new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })} icon="📋" />
                                <StatCard label="Staff On Duty" value={Object.keys(todayByReceptionist).length} gradient="bg-gradient-to-br from-violet-600 to-purple-700" sub="Receptionists active today" icon="👩‍💼" />
                                <StatCard label="Pending Review" value={todayNewPatients.filter(p => p.status !== 'Completed').length} gradient="bg-gradient-to-br from-amber-500 to-orange-600" sub="Need doctor attention" icon="⏳" />
                            </div>
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <h2 className="text-base font-bold text-slate-800">Today's Patient Records</h2>
                                    <p className="text-sm text-gray-400">All patients registered on {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead><tr className="bg-gray-50 border-b border-gray-100">
                                            {['Patient', 'MRN', 'Doctor Assigned', 'Department', 'Registered By', 'Status', 'Admission'].map(h => <th key={h} className="py-3.5 px-4 text-xs font-bold text-gray-500 uppercase">{h}</th>)}
                                        </tr></thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {loading ? <tr><td colSpan="7" className="py-8 text-center text-gray-400">Loading today's patients...</td></tr>
                                                : todayNewPatients.length === 0 ? <tr><td colSpan="7" className="py-12 text-center text-gray-400">No patients registered today yet.</td></tr>
                                                    : todayNewPatients.map((p, i) => (
                                                        <tr key={i} className="hover:bg-blue-50/20 transition-colors group">
                                                            <td className="py-4 px-6"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">{p.fullName?.charAt(0)}</div><div><div className="text-sm font-bold text-slate-700">{p.fullName}</div><div className="text-xs text-gray-400">{p.contactNumber}</div></div></div></td>
                                                            <td className="py-4 px-4 text-xs font-mono text-gray-500">{p.medicalRecordNumber}</td>
                                                            <td className="py-4 px-4 text-sm text-gray-600 font-medium">{p.doctorName || '—'}</td>
                                                            <td className="py-4 px-4 text-sm text-gray-500">{p.department || '—'}</td>
                                                            <td className="py-4 px-4"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs flex-shrink-0">{(p.createdBy?.name || 'U').charAt(0).toUpperCase()}</div><div><div className="text-xs font-semibold text-slate-600">{p.createdBy?.name || 'Unknown'}</div><div className="text-[10px] text-gray-400">{p.createdBy?.email || ''}</div></div></div></td>
                                                            <td className="py-4 px-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{p.status || 'Pending'}</span></td>
                                                            <td className="py-4 px-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${admissionBadge(p.admissionStatus)}`}>{p.admissionStatus}</span></td>
                                                        </tr>
                                                    ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ──── ALL PATIENTS ──── */}
                    {activeView === 'all' && (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold text-slate-800">All Patient Records</h2>
                                    <p className="text-sm text-gray-400">{filteredPatients.length} of {totalPatients} patients</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead><tr className="bg-gray-50 border-b border-gray-100">
                                        {['Patient', 'MRN', 'Doctor', 'Registered By', 'Status', 'Admission', 'Date', 'Actions'].map(h => (
                                            <th key={h} className={`py-3.5 px-4 text-xs font-bold text-gray-500 uppercase ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                                        ))}
                                    </tr></thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {loading ? <tr><td colSpan="8" className="py-8 text-center text-gray-400">Loading patients...</td></tr>
                                            : filteredPatients.length === 0 ? <tr><td colSpan="8" className="py-12 text-center text-gray-400">No patients found for "{searchTerm}"</td></tr>
                                                : filteredPatients.slice().reverse().map((p, i) => (
                                                    <tr key={i} className="hover:bg-violet-50/20 transition-colors group">
                                                        <td className="py-4 px-6"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm flex-shrink-0">{p.fullName?.charAt(0)}</div><div><div className="text-sm font-bold text-slate-700">{p.fullName}</div><div className="text-xs text-gray-400">{p.contactNumber}</div></div></div></td>
                                                        <td className="py-4 px-4 text-xs font-mono text-gray-500">{p.medicalRecordNumber}</td>
                                                        <td className="py-4 px-4 text-sm text-gray-600">{p.doctorName || '—'}</td>
                                                        <td className="py-4 px-4"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs">{(p.createdBy?.name || 'U').charAt(0).toUpperCase()}</div><div><div className="text-xs font-semibold text-slate-600">{p.createdBy?.name || 'Unknown'}</div><div className="text-[10px] text-gray-400">{p.createdBy?.email || ''}</div></div></div></td>
                                                        <td className="py-4 px-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{p.status || 'Pending'}</span></td>
                                                        <td className="py-4 px-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${admissionBadge(p.admissionStatus)}`}>{p.admissionStatus}</span></td>
                                                        <td className="py-4 px-4 text-xs text-gray-400 whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                                                        <td className="py-4 px-4 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                {/* View */}
                                                                <button onClick={() => setViewPatient(p)} className="p-1.5 text-violet-500 hover:bg-violet-50 rounded-lg transition-colors" title="View">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                                </button>
                                                                {/* Edit */}
                                                                <button onClick={() => openEdit(p)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                                </button>
                                                                {/* Delete */}
                                                                <button onClick={() => openDeleteModal(p)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ──── DELETED PATIENTS ──── */}
                    {activeView === 'deleted' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <StatCard label="Total Deleted" value={deletedPatients.length} gradient="bg-gradient-to-br from-red-500 to-rose-700" sub="Archived records" icon="🗑️" />
                                <StatCard label="Deleted Today" value={deletedPatients.filter(d => new Date(d.deletedAt) >= todayStart).length} gradient="bg-gradient-to-br from-orange-500 to-red-600" sub="Deletions today" icon="📅" />
                                <StatCard label="Unique Reasons" value={[...new Set(deletedPatients.map(d => d.deletionReason))].length} gradient="bg-gradient-to-br from-slate-500 to-slate-700" sub="Different reasons given" icon="📝" />
                            </div>
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg></div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-800">Deleted Patient Records Archive</h2>
                                        <p className="text-sm text-gray-400">Records are preserved here after deletion for audit purposes</p>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead><tr className="bg-gray-50 border-b border-gray-100">
                                            {['Patient Name', 'MRN', 'Doctor', 'Originally By', 'Deleted By', 'Reason', 'Deleted On'].map(h => (
                                                <th key={h} className="py-3.5 px-4 text-xs font-bold text-gray-500 uppercase">{h}</th>
                                            ))}
                                        </tr></thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {deletedLoading ? <tr><td colSpan="7" className="py-8 text-center text-gray-400">Loading deleted records...</td></tr>
                                                : deletedPatients.length === 0 ? <tr><td colSpan="7" className="py-12 text-center text-gray-400">No deleted patient records found.</td></tr>
                                                    : deletedPatients.map((d, i) => (
                                                        <tr key={i} className="hover:bg-red-50/20 transition-colors">
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 rounded-full bg-red-100 text-red-500 flex items-center justify-center font-bold text-sm flex-shrink-0">{d.fullName?.charAt(0)}</div>
                                                                    <div>
                                                                        <div className="text-sm font-bold text-slate-600 line-through decoration-red-300">{d.fullName}</div>
                                                                        <div className="text-xs text-gray-400">{d.contactNumber}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4 text-xs font-mono text-gray-400">{d.medicalRecordNumber}</td>
                                                            <td className="py-4 px-4 text-sm text-gray-500">{d.doctorName || '—'}</td>
                                                            <td className="py-4 px-4">
                                                                <div className="text-xs font-semibold text-slate-600">{d.createdBy?.name || 'Unknown'}</div>
                                                                <div className="text-[10px] text-gray-400">{d.createdBy?.email || ''}</div>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <div className="text-xs font-semibold text-red-600">{d.deletedByName || 'Unknown'}</div>
                                                                <div className="text-[10px] text-gray-400">{d.deletedByEmail || ''}</div>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <span className="inline-block max-w-[200px] px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-md font-medium truncate" title={d.deletionReason}>
                                                                    {d.deletionReason}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4 text-xs text-gray-400 whitespace-nowrap">{new Date(d.deletedAt).toLocaleString('en-IN')}</td>
                                                        </tr>
                                                    ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {/* ══ VIEW MODAL ══════════════════════════════════════ */}
            {viewPatient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                        <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-5 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-white">{viewPatient.fullName}</h2>
                                <p className="text-violet-200 text-xs font-mono">{viewPatient.medicalRecordNumber}</p>
                            </div>
                            <button onClick={() => setViewPatient(null)} className="text-white/70 hover:text-white p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4 text-sm max-h-[60vh] overflow-y-auto">
                            {[
                                ['Gender', viewPatient.gender],
                                ['Date of Birth', viewPatient.dateOfBirth ? new Date(viewPatient.dateOfBirth).toLocaleDateString('en-IN') : '—'],
                                ['Contact', viewPatient.contactNumber],
                                ['Email', viewPatient.email || '—'],
                                ['Blood Group', viewPatient.bloodGroup || '—'],
                                ['Assigned Doctor', viewPatient.doctorName || '—'],
                                ['Admission Status', viewPatient.admissionStatus],
                                ['Status', viewPatient.status || 'Pending'],
                                ['Registered By', viewPatient.createdBy?.name || 'Unknown'],
                                ['Staff Email', viewPatient.createdBy?.email || '—'],
                                ['Next Visit', viewPatient.nextVisitDate ? new Date(viewPatient.nextVisitDate).toLocaleDateString('en-IN') : '—'],
                                ['Registered On', new Date(viewPatient.createdAt).toLocaleDateString('en-IN')],
                            ].map(([label, val]) => (
                                <div key={label}>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
                                    <div className="text-slate-700 font-semibold">{val}</div>
                                </div>
                            ))}
                            {viewPatient.address && (
                                <div className="col-span-2">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Address</div>
                                    <div className="text-slate-700 font-semibold">{viewPatient.address}</div>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                            <button onClick={() => setViewPatient(null)} className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ EDIT MODAL ══════════════════════════════════════ */}
            {editPatient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-white">Edit Patient</h2>
                                <p className="text-blue-200 text-xs font-mono">{editPatient.medicalRecordNumber}</p>
                            </div>
                            <button onClick={() => setEditPatient(null)} className="text-white/70 hover:text-white p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                            {[
                                { label: 'Full Name', key: 'fullName', type: 'text' },
                                { label: 'Contact Number', key: 'contactNumber', type: 'text' },
                                { label: 'Email', key: 'email', type: 'email' },
                                { label: 'Blood Group', key: 'bloodGroup', type: 'text' },
                                { label: 'Doctor Name', key: 'doctorName', type: 'text' },
                                { label: 'Address', key: 'address', type: 'text' },
                            ].map(f => (
                                <div key={f.key} className={f.key === 'address' ? 'col-span-2' : ''}>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{f.label}</label>
                                    <input
                                        type={f.type}
                                        value={editForm[f.key] || ''}
                                        onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Gender</label>
                                <select value={editForm.gender} onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                                    <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Admission Status</label>
                                <select value={editForm.admissionStatus} onChange={e => setEditForm(p => ({ ...p, admissionStatus: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                                    <option value="In-Patient">In-Patient</option><option value="Out-Patient">Out-Patient</option><option value="Discharged">Discharged</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                                <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                                    <option value="Pending">Pending</option><option value="Completed">Completed</option>
                                </select>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setEditPatient(null)} className="px-5 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={handleEditSave} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ DELETE REASON MODAL ═════════════════════════════ */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-5 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-white">Delete Patient Record</h2>
                                <p className="text-red-200 text-xs">This action will archive the record</p>
                            </div>
                            <button onClick={() => setDeleteTarget(null)} className="text-white/70 hover:text-white p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-5 p-4 bg-red-50 rounded-xl border border-red-100">
                                <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center font-black text-xl flex-shrink-0">{deleteTarget.fullName?.charAt(0)}</div>
                                <div>
                                    <div className="text-base font-bold text-slate-800">{deleteTarget.fullName}</div>
                                    <div className="text-sm text-gray-500 font-mono">{deleteTarget.medicalRecordNumber}</div>
                                    <div className="text-xs text-gray-400 mt-0.5">Doctor: {deleteTarget.doctorName || '—'}</div>
                                </div>
                            </div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Reason for Deletion <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={4}
                                value={deleteReason}
                                onChange={e => setDeleteReason(e.target.value)}
                                placeholder="Please provide a clear reason why this patient record is being deleted (e.g., Duplicate entry, Patient request, Data error)..."
                                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none transition-all"
                            />
                            <p className="text-xs text-gray-400 mt-2">⚠️ The record will be preserved in the Deleted Patients archive with this reason.</p>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="px-5 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={handleConfirmDelete} disabled={deleteLoading || !deleteReason.trim()} className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2">
                                {deleteLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />&nbsp;Deleting...</> : 'Confirm Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
