import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function UploadStatistics() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [uploadStats, setUploadStats] = useState([]);
    const [recentUploads, setRecentUploads] = useState([]);
    const [departmentStats, setDepartmentStats] = useState([]);
    const [summary, setSummary] = useState({
        totalFiles: 0,
        totalStorage: '0 GB',
        todaysUploads: '+0',
        avgFileSize: '0 MB'
    });
    const [loading, setLoading] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const fetchUploadStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/admin/upload-stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                setUploadStats(data.uploadStats || []);
                setDepartmentStats(data.departmentStats || []);
                setRecentUploads(data.recentUploads || []);
                if (data.summary) {
                    setSummary(data.summary);
                }
            }
        } catch (error) {
            console.error('Error fetching upload stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUploadStats();
    }, []);

    return (
        <div className="flex h-screen bg-[#f8fafc] text-slate-800">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 fixed h-full z-20">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="bg-[#0065a3] text-white p-2 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                        Admin<span className="text-[#0065a3]">Monitor</span>
                    </h1>
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
                        <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Analytics</p>
                        <ul className="space-y-1">
                            <li>
                                <Link to="/admin/upload-statistics" className="flex items-center px-3 py-2.5 text-sm font-medium text-white bg-[#0065a3] rounded-lg shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                                    Upload Statistics
                                </Link>
                            </li>
                            <li>
                                <Link to="/admin/activity-logs" className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-[#0065a3] hover:bg-blue-50 rounded-lg transition-colors group">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-3 text-gray-400 group-hover:text-[#0065a3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                                    Activity Logs
                                </Link>
                            </li>
                            <li>
                                <Link to="/admin/storage-analytics" className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-[#0065a3] hover:bg-blue-50 rounded-lg transition-colors group">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-3 text-gray-400 group-hover:text-[#0065a3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                                    Storage Analytics
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="mb-6">
                        <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Management</p>
                        <ul className="space-y-1">
                            <li>
                                <Link to="/admin/staff-management" className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-[#0065a3] hover:bg-blue-50 rounded-lg transition-colors group">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-3 text-gray-400 group-hover:text-[#0065a3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                    Create Staff
                                </Link>
                            </li>
                        </ul>
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-200 bg-gray-50/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-[#0065a3] text-white flex items-center justify-center font-bold">
                            {user?.email?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">{user?.email || 'Admin User'}</span>
                            <span className="text-xs text-gray-500">System Monitor</span>
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
                <div className="max-w-[1600px] mx-auto p-8">
                    {/* Page Header */}
                    <header className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Upload Statistics</h2>
                                <p className="text-sm text-gray-500">File upload metadata and distribution analysis</p>
                            </div>
                        </div>
                    </header>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Total Files</p>
                            <h3 className="text-3xl font-bold text-slate-800 font-mono">{summary.totalFiles.toLocaleString()}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Total Storage</p>
                            <h3 className="text-3xl font-bold text-slate-800 font-mono">{summary.totalStorage}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Today's Uploads</p>
                            <h3 className="text-3xl font-bold text-green-600 font-mono">{summary.todaysUploads}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Avg File Size</p>
                            <h3 className="text-3xl font-bold text-slate-800 font-mono">{summary.avgFileSize}</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* File Type Distribution */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">File Type Distribution</h3>
                            <div className="space-y-6">
                                {uploadStats.length === 0 ? (
                                    <p className="text-sm text-gray-500">No file type data available.</p>
                                ) : (
                                    uploadStats.map((upload, idx) => (
                                        <div key={idx}>
                                            <div className="flex justify-between text-xs font-semibold text-gray-600 mb-2">
                                                <span>{upload.type}</span>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-mono text-gray-500">{upload.count} files</span>
                                                    <span className="font-mono text-slate-700">{upload.size}</span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                                <div className={`${upload.color} h-3 rounded-full`} style={{ width: `${upload.percentage}%` }}></div>
                                            </div>
                                            <div className="flex justify-between mt-2">
                                                <p className="text-[10px] text-gray-400 font-medium">{upload.percentage}% of total • Avg: {upload.avgSize}</p>
                                                <p className="text-[10px] text-green-600 font-semibold">{upload.trend}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Department Upload Trends */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">Upload by Department</h3>
                            <div className="space-y-4">
                                {departmentStats.length === 0 ? (
                                    <p className="text-sm text-gray-500">No department data available.</p>
                                ) : (
                                    departmentStats.map((dept, idx) => (
                                        <div key={idx} className="flex items-center gap-4">
                                            <div className="w-24 text-sm font-semibold text-slate-700">{dept.department}</div>
                                            <div className="flex-1">
                                                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                    <div className={`${dept.color} h-2.5 rounded-full`} style={{ width: `${dept.percentage}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="w-20 text-right">
                                                <span className="text-sm font-bold text-slate-700 font-mono">{dept.uploads.toLocaleString()}</span>
                                                <span className="text-xs text-gray-400 ml-2">{dept.percentage}%</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Uploads Table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Recent Uploads</h3>
                                <p className="text-xs text-gray-400">Metadata only - showing latest file uploads</p>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Search files..."
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0065a3]"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Filename</th>
                                        <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Type</th>
                                        <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Size</th>
                                        <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Uploader</th>
                                        <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Department</th>
                                        <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Timestamp</th>
                                        <th className="text-left py-3 px-4 text-xs font-bold text-gray-600 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {recentUploads.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="py-4 px-4 text-center text-sm text-gray-500">No recent uploads found.</td>
                                        </tr>
                                    ) : (
                                        recentUploads.map((upload, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-50 rounded-lg">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0065a3]"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700 truncate max-w-xs">{upload.filename}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-gray-600">{upload.type}</td>
                                                <td className="py-4 px-4 text-sm font-mono text-slate-700">{upload.size}</td>
                                                <td className="py-4 px-4 text-sm text-gray-600">{upload.uploader}</td>
                                                <td className="py-4 px-4 text-sm text-gray-600">{upload.department}</td>
                                                <td className="py-4 px-4 text-xs font-mono text-gray-500">{new Date(upload.timestamp).toLocaleString()}</td>
                                                <td className="py-4 px-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                                                        {upload.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
