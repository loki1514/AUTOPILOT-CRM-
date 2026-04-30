import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Shield, User, ArrowLeft } from 'lucide-react';
import { GlassCard } from '@/components/atmosphere/GlassCard';
import { WeatherScene } from '@/components/atmosphere/WeatherScene';
import { motion, AnimatePresence } from 'framer-motion';

type AuthView = 'role-select' | 'login' | 'signup';
type SelectedRole = 'admin' | 'rep' | null;

export default function Auth() {
  const { isAuthenticated, isLoading, signIn, signUp } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState<AuthView>('role-select');
  const [selectedRole, setSelectedRole] = useState<SelectedRole>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  if (isLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <WeatherScene mode="clear-night" />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(loginEmail, loginPassword);
      toast.success('Logged in successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to log in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail || !signupPassword || !signupConfirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (signupPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp(signupEmail, signupPassword);
      toast.success('Account created successfully! You can now log in.');
      setView('login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectRole = (role: SelectedRole) => {
    setSelectedRole(role);
    setView('login');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 text-foreground">
      <WeatherScene mode="clear-night" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <GlassCard variant="strong" hover={false} glow="accent" className="p-8 sm:p-10">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-5">
              <span
                aria-hidden
                className="absolute inset-0 -z-10 rounded-full blur-2xl"
                style={{ background: "oklch(0.7 0.18 240 / 45%)" }}
              />
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold tracking-tight">Office</span>
                <span className="text-2xl font-extrabold tracking-tight text-emerald-400">Flow</span>
                <span className="ml-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
            <div className="eyebrow mb-2">BD Workspace Intelligence</div>
          </div>

          <AnimatePresence mode="wait">
            {view === 'role-select' && (
              <motion.div
                key="role-select"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="mt-8 space-y-4"
              >
                <p className="text-center text-sm text-foreground/55 mb-4">
                  Choose your role to continue
                </p>

                <button
                  onClick={() => selectRole('admin')}
                  className="w-full group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-5 text-left transition-all hover:border-emerald-500/40 hover:bg-white/[0.07]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Admin</h3>
                      <p className="text-xs text-foreground/55 mt-0.5">
                        Full access to all leads, reps, settings, and integrations
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => selectRole('rep')}
                  className="w-full group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-5 text-left transition-all hover:border-blue-500/40 hover:bg-white/[0.07]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Sales Rep</h3>
                      <p className="text-xs text-foreground/55 mt-0.5">
                        View assigned leads only, log activities, manage your pipeline
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setView('signup')}
                  className="w-full text-center text-sm text-foreground/40 hover:text-foreground/70 transition-colors pt-2"
                >
                  Don't have an account? <span className="text-primary">Sign up</span>
                </button>
              </motion.div>
            )}

            {view === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="mt-6"
              >
                <button
                  onClick={() => setView('role-select')}
                  className="mb-4 flex items-center gap-1 text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to roles
                </button>

                {selectedRole && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2 text-xs">
                    {selectedRole === 'admin' ? (
                      <>
                        <Shield className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Admin access</span>
                      </>
                    ) : (
                      <>
                        <User className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-blue-400 font-medium">Sales Rep access</span>
                      </>
                    )}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-[12px] uppercase tracking-[0.14em] text-foreground/55">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="h-11 bg-white/[0.04] border-white/10 focus-visible:ring-accent/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-[12px] uppercase tracking-[0.14em] text-foreground/55">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="h-11 bg-white/[0.04] border-white/10 focus-visible:ring-accent/60"
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 mt-2" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>

                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={() => setView('signup')}
                    className="text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
                  >
                    Create account
                  </button>
                  <button
                    onClick={() => setView('role-select')}
                    className="text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
                  >
                    Change role
                  </button>
                </div>
              </motion.div>
            )}

            {view === 'signup' && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="mt-6"
              >
                <button
                  onClick={() => setView('role-select')}
                  className="mb-4 flex items-center gap-1 text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" /> Back
                </button>

                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-[12px] uppercase tracking-[0.14em] text-foreground/55">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="h-11 bg-white/[0.04] border-white/10 focus-visible:ring-accent/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-[12px] uppercase tracking-[0.14em] text-foreground/55">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="h-11 bg-white/[0.04] border-white/10 focus-visible:ring-accent/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password" className="text-[12px] uppercase tracking-[0.14em] text-foreground/55">Confirm Password</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="h-11 bg-white/[0.04] border-white/10 focus-visible:ring-accent/60"
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 mt-2" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>

                <button
                  onClick={() => setView('login')}
                  className="mt-4 w-full text-center text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
                >
                  Already have an account? <span className="text-primary">Sign in</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>
    </div>
  );
}
