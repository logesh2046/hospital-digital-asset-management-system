import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function StorageAnalytics() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [storageOverview, setStorageOverview] = useState({
        total: '0 GB',
        used: '0 GB',
        available: '0 GB',
        percentage: 0,
        totalFiles: 0,
        avgMonthlyGrowth: 0
    });
    const [storageByType, setStorageByType] = useState([]);
    const [storageByDepartment, setStorageByDepartment] = useState([]);
    const [monthlyGrowth, setMonthlyGrowth] = useState([]);
    const [storageWarnings, setStorageWarnings] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const fetchStorageAnalytics = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/storage`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                setStorageOverview(data.storageOverview || { total: '0 GB', used: '0 GB', available: '0 GB', percentage: 0, totalFiles: 0, avgMonthlyGrowth: 0 });
                setStorageByType(data.storageByType || []);
                setStorageByDepartment(data.storageByDepartment || []);
                setMonthlyGrowth(data.monthlyGrowth || []);
                setStorageWarnings(data.storageWarnings || []);
            }
        } catch (error) {
            console.error('Error fetching storage analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStorageAnalytics();
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
                                <Link to="/admin/upload-statistics" className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-[#0065a3] hover:bg-blue-50 rounded-lg transition-colors group">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-3 text-gray-400 group-hover:text-[#0065a3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
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
                                <Link to="/admin/storage-analytics" className="flex items-center px-3 py-2.5 text-sm font-medium text-white bg-[#0065a3] rounded-lg shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
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
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Storage Analytics</h2>
                                <p className="text-sm text-gray-500">Comprehensive storage capacity and distribution analysis</p>
                            </div>
                        </div>
                    </header>

                    {/* Storage Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Total Capacity</p>
                            <h3 className="text-3xl font-bold text-slate-800 font-mono">{storageOverview.total}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Used Storage</p>
                            <h3 className="text-3xl font-bold text-red-600 font-mono">{storageOverview.used}</h3>
                            <p className="text-xs text-gray-400 mt-1">{storageOverview.percentage}% utilized</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Available</p>
                            <h3 className="text-3xl font-bold text-green-600 font-mono">{storageOverview.available}</h3>
                            <p className="text-xs text-gray-400 mt-1">{100 - storageOverview.percentage}% free</p>
                        </div>

                    </div>

                    {/* Storage Capacity Gauge */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Storage Capacity</h3>
                        <div className="relative">
                            <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                                <div className={`h-8 rounded-full flex items-center justify-end pr-4 transition-all ${storageOverview.percentage > 90 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                    storageOverview.percentage > 80 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                                        'bg-gradient-to-r from-[#0065a3] to-blue-600'
                                    }`} style={{ width: `${storageOverview.percentage}%` }}>
                                    <span className="text-sm font-bold text-white">{storageOverview.percentage}%</span>
                                </div>
                            </div>
                            <div className="flex justify-between mt-3">
                                <span className="text-sm font-mono text-slate-700">0 GB</span>
                                <span className="text-sm font-mono text-slate-700">{storageOverview.used} used</span>
                                <span className="text-sm font-mono text-slate-700">{storageOverview.total}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Storage by File Type */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">Storage by File Type</h3>
                            <div className="space-y-6">
                                {storageByType.map((item, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-semibold text-slate-700">{item.type}</span>
                                            <span className="text-sm font-mono font-bold text-slate-800">{item.size}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mb-2">
                                            <div className={`${item.color} h-3 rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500 font-mono">{item.files.toLocaleString()} files • {item.percentage}%</span>
                                            <span className="text-green-600 font-semibold">{item.trend}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Storage by Department */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">Storage by Department</h3>
                            <div className="space-y-5">
                                {storageByDepartment.map((dept, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-semibold text-slate-700">{dept.department}</span>
                                            <div className="text-right">
                                                <span className="text-sm font-mono font-bold text-slate-800">{dept.size}</span>
                                                <span className="text-xs text-gray-400 ml-2">{dept.percentage}%</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden mb-1">
                                            <div className={`${dept.color} h-2.5 rounded-full`} style={{ width: `${dept.percentage}%` }}></div>
                                        </div>
                                        <p className="text-xs text-gray-500 font-mono">{dept.files.toLocaleString()} files</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Monthly Growth Trend */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Monthly Storage Growth</h3>
                        <div className="space-y-4">
                            {monthlyGrowth.map((month, idx) => (
                                <div key={idx} className="flex items-center gap-4">
                                    <div className="w-24 text-sm font-semibold text-slate-700">{month.month}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                                                <div className="bg-[#0065a3] h-3 rounded-full" style={{ width: `${(month.size / 1000) * 100}%` }}></div>
                                            </div>
                                            <span className="text-sm font-mono font-bold text-slate-800 w-20 text-right">{month.size} GB</span>
                                        </div>
                                    </div>
                                    <div className="w-24 text-right">
                                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-50 text-green-600">+{month.growth} GB</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-slate-700">Avg. Monthly Growth</span>
                                <span className="text-lg font-bold text-[#0065a3] font-mono">+{storageOverview.avgMonthlyGrowth || 0} GB/month</span>
                            </div>
                        </div>
                    </div>

                    {/* Storage Warnings & Recommendations */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Alerts & Recommendations</h3>
                        <div className="space-y-3">
                            {storageWarnings.map((warning) => (
                                <div key={warning.id} className={`p-4 rounded-lg border flex items-start gap-3 ${warning.severity === 'warning' ? 'bg-amber-50 border-amber-200' :
                                    warning.severity === 'info' ? 'bg-blue-50 border-blue-200' :
                                        'bg-green-50 border-green-200'
                                    }`}>
                                    <div className={`p-2 rounded-lg ${warning.severity === 'warning' ? 'bg-amber-100 text-amber-600' :
                                        warning.severity === 'info' ? 'bg-blue-100 text-blue-600' :
                                            'bg-green-100 text-green-600'
                                        }`}>
                                        {warning.icon === 'alert' && (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                        )}
                                        {warning.icon === 'info' && (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                                        )}
                                        {warning.icon === 'clock' && (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                                        )}
                                        {warning.icon === 'check' && (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                        )}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-semibold ${warning.severity === 'warning' ? 'text-amber-800' :
                                            warning.severity === 'info' ? 'text-blue-800' :
                                                'text-green-800'
                                            }`}>
                                            {warning.message}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
