import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function PublicSharedReport() {
    const { id: reportId } = useParams();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [emailInput, setEmailInput] = useState('');
    const [otpInput, setOtpInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [timer, setTimer] = useState(0);

    // Step 1: Request OTP
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/otp/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId, email: emailInput })
            });
            const data = await res.json();

            if (res.ok) {
                setStep(2);
                setTimer(30);
                startTimer();
            } else {
                setError(data.message || 'Failed to send OTP');
            }
        } catch (err) {
            console.error('Error sending OTP:', err);
            setError('Failed to connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/otp/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId, email: emailInput, otp: otpInput })
            });
            const data = await res.json();

            if (res.ok) {
                // Successfully verified. Now fetch the actual report using the temp token!
                fetchReportWithToken(data.tempToken);
            } else {
                setError(data.message || 'Invalid OTP');
                setLoading(false);
            }
        } catch (err) {
            console.error('Error verifying OTP:', err);
            setError('Failed to verify OTP.');
            setLoading(false);
        }
    };

    const fetchReportWithToken = async (tempToken) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reports/view/${reportId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${tempToken}`
                }
            });
            const data = await res.json();
            if (res.ok) {
                // Prepend base URL if filePath is relative
                let fullUrl = data.url;
                if (!fullUrl.startsWith('http')) {
                    let formattedPath = fullUrl.replace(/\\/g, '/');
                    // Remove 'server/' prefix if it exists because the backend serves from '/uploads'
                    if (formattedPath.startsWith('server/')) {
                        formattedPath = formattedPath.replace('server/', '');
                    }
                    if (!formattedPath.startsWith('/')) {
                        formattedPath = '/' + formattedPath;
                    }
                    fullUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${formattedPath}`;
                }

                // Instantly redirect directly to the PDF in the current tab natively
                window.location.replace(fullUrl);
            } else {
                setError(data.message || 'Failed to load report.');
            }
        } catch (err) {
            setError('Failed to securely fetch the report.');
        } finally {
            setLoading(false);
        }
    };

    const startTimer = () => {
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center font-sans text-slate-800 relative px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header Pattern */}
                <div className="h-24 bg-[#0065a3] relative flex items-center justify-center">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\\"20\\\" height=\\\"20\\\" viewBox=\\\"0 0 20 20\\\" xmlns=\\\"http://www.w3.org/2000/svg\\\"%3E%3Cg fill=\\\"%23ffffff\\\" fill-opacity=\\\"1\\\" fill-rule=\\\"evenodd\\\"%3E%3Ccircle cx=\\\"3\\\" cy=\\\"3\\\" r=\\\"3\\\"/%3E%3Ccircle cx=\\\"13\\\" cy=\\\"13\\\" r=\\\"3\\\"/%3E%3C/g%3E%3C/svg%3E')" }}></div>
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg relative z-10 translate-y-8">
                        <svg className="h-8 w-8 text-[#0065a3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                </div>

                <div className="pt-12 pb-8 px-8 text-center">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Secure External Access</h2>
                    <p className="text-sm text-gray-500 mb-8">
                        {step === 1 ? 'Enter the patient\'s registered email to request access.' : 'An OTP has been sent to the patient. Enter it below.'}
                    </p>

                    {error && (
                        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100 flex items-start text-left">
                            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleSendOTP} className="space-y-6">
                            <div className="text-left">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Patient Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    placeholder="patient@example.com"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0065a3]/50 focus:border-[#0065a3] transition-all text-slate-700 font-medium"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !emailInput}
                                className="w-full bg-[#0065a3] hover:bg-[#005080] text-white font-bold py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center"
                            >
                                {loading ? 'Sending Request...' : 'Send Access Request (OTP)'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
                            <div className="text-left">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Enter 6-Digit OTP
                                </label>
                                <input
                                    type="text"
                                    value={otpInput}
                                    onChange={(e) => setOtpInput(e.target.value.replace(/\\D/g, ''))}
                                    placeholder="• • • • • •"
                                    maxLength={6}
                                    required
                                    className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold text-slate-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0065a3]/50 focus:border-[#0065a3] transition-all placeholder-gray-300"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otpInput.length !== 6}
                                className="w-full bg-[#0065a3] hover:bg-[#005080] text-white font-bold py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? 'Verifying...' : 'Verify & View Report'}
                            </button>

                            <div className="text-sm mt-4">
                                {timer > 0 ? (
                                    <span className="text-gray-500">Resend code in <strong className="text-[#0065a3]">{timer}s</strong></span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleSendOTP}
                                        className="text-[#0065a3] font-semibold hover:underline"
                                    >
                                        Didn't receive code? Resend
                                    </button>
                                )}
                            </div>
                        </form>
                    )}

                    <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Verified by MediVault Security</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
