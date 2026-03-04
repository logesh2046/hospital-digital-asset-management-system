import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProtectedReport() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center font-sans text-slate-800 relative px-4">

            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header Pattern */}
                <div className="h-24 bg-[#0065a3] relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg relative z-10 translate-y-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#0065a3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                </div>

                <div className="pt-12 pb-8 px-8 text-center">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Protected Medical Document</h2>
                    <p className="text-sm text-gray-500 mb-8">
                        Security verification required to access <br /> <span className="font-semibold text-slate-700">Lab_Report_0921.pdf</span>
                    </p>

                    <form className="space-y-6">
                        <div className="relative">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 text-left">
                                Enter 6-Digit PIN
                            </label>
                            <input
                                type="password"
                                placeholder="• • • • • •"
                                className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold text-slate-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0065a3]/50 focus:border-[#0065a3] transition-all placeholder-gray-300"
                                maxLength={6}
                            />
                        </div>

                        <div className="flex flex-col gap-3">
                            <button className="w-full bg-[#0065a3] hover:bg-[#005080] text-white font-bold py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
                                Unlock Document
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="w-full text-sm font-semibold text-gray-500 hover:text-slate-700 transition-colors py-2"
                            >
                                Cancel & Return
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>End-to-End Encrypted via MediVault</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
