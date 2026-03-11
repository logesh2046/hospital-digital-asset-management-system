import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function AdminDatabaseDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('patients');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const tabs = [
        { id: 'patients', label: 'Patients' },
        { id: 'doctors', label: 'Doctors' },
        { id: 'lab-technicians', label: 'Lab Technicians' },
        { id: 'receptionists', label: 'Receptionists' },
        { id: 'reports', label: 'Reports' }
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/${activeTab}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const result = await res.json();
                setData(result);
            } else {
                console.error('Failed to fetch data');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        setCurrentPage(1);
        setSearchTerm('');
    }, [activeTab]);

    const getFilteredData = () => {
        if (!searchTerm) return data;
        return data.filter(item => {
            const searchStr = Object.values(item).join(' ').toLowerCase();
            return searchStr.includes(searchTerm.toLowerCase());
        });
    };

    const confirmDelete = (item) => {
        setItemToDelete(item);
        setDeleteReason('');
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/${activeTab}/${itemToDelete._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: deleteReason })
            });
            if (res.ok) {
                setData(data.filter(d => d._id !== itemToDelete._id));
            } else {
                alert('Failed to delete item');
            }
        } catch (error) {
            console.error('Error deleting:', error);
        } finally {
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setShowEditModal(true);
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/${activeTab}/${editingItem._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editingItem)
            });
            if (res.ok) {
                const updated = await res.json();
                setData(data.map(d => d._id === updated._id ? updated : d));
                setShowEditModal(false);
            } else {
                alert('Failed to update item');
            }
        } catch (error) {
            console.error('Error updating:', error);
        }
    };

    const filteredData = getFilteredData();
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const renderTableHeaders = () => {
        switch (activeTab) {
            case 'patients':
                return ['Name', 'Email', 'Phone', 'Address', 'Actions'];
            case 'doctors':
                return ['Name', 'Email', 'Specialization', 'Actions'];
            case 'lab-technicians':
                return ['Name', 'Email', 'Department', 'Actions'];
            case 'receptionists':
                return ['Name', 'Email', 'Actions'];
            case 'reports':
                return ['Report Type', 'Patient Name', 'Uploaded By', 'Actions'];
            default:
                return [];
        }
    };

    const renderTableRow = (item) => {
        switch (activeTab) {
            case 'patients':
                return (
                    <tr key={item._id} className="border-b transition hover:bg-gray-50">
                        <td className="py-3 px-4">{item.fullName || item.name}</td>
                        <td className="py-3 px-4">{item.email}</td>
                        <td className="py-3 px-4">{item.contactNumber || item.phone}</td>
                        <td className="py-3 px-4">{item.address}</td>
                        <td className="py-3 px-4 flex gap-2">
                            <button onClick={() => openEditModal(item)} className="text-blue-500 hover:text-blue-700">Edit</button>
                            <button onClick={() => confirmDelete(item)} className="text-red-500 hover:text-red-700">Delete</button>
                        </td>
                    </tr>
                );
            case 'doctors':
                return (
                    <tr key={item._id} className="border-b transition hover:bg-gray-50">
                        <td className="py-3 px-4">{item.name}</td>
                        <td className="py-3 px-4">{item.email}</td>
                        <td className="py-3 px-4">{item.specialization || 'N/A'}</td>
                        <td className="py-3 px-4 flex gap-2">
                            <button onClick={() => openEditModal(item)} className="text-blue-500 hover:text-blue-700">Edit</button>
                            <button onClick={() => confirmDelete(item)} className="text-red-500 hover:text-red-700">Delete</button>
                        </td>
                    </tr>
                );
            case 'lab-technicians':
                return (
                    <tr key={item._id} className="border-b transition hover:bg-gray-50">
                        <td className="py-3 px-4">{item.name}</td>
                        <td className="py-3 px-4">{item.email}</td>
                        <td className="py-3 px-4">{item.department || 'N/A'}</td>
                        <td className="py-3 px-4 flex gap-2">
                            <button onClick={() => openEditModal(item)} className="text-blue-500 hover:text-blue-700">Edit</button>
                            <button onClick={() => confirmDelete(item)} className="text-red-500 hover:text-red-700">Delete</button>
                        </td>
                    </tr>
                );
            case 'receptionists':
                return (
                    <tr key={item._id} className="border-b transition hover:bg-gray-50">
                        <td className="py-3 px-4">{item.name}</td>
                        <td className="py-3 px-4">{item.email}</td>
                        <td className="py-3 px-4 flex gap-2">
                            <button onClick={() => openEditModal(item)} className="text-blue-500 hover:text-blue-700">Edit</button>
                            <button onClick={() => confirmDelete(item)} className="text-red-500 hover:text-red-700">Delete</button>
                        </td>
                    </tr>
                );
            case 'reports':
                return (
                    <tr key={item._id} className="border-b transition hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold">{item.fileCategory || item.reportType}</td>
                        <td className="py-3 px-4">{item.patient?.fullName || 'Unknown'}</td>
                        <td className="py-3 px-4">{item.uploadedBy?.name || 'Unknown'}</td>
                        <td className="py-3 px-4 flex gap-2">
                            <button onClick={() => confirmDelete(item)} className="text-red-500 hover:text-red-700">Delete Metadata</button>
                        </td>
                    </tr>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 fixed h-full z-20">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="bg-[#0065a3] text-white p-2 rounded-lg flex items-center justify-center w-10 h-10">
                        <span className="font-black text-xs tracking-tight">KMCH</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-sm font-black text-slate-800 tracking-tight leading-tight">KMCH Hospital</h1>
                        <span className="text-[10px] text-[#0065a3] font-semibold uppercase tracking-widest">Admin Panel</span>
                    </div>
                </div>
                <nav className="flex-1 overflow-y-auto py-6 px-4">
                    <div className="mb-6">
                        <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Monitoring</p>
                        <ul className="space-y-1">
                            <li>
                                <Link to="/admin" className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-[#0065a3] hover:bg-blue-50 rounded-lg transition-colors group">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-3 text-gray-400 group-hover:text-[#0065a3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                                    System Overview
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div className="mb-6">
                        <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Management</p>
                        <ul className="space-y-1">
                            <li>
                                <Link to="/admin/dashboard" className="flex items-center px-3 py-2.5 text-sm font-medium text-white bg-[#0065a3] rounded-lg shadow-sm group">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                    Database Mgmt
                                </Link>
                            </li>
                            <li>
                                <Link to="/admin/staff-management" className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-[#0065a3] hover:bg-blue-50 rounded-lg transition-colors group">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-3 text-gray-400 group-hover:text-[#0065a3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                    Create Staff
                                </Link>
                            </li>
                        </ul>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 overflow-y-auto">
                <div className="max-w-[1600px] mx-auto p-8">
                    <header className="mb-8 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Database Management</h2>
                            <p className="text-sm text-gray-500">Manage all entity records securely. Reports files are not accessible.</p>
                        </div>
                    </header>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 bg-gray-50">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`py-4 px-6 font-semibold text-sm transition-colors ${activeTab === tab.id ? 'border-b-2 border-[#0065a3] text-[#0065a3] bg-white' : 'text-gray-500 hover:text-[#0065a3]'}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Search Bar */}
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                            <input
                                type="text"
                                placeholder="Search records..."
                                className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0065a3] focus:border-transparent text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 border-b border-gray-200 text-slate-800">
                                    <tr>
                                        {renderTableHeaders().map((header, idx) => (
                                            <th key={idx} className="py-3 px-4 font-semibold uppercase text-xs tracking-wider">{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="5" className="py-8 text-center text-gray-500">Loading data...</td></tr>
                                    ) : paginatedData.length === 0 ? (
                                        <tr><td colSpan="5" className="py-8 text-center text-gray-500">No records found.</td></tr>
                                    ) : (
                                        paginatedData.map(item => renderTableRow(item))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {!loading && totalPages > 1 && (
                            <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
                                <span className="text-sm text-gray-500">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} records</span>
                                <div className="space-x-1">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                        className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50"
                                    >Prev</button>
                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50"
                                    >Next</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Confirm Deletion</h3>
                        <p className="text-sm text-gray-500 mb-4">Are you sure you want to delete this record? This action cannot be undone.</p>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Deletion <span className="text-red-500">*</span></label>
                            <textarea
                                required
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                                placeholder="Enter reason (Mandatory)"
                                className="w-full border border-red-300 bg-red-50/50 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-sm"
                                rows="3"
                            ></textarea>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
                            <button
                                onClick={handleDelete}
                                disabled={!deleteReason.trim()}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium w-24 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                            >Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingItem && activeTab !== 'reports' && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleEditSave} className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 capitalize">Edit {activeTab.replace('-', ' ')}</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name / FullName</label>
                            <input
                                required
                                type="text"
                                value={editingItem.fullName || editingItem.name || ''}
                                onChange={e => setEditingItem({ ...editingItem, fullName: e.target.value, name: e.target.value })}
                                className="w-full border border-gray-300 p-2 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={editingItem.email || ''}
                                onChange={e => setEditingItem({ ...editingItem, email: e.target.value })}
                                className="w-full border border-gray-300 p-2 rounded-lg"
                            />
                        </div>

                        {activeTab === 'patients' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone / Contact</label>
                                    <input
                                        type="text"
                                        value={editingItem.contactNumber || editingItem.phone || ''}
                                        onChange={e => setEditingItem({ ...editingItem, contactNumber: e.target.value })}
                                        className="w-full border border-gray-300 p-2 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <input
                                        type="text"
                                        value={editingItem.address || ''}
                                        onChange={e => setEditingItem({ ...editingItem, address: e.target.value })}
                                        className="w-full border border-gray-300 p-2 rounded-lg"
                                    />
                                </div>
                            </>
                        )}

                        {activeTab === 'doctors' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                                <input
                                    type="text"
                                    value={editingItem.specialization || ''}
                                    onChange={e => setEditingItem({ ...editingItem, specialization: e.target.value })}
                                    className="w-full border border-gray-300 p-2 rounded-lg"
                                />
                            </div>
                        )}

                        {activeTab === 'lab-technicians' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <input
                                    type="text"
                                    value={editingItem.department || ''}
                                    onChange={e => setEditingItem({ ...editingItem, department: e.target.value })}
                                    className="w-full border border-gray-300 p-2 rounded-lg"
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-6">
                            <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-[#0065a3] text-white rounded-lg hover:bg-blue-800">Save Changes</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
