import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ActivityLogs() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [filter, setFilter] = useState('all');
    const [activityLogs, setActivityLogs] = useState([]);
    const [activityStats, setActivityStats] = useState([]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const fetchActivityLogs = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/admin/staff-stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                // Map backend logs to frontend structure
                const logs = (data.activityLogs || []).map(log => {
                    const type = log.action.split('_')[0].toLowerCase(); // e.g., 'CREATE_STAFF' -> 'create'
                    let icon = 'more';
                    let color = 'bg-gray-100';

                    if (type === 'create') { icon = 'userPlus'; color = 'bg-purple-100'; }
                    else if (type === 'delete') { icon = 'alert'; color = 'bg-red-100'; }
                    else if (type === 'update') { icon = 'edit'; color = 'bg-yellow-100'; }
                    else if (type === 'upload') { icon = 'upload'; color = 'bg-blue-100'; }
                    else { icon = 'settings'; color = 'bg-green-100'; }

                    return {
                        id: log._id,
                        text: log.details,
                        time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        user: log.user ? log.user.name : 'Unknown',
                        type: type,
                        color: color,
                        icon: icon,
                        timestamp: new Date(log.timestamp).toLocaleDateString()
                    };
                });
                setActivityLogs(logs);

                // Calculate Stats
                const statsMap = logs.reduce((acc, log) => {
                    acc[log.type] = (acc[log.type] || 0) + 1;
                    return acc;
                }, {});

                const total = logs.length;
                const stats = Object.keys(statsMap).map(type => ({
                    type: type.charAt(0).toUpperCase() + type.slice(1),
                    count: statsMap[type],
                    percentage: total ? Math.round((statsMap[type] / total) * 100) : 0,
                    color: type === 'create' ? 'bg-purple-500' : type === 'delete' ? 'bg-red-500' : 'bg-blue-500',
                    icon: type === 'create' ? 'userPlus' : 'more'
                }));
                setActivityStats(stats);
            }
        } catch (error) {
            console.error('Error fetching activity logs:', error);
        }
    };

    useEffect(() => {
        fetchActivityLogs();
    }, []);

    const filteredLogs = filter === 'all' ? activityLogs : activityLogs.filter(log => log.type === filter);

    const getIcon = (iconName) => {
        const icons = {
            upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>,
            check: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
            alert: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
            eye: <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
            archive: <><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" /></>,
            shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
            download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
            userPlus: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></>,
            settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
            edit: <><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></>,
            mail: <><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>,
            more: <><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></>,
        };
        return icons[iconName] || icons.more;
    };

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
                                <Link to="/admin/activity-logs" className="flex items-center px-3 py-2.5 text-sm font-medium text-white bg-[#0065a3] rounded-lg shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
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
                                    Staff Management
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
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Activity Logs</h2>
                                <p className="text-sm text-gray-500">Real-time system events and user activities</p>
                            </div>
                        </div>
                    </header>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                        {activityStats.map((stat, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-white mb-3`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        {getIcon(stat.icon)}
                                    </svg>
                                </div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{stat.type}</p>
                                <h3 className="text-2xl font-bold text-slate-800 font-mono">{stat.count}</h3>
                                <p className="text-xs text-gray-400 mt-1">{stat.percentage}% of total</p>
                            </div>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${filter === 'all' ? 'bg-[#0065a3] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilter('upload')}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${filter === 'upload' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    Uploads
                                </button>
                                <button
                                    onClick={() => setFilter('access')}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${filter === 'access' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    Access
                                </button>
                                <button
                                    onClick={() => setFilter('system')}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${filter === 'system' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    System
                                </button>
                                <button
                                    onClick={() => setFilter('warning')}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${filter === 'warning' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    Warnings
                                </button>
                                <button
                                    onClick={() => setFilter('security')}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${filter === 'security' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    Security
                                </button>
                            </div>
                            <div className="text-sm text-gray-500">
                                Showing <span className="font-bold text-slate-800">{filteredLogs.length}</span> logs
                            </div>
                        </div>
                    </div>

                    {/* Activity Timeline */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Activity Timeline</h3>
                        <div className="space-y-4 relative">
                            <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-gray-100"></div>
                            {filteredLogs.map((log) => (
                                <div key={log.id} className="flex gap-4 relative">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 z-10 shadow-sm ${log.color.includes('blue') ? 'bg-blue-100 text-blue-600' :
                                        log.color.includes('green') ? 'bg-green-100 text-green-600' :
                                            log.color.includes('amber') ? 'bg-amber-100 text-amber-600' :
                                                log.color.includes('red') ? 'bg-red-100 text-red-600' :
                                                    log.color.includes('purple') ? 'bg-purple-100 text-purple-600' :
                                                        log.color.includes('indigo') ? 'bg-indigo-100 text-indigo-600' :
                                                            log.color.includes('yellow') ? 'bg-yellow-100 text-yellow-600' :
                                                                'bg-gray-100 text-gray-600'
                                        }`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            {getIcon(log.icon)}
                                        </svg>
                                    </div>
                                    <div className="flex-1 bg-gray-50 rounded-xl p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <p className="text-sm font-semibold text-slate-700 leading-snug flex-1">
                                                {log.text}
                                            </p>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${log.type === 'upload' ? 'bg-blue-100 text-blue-700' :
                                                log.type === 'system' ? 'bg-green-100 text-green-700' :
                                                    log.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                                                        log.type === 'access' ? 'bg-indigo-100 text-indigo-700' :
                                                            log.type === 'security' ? 'bg-purple-100 text-purple-700' :
                                                                log.type === 'download' ? 'bg-teal-100 text-teal-700' :
                                                                    log.type === 'update' ? 'bg-yellow-100 text-yellow-700' :
                                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {log.type.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                                {log.user}
                                            </span>
                                            <span className="font-mono">{log.time}</span>
                                            <span className="font-mono text-gray-400">{log.timestamp}</span>
                                        </div>
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
