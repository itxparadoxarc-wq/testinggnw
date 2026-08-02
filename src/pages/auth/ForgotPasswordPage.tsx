import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type Step = 'email' | 'sent' | 'reset' | 'success';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && window.location.hash) setStep('reset');
    });
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setStep('reset');
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/forgot-password`,
      });
      if (error) throw error;
      setStep('sent');
      toast.success('Password reset link sent.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setStep('success');
      toast.success('Password reset successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-16 max-w-sm mx-auto">
      <h1 className="font-display text-3xl text-center mb-8">Reset Password</h1>

      {step === 'email' && (
        <form onSubmit={handleSendCode} className="space-y-4">
          <p className="text-muted-foreground text-sm text-center mb-4">
            Enter your email and we'll send you a secure password reset link.
          </p>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
          <p className="text-center text-sm">
            <Link to="/login" className="text-accent hover:underline">Back to Sign In</Link>
          </p>
        </form>
      )}

      {step === 'sent' && (
        <div className="text-center space-y-4">
          <p className="text-muted-foreground text-sm">Check your email and open the reset link to choose a new password.</p>
          <Button type="button" variant="outline" onClick={() => setStep('email')} className="w-full">Use another email</Button>
        </div>
      )}

      {step === 'reset' && (
        <form onSubmit={handleVerifyAndReset} className="space-y-5">
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      )}

      {step === 'success' && (
        <div className="text-center space-y-4">
          <div className="text-5xl">✅</div>
          <p className="text-foreground font-medium">Your password has been reset successfully!</p>
          <Button onClick={() => navigate('/login')} className="w-full">Sign In</Button>
        </div>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
