"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const App_1 = require("../App");
const types_1 = require("../types");
const constants_1 = require("../constants");
const lucide_react_1 = require("lucide-react");
const Login = () => {
    const { login, allowedStudents } = (0, App_1.useAuth)();
    const [mode, setMode] = (0, react_1.useState)('SIGN_IN');
    const [step, setStep] = (0, react_1.useState)('EMAIL');
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [confirmPassword, setConfirmPassword] = (0, react_1.useState)('');
    const [otp, setOtp] = (0, react_1.useState)('');
    const [error, setError] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [showPassword, setShowPassword] = (0, react_1.useState)(false);
    const [showConfirmPassword, setShowConfirmPassword] = (0, react_1.useState)(false);
    // Normal Sign In Handler
    const handleSignIn = (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setTimeout(() => {
            // Check Admin/Faculty Demo
            const demoUser = constants_1.DEMO_USERS.find(u => u.email === email);
            if (demoUser) {
                login(demoUser.email, demoUser.role);
                setLoading(false);
                return;
            }
            // Check Student (Using dynamic whitelist)
            const student = allowedStudents.find(s => s.email === email);
            if (student && password === 'password123') { // Mock check
                login(email, types_1.UserRole.STUDENT);
            }
            else {
                setError('Invalid credentials. If you are a first-time student, please use the Verify Email option.');
            }
            setLoading(false);
        }, 800);
    };
    // Student Verification & Forgot Password Handlers
    const handleEmailVerification = (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setTimeout(() => {
            // For verification, check whitelist. For forgot password, check if user exists.
            const isAllowed = allowedStudents.find(s => s.email === email);
            const isDemo = constants_1.DEMO_USERS.find(u => u.email === email);
            if (mode === 'VERIFY_STUDENT') {
                if (isAllowed) {
                    setStep('OTP');
                }
                else {
                    setError('Email not found in authorized whitelist.');
                }
            }
            else if (mode === 'FORGOT_PASSWORD') {
                if (isAllowed || isDemo) {
                    setStep('OTP');
                }
                else {
                    setError('Email not found in our records.');
                }
            }
            setLoading(false);
        }, 800);
    };
    const handleOtpSubmit = (e) => {
        e.preventDefault();
        if (otp === '123456') {
            setStep('PASSWORD');
            setError('');
        }
        else {
            setError('Invalid OTP code.');
        }
    };
    const handleSetPassword = (e) => {
        e.preventDefault();
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (mode === 'FORGOT_PASSWORD') {
            // Mock password reset success
            setLoading(true);
            setTimeout(() => {
                setLoading(false);
                resetToSignIn();
                alert('Password successfully reset. You can now sign in with your new password.');
            }, 1000);
        }
        else {
            login(email, types_1.UserRole.STUDENT);
        }
    };
    const resetToSignIn = () => {
        setMode('SIGN_IN');
        setStep('EMAIL');
        setError('');
        setPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setShowConfirmPassword(false);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen flex items-center justify-center bg-[#1e3a8a] p-4 relative overflow-x-hidden", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 md:w-[600px] h-64 md:h-[600px] bg-[#065f46] rounded-full blur-[100px] opacity-20" }), (0, jsx_runtime_1.jsx)("div", { className: "absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 md:w-[600px] h-64 md:h-[600px] bg-[#facc15] rounded-full blur-[100px] opacity-10" }), (0, jsx_runtime_1.jsxs)("div", { className: "w-full max-w-4xl flex flex-col md:flex-row bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden relative z-10 border border-white/20", children: [(0, jsx_runtime_1.jsxs)("div", { className: "w-full md:w-5/12 bg-[#065f46] p-6 md:p-10 text-white flex flex-col justify-center items-center text-center", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "inline-flex items-center justify-center w-32 h-32 md:w-40 md:h-40 bg-[#facc15] rounded-full mb-6 shadow-2xl border-4 border-white/20 relative overflow-hidden group", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" }), (0, jsx_runtime_1.jsx)(lucide_react_1.GraduationCap, { className: "w-16 h-16 md:w-20 md:h-20 text-[#065f46] relative z-10" })] }), (0, jsx_runtime_1.jsx)("h1", { className: "text-3xl md:text-4xl font-black tracking-tighter mb-4", children: "AccounTech" }), (0, jsx_runtime_1.jsx)("div", { className: "w-12 h-1 bg-[#facc15] mx-auto mb-6 rounded-full" }), (0, jsx_runtime_1.jsx)("p", { className: "text-emerald-100 text-sm md:text-base leading-relaxed opacity-90 max-w-xs mx-auto", children: "CMA Department Informatics Ecosystem. Professional board exam preparation via data-driven adaptive drills." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "hidden md:block w-full mt-8 pt-8 border-t border-white/10", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-[10px] font-bold uppercase tracking-widest text-[#facc15] opacity-80 mb-4", children: "System Credentials" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 gap-2 text-[10px] font-mono text-emerald-200/70", children: [(0, jsx_runtime_1.jsx)("p", { children: "Admin: admin@phinmaed.com / any" }), (0, jsx_runtime_1.jsx)("p", { children: "Faculty: faculty@phinmaed.com / any" }), (0, jsx_runtime_1.jsx)("p", { children: "Student: student@phinmaed.com / password123" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 text-[10px] text-emerald-300/50 font-medium mt-8", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShieldCheck, { size: 14 }), (0, jsx_runtime_1.jsx)("span", { children: "Secure Login v3.0" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "w-full md:w-7/12 p-6 md:p-12 bg-white flex flex-col justify-center", children: mode === 'SIGN_IN' ? (
                        /* Normal Login Form */
                        (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSignIn, className: "space-y-4 md:space-y-6 animate-in fade-in zoom-in-95 duration-300", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl md:text-2xl font-black text-slate-800 mb-1", children: "Sign In" }), (0, jsx_runtime_1.jsx)("p", { className: "text-slate-500 text-xs md:text-sm", children: "Enter your credentials to access your dashboard." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3 md:space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-1", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider", children: "Institutional Email" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-300", size: 16 }), (0, jsx_runtime_1.jsx)("input", { type: "email", required: true, placeholder: "user@phinmaed.com", className: "w-full pl-10 md:pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none", value: email, onChange: (e) => setEmail(e.target.value) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider", children: "Password" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => { setMode('FORGOT_PASSWORD'); setStep('EMAIL'); setError(''); }, className: "text-[10px] font-bold text-[#1e3a8a] hover:underline uppercase tracking-wider", children: "Forgot Password?" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Lock, { className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-300", size: 16 }), (0, jsx_runtime_1.jsx)("input", { type: showPassword ? "text" : "password", required: true, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", className: "w-full pl-10 md:pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none", value: password, onChange: (e) => setPassword(e.target.value) }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors", children: showPassword ? (0, jsx_runtime_1.jsx)(lucide_react_1.EyeOff, { size: 16 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { size: 16 }) })] })] }), error && (0, jsx_runtime_1.jsx)("p", { className: "text-[10px] text-red-500 font-bold", children: error }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: loading, className: "w-full bg-[#1e3a8a] text-white py-3 md:py-3.5 rounded-xl font-bold text-sm hover:bg-blue-800 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50", children: loading ? 'Processing...' : 'Sign In' }), (0, jsx_runtime_1.jsxs)("div", { className: "relative py-2 md:py-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 flex items-center", children: (0, jsx_runtime_1.jsx)("span", { className: "w-full border-t border-slate-100" }) }), (0, jsx_runtime_1.jsx)("div", { className: "relative flex justify-center text-[10px] uppercase tracking-widest", children: (0, jsx_runtime_1.jsx)("span", { className: "bg-white px-2 text-slate-400 font-bold", children: "Or" }) })] }), (0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => { setMode('VERIFY_STUDENT'); setError(''); }, className: "w-full py-3 md:py-3.5 border-2 border-[#065f46] text-[#065f46] rounded-xl font-bold text-sm hover:bg-emerald-50 transition-all flex items-center justify-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShieldCheck, { size: 16 }), "First Time? Verify Email"] })] })] })) : (
                        /* Student Verification & Forgot Password Flow */
                        (0, jsx_runtime_1.jsxs)("div", { className: "animate-in fade-in slide-in-from-right-8 duration-300", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: resetToSignIn, className: "flex items-center gap-2 text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase mb-6 md:mb-8 transition-colors", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowLeft, { size: 14 }), " Back to Sign In"] }), step === 'EMAIL' && ((0, jsx_runtime_1.jsxs)("form", { onSubmit: handleEmailVerification, className: "space-y-4 md:space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: `text-xl md:text-2xl font-black ${mode === 'FORGOT_PASSWORD' ? 'text-[#1e3a8a]' : 'text-[#065f46]'} mb-1`, children: mode === 'FORGOT_PASSWORD' ? 'Reset Password' : 'Email Verification' }), (0, jsx_runtime_1.jsx)("p", { className: "text-slate-500 text-xs md:text-sm", children: mode === 'FORGOT_PASSWORD' ? 'Enter your email to receive a password reset code.' : 'Students must verify their institutional email.' })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-300", size: 16 }), (0, jsx_runtime_1.jsx)("input", { type: "email", required: true, placeholder: "user@phinmaed.com", className: `w-full pl-10 md:pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 ${mode === 'FORGOT_PASSWORD' ? 'focus:ring-[#1e3a8a]' : 'focus:ring-[#065f46]'} outline-none`, value: email, onChange: (e) => setEmail(e.target.value) })] }), error && (0, jsx_runtime_1.jsx)("p", { className: "text-[10px] text-red-500 font-bold", children: error }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: loading, className: `w-full ${mode === 'FORGOT_PASSWORD' ? 'bg-[#1e3a8a]' : 'bg-[#065f46]'} text-white py-3.5 rounded-xl font-bold text-sm transition-all`, children: loading ? 'Verifying...' : 'Send Verification Code' })] })] })), step === 'OTP' && ((0, jsx_runtime_1.jsxs)("form", { onSubmit: handleOtpSubmit, className: "space-y-4 md:space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: `text-xl md:text-2xl font-black ${mode === 'FORGOT_PASSWORD' ? 'text-[#1e3a8a]' : 'text-[#065f46]'} mb-1`, children: "Enter OTP" }), (0, jsx_runtime_1.jsx)("p", { className: "text-slate-500 text-xs md:text-sm", children: "Check your inbox for the 6-digit code." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("input", { type: "text", required: true, maxLength: 6, className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20", value: otp, onChange: (e) => {
                                                                const val = e.target.value.replace(/\D/g, '');
                                                                if (val.length <= 6)
                                                                    setOtp(val);
                                                            }, autoFocus: true }), (0, jsx_runtime_1.jsx)("div", { className: "flex justify-between gap-2", children: [...Array(6)].map((_, i) => ((0, jsx_runtime_1.jsx)("div", { className: `w-10 h-12 md:w-12 md:h-16 flex items-center justify-center bg-slate-50 border-2 rounded-xl text-xl md:text-2xl font-black transition-all duration-200 ${otp.length === i
                                                                    ? (mode === 'FORGOT_PASSWORD' ? 'border-[#1e3a8a] ring-4 ring-blue-500/10' : 'border-[#065f46] ring-4 ring-emerald-500/10')
                                                                    : 'border-slate-200'}`, children: otp[i] ? ((0, jsx_runtime_1.jsx)("span", { className: "animate-in zoom-in duration-200", children: otp[i] })) : ((0, jsx_runtime_1.jsx)("span", { className: "text-slate-300", children: "\u2022" })) }, i))) })] }), error && (0, jsx_runtime_1.jsx)("p", { className: "text-[10px] text-red-500 font-bold text-center", children: error }), (0, jsx_runtime_1.jsx)("button", { type: "submit", className: `w-full ${mode === 'FORGOT_PASSWORD' ? 'bg-[#1e3a8a]' : 'bg-[#065f46]'} text-white py-3.5 rounded-xl font-bold text-sm transition-all`, children: "Verify Code" })] })] })), step === 'PASSWORD' && ((0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSetPassword, className: "space-y-4 md:space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: `text-xl md:text-2xl font-black ${mode === 'FORGOT_PASSWORD' ? 'text-[#1e3a8a]' : 'text-[#065f46]'} mb-1`, children: mode === 'FORGOT_PASSWORD' ? 'New Password' : 'Set Password' }), (0, jsx_runtime_1.jsx)("p", { className: "text-slate-500 text-xs md:text-sm", children: mode === 'FORGOT_PASSWORD' ? 'Enter your new secure password.' : 'Secure your portal with a new password.' })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-1", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider", children: "New Password" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Lock, { className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-300", size: 16 }), (0, jsx_runtime_1.jsx)("input", { type: showPassword ? "text" : "password", required: true, placeholder: "New Security Password", className: `w-full pl-10 md:pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 ${mode === 'FORGOT_PASSWORD' ? 'focus:ring-[#1e3a8a]' : 'focus:ring-[#facc15]'} outline-none`, value: password, onChange: (e) => setPassword(e.target.value) }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors", children: showPassword ? (0, jsx_runtime_1.jsx)(lucide_react_1.EyeOff, { size: 16 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { size: 16 }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-1", children: [(0, jsx_runtime_1.jsx)("label", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider", children: "Confirm Password" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Lock, { className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-300", size: 16 }), (0, jsx_runtime_1.jsx)("input", { type: showConfirmPassword ? "text" : "password", required: true, placeholder: "Repeat Password", className: `w-full pl-10 md:pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 ${mode === 'FORGOT_PASSWORD' ? 'focus:ring-[#1e3a8a]' : 'focus:ring-[#facc15]'} outline-none`, value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value) }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowConfirmPassword(!showConfirmPassword), className: "absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors", children: showConfirmPassword ? (0, jsx_runtime_1.jsx)(lucide_react_1.EyeOff, { size: 16 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Eye, { size: 16 }) })] })] }), error && (0, jsx_runtime_1.jsx)("p", { className: "text-[10px] text-red-500 font-bold", children: error }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: loading, className: `w-full ${mode === 'FORGOT_PASSWORD' ? 'bg-[#1e3a8a]' : 'bg-[#facc15]'} ${mode === 'FORGOT_PASSWORD' ? 'text-white' : 'text-[#065f46]'} py-3.5 rounded-xl font-black text-sm hover:scale-[1.01] transition-all shadow-md`, children: loading ? 'Updating...' : mode === 'FORGOT_PASSWORD' ? 'Reset Password' : 'Activate Account' })] })] }))] })) })] })] }));
};
exports.default = Login;
//# sourceMappingURL=Login.js.map