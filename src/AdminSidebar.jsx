import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function AdminSidebar({ activePage }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (page) => activePage === page
        ? "flex items-center px-3 py-2.5 text-sm font-medium text-white bg-[#0065a3] rounded-lg shadow-sm"
        : "flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-[#0065a3] hover:bg-blue-50 rounded-lg transition-colors group";

    const getIconClass = (page) => activePage === page
        ? "w-4 h-4 mr-3"
        : "w-4 h-4 mr-3 text-gray-400 group-hover:text-[#0065a3]";

    return (
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
                            <Link to="/admin" className={isActive('overview')}>
                                <svg xmlns="http://www.w3.org/2000/svg" className={getIconClass('overview')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                                System Overview
                            </Link>
                        </li>
                    </ul>
                </div>

                <div className="mb-6">
                    <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Analytics</p>
                    <ul className="space-y-1">
                        <li>
                            <Link to="/admin/upload-statistics" className={isActive('upload-stats')}>
                                <svg xmlns="http://www.w3.org/2000/svg" className={getIconClass('upload-stats')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                                Upload Statistics
                            </Link>
                        </li>
                        <li>
                            <Link to="/admin/activity-logs" className={isActive('activity-logs')}>
                                <svg xmlns="http://www.w3.org/2000/svg" className={getIconClass('activity-logs')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                                Activity Logs
                            </Link>
                        </li>
                        <li>
                            <Link to="/admin/storage-analytics" className={isActive('storage')}>
                                <svg xmlns="http://www.w3.org/2000/svg" className={getIconClass('storage')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                                Storage Analytics
                            </Link>
                        </li>
                    </ul>
                </div>

                <div className="mb-6">
                    <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Management</p>
                    <ul className="space-y-1">
                        <li>
                            <Link to="/admin/staff-management" className={isActive('staff')}>
                                <svg xmlns="http://www.w3.org/2000/svg" className={getIconClass('staff')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
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
    );
}
