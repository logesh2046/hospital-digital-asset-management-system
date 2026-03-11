import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import AdminSidebar from './AdminSidebar';

export default function StaffManagement() {
    const { user } = useAuth();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        department: '',
        contactNumber: '',
        employeeId: ''
    });

    const [staffList, setStaffList] = useState([]);
    const [deletedStaff, setDeletedStaff] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deletedLoading, setDeletedLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [activeView, setActiveView] = useState('accounts'); // 'accounts' | 'deleted'

    // Delete modal state
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const token = () => localStorage.getItem('token');

    const fetchStaff = async () => {
        try {
            const res = await fetch(`${API}/api/admin/staff`, {
                headers: { 'Authorization': `Bearer ${token()}` }
            });
            const data = await res.json();
            if (res.ok) setStaffList(data.staff || []);
        } catch { console.error('Error fetching staff'); }
    };

    const fetchDeletedStaff = async () => {
        setDeletedLoading(true);
        try {
            const res = await fetch(`${API}/api/deleted-staff`, {
                headers: { 'Authorization': `Bearer ${token()}` }
            });
            if (res.ok) setDeletedStaff(await res.json());
        } catch { console.error('Error fetching deleted staff'); }
        finally { setDeletedLoading(false); }
    };

    useEffect(() => { fetchStaff(); }, []);
    useEffect(() => { if (activeView === 'deleted') fetchDeletedStaff(); }, [activeView]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        if (!formData.name || !formData.email || (!editingId && !formData.password)) {
            setMessage({ type: 'error', text: editingId ? 'Name and email are required' : 'Name, email, and password are required' });
            setLoading(false);
            return;
        }

        try {
            const url = editingId ? `${API}/api/admin/staff/${editingId}` : `${API}/api/admin/staff`;
            const method = editingId ? 'PUT' : 'POST';
            const payload = {
                name: formData.name,
                email: formData.email,
                role: 'staff',
                department: formData.department,
                contactNumber: formData.contactNumber,
            };
            if (formData.password) payload.password = formData.password;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: editingId ? 'Staff member updated successfully!' : 'Staff member created successfully!' });
                setFormData({ name: '', email: '', password: '', role: 'staff', department: '', contactNumber: '', employeeId: '' });
                setEditingId(null);
                fetchStaff();
            } else {
                setMessage({ type: 'error', text: data.message || `Failed to ${editingId ? 'update' : 'create'} staff member` });
            }
        } catch {
            setMessage({ type: 'error', text: 'Error connecting to server' });
        } finally { setLoading(false); }
    };

    const handleEdit = (staff) => {
        setFormData({
            name: staff.name || '',
            email: staff.email || '',
            password: '',
            role: staff.role || 'staff',
            department: staff.department || '',
            contactNumber: staff.contactNumber || '',
            employeeId: staff.employeeId || ''
        });
        setEditingId(staff._id);
        setMessage({ type: '', text: '' });
    };

    const handleCancelEdit = () => {
        setFormData({ name: '', email: '', password: '', role: 'staff', department: '', contactNumber: '', employeeId: '' });
        setEditingId(null);
        setMessage({ type: '', text: '' });
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const res = await fetch(`${API}/api/admin/staff/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            if (res.ok) fetchStaff();
        } catch { console.error('Error toggling status'); }
    };

    // Open delete reason modal
    const openDeleteModal = (staff) => {
        setDeleteTarget(staff);
        setDeleteReason('');
    };

    const handleConfirmDelete = async () => {
        if (!deleteReason.trim()) { alert('Please enter a reason for deletion.'); return; }
        setDeleteLoading(true);
        try {
            const res = await fetch(`${API}/api/admin/staff/${deleteTarget._id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
                body: JSON.stringify({ reason: deleteReason })
            });
            if (res.ok) {
                setMessage({ type: 'success', text: `${deleteTarget.name} has been deleted and archived.` });
                setStaffList(prev => prev.filter(s => s._id !== deleteTarget._id));
                setDeleteTarget(null);
                setDeleteReason('');
            } else {
                const err = await res.json();
                setMessage({ type: 'error', text: err.message || 'Delete failed.' });
            }
        } catch { setMessage({ type: 'error', text: 'Connection error.' }); }
        finally { setDeleteLoading(false); }
    };

    // ── Filtered staff (only role=staff, apply search)
    const filteredStaff = staffList
        .filter(s => s.role === 'staff')
        .filter(s => {
            if (!searchTerm.trim()) return true;
            const q = searchTerm.toLowerCase();
            return (
                (s.name || '').toLowerCase().includes(q) ||
                (s.email || '').toLowerCase().includes(q) ||
                (s.department || '').toLowerCase().includes(q) ||
                (s.contactNumber || '').toLowerCase().includes(q)
            );
        });

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    return (
        <div className="flex h-screen bg-[#f8fafc] text-slate-800">
            <AdminSidebar activePage="staff" />

            <main className="flex-1 ml-64 overflow-y-auto">
                {/* Page Header */}
                <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-slate-700">Create Staff</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveView('accounts')}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeView === 'accounts' ? 'bg-[#0065a3] text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Staff Accounts
                        </button>
                        <button
                            onClick={() => setActiveView('deleted')}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeView === 'deleted' ? 'bg-red-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Deleted Staff
                            {deletedStaff.length > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{deletedStaff.length}</span>
                            )}
                        </button>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">

                    {/* ══ STAFF ACCOUNTS VIEW ══════════════════════ */}
                    {activeView === 'accounts' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Create/Edit Form (Left) */}
                            <div className="lg:col-span-4 flex flex-col gap-6">
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sticky top-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-lg font-bold text-[#0065a3]">{editingId ? 'Update Staff Account' : 'Create New Staff Account'}</h2>
                                        {editingId && (
                                            <button onClick={handleCancelEdit} className="text-xs text-red-500 hover:underline font-semibold">Cancel Edit</button>
                                        )}
                                    </div>

                                    {message.text && (
                                        <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                            {message.text}
                                        </div>
                                    )}

                                    <form className="space-y-5" onSubmit={handleSubmit}>
                                        <div>
                                            <label className="block text-xs font-bold text-[#0065a3] uppercase tracking-wide mb-2">Full Name *</label>
                                            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. John Doe" required className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#0065a3] uppercase tracking-wide mb-2">Email Address *</label>
                                            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@hospital.com" required className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#0065a3] uppercase tracking-wide mb-2">Password {editingId ? '' : '*'}</label>
                                            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={editingId ? 'Leave blank to keep current' : 'Enter password'} required={!editingId} className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#0065a3] uppercase tracking-wide mb-2">Department</label>
                                            <input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="e.g. Administration" className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[#0065a3] uppercase tracking-wide mb-2">Phone Number</label>
                                            <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} placeholder="+1 (555) 000-0000" className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all" />
                                        </div>
                                        <div className="flex gap-3">
                                            <button type="submit" disabled={loading} className={`flex-1 ${editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#0065a3] hover:bg-[#005080]'} text-white font-semibold py-3 rounded-md transition-all shadow-md active:scale-[0.98] mt-2 disabled:opacity-50 disabled:cursor-not-allowed`}>
                                                {loading ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Account' : 'Create Account')}
                                            </button>
                                            {editingId && (
                                                <button type="button" onClick={handleCancelEdit} className="flex-none bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-md transition-all shadow-md active:scale-[0.98] mt-2">
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* Staff Directory (Right) */}
                            <div className="lg:col-span-8">
                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full max-h-[800px]">
                                    <div className="p-6 border-b border-gray-100">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-lg font-bold text-[#0065a3]">Staff Accounts</h2>
                                                <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200">
                                                    {staffList.filter(s => s.role === 'staff' && s.isActive).length} Active
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-400">{filteredStaff.length} result{filteredStaff.length !== 1 ? 's' : ''}</span>
                                        </div>
                                        {/* Search input */}
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search by name, email, department..."
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all"
                                            />
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="overflow-y-auto flex-1">
                                        {filteredStaff.length === 0 ? (
                                            <div className="p-10 text-center text-gray-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                                <p className="text-sm font-medium">{searchTerm ? `No staff matching "${searchTerm}"` : 'No staff accounts found. Create one to see it here.'}</p>
                                            </div>
                                        ) : (
                                            <table className="w-full text-left">
                                                <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">
                                                    <tr className="border-b border-gray-100">
                                                        <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[35%]">Name</th>
                                                        <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[20%]">Department</th>
                                                        <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[10%]">Status</th>
                                                        <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[15%] text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {filteredStaff.map(staff => (
                                                        <tr key={staff._id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-[#0065a3]/10 text-[#0065a3] flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                                        {(staff.name || '?').charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-semibold text-slate-700">{staff.name}</span>
                                                                        <span className="text-xs text-gray-500">{staff.email}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4 text-sm text-gray-600">{staff.department || '—'}</td>
                                                            <td className="py-4 px-4">
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${staff.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {staff.isActive ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4 text-right">
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <button onClick={() => handleEdit(staff)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                                                                    </button>
                                                                    <button onClick={() => handleToggleStatus(staff._id, staff.isActive)} className={`p-1.5 rounded-lg ${staff.isActive ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`} title={staff.isActive ? 'Disable' : 'Enable'}>
                                                                        {staff.isActive ? (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                                                        ) : (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                        )}
                                                                    </button>
                                                                    <button onClick={() => openDeleteModal(staff)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══ DELETED STAFF VIEW ═══════════════════════ */}
                    {activeView === 'deleted' && (
                        <div className="space-y-6">
                            {/* Stat cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                {[
                                    { label: 'Total Deleted', value: deletedStaff.length, bg: 'bg-gradient-to-br from-red-500 to-rose-700', icon: '🗑️' },
                                    { label: 'Deleted Today', value: deletedStaff.filter(d => new Date(d.deletedAt) >= todayStart).length, bg: 'bg-gradient-to-br from-orange-500 to-red-600', icon: '📅' },
                                    { label: 'Unique Reasons', value: [...new Set(deletedStaff.map(d => d.deletionReason))].length, bg: 'bg-gradient-to-br from-slate-500 to-slate-700', icon: '📝' },
                                ].map(c => (
                                    <div key={c.label} className={`relative rounded-2xl p-6 overflow-hidden shadow-lg ${c.bg}`}>
                                        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10 blur-xl" />
                                        <div className="relative z-10">
                                            <div className="text-white/80 text-xs font-bold uppercase tracking-widest mb-3">{c.label}</div>
                                            <div className="text-5xl font-black text-white mb-1">{c.value}</div>
                                        </div>
                                        <div className="absolute bottom-4 right-4 opacity-20 text-white text-5xl">{c.icon}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-800">Deleted Staff Account Archive</h2>
                                        <p className="text-sm text-gray-400">Records preserved here after deletion for audit purposes</p>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                {['Name & Email', 'Role', 'Department', 'Deleted By', 'Reason', 'Deleted On'].map(h => (
                                                    <th key={h} className="py-3.5 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {deletedLoading ? (
                                                <tr><td colSpan="6" className="py-8 text-center text-gray-400">Loading deleted staff records...</td></tr>
                                            ) : deletedStaff.length === 0 ? (
                                                <tr><td colSpan="6" className="py-12 text-center text-gray-400">No deleted staff records found.</td></tr>
                                            ) : deletedStaff.map((d, i) => (
                                                <tr key={i} className="hover:bg-red-50/20 transition-colors">
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-red-100 text-red-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                                {(d.name || '?').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-slate-600 line-through decoration-red-300">{d.name}</div>
                                                                <div className="text-xs text-gray-400">{d.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-600">{d.role}</span>
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-gray-500">{d.department || '—'}</td>
                                                    <td className="py-4 px-4">
                                                        <div className="text-xs font-semibold text-red-600">{d.deletedByName || 'Unknown'}</div>
                                                        <div className="text-[10px] text-gray-400">{d.deletedByEmail || ''}</div>
                                                    </td>
                                                    <td className="py-4 px-4 max-w-[220px]">
                                                        <span className="inline-block px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-md font-medium" title={d.deletionReason}>
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

            {/* ══ DELETE REASON MODAL ═══════════════════════════ */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-5 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-white">Delete Staff Account</h2>
                                <p className="text-red-200 text-xs">This action will archive the account</p>
                            </div>
                            <button onClick={() => setDeleteTarget(null)} className="text-white/70 hover:text-white p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-5 p-4 bg-red-50 rounded-xl border border-red-100">
                                <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center font-black text-xl flex-shrink-0">
                                    {(deleteTarget.name || '?').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-base font-bold text-slate-800">{deleteTarget.name}</div>
                                    <div className="text-sm text-gray-500">{deleteTarget.email}</div>
                                    <div className="text-xs text-gray-400 mt-0.5 capitalize">{deleteTarget.role} · {deleteTarget.department || 'No Department'}</div>
                                </div>
                            </div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Reason for Deletion <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={4}
                                value={deleteReason}
                                onChange={e => setDeleteReason(e.target.value)}
                                placeholder="Please provide a clear reason why this staff account is being deleted (e.g., Resignation, Contract ended, Policy violation)..."
                                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none transition-all"
                            />
                            <p className="text-xs text-gray-400 mt-2">⚠️ The account will be preserved in the Deleted Staff archive with this reason.</p>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="px-5 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deleteLoading || !deleteReason.trim()}
                                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                            >
                                {deleteLoading ? (
                                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />&nbsp;Deleting...</>
                                ) : 'Confirm Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
