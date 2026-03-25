
import React, { useState } from 'react';
import { useAuth } from '../App';
import { authApi } from '../services/api';
import { ShieldCheck, Mail, Lock, ArrowLeft, Eye, EyeOff, KeyRound } from 'lucide-react';

const TERMS_LAST_REVISED = 'March 21, 2026';

const TERMS_OF_SERVICE = `ACCOUNTECH TERMS OF SERVICE AND USE AGREEMENT

Last Revised: March 21, 2026
Effective Date: Upon User Registration/Verification

PLEASE READ THESE TERMS OF SERVICE CAREFULLY. THIS IS A BINDING LEGAL AGREEMENT. BY ACCESSING THE ACCOUNTECH PLATFORM, COMPLETING THE FILTERED REGISTRATION PROCESS, OR USING ANY PART OF THE INFORMATICS ECOSYSTEM, YOU AGREE TO BE BOUND BY THESE TERMS.

1. THE SERVICE
AccounTech is a proprietary Integrated Informatics Ecosystem designed for the College of Management and Accountancy (CMA) of PHINMA Araullo University. The service includes, but is not limited to, adaptive drill engines, AI-driven document parsing, predictive performance analytics, and specialized board-preparation repositories.

2. ELIGIBILITY AND AUTHORIZATION
2.1. Restricted Access. Access to the Service is strictly limited to authorized students, faculty, and administrators of the PHINMA AU CMA Department.
2.2. Filtered Registration. Participation is predicated on the "AllowedUsers" whitelist. If your Student ID or Phinma Email is not pre-validated by the Department Administration, you are ineligible to register or access the informatics data.

3. USER ACCOUNTS AND SECURITY
3.1. Authentication Protocol. Users must undergo a two-step verification process involving an alphanumeric One-Time Password (OTP).
3.2. Credential Security. All passwords and OTPs are encrypted using the Bcrypt hashing algorithm. However, users are solely responsible for maintaining the confidentiality of their login credentials.
3.3. Prohibited Sharing. Account sharing is strictly prohibited. Any activity originating from your account will be attributed to you for academic and disciplinary purposes.

4. INTELLECTUAL PROPERTY RIGHTS
4.1. Ownership. All content, including but not limited to board-style questions, solution explanations, subject-part references, source code, and analytics models, is the exclusive intellectual property of the PHINMA Araullo University CMA Department and the AccounTech developers.
4.2. Usage License. Users are granted a limited, non-transferable, non-sublicensable license to access the materials for personal, non-commercial academic review only.
4.3. Restrictions. You may not:
Copy, record, or screenshot the test bank for external distribution.
Reverse-engineer the adaptive algorithms or parsing logic.
Use any manual or automated system (scrapers/bots) to extract data from the MongoDB database.

5. DATA PRIVACY AND PROTECTION (RA 10173)
5.1. Compliance. In accordance with the Data Privacy Act of 2012 (Republic Act No. 10173), AccounTech collects and processes personal information (Email, Student ID) and sensitive performance data (drill scores, completion rates).
5.2. Purpose of Collection. Data is processed to:
Identify subject-specific knowledge gaps via the Analytics Engine.
Provide the Dean and Faculty with predictive readiness reports.
Generate personal mastery heatmaps for the learner.
5.3. Data Retention. Performance data will be stored in the MongoDB Cloud for the duration of the student's enrollment or as determined by the University’s academic retention policy.

6. USE OF ARTIFICIAL INTELLIGENCE AND AUTOMATION
6.1. AI Extraction. Faculty members acknowledge that the AI Document Parser utilizes algorithmic logic to sort .docx and .pdf files. While high precision is targeted, the system is provided as a tool to assist, not replace, human vetting.
6.2. Accuracy. Users agree that the University and developers are not responsible for typographical errors or misclassifications resulting from the AI document parsing process.

7. ANALYTICS AND PERFORMANCE DISCLAIMER
7.1. Predictive Nature. All analytics, including "Readiness Scores" and "Top 10 Rankings," are based on historical trends (2022-2025) and statistical models (ANOVA).
7.2. No Guarantee of Success. These tools are designed for diagnostic and preparatory purposes. Use of AccounTech does not guarantee a passing score on the official Professional Regulation Commission (PRC) CPA Licensure Examination.

8. CODE OF CONDUCT AND DISCIPLINE
Users agree to use the platform ethically. Any attempt to circumvent the adaptive logic, bypass the filtered registration, or manipulate performance scores will be reported to the PHINMA AU Student Affairs Office for academic dishonesty, which may lead to suspension or expulsion.

9. LIMITATION OF LIABILITY
AccounTech is provided on an "AS IS" and "AS AVAILABLE" basis. PHINMA Araullo University and the Developers disclaim all warranties. We shall not be liable for any system downtime, loss of data due to technical failure, or errors in subject-part references provided within the remedial feedback loop.

10. MODIFICATIONS AND TERMINATION
The Administrator reserves the right to modify these terms at any time. Continued use of the platform following updates constitutes acceptance of the new terms. Access may be terminated immediately for any breach of this agreement.

11. GOVERNING LAW
This Agreement is governed by the laws of the Republic of the Philippines and the internal academic and administrative policies of PHINMA Araullo University.

User Declaration:
By clicking "I Accept" or by logging into the AccounTech system, I acknowledge that I have read, understood, and agreed to be legally bound by these Terms and Conditions.`;

const Login: React.FC = () => {
  const { login, activateSession } = useAuth();
  const [mode, setMode] = useState<'SIGN_IN' | 'VERIFY_STUDENT' | 'FORGOT_PASSWORD'>('SIGN_IN');
  const [step, setStep] = useState<'EMAIL' | 'OTP' | 'PASSWORD'>('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [otpNotice, setOtpNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);

  const resetToSignIn = () => {
    setMode('SIGN_IN');
    setStep('EMAIL');
    setError('');
    setOtpNotice('');
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setHasAcceptedTerms(false);
    setShowTerms(false);
    setHasReadTerms(false);
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    login(email, password)
      .then((result) => {
        if ('token' in result) {
          activateSession(result.token, result.user);
          return;
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Invalid credentials. Please try again.';
        setError(message);
      })
      .finally(() => setLoading(false));
  };

  const handleEmailVerification = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'VERIFY_STUDENT' && !hasAcceptedTerms) {
      setError('You must accept the Terms of Service before email verification.');
      return;
    }

    setLoading(true);
    setError('');
    setOtpNotice('');

    const request = mode === 'VERIFY_STUDENT' ? authApi.requestOtp(email, true) : authApi.requestResetOtp(email);

    request
      .then((response) => {
        setOtp('');
        setStep('OTP');
        setOtpNotice(response.message || 'OTP sent. Please check your inbox.');
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unable to verify email right now.';
        const enrollmentBlocked = /not yet enrolled by faculty|whitelist enrollment/i.test(message);
        const unregisteredEmail = /email is not in allowed registration list|not in allowed registration list|cannot be verified|not registered/i.test(message);
        const alreadyVerified = /account already verified|already activated|already registered/i.test(message);
        const smtpFailed = /unable to send otp email|smtp/i.test(message);
        if (enrollmentBlocked && mode === 'VERIFY_STUDENT') {
          setError('Email is not registered.');
          return;
        }
        if (unregisteredEmail && mode === 'VERIFY_STUDENT') {
          setError('Email is not registered.');
          return;
        }
        if (alreadyVerified && mode === 'VERIFY_STUDENT') {
          setError('Account already verified. Please sign in.');
          return;
        }
        if (enrollmentBlocked && mode === 'FORGOT_PASSWORD') {
          setError('Email is not enrolled in the student roster.');
          return;
        }
        if (smtpFailed) {
          setOtp('');
          setStep('OTP');
        }
        setError(message);
      })
      .finally(() => setLoading(false));
  };

  const handleResendOtp = () => {
    if (!email) {
      setError('Email is required before requesting another OTP.');
      return;
    }

    setLoading(true);
    setError('');
    setOtpNotice('');

    const request = mode === 'VERIFY_STUDENT' ? authApi.requestOtp(email, hasAcceptedTerms) : authApi.requestResetOtp(email);

    request
      .then((response) => {
        setOtp('');
        setOtpNotice(response.message || 'A new OTP has been sent to your email.');
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unable to resend OTP right now.';
        setError(message);
      })
      .finally(() => setLoading(false));
  };

  const handleOtpVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setError('Please enter the 6-character OTP code.');
      return;
    }

    setLoading(true);
    setError('');
    setOtpNotice('');

    authApi
      .verifyOtp({
        email,
        otp: otp.trim(),
        purpose: mode === 'VERIFY_STUDENT' ? 'verification' : 'password-reset',
      })
      .then(() => {
        setStep('PASSWORD');
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'OTP verification failed.';
        setError(message);
      })
      .finally(() => setLoading(false));
  };

  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    if (mode === 'FORGOT_PASSWORD') {
      authApi
        .resetPassword({ email, password, otp: otp.trim() })
        .then(() => {
          resetToSignIn();
          alert('Password successfully reset. You can now sign in with your new password.');
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Failed to reset password.';
          setError(message);
        })
        .finally(() => setLoading(false));
      return;
    }

    authApi
      .activate({ email, password, name: email.split('@')[0], otp: otp.trim() })
      .then(() => login(email, password))
      .then((result) => {
        if ('token' in result) {
          activateSession(result.token, result.user);
          return;
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to activate account.';
        setError(message);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1e3a8a] p-4 relative overflow-x-hidden">
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 md:w-[600px] h-64 md:h-[600px] bg-[#065f46] rounded-full blur-[100px] opacity-20"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 md:w-[600px] h-64 md:h-[600px] bg-[#facc15] rounded-full blur-[100px] opacity-10"></div>

      <div className="w-full max-w-4xl flex flex-col md:flex-row bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden relative z-10 border border-white/20">
        <div className="w-full md:w-5/12 bg-[#065f46] p-6 md:p-10 text-white flex flex-col justify-center items-center text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-32 h-32 md:w-40 md:h-40 bg-white rounded-full mb-6 shadow-2xl border-4 border-white/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {!logoLoadFailed ? (
                <img
                  src="/logo.jpg"
                  alt="College of Management and Accountancy Local Student Council logo"
                  className="w-full h-full object-cover relative z-10"
                  onError={() => setLogoLoadFailed(true)}
                />
              ) : (
                <ShieldCheck className="w-14 h-14 md:w-16 md:h-16 text-[#065f46] relative z-10" />
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-4">AccounTech</h1>
            <div className="w-12 h-1 bg-[#facc15] mx-auto mb-6 rounded-full"></div>
          </div>




        </div>

        <div className="w-full md:w-7/12 p-6 md:p-12 bg-white flex flex-col justify-center">
          {mode === 'SIGN_IN' ? (
            <form onSubmit={handleSignIn} className="space-y-4 md:space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-1">Sign In</h2>
                <p className="text-slate-500 text-xs md:text-sm">
                  Enter your credentials to access your dashboard.
                </p>
              </div>

              <div className="space-y-3 md:space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Institutional Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      type="email"
                      required
                      placeholder="user@phinmaed.com"
                      className="w-full pl-10 md:pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                    <button
                      type="button"
                      onClick={() => { setMode('FORGOT_PASSWORD'); setStep('EMAIL'); setError(''); setOtp(''); }}
                      className="text-[10px] font-bold text-[#1e3a8a] hover:underline uppercase tracking-wider"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      className="w-full pl-10 md:pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-[10px] text-red-500 font-bold">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1e3a8a] text-white py-3 md:py-3.5 rounded-xl font-bold text-sm hover:bg-blue-800 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Sign In'}
                </button>

                <div className="relative py-2 md:py-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-white px-2 text-slate-400 font-bold">Or</span></div>
                </div>

                <button
                  type="button"
                  onClick={() => { setMode('VERIFY_STUDENT'); setStep('EMAIL'); setError(''); setOtp(''); setHasAcceptedTerms(false); setShowTerms(false); setHasReadTerms(false); }}
                  className="w-full py-3 md:py-3.5 border-2 border-[#065f46] text-[#065f46] rounded-xl font-bold text-sm hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={16} />
                  First Time? Verify Email
                </button>
              </div>
            </form>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300">
              <button
                onClick={resetToSignIn}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase mb-6 md:mb-8 transition-colors"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>

              {step === 'EMAIL' && (
                <form onSubmit={handleEmailVerification} className="space-y-4 md:space-y-6">
                  <div>
                    <h2 className={`text-xl md:text-2xl font-black ${mode === 'FORGOT_PASSWORD' ? 'text-[#1e3a8a]' : 'text-[#065f46]'} mb-1`}>
                      {mode === 'FORGOT_PASSWORD' ? 'Reset Password' : 'Email Verification'}
                    </h2>
                    <p className="text-slate-500 text-xs md:text-sm">
                      {mode === 'FORGOT_PASSWORD' ? 'Enter your email to reset your password.' : 'Students must verify their institutional email before setting a password.'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input
                        type="email"
                        required
                        placeholder="user@phinmaed.com"
                        className={`w-full pl-10 md:pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 ${mode === 'FORGOT_PASSWORD' ? 'focus:ring-[#1e3a8a]' : 'focus:ring-[#065f46]'} outline-none`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    {mode === 'VERIFY_STUDENT' && (
                      <div className="space-y-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/40">
                        <button
                          type="button"
                          onClick={() => {
                            setShowTerms((current) => {
                              if (current) {
                                return false;
                              }
                              setHasAcceptedTerms(false);
                              return true;
                            });
                          }}
                          className="text-xs font-black text-black underline underline-offset-2"
                        >
                          {showTerms ? 'Hide' : 'View'} Terms of Service and Use Agreement
                        </button>

                        {showTerms && (
                          <div
                            className="max-h-56 overflow-y-auto rounded-lg border border-emerald-100 bg-white p-3 text-[11px] leading-relaxed whitespace-pre-wrap text-black"
                            onScroll={(event) => {
                              const target = event.currentTarget;
                              const reachedBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 4;
                              if (reachedBottom) {
                                setHasReadTerms(true);
                              }
                            }}
                          >
                            {TERMS_OF_SERVICE}
                          </div>
                        )}

                        <label className="flex items-start gap-2 text-[11px] text-black">
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#065f46] focus:ring-[#065f46]"
                            disabled={!hasReadTerms}
                            checked={hasAcceptedTerms}
                            onChange={(e) => setHasAcceptedTerms(e.target.checked)}
                          />
                          <span>
                            I have read and accepted the AccounTech Terms of Service and Use Agreement
                            (Last Revised: {TERMS_LAST_REVISED}).
                          </span>
                        </label>
                        {!hasReadTerms && (
                          <p className="text-[10px] font-bold text-slate-600">
                            Basahin at i-scroll muna hanggang dulo ang Terms para ma-enable ang checkbox.
                          </p>
                        )}
                      </div>
                    )}

                    {error && <p className="text-[10px] text-red-500 font-bold">{error}</p>}
                    <button
                      type="submit"
                      disabled={loading || (mode === 'VERIFY_STUDENT' && !hasAcceptedTerms)}
                      className={`w-full ${mode === 'FORGOT_PASSWORD' ? 'bg-[#1e3a8a]' : 'bg-[#065f46]'} text-white py-3.5 rounded-xl font-bold text-sm transition-all`}
                    >
                      {loading ? 'Checking...' : 'Continue'}
                    </button>
                  </div>
                </form>
              )}

              {step === 'OTP' && (
                <form onSubmit={handleOtpVerification} className="space-y-5 md:space-y-6">
                  <div>
                    <h2 className={`text-xl md:text-2xl font-black tracking-tight ${mode === 'FORGOT_PASSWORD' ? 'text-[#1e3a8a]' : 'text-[#065f46]'} mb-1`}>
                      OTP Verification
                    </h2>
                    <p className="text-slate-500 text-xs md:text-sm">
                      Enter the one-time code sent to your email.
                    </p>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:p-5">
                    <div className="relative">
                      <input
                        type="text"
                        autoComplete="one-time-code"
                        required
                        maxLength={6}
                        className="absolute inset-0 h-full w-full opacity-0 z-20 cursor-text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6))}
                      />
                      <div className="grid grid-cols-6 gap-2 md:gap-3">
                        {Array.from({ length: 6 }).map((_, i) => {
                          const filled = Boolean(otp[i]);
                          const active = otp.length === i;
                          return (
                            <div
                              key={i}
                              className={`h-13 md:h-14 rounded-xl border-2 flex items-center justify-center text-xl font-black transition-all ${active ? (mode === 'FORGOT_PASSWORD' ? 'border-[#1e3a8a] bg-blue-50 ring-2 ring-blue-200/60' : 'border-[#065f46] bg-emerald-50 ring-2 ring-emerald-200/60') : 'border-slate-200 bg-white'}`}
                            >
                              {filled ? otp[i] : <span className="text-slate-300">•</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 font-bold">Enter the 6-character code sent to your email.</p>
                    {otpNotice && <p className="text-[11px] text-emerald-700 font-bold">{otpNotice}</p>}
                    {error && <p className="text-[11px] text-red-600 font-bold">{error}</p>}
                    <button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className={`w-full ${mode === 'FORGOT_PASSWORD' ? 'bg-[#1e3a8a]' : 'bg-[#065f46]'} text-white py-3 rounded-xl font-black text-sm shadow-md transition-all disabled:opacity-60`}
                    >
                      {loading ? 'Verifying...' : 'Verify Code'}
                    </button>
                    <p className="text-[11px] text-black text-center">
                      Didn&apos;t get an OTP?{' '}
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                        className={`font-black underline underline-offset-2 ${mode === 'FORGOT_PASSWORD' ? 'text-[#1e3a8a]' : 'text-[#065f46]'} disabled:opacity-60`}
                      >
                        Resend it
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {step === 'PASSWORD' && (
                <form onSubmit={handleSetPassword} className="space-y-4 md:space-y-6">
                  <div>
                    <h2 className={`text-xl md:text-2xl font-black ${mode === 'FORGOT_PASSWORD' ? 'text-[#1e3a8a]' : 'text-[#065f46]'} mb-1`}>
                      {mode === 'FORGOT_PASSWORD' ? 'New Password' : 'Set Password'}
                    </h2>
                    <p className="text-slate-500 text-xs md:text-sm">
                      {mode === 'FORGOT_PASSWORD' ? 'Enter your new secure password.' : 'Create a password to activate your account.'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                      <div className="relative">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="New Security Password"
                          className={`w-full pl-10 md:pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 ${mode === 'FORGOT_PASSWORD' ? 'focus:ring-[#1e3a8a]' : 'focus:ring-[#facc15]'} outline-none`}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          placeholder="Repeat Password"
                          className={`w-full pl-10 md:pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 ${mode === 'FORGOT_PASSWORD' ? 'focus:ring-[#1e3a8a]' : 'focus:ring-[#facc15]'} outline-none`}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {error && <p className="text-[10px] text-red-500 font-bold">{error}</p>}

                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full ${mode === 'FORGOT_PASSWORD' ? 'bg-[#1e3a8a]' : 'bg-[#facc15]'} ${mode === 'FORGOT_PASSWORD' ? 'text-white' : 'text-[#065f46]'} py-3.5 rounded-xl font-black text-sm hover:scale-[1.01] transition-all shadow-md`}
                    >
                      {loading ? 'Updating...' : mode === 'FORGOT_PASSWORD' ? 'Reset Password' : 'Activate Account'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
