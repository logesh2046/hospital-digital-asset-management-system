import React, { useState, useEffect, useRef } from 'react';

export default function OTPModal({ reportId, onClose, onSuccess }) {
    const [step, setStep] = useState(1);
    const [emailInput, setEmailInput] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [timer, setTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);
    const [maskedEmail, setMaskedEmail] = useState('');

    const inputRefs = useRef([]);

    const sendOTP = async () => {
        if (!emailInput) {
            setError('Please enter an email address.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch('http://localhost:5000/api/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId, email: emailInput })
            });
            const data = await res.json();
            if (res.ok) {
                setMaskedEmail(data.email || emailInput);
                setStep(2);
                setTimer(30);
                setCanResend(false);
            } else {
                setError(data.message || 'Failed to send OTP');
            }
        } catch (err) {
            setError(`Server Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let interval;
        if (step === 2) {
            if (timer > 0 && !canResend) {
                interval = setInterval(() => setTimer((t) => t - 1), 1000);
            } else if (timer === 0) {
                setCanResend(true);
            }
        }
        return () => clearInterval(interval);
    }, [timer, canResend, step]);

    const handleChange = (index, e) => {
        const val = e.target.value;
        if (isNaN(val)) return;

        const newOtp = [...otp];
        newOtp[index] = val;
        setOtp(newOtp);

        if (val && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter a 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await fetch('http://localhost:5000/api/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId, email: emailInput, otp: otpString })
            });

            const data = await res.json();
            if (res.ok) {
                onSuccess(data.tempToken, emailInput);
            } else {
                setError(data.message || 'Invalid OTP');
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (err) {
            setError('Verification failed. Server error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden z-[60]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">Verify Identity</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-blue-50 text-[#0065a3] rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>

                    {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

                    {step === 1 ? (
                        <>
                            <p className="text-sm text-gray-600 mb-6">
                                Enter your registered email address to receive a verification code.
                            </p>
                            <input
                                type="email"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                placeholder="Enter email"
                                className="w-full h-12 px-4 mb-6 border border-gray-300 rounded focus:border-[#0065a3] focus:ring-1 focus:ring-[#0065a3] outline-none transition-all text-center"
                            />
                            <button
                                onClick={sendOTP}
                                disabled={loading || !emailInput}
                                className="w-full bg-[#0065a3] text-white py-2.5 rounded text-sm font-semibold hover:bg-[#005080] transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Sending...' : 'Send OTP'}
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-gray-600 mb-6">
                                We've sent a 6-digit code to <strong>{maskedEmail}</strong>. Enter it below to verify.
                            </p>

                            <div className="flex justify-center gap-2 mb-6">
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={el => inputRefs.current[i] = el}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleChange(i, e)}
                                        onKeyDown={(e) => handleKeyDown(i, e)}
                                        className="w-10 h-12 text-center text-lg font-bold border border-gray-300 rounded focus:border-[#0065a3] focus:ring-1 focus:ring-[#0065a3] outline-none transition-all"
                                    />
                                ))}
                            </div>

                            <button
                                onClick={handleVerify}
                                disabled={loading || otp.join('').length !== 6}
                                className="w-full bg-[#0065a3] text-white py-2.5 rounded text-sm font-semibold hover:bg-[#005080] transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed mb-4"
                            >
                                {loading ? 'Verifying...' : 'Verify & View Report'}
                            </button>

                            <div className="text-sm text-gray-500 flex flex-col items-center gap-1">
                                {canResend ? (
                                    <button onClick={sendOTP} className="text-[#0065a3] font-semibold hover:underline">
                                        Didn't receive code? Resend
                                    </button>
                                ) : (
                                    <span>Resend code in {timer}s</span>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
