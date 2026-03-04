import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Mock Data - In a real app, you would fetch this from the backend
// Mock Data removed as per request to use real backend data only

export default function StaffUserManagement() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'doctor', // Default to doctor
        department: '',
        contactNumber: '',
        employeeId: ''
    });

    // Staff list state - Fetch from backend
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Edit Mode State
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);

    // Fetch staff from backend
    const fetchStaff = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/staff`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setStaffList(data.staff);
            }
        } catch (error) {
            console.error('Error fetching staff:', error);
            setMessage({ type: 'error', text: 'Failed to load staff list.' });
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Filter staff list to only show clinical staff
    const clinicalStaff = staffList.filter(staff => ['doctor', 'technician', 'receptionist'].includes(staff.role));


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        // Validation
        if (!formData.name || !formData.email || (!editMode && !formData.password)) {
            setMessage({ type: 'error', text: 'Name, email, and password are required (Password optional for edit)' });
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const url = editMode
                ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/staff/${editId}`
                : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/staff`;

            const method = editMode ? 'PUT' : 'POST';

            const bodyData = {
                name: formData.name,
                email: formData.email,
                role: formData.role, // User selected role
                department: formData.department,
                contactNumber: formData.contactNumber
            };

            // Only send password if it's provided (important for Edit mode where it might be empty)
            if (formData.password) {
                bodyData.password = formData.password;
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bodyData)
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: editMode ? 'Staff member updated successfully!' : 'Clinical staff member created successfully!' });

                // Refresh list from server
                fetchStaff();

                // Reset form and mode
                setFormData({
                    name: '',
                    email: '',
                    password: '',
                    role: 'doctor',
                    department: '',
                    contactNumber: '',
                    employeeId: ''
                });
                setEditMode(false);
                setEditId(null);
            } else {
                setMessage({ type: 'error', text: data.message || `Failed to ${editMode ? 'update' : 'create'} staff member` });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error connecting to server' });
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-[#f8fafc] text-slate-800">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 fixed h-full z-20">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="bg-green-600 text-white p-2 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                        Staff<span className="text-green-600">Portal</span>
                    </h1>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-4">
                    <div className="mb-6">
                        <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Menu</p>
                        <ul className="space-y-1">
                            <li>
                                <Link to="/staff-dashboard" className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors group">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-3 text-gray-400 group-hover:text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link to="/staff-dashboard/management" className="flex items-center px-3 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                    Staff Management
                                </Link>
                            </li>

                        </ul>
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-200 bg-gray-50/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                            {user?.email?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">{user?.email || 'Staff User'}</span>
                            <span className="text-xs text-gray-500">Staff Member</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full text-xs font-semibold text-red-600 bg-white border border-red-100 hover:bg-red-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 overflow-y-auto">
                {/* Page Header */}
                <div className="bg-white border-b border-gray-200 px-8 py-5">
                    <h1 className="text-xl font-bold text-slate-700">Clinical Staff Management</h1>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Add New Staff Column (Left) */}
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sticky top-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-bold text-green-600">{editMode ? 'Edit Clinical Staff' : 'Add Clinical Staff'}</h2>
                                    {editMode && (
                                        <button
                                            onClick={() => {
                                                setEditMode(false);
                                                setEditId(null);
                                                setFormData({
                                                    name: '',
                                                    email: '',
                                                    password: '',
                                                    role: 'doctor',
                                                    department: '',
                                                    contactNumber: '',
                                                    employeeId: ''
                                                });
                                                setMessage({ type: '', text: '' });
                                            }}
                                            className="text-xs text-red-500 hover:underline"
                                        >
                                            Cancel Edit
                                        </button>
                                    )}
                                </div>

                                {/* Success/Error Messages */}
                                {message.text && (
                                    <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                        {message.text}
                                    </div>
                                )}

                                <form className="space-y-5" onSubmit={handleSubmit}>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="e.g. John Doe"
                                            className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="john@hospital.com"
                                            className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                                            Password {editMode && '(Leave blank to keep current)'} *
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder={editMode ? "Enter new password (optional)" : "Enter password"}
                                            className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                            required={!editMode}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                                            Role
                                        </label>
                                        <div className="relative">
                                            <select
                                                name="role"
                                                value={formData.role}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all appearance-none bg-white"
                                            >
                                                <option value="doctor">Doctor</option>
                                                <option value="technician">Lab Technician</option>
                                                <option value="receptionist">Receptionist</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dynamic Department Selection */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                                            Department
                                        </label>
                                        <div className="relative">
                                            <select
                                                name="department"
                                                value={formData.department}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all appearance-none bg-white"
                                            >
                                                <option value="">Select Department</option>
                                                {formData.role === 'doctor' && (
                                                    <>
                                                        <option value="Cardiology">Cardiology</option>
                                                        <option value="Neurology">Neurology</option>
                                                        <option value="Orthopedics">Orthopedics</option>
                                                        <option value="Pediatrics">Pediatrics</option>
                                                        <option value="Dermatology">Dermatology</option>
                                                        <option value="General Medicine">General Medicine</option>
                                                    </>
                                                )}
                                                {formData.role === 'technician' && (
                                                    <>
                                                        <option value="Radiology Department">Radiology Department (X-ray)</option>
                                                        <option value="MRI Department">MRI Department</option>
                                                        <option value="CT Scan Department">CT Scan Department</option>
                                                        <option value="Pathology / Laboratory">Pathology / Laboratory</option>
                                                        <option value="Ultrasound Department">Ultrasound Department</option>
                                                    </>
                                                )}
                                                {formData.role === 'receptionist' && (
                                                    <option value="Front Desk">Front Desk</option>
                                                )}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                                            Phone Number
                                        </label>
                                        <input
                                            type="text"
                                            name="contactNumber"
                                            value={formData.contactNumber}
                                            onChange={handleChange}
                                            placeholder="+1 (555) 000-0000"
                                            className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`w-full text-white font-semibold py-3 rounded-md transition-all shadow-md active:scale-[0.98] mt-2 disabled:opacity-50 disabled:cursor-not-allowed ${editMode ? 'bg-[#0065a3] hover:bg-[#005080]' : 'bg-green-600 hover:bg-green-700'}`}
                                    >
                                        {loading ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update Staff Account' : 'Create Staff Account')}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Staff Directory Column (Right) */}
                        <div className="lg:col-span-8">
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full max-h-[800px]">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-lg font-bold text-green-600">Clinical Staff Directory</h2>
                                        <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200">
                                            {clinicalStaff.filter(s => s.isActive).length} Active
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search staff..."
                                            className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 w-48"
                                        />
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="overflow-y-auto flex-1">
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
                                            {clinicalStaff.map((staff) => (
                                                <tr key={staff.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            {staff.img ? (
                                                                <img src={staff.img} alt={staff.name} className="w-10 h-10 rounded-full object-cover" />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                            <span className="text-sm font-medium text-slate-700">{staff.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-green-600 font-medium capitalize">{staff.role}</td>
                                                    <td className="py-4 px-4 text-sm text-gray-600 font-medium">{staff.department}</td>
                                                    <td className="py-4 px-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${staff.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {staff.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                                title="Edit"
                                                                onClick={() => {
                                                                    setEditMode(true);
                                                                    setEditId(staff._id);
                                                                    setFormData({
                                                                        name: staff.name,
                                                                        email: staff.email,
                                                                        role: staff.role,
                                                                        department: staff.department || '',
                                                                        contactNumber: staff.contactNumber || '',
                                                                        password: ''
                                                                    });
                                                                    setMessage({ type: '', text: '' });
                                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                }}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                                title="Delete"
                                                                onClick={async () => {
                                                                    if (window.confirm(`Are you sure you want to delete ${staff.name}?`)) {
                                                                        try {
                                                                            const token = localStorage.getItem('token');
                                                                            console.log(`Attempting to delete user ${staff._id}`);

                                                                            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/staff/${staff._id}`, {
                                                                                method: 'DELETE',
                                                                                headers: {
                                                                                    'Authorization': `Bearer ${token}`,
                                                                                    'Content-Type': 'application/json'
                                                                                }
                                                                            });

                                                                            if (res.ok) {
                                                                                setMessage({ type: 'success', text: 'Staff member deleted successfully' });
                                                                                // Refresh the list immediately
                                                                                await fetchStaff();
                                                                            } else {
                                                                                const err = await res.json();
                                                                                console.error('Delete failed:', err);
                                                                                setMessage({ type: 'error', text: err.message || 'Delete failed. Please try again.' });
                                                                            }
                                                                        } catch (error) {
                                                                            console.error('Network/Server error during delete:', error);
                                                                            setMessage({ type: 'error', text: 'Delete failed due to connection error.' });
                                                                        }
                                                                    }
                                                                }}
                                                            >
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
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    )
}
