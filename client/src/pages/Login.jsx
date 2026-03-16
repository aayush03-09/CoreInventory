import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PackagePlus, UserCog, Users, ArrowLeft } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    // 'login' | 'register' | 'forgot'
    const [view, setView] = useState('login');
    const [role, setRole] = useState('manager'); // 'manager' | 'staff'
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);

    // Form states
    const [password, setPassword] = useState('');
    const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });
    const [resetData, setResetData] = useState({ email: '', otp: '', step: 1 });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true); setError(null);

        const email = role === 'manager' ? 'manager@coreinventory.local' : 'staff@coreinventory.local';

        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.errors ? data.errors[0].msg : data.message || 'Login failed');

            login(data.token, data.user);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally { setLoading(false); }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true); setError(null);
        try {
            const res = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...registerData, role })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.errors ? data.errors[0].msg : data.message || 'Registration failed');

            login(data.token, data.user);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally { setLoading(false); }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true); setError(null); setSuccess(null);
        try {
            if (resetData.step === 1) {
                // Mock sending OTP
                setSuccess('Mock OTP sent to ' + resetData.email + '. Use "1234" to verify.');
                setResetData(prev => ({ ...prev, step: 2 }));
            } else {
                const res = await fetch('http://localhost:5000/api/auth/reset-password-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: resetData.email, otp: resetData.otp })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.errors ? data.errors[0].msg : data.message || 'Verification failed');

                setSuccess('Password reset successfully! (Mock)');
                setTimeout(() => setView('login'), 2000);
            }
        } catch (err) {
            setError(err.message);
        } finally { setLoading(false); }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '40px' }}>
                <div className="flex-col items-center mb-4" style={{ textAlign: 'center' }}>
                    <PackagePlus size={48} color="var(--color-primary)" style={{ marginBottom: '16px' }} />
                    <h2 className="text-2xl" style={{ marginBottom: '8px' }}>CoreInventory</h2>
                    <p className="text-muted" style={{ marginBottom: '24px' }}>
                        {view === 'login' ? 'Select your portal to log in' : view === 'register' ? 'Create a new account' : 'Reset your password'}
                    </p>
                </div>

                {error && (
                    <div style={{ padding: '12px', background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', marginBottom: '16px', fontSize: 'var(--font-size-sm)' }}>
                        {error}
                    </div>
                )}
                {success && (
                    <div style={{ padding: '12px', background: 'var(--color-success-bg)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-md)', color: 'var(--color-success)', marginBottom: '16px', fontSize: 'var(--font-size-sm)' }}>
                        {success}
                    </div>
                )}

                {(view === 'login' || view === 'register') && (
                    <div className="grid grid-cols-2 gap-4 mb-4" style={{ marginBottom: '24px' }}>
                        <button type="button" onClick={() => { setRole('manager'); setError(null); }} className="card flex-col items-center justify-center transition" style={{ padding: '20px', cursor: 'pointer', border: role === 'manager' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: role === 'manager' ? 'var(--color-primary)' : 'var(--color-bg-card)' }}>
                            <UserCog size={32} color={role === 'manager' ? '#ffffff' : 'var(--color-primary)'} style={{ marginBottom: '8px' }} />
                            <span style={{ fontWeight: 600, color: role === 'manager' ? '#ffffff' : 'var(--color-text-main)' }}>Manager</span>
                        </button>
                        <button type="button" onClick={() => { setRole('staff'); setError(null); }} className="card flex-col items-center justify-center transition" style={{ padding: '20px', cursor: 'pointer', border: role === 'staff' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: role === 'staff' ? 'var(--color-primary)' : 'var(--color-bg-card)' }}>
                            <Users size={32} color={role === 'staff' ? '#ffffff' : 'var(--color-primary)'} style={{ marginBottom: '8px' }} />
                            <span style={{ fontWeight: 600, color: role === 'staff' ? '#ffffff' : 'var(--color-text-main)' }}>Staff</span>
                        </button>
                    </div>
                )}

                {view === 'login' && (
                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <label>Assigned Account Email</label>
                            <input type="text" disabled className="input-field" value={role === 'manager' ? 'manager@coreinventory.local' : 'staff@coreinventory.local'} style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                        </div>
                        <div className="input-group">
                            <label>Password</label>
                            <input type="password" required className="input-field" value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                        <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading} style={{ padding: '12px', fontSize: 'var(--font-size-base)' }}>
                            {loading ? 'Authenticating...' : `Log In as ${role === 'manager' ? 'Manager' : 'Staff'}`}
                        </button>
                        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: 'var(--font-size-sm)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <a href="#" onClick={(e) => { e.preventDefault(); setView('forgot'); setError(null); }}>Forgot password? Reset via OTP.</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); setView('register'); setError(null); }}>Don't have an account? Sign up.</a>
                        </div>
                    </form>
                )}

                {view === 'register' && (
                    <form onSubmit={handleRegister}>
                        <div className="input-group">
                            <label>Full Name</label>
                            <input type="text" required className="input-field" value={registerData.name} onChange={e => setRegisterData({ ...registerData, name: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label>Email Address</label>
                            <input type="email" required className="input-field" value={registerData.email} onChange={e => setRegisterData({ ...registerData, email: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label>Password</label>
                            <input type="password" required minLength="6" className="input-field" value={registerData.password} onChange={e => setRegisterData({ ...registerData, password: e.target.value })} />
                        </div>
                        <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading} style={{ padding: '12px', fontSize: 'var(--font-size-base)' }}>
                            {loading ? 'Registering...' : `Sign Up as ${role === 'manager' ? 'Manager' : 'Staff'}`}
                        </button>
                        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: 'var(--font-size-sm)' }}>
                            <a href="#" onClick={(e) => { e.preventDefault(); setView('login'); setError(null); }}>Already have an account? Log in.</a>
                        </div>
                    </form>
                )}

                {view === 'forgot' && (
                    <form onSubmit={handleReset}>
                        <div className="input-group">
                            <label>Email Address</label>
                            <input type="email" required disabled={resetData.step === 2} className="input-field" value={resetData.email} onChange={e => setResetData({ ...resetData, email: e.target.value })} />
                        </div>
                        {resetData.step === 2 && (
                            <div className="input-group">
                                <label>Reset Code</label>
                                <input type="text" required minLength="4" className="input-field" value={resetData.otp} onChange={e => setResetData({ ...resetData, otp: e.target.value })} />
                            </div>
                        )}
                        <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading} style={{ padding: '12px', fontSize: 'var(--font-size-base)' }}>
                            {loading ? 'Processing...' : resetData.step === 1 ? 'Send OTP Code' : 'Verify & Reset Password'}
                        </button>
                        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: 'var(--font-size-sm)' }}>
                            <a href="#" onClick={(e) => { e.preventDefault(); setView('login'); setError(null); setSuccess(null); setResetData({ email: '', otp: '', step: 1 }); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <ArrowLeft size={16} /> Back to Login
                            </a>
                        </div>
                    </form>
                )}

            </div>
        </div>
    );
};

export default Login;
