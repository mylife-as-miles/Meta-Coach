import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from '@tanstack/react-form';
import { supabase } from '../lib/supabase';
import Logo from './Logo';

interface AuthProps {
  onNavigateHome: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot-password';

const Auth: React.FC<AuthProps> = ({ onNavigateHome }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });

  // TanStack Form instance
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      username: '',
    },
    onSubmit: async ({ value }) => {
      setSubmitMessage({ type: '', text: '' });
      setIsSubmitting(true);

      try {
        if (mode === 'signup') {
          const { data, error } = await supabase.auth.signUp({
            email: value.email,
            password: value.password,
            options: {
              data: {
                username: value.username,
                onboarding_complete: false
              }
            }
          });

          if (error) throw error;

          if (data.session) {
            setSubmitMessage({ type: 'success', text: 'Account created! Redirecting...' });
            setTimeout(() => navigate('/onboarding/step-1'), 1500);
          } else {
            setSubmitMessage({
              type: 'success',
              text: 'Account created! Please check your email to verify. If you don\'t see it, check your spam folder.'
            });
          }

        } else if (mode === 'login') {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: value.email,
            password: value.password,
          });

          if (error) throw error;

          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_complete')
            .eq('id', data.user.id)
            .single();

          if (profile?.onboarding_complete) {
            navigate('/dashboard');
          } else {
            navigate('/onboarding/step-1');
          }
        } else if (mode === 'forgot-password') {
          const { error } = await supabase.auth.resetPasswordForEmail(value.email);
          if (error) throw error;
          setSubmitMessage({ type: 'success', text: 'Password reset link sent to your email.' });
        }
      } catch (err: any) {
        console.error(err);
        setSubmitMessage({ type: 'error', text: err.message || 'Authentication failed' });
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Reset form when switching modes
  useEffect(() => {
    form.reset();
    setSubmitMessage({ type: '', text: '' });
    setShowPassword(false);
  }, [mode]);

  const handleSocialLogin = async (provider: 'google' | 'discord') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      setSubmitMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="bg-background-dark text-white min-h-screen flex relative overflow-hidden selection:bg-primary selection:text-black font-sans">
      <div className="fixed inset-0 grid-bg pointer-events-none z-0"></div>

      <div className="w-full min-h-screen flex z-10 relative">
        {/* Left Section - Visuals (Reduced size) */}
        <div className="hidden lg:flex lg:w-[45%] relative bg-[#0E100A] items-center justify-center border-r border-white/5 overflow-hidden">
          <div className="relative w-full h-full flex flex-col items-center justify-center p-8">
            <div className="relative w-[400px] h-[400px] flex items-center justify-center mb-8 animate-float scale-90">
              {/* Core Glow */}
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-[60px] animate-pulse-slow"></div>

              {/* Central Processor */}
              <div className="relative w-32 h-32 bg-[#0E100A]/80 backdrop-blur-md rounded-full border border-primary/30 flex items-center justify-center shadow-[0_0_30px_rgba(210,249,111,0.1)] z-20">
                <span className="material-symbols-outlined text-5xl text-primary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>

                {/* Inner Ring */}
                <div className="absolute inset-2 border border-primary/20 rounded-full"></div>
              </div>

              {/* Orbiting Rings */}
              <div className="absolute inset-[80px] border border-white/5 rounded-full animate-[spin_30s_linear_infinite]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary/50 rounded-full shadow-[0_0_10px_currentColor]"></div>
              </div>
              <div className="absolute inset-[40px] border border-white/5 rounded-full animate-[spin_40s_linear_infinite_reverse]">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-400/50 rounded-full"></div>
              </div>

              {/* Radar Scan Effect */}
              <div className="absolute inset-[20px] rounded-full border border-white/5 overflow-hidden opacity-30">
                <div className="absolute top-1/2 left-1/2 w-full h-1/2 bg-gradient-to-t from-primary/20 to-transparent origin-top animate-[spin_4s_linear_infinite]"></div>
              </div>

              {/* Floating Data UI Cards - Simulation Elements */}
              {/* Card 1: Win Prob */}
              <div className="absolute top-[20%] right-[5%] bg-[#1A1C14]/90 border border-white/10 backdrop-blur-md py-2 px-3 rounded-lg flex items-center gap-3 shadow-xl animate-[bounce_4s_infinite] z-30">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                  <span className="material-icons text-primary text-xs">analytics</span>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Win Probability</div>
                  <div className="text-sm text-white font-mono font-bold flex items-center gap-1">
                    64.2% <span className="text-[10px] text-green-400">▲ 2.1%</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Draft Analysis */}
              <div className="absolute bottom-[20%] left-[5%] bg-[#1A1C14]/90 border border-white/10 backdrop-blur-md py-2 px-3 rounded-lg flex items-center gap-3 shadow-xl animate-[bounce_5s_infinite] delay-700 z-30">
                <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center">
                  <span className="material-icons text-blue-400 text-xs">psychology</span>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Draft Insight</div>
                  <div className="text-xs text-white leading-tight mt-0.5">
                    Pick Priority: <span className="text-blue-300 font-mono">Ahri</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center z-20 max-w-sm mt-[-30px]">
              <h2 className="text-3xl font-display font-bold text-white mb-3 tracking-tight">AI-Powered Coaching</h2>
              <p className="text-gray-400 text-sm font-light leading-relaxed">
                Transform raw data into championship strategies with Gemini AI.
              </p>
            </div>
          </div>
        </div>

        {/* Right Section - Login/Signup Form (Compact) */}
        <div className="w-full lg:w-[55%] flex flex-col relative bg-background-dark/95 backdrop-blur-sm border-l border-white/5">
          <div className="absolute top-0 left-0 p-6 w-full flex justify-between items-center z-10">
            <div className="absolute top-0 left-0 p-6 w-full flex justify-between items-center z-10">
              <Logo />
            </div>
          </div>

          <div className="flex-grow flex items-center justify-center px-4 sm:px-8">
            <div className="w-full max-w-[380px] space-y-6 animate-fade-in-up">
              <div className="space-y-1 text-center lg:text-left">
                <h1 className="text-2xl font-medium tracking-tight text-white">
                  {mode === 'login' && 'Welcome back'}
                  {mode === 'signup' && 'Create account'}
                  {mode === 'forgot-password' && 'Reset Password'}
                </h1>
                <p className="text-gray-500 text-xs">
                  {mode === 'login' && 'Sign in to access your Strategy Lab.'}
                  {mode === 'signup' && 'Join thousands of coaches optimizing gameplay.'}
                  {mode === 'forgot-password' && 'Enter email for reset instructions.'}
                </p>
              </div>

              {submitMessage.text && (
                <div className={`text-xs p-3 rounded border ${submitMessage.type === 'error'
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-green-500/10 border-green-500/30 text-green-400'
                  }`}>
                  {submitMessage.text}
                </div>
              )}

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
                noValidate
              >
                {/* Username Field */}
                {mode === 'signup' && (
                  <form.Field
                    name="username"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value) return 'Required';
                        if (value.length < 3) return 'Min 3 chars';
                        return undefined;
                      },
                    }}
                  >
                    {(field) => (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest" htmlFor="username">Username</label>
                        <div className="relative">
                          <input
                            className={`block w-full px-3 py-2.5 bg-surface-dark border rounded text-white text-sm focus:outline-none focus:ring-1 transition-all ${field.state.meta.isTouched && field.state.meta.errors.length > 0
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-white/10 focus:border-primary focus:ring-primary'
                              }`}
                            id="username"
                            name="username"
                            placeholder="MetaCoachUser"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            type="text"
                          />
                          {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                            <p className="text-[10px] text-red-400 mt-1">{field.state.meta.errors[0]}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </form.Field>
                )}

                {/* Email Field */}
                <form.Field
                  name="email"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value) return 'Required';
                      if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email';
                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest" htmlFor="email">Email</label>
                      <input
                        className={`block w-full px-3 py-2.5 bg-surface-dark border rounded text-white text-sm focus:outline-none focus:ring-1 transition-all ${field.state.meta.isTouched && field.state.meta.errors.length > 0
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-white/10 focus:border-primary focus:ring-primary'
                          }`}
                        id="email"
                        name="email"
                        placeholder="coach@metacoach.gg"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        type="email"
                      />
                      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                        <p className="text-[10px] text-red-400 mt-1">{field.state.meta.errors[0]}</p>
                      )}
                    </div>
                  )}
                </form.Field>

                {/* Password Field */}
                {mode !== 'forgot-password' && (
                  <form.Field
                    name="password"
                    validators={{
                      onChange: ({ value }) => {
                        if (!value) return 'Required';
                        if (value.length < 6) return 'Min 6 chars';
                        return undefined;
                      },
                    }}
                  >
                    {(field) => (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest" htmlFor="password">Password</label>
                          {mode === 'login' && (
                            <a onClick={() => setMode('forgot-password')} className="text-[10px] text-gray-400 hover:text-primary cursor-pointer">Forgot?</a>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            className={`block w-full px-3 py-2.5 bg-surface-dark border rounded text-white text-sm focus:outline-none focus:ring-1 transition-all pr-10 ${field.state.meta.isTouched && field.state.meta.errors.length > 0
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-white/10 focus:border-primary focus:ring-primary'
                              }`}
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            type={showPassword ? "text" : "password"}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                          >
                            <span className="material-icons text-base">{showPassword ? 'visibility_off' : 'visibility'}</span>
                          </button>
                        </div>
                        {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                          <p className="text-[10px] text-red-400 mt-1">{field.state.meta.errors[0]}</p>
                        )}
                      </div>
                    )}
                  </form.Field>
                )}

                <button
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded shadow-neon text-xs font-bold text-black bg-primary hover:bg-primary-hover hover:scale-[1.01] transition-all uppercase tracking-widest mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                >
                  {isSubmitting ? (
                    <span className="material-icons animate-spin text-sm">run_circle</span>
                  ) : (
                    <>
                      <span>
                        {mode === 'login' && 'Sign In'}
                        {mode === 'signup' && 'Create Account'}
                        {mode === 'forgot-password' && 'Send Reset Link'}
                      </span>
                      <span className="material-icons text-sm">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-background-dark text-gray-600 font-mono text-[10px]">OR</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSocialLogin('google')}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 border border-white/10 rounded bg-surface-dark hover:bg-white hover:text-black hover:border-white transition-all group"
                >
                  <svg className="h-4 w-4 text-gray-400 group-hover:text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"></path></svg>
                  <span className="text-xs font-bold text-gray-400 group-hover:text-black">Google</span>
                </button>
                <button
                  onClick={() => handleSocialLogin('discord')}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 border border-white/10 rounded bg-surface-dark hover:bg-[#5865F2] hover:border-[#5865F2] hover:text-white transition-all group"
                >
                  <svg className="h-4 w-4 fill-current text-[#5865F2] group-hover:text-white" viewBox="0 0 127.14 96.36"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.82,105.82,0,0,0,126.6,80.22c2.36-24.44-2-47.27-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.25-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"></path></svg>
                  <span className="text-xs font-bold text-gray-400 group-hover:text-white">Discord</span>
                </button>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                  <a
                    className="ml-2 font-bold text-primary hover:underline cursor-pointer"
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  >
                    {mode === 'login' ? 'Create account' : 'Sign in'}
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-4 w-full text-center">
            <p className="text-[10px] text-gray-800 uppercase tracking-widest">© MetaCoach 2024</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;