import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // State for dashboard data
    const [stats, setStats] = useState([
        { title: 'Total Patients', value: '...', change: 'Loading...', isPositive: true, icon: 'users' },
        { title: 'Total Reports', value: '...', change: 'Loading...', isPositive: true, icon: 'file' },
        { title: 'Storage Used', value: '...', subtitle: 'Calculating...', progress: 0, isWarning: false, icon: 'database' },
        { title: 'Active Staff', value: '...', change: 'Loading...', isPositive: true, icon: 'activity' },
    ]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch General Stats
            const statsRes = await fetch('http://localhost:5000/api/admin/stats', { headers });
            const statsData = await statsRes.json();

            // Fetch Staff Stats & Activity Logs
            const staffRes = await fetch('http://localhost:5000/api/admin/staff-stats', { headers });
            const staffData = await staffRes.json();

            if (statsRes.ok && staffRes.ok) {
                // Process Stats
                const backendStats = statsData.stats || [];
                // Map backend stats to UI structure if needed, or use directly if they match
                // Backend sends: [{ title, value, change, isPositive }]
                // We need to ensure icons are mapped correctly based on title

                const mappedStats = backendStats.map(stat => {
                    let icon = 'users';
                    if (stat.title.includes('Report')) icon = 'file';
                    if (stat.title.includes('Storage')) icon = 'database';
                    if (stat.title.includes('Staff')) icon = 'activity';

                    return { ...stat, icon };
                });

                setStats(mappedStats);

                // Process Activity Logs
                // Backend returns activityLogs with { user: { name }, action, details, timestamp }
                const logs = staffData.activityLogs.map(log => ({
                    id: log._id,
                    text: log.details, // Use details as main text
                    time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    type: 'system', // Default type
                    color: 'bg-blue-100' // Default color
                }));
                setActivityLogs(logs);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
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
                                <Link to="/admin" className="flex items-center px-3 py-2.5 text-sm font-medium text-white bg-[#0065a3] rounded-lg shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
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
                            {user?.name?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">{user?.name || 'Admin User'}</span>
                            <span className="text-xs text-gray-500">Administrator</span>
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
                    <header className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#0065a3] to-[#004d7a] rounded-xl flex items-center justify-center text-white shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Admin Monitoring Dashboard</h2>
                                <p className="text-sm text-gray-500">System health and analytics overview • Metadata only</p>
                            </div>
                        </div>
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                            <div>
                                <p className="text-xs font-semibold text-blue-800">Admin Access Restrictions</p>
                                <p className="text-xs text-blue-700 mt-1">You can view system statistics and metadata only. Private files and patient data cannot be accessed directly.</p>
                            </div>
                        </div>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2 rounded-lg transition-colors ${stat.title.includes('Patient') ? 'bg-blue-50 text-[#0065a3]' :
                                        stat.title.includes('Report') ? 'bg-indigo-50 text-indigo-600' :
                                            stat.title.includes('Storage') ? 'bg-red-50 text-red-500' :
                                                'bg-emerald-50 text-emerald-600'
                                        }`}>
                                        {/* Icons */}
                                        {stat.icon === 'users' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
                                        {stat.icon === 'file' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>}
                                        {stat.icon === 'database' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" /></svg>}
                                        {stat.icon === 'activity' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>}
                                    </div>
                                    {stat.change && (
                                        <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${stat.isPositive ? 'text-green-600 bg-green-50' : stat.isWarning ? 'text-red-600 bg-red-50' : 'text-gray-500 bg-gray-100'}`}>
                                            {stat.change}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</h3>
                                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                {stat.subtitle && <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>}
                                {stat.progress && (
                                    <div className="mt-3">
                                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                            <div className={`h-2 rounded-full ${stat.progress > 80 ? 'bg-red-500' : 'bg-[#0065a3]'}`} style={{ width: `${stat.progress}%` }}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* System Activity Log */}
                    <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
                                <p className="text-xs text-gray-400">Latest system events</p>
                            </div>
                            <Link to="/admin/activity-logs" className="text-sm font-semibold text-[#0065a3] hover:underline">View All →</Link>
                        </div>
                        {activityLogs.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No recent activity found.</p>
                        ) : (
                            <div className="space-y-3">
                                {activityLogs.slice(0, 5).map((log) => (
                                    <div key={log.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.color.includes('blue') ? 'bg-blue-500' :
                                            log.color.includes('green') ? 'bg-green-500' :
                                                log.color.includes('amber') ? 'bg-amber-500' : 'bg-gray-400'
                                            }`} />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-700">{log.text}</p>
                                        </div>
                                        <span className="text-xs text-gray-400 font-mono">{log.time}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
