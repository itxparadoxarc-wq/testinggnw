import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type Step = 'email' | 'code' | 'success';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setStep('code');
      toast.success('Verification code sent! Check your email.');
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
      const { data, error } = await supabase.functions.invoke('verify-reset-code', {
        body: { email, code, new_password: newPassword },
      });
      if (error) {
        // Parse the error body for user-friendly message
        const errorBody = typeof error === 'object' && error.context ? await error.context?.json?.().catch(() => null) : null;
        const msg = errorBody?.error || data?.error || error.message || 'Failed to reset password';
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
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
            Enter your email and we'll send you a 6-digit verification code.
          </p>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Verification Code'}
          </Button>
          <p className="text-center text-sm">
            <Link to="/login" className="text-accent hover:underline">Back to Sign In</Link>
          </p>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={handleVerifyAndReset} className="space-y-5">
          <p className="text-muted-foreground text-sm text-center mb-2">
            Enter the 6-digit code sent to <strong>{email}</strong>
          </p>
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
          </div>
          <Button type="submit" className="w-full" disabled={loading || code.length < 6}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
          <div className="flex justify-between text-sm">
            <button type="button" onClick={() => setStep('email')} className="text-accent hover:underline">
              Change email
            </button>
            <button type="button" onClick={handleSendCode as any} className="text-accent hover:underline" disabled={loading}>
              Resend code
            </button>
          </div>
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
