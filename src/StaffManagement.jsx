import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import AdminSidebar from './AdminSidebar';

export default function StaffManagement() {
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'staff', // Force role to staff
        department: '',
        contactNumber: '',
        employeeId: ''
    });

    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const fetchStaff = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/admin/staff', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setStaffList(data.staff || []);
            }
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        // Validation
        if (!formData.name || !formData.email || (!editingId && !formData.password)) {
            setMessage({ type: 'error', text: editingId ? 'Name and email are required' : 'Name, email, and password are required' });
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const url = editingId ? `http://localhost:5000/api/admin/staff/${editingId}` : 'http://localhost:5000/api/admin/staff';
            const method = editingId ? 'PUT' : 'POST';

            const payload = {
                name: formData.name,
                email: formData.email,
                role: 'staff',
                department: formData.department,
                contactNumber: formData.contactNumber,
            };

            if (formData.password) {
                payload.password = formData.password;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: editingId ? 'Staff member updated successfully!' : 'Staff member created successfully!' });
                // Reset form
                setFormData({
                    name: '',
                    email: '',
                    password: '',
                    role: 'staff',
                    department: '',
                    contactNumber: '',
                    employeeId: ''
                });
                setEditingId(null);
                fetchStaff(); // Refresh list
            } else {
                setMessage({ type: 'error', text: data.message || `Failed to ${editingId ? 'update' : 'create'} staff member` });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error connecting to server' });
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (staff) => {
        setFormData({
            name: staff.name || '',
            email: staff.email || '',
            password: '', // clear password so it's only updated if typed
            role: staff.role || 'staff',
            department: staff.department || '',
            contactNumber: staff.contactNumber || '',
            employeeId: staff.employeeId || ''
        });
        setEditingId(staff._id);
        setMessage({ type: '', text: '' });
    };

    const handleCancelEdit = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'staff',
            department: '',
            contactNumber: '',
            employeeId: ''
        });
        setEditingId(null);
        setMessage({ type: '', text: '' });
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/staff/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            if (response.ok) {
                fetchStaff();
            }
        } catch (error) {
            console.error('Error toggling status:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this staff member?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/admin/staff/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                fetchStaff();
            }
        } catch (error) {
            console.error('Error deleting staff:', error);
        }
    };

    const filteredStaff = staffList.filter(staff =>
        (staff.role === 'staff') &&
        (staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="flex h-screen bg-[#f8fafc] text-slate-800">
            {/* Sidebar */}
            <AdminSidebar activePage="staff" />

            {/* Main Content */}
            <main className="flex-1 ml-64 overflow-y-auto">
                {/* Page Header */}
                <div className="bg-white border-b border-gray-200 px-8 py-5">
                    <h1 className="text-xl font-bold text-slate-700">Create Staff</h1>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Add New Staff Column (Left) */}
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sticky top-6">
                                <h2 className="text-lg font-bold text-[#0065a3] mb-6">{editingId ? 'Update Staff Account' : 'Create New Staff Account'}</h2>

                                {/* Success/Error Messages */}
                                {message.text && (
                                    <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                        {message.text}
                                    </div>
                                )}

                                <form className="space-y-5" onSubmit={handleSubmit}>
                                    <div>
                                        <label className="block text-xs font-bold text-[#0065a3] uppercase tracking-wide mb-2">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="e.g. John Doe"
                                            className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[#0065a3] uppercase tracking-wide mb-2">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="john@hospital.com"
                                            className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[#0065a3] uppercase tracking-wide mb-2">
                                            Password {editingId ? '' : '*'}
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder={editingId ? "Leave blank to keep current" : "Enter password"}
                                            className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all"
                                            required={!editingId}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[#0065a3] uppercase tracking-wide mb-2">
                                            Department
                                        </label>
                                        <input
                                            type="text"
                                            name="department"
                                            value={formData.department}
                                            onChange={handleChange}
                                            placeholder="e.g. Administration"
                                            className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[#0065a3] uppercase tracking-wide mb-2">
                                            Phone Number
                                        </label>
                                        <input
                                            type="text"
                                            name="contactNumber"
                                            value={formData.contactNumber}
                                            onChange={handleChange}
                                            placeholder="+1 (555) 000-0000"
                                            className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0065a3]/20 focus:border-[#0065a3] transition-all"
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className={`flex-1 ${editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#0065a3] hover:bg-[#005080]'} text-white font-semibold py-3 rounded-md transition-all shadow-md active:scale-[0.98] mt-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {loading ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Account' : 'Create Account')}
                                        </button>
                                        {editingId && (
                                            <button
                                                type="button"
                                                onClick={handleCancelEdit}
                                                className="flex-none bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-md transition-all shadow-md active:scale-[0.98] mt-2"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Staff Directory Column (Right) */}
                        <div className="lg:col-span-8">
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full max-h-[800px]">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-lg font-bold text-[#0065a3]">Staff Accounts</h2>
                                        <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200">
                                            {staffList.filter(s => s.role === 'staff' && s.isActive).length} Active
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search staff..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0065a3] w-48"
                                        />
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="overflow-y-auto flex-1">
                                    {filteredStaff.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500">
                                            No staff accounts found. Create one to see it here.
                                        </div>
                                    ) : (
                                        <table className="w-full text-left">
                                            <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">
                                                <tr className="border-b border-gray-100">
                                                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[35%]">Name</th>
                                                    <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[20%]">Role</th>
                                                    <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[20%]">Department</th>
                                                    <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[10%]">Status</th>
                                                    <th className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[15%] text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {filteredStaff.map((staff) => (
                                                    <tr key={staff._id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-medium text-slate-700">{staff.name}</span>
                                                                    <span className="text-xs text-gray-500">{staff.email}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 text-sm text-[#0065a3] font-medium capitalize">{staff.role}</td>
                                                        <td className="py-4 px-4 text-sm text-[#0065a3] font-medium">{staff.department || '-'}</td>
                                                        <td className="py-4 px-4">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${staff.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                {staff.isActive ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button onClick={() => handleEdit(staff)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                                                    </svg>
                                                                </button>
                                                                <button onClick={() => handleToggleStatus(staff._id, staff.isActive)} className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded" title={staff.isActive ? "Disable" : "Enable"}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                                    </svg>
                                                                </button>
                                                                <button onClick={() => handleDelete(staff._id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                    </svg>
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
                </div>
            </main>
        </div>
    );
}
