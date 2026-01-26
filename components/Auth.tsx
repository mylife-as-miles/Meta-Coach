import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db';

interface AuthProps {
  onNavigateHome: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot-password';

const Auth: React.FC<AuthProps> = ({ onNavigateHome }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });

  const [rememberMe, setRememberMe] = useState(false);

  // Validation State
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    username: ''
  });

  const [touched, setTouched] = useState({
    email: false,
    password: false,
    username: false
  });

  const [submitError, setSubmitError] = useState('');

  // Reset form when switching modes
  useEffect(() => {
    setErrors({ email: '', password: '', username: '' });
    setTouched({ email: false, password: false, username: false });
    setFormData({ email: '', password: '', username: '' });
    setSubmitError('');
    // Don't reset rememberMe when switching modes
  }, [mode]);

  const validateField = (name: string, value: string) => {
    let error = '';
    switch (name) {
      case 'email':
        if (!value) error = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(value)) error = 'Please enter a valid email address';
        break;
      case 'password':
        if (!value) error = 'Password is required';
        else if (value.length < 8) error = 'Password must be at least 8 characters';
        break;
      case 'username':
        if (mode === 'signup') {
          if (!value) error = 'Username is required';
          else if (value.length < 3) error = 'Username must be at least 3 characters';
        }
        break;
    }
    return error;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error immediately when user types
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (submitError) setSubmitError('');
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    
    // Validate all fields
    const emailError = validateField('email', formData.email);
    const passwordError = mode === 'forgot-password' ? '' : validateField('password', formData.password);
    const usernameError = validateField('username', formData.username);

    setErrors({
      email: emailError,
      password: passwordError,
      username: usernameError
    });

    setTouched({
      email: true,
      password: true,
      username: true
    });

    // Check if valid
    if (mode === 'forgot-password') {
      if (!emailError) {
        console.log('Forgot Password Submitted:', { email: formData.email });
        // Mock password reset
        alert('Password reset link sent (simulated)');
      }
    } else if (!emailError && !passwordError && (mode === 'login' || !usernameError)) {
      try {
        if (mode === 'signup') {
            // Check if email exists
            const existingUser = await db.users.where('email').equals(formData.email).first();
            if (existingUser) {
                setSubmitError('User with this email already exists.');
                return;
            }
            const id = await db.users.add({
                email: formData.email,
                password: formData.password,
                username: formData.username,
                onboardingComplete: false
            });
            localStorage.setItem('userId', id.toString());
            navigate('/onboarding/step-1');
        } else if (mode === 'login') {
            const user = await db.users.where('email').equals(formData.email).first();
            if (user && user.password === formData.password) {
                localStorage.setItem('userId', user.id.toString());
                if (user.onboardingComplete) {
                    navigate('/dashboard');
                } else {
                    navigate('/onboarding/step-1');
                }
            } else {
                 setSubmitError('Invalid email or password.');
            }
        }
      } catch (err) {
        console.error(err);
        setSubmitError('An error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="bg-background-dark text-white min-h-screen flex relative overflow-hidden selection:bg-primary selection:text-black font-sans">
      <div className="fixed inset-0 grid-bg pointer-events-none z-0"></div>
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      
      <div className="w-full min-h-screen flex z-10 relative">
        {/* Left Section - Visuals (Desktop) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-[#0E100A] items-center justify-center border-r border-white/5 overflow-hidden">
          <div className="relative w-full h-full flex flex-col items-center justify-center p-12">
            <div className="relative w-[500px] h-[500px] flex items-center justify-center mb-12 animate-float">
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl animate-pulse-slow"></div>
              
              <div className="relative w-48 h-48 bg-surface-dark/40 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] z-20">
                <span className="material-symbols-outlined text-8xl text-primary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              
              <div className="absolute inset-20 border border-white/5 rounded-full animate-spin-slow"></div>
              <div className="absolute inset-10 border border-dashed border-white/10 rounded-full animate-[spin_25s_linear_infinite_reverse]"></div>
              <div className="absolute inset-0 border border-white/5 rounded-full opacity-30 animate-[spin_40s_linear_infinite]"></div>
              
              {/* Orbital Lines */}
              <div className="absolute top-1/2 left-1/2 w-[350px] h-[1px] bg-gradient-to-r from-primary/60 to-transparent -translate-y-1/2 origin-left rotate-[-25deg]"></div>
              <div className="absolute top-1/2 left-1/2 w-[320px] h-[1px] bg-gradient-to-r from-blue-400/40 to-transparent -translate-y-1/2 origin-left rotate-[155deg]"></div>
              <div className="absolute top-1/2 left-1/2 w-[300px] h-[1px] bg-gradient-to-r from-primary/40 to-transparent -translate-y-1/2 origin-left rotate-[45deg]"></div>
              <div className="absolute top-1/2 left-1/2 w-[380px] h-[1px] bg-gradient-to-r from-white/20 to-transparent -translate-y-1/2 origin-left rotate-[200deg]"></div>
              
              {/* Floating Labels */}
              <div className="absolute top-[15%] right-[10%] bg-surface-dark/90 border border-white/10 px-4 py-2 rounded-lg text-xs text-gray-300 shadow-lg flex items-center gap-2 backdrop-blur-sm animate-[bounce_4s_infinite]">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                <span className="font-mono">MACRO_STRATEGY_OK</span>
              </div>
              
              <div className="absolute bottom-[20%] left-[5%] bg-surface-dark/90 border border-white/10 px-4 py-2 rounded-lg text-xs text-gray-300 shadow-lg flex items-center gap-2 backdrop-blur-sm animate-[bounce_5s_infinite]">
                <span className="material-symbols-outlined text-xs text-blue-400">query_stats</span>
                <span className="font-mono">PLAYER_METRICS_SYNC</span>
              </div>
              
              <div className="absolute top-[30%] left-[0%] bg-surface-dark/90 border border-white/10 px-3 py-1.5 rounded-lg text-[10px] text-gray-400 shadow-lg flex items-center gap-2 backdrop-blur-sm animate-[bounce_7s_infinite]">
                <span className="w-1 h-1 bg-white rounded-full"></span>
                <span className="font-mono">GEMINI_API_V1.5</span>
              </div>
            </div>
            
            <div className="text-center z-20 max-w-lg mt-[-50px]">
              <h2 className="text-4xl font-display font-bold text-white mb-4 tracking-tight">AI-Powered Coaching</h2>
              <p className="text-gray-400 text-lg font-light leading-relaxed">
                Transform raw data into championship strategies. Let Gemini analyze your team's performance while you focus on the win.
              </p>
            </div>
            
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')]"></div>
          </div>
        </div>

        {/* Right Section - Login/Signup Form */}
        <div className="w-full lg:w-1/2 flex flex-col relative bg-background-dark/95 backdrop-blur-sm border-l border-white/5">
          <div className="absolute top-0 left-0 p-8 w-full flex justify-between items-center z-10">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={onNavigateHome}>
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-black shadow-[0_0_15px_rgba(210,249,111,0.4)] transition-transform group-hover:rotate-3">
                <span className="material-icons text-xl">auto_graph</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-display">MetaCoach</span>
            </div>
            <a className="text-sm font-medium text-gray-400 hover:text-primary transition-colors cursor-pointer">Contact Support</a>
          </div>

          <div className="flex-grow flex items-center justify-center px-6 sm:px-12 md:px-24">
            <div className="w-full max-w-md space-y-8 animate-fade-in-up">
              <div className="space-y-2">
                <h1 className="text-4xl font-medium tracking-tight text-white animate-fade-in-up">
                  {mode === 'login' && 'Welcome back'}
                  {mode === 'signup' && 'Create an account'}
                  {mode === 'forgot-password' && 'Reset Password'}
                </h1>
                <p className="text-gray-400 text-sm animate-fade-in-up delay-75">
                  {mode === 'login' && 'Sign in to access your Strategy Lab and Analytics.'}
                  {mode === 'signup' && 'Join thousands of coaches optimizing their gameplay.'}
                  {mode === 'forgot-password' && 'Enter your email to receive reset instructions.'}
                </p>
              </div>

              {submitError && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                  {submitError}
                </div>
              )}

              <form action="#" className="space-y-5" method="POST" onSubmit={handleSubmit} noValidate>
                <div className="space-y-5">
                  
                  {/* Username Field - Only visible in Signup */}
                  {mode === 'signup' && (
                    <div className="group animate-fade-in-up">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-primary transition-colors" htmlFor="username">
                        Username
                      </label>
                      <div className="relative">
                        <span className={`material-icons absolute left-4 top-1/2 -translate-y-1/2 text-lg transition-colors ${errors.username && touched.username ? 'text-red-400' : 'text-gray-500'}`}>person</span>
                        <input 
                          autoComplete="username" 
                          className={`appearance-none block w-full pl-11 pr-4 py-3.5 bg-surface-dark border placeholder-gray-600 text-white rounded-lg focus:outline-none focus:ring-1 sm:text-sm transition-all duration-200 
                            ${errors.username && touched.username 
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                              : 'border-gray-800 focus:ring-primary focus:border-primary'}`}
                          id="username" 
                          name="username" 
                          placeholder="MetaCoachUser"
                          value={formData.username}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          required 
                          type="text"
                        />
                      </div>
                      {errors.username && touched.username && (
                        <p className="ml-1 mt-1 text-xs text-red-400 animate-fade-in-up">{errors.username}</p>
                      )}
                    </div>
                  )}

                  {/* Email Field */}
                  <div className="group">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-primary transition-colors" htmlFor="email">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className={`material-icons absolute left-4 top-1/2 -translate-y-1/2 text-lg transition-colors ${errors.email && touched.email ? 'text-red-400' : 'text-gray-500'}`}>mail</span>
                      <input 
                        autoComplete="email" 
                        className={`appearance-none block w-full pl-11 pr-4 py-3.5 bg-surface-dark border placeholder-gray-600 text-white rounded-lg focus:outline-none focus:ring-1 sm:text-sm transition-all duration-200 
                          ${errors.email && touched.email 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-800 focus:ring-primary focus:border-primary'}`}
                        id="email" 
                        name="email" 
                        placeholder="coach@metacoach.gg" 
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required 
                        type="email"
                      />
                    </div>
                    {errors.email && touched.email && (
                      <p className="ml-1 mt-1 text-xs text-red-400 animate-fade-in-up">{errors.email}</p>
                    )}
                  </div>

                  {/* Password Field - Hidden in Forgot Password mode */}
                  {mode !== 'forgot-password' && (
                    <div className="group animate-fade-in-up delay-100">
                      <div className="flex items-center justify-between mb-2 ml-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest group-focus-within:text-primary transition-colors" htmlFor="password">
                          Password
                        </label>
                        {mode === 'login' && (
                          <a 
                            className="text-xs font-medium text-gray-400 hover:text-primary transition-colors cursor-pointer"
                            onClick={() => setMode('forgot-password')}
                          >
                            Forgot password?
                          </a>
                        )}
                      </div>
                      <div className="relative">
                        <span className={`material-icons absolute left-4 top-1/2 -translate-y-1/2 text-lg transition-colors ${errors.password && touched.password ? 'text-red-400' : 'text-gray-500'}`}>lock</span>
                        <input 
                          autoComplete={mode === 'login' ? "current-password" : "new-password"}
                          className={`appearance-none block w-full pl-11 pr-4 py-3.5 bg-surface-dark border placeholder-gray-600 text-white rounded-lg focus:outline-none focus:ring-1 sm:text-sm transition-all duration-200 
                            ${errors.password && touched.password 
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                              : 'border-gray-800 focus:ring-primary focus:border-primary'}`}
                          id="password" 
                          name="password" 
                          placeholder="••••••••" 
                          value={formData.password}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          required={mode !== 'forgot-password'} 
                          type="password"
                        />
                      </div>
                      {errors.password && touched.password && (
                        <p className="ml-1 mt-1 text-xs text-red-400 animate-fade-in-up">{errors.password}</p>
                      )}
                    </div>
                  )}

                  {/* Remember Me Checkbox - Only in Login mode */}
                  {mode === 'login' && (
                    <div className="flex items-center animate-fade-in-up delay-150">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-700 rounded bg-surface-dark cursor-pointer accent-primary"
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400 cursor-pointer hover:text-gray-300 select-none">
                        Remember me
                      </label>
                    </div>
                  )}
                </div>

                <button 
                  className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-lg shadow-[0_0_20px_rgba(210,249,111,0.2)] text-sm font-bold text-black bg-primary hover:bg-primary-hover hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-gray-900 transition-all duration-200 uppercase tracking-widest mt-6" 
                  type="submit"
                >
                  <span>
                    {mode === 'login' && 'Sign In'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'forgot-password' && 'Send Reset Link'}
                  </span>
                  <span className="material-icons text-sm font-bold">arrow_forward</span>
                </button>
              </form>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-background-dark text-gray-500 font-mono text-xs">OR CONTINUE WITH</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-3 px-4 py-3.5 border border-gray-700 rounded-lg shadow-sm bg-surface-dark hover:bg-white hover:text-black hover:border-white transition-all duration-300 group">
                  <svg className="h-5 w-5 text-gray-300 group-hover:text-black transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"></path>
                  </svg>
                  <span className="text-sm font-bold text-gray-300 group-hover:text-black">Google</span>
                </button>
                <button className="flex items-center justify-center gap-3 px-4 py-3.5 border border-gray-700 rounded-lg shadow-sm bg-surface-dark hover:bg-[#5865F2] hover:border-[#5865F2] hover:text-white transition-all duration-300 group">
                  <svg className="h-5 w-5 fill-current text-[#5865F2] group-hover:text-white transition-colors" viewBox="0 0 127.14 96.36">
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.82,105.82,0,0,0,126.6,80.22c2.36-24.44-2-47.27-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.25-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"></path>
                  </svg>
                  <span className="text-sm font-bold text-gray-300 group-hover:text-white">Discord</span>
                </button>
              </div>
              
              <p className="text-center text-sm text-gray-500">
                {mode === 'login' && "Don't have an account? "}
                {mode === 'signup' && "Already have an account? "}
                {mode === 'forgot-password' && "Remember your password? "}
                <a 
                  className="font-bold text-primary hover:text-primary-hover hover:underline transition-all cursor-pointer"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                >
                  {mode === 'login' && 'Create account'}
                  {mode === 'signup' && 'Sign in'}
                  {mode === 'forgot-password' && 'Back to Sign In'}
                </a>
              </p>
            </div>
          </div>
          
          <div className="absolute bottom-6 left-0 w-full text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">System Operational</span>
            </div>
            <p className="text-[10px] text-gray-700 uppercase tracking-widest">© MetaCoach 2024</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;