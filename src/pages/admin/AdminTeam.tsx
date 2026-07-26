import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  listAdmins,
  createAdmin,
  promoteToAdmin,
  revokeAdmin,
  deleteAdminAccount,
  resetAdminPassword,
} from '@/lib/admin-users.functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { KeyRound, ShieldMinus, Trash2, UserPlus } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

const AdminTeam = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [promoteEmail, setPromoteEmail] = useState('');

  const [pwTarget, setPwTarget] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setAdmins((await listAdmins({ data: {} as never })) as AdminUser[]);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createAdmin({ data: { email, password, full_name: fullName } });
      toast.success('Admin account created');
      setCreateOpen(false);
      setEmail(''); setPassword(''); setFullName('');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create admin');
    } finally { setBusy(false); }
  };

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await promoteToAdmin({ data: { email: promoteEmail } });
      toast.success('Admin access granted');
      setPromoteEmail('');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to grant access');
    } finally { setBusy(false); }
  };

  const handleRevoke = async (a: AdminUser) => {
    if (!confirm(`Remove admin access for ${a.email}? Their account stays active as a customer.`)) return;
    try {
      await revokeAdmin({ data: { userId: a.id } });
      toast.success('Admin access revoked');
      load();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (a: AdminUser) => {
    if (!confirm(`Permanently delete the account ${a.email}? This cannot be undone.`)) return;
    try {
      await deleteAdminAccount({ data: { userId: a.id } });
      toast.success('Account deleted');
      load();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwTarget) return;
    setBusy(true);
    try {
      await resetAdminPassword({ data: { userId: pwTarget.id, password: newPassword } });
      toast.success('Password updated');
      setPwTarget(null); setNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl">Admin Accounts</h1>
          <p className="text-sm text-muted-foreground">Create, promote and manage users with admin access.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 mr-2" /> New Admin</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create admin account</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="a-name">Full name</Label>
                <Input id="a-name" value={fullName} onChange={e => setFullName(e.target.value)} maxLength={100} />
              </div>
              <div>
                <Label htmlFor="a-email">Email</Label>
                <Input id="a-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="a-pass">Password</Label>
                <Input id="a-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create admin'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <form onSubmit={handlePromote} className="flex gap-2 items-end mb-6 max-w-md">
        <div className="flex-1">
          <Label htmlFor="promote">Grant admin to an existing customer</Label>
          <Input id="promote" type="email" placeholder="customer@email.com" value={promoteEmail} onChange={e => setPromoteEmail(e.target.value)} required />
        </div>
        <Button type="submit" variant="secondary" disabled={busy}>Grant</Button>
      </form>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded animate-pulse" />)}</div>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead><TableHead>Email</TableHead>
                <TableHead>Last sign in</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium text-sm">
                    {a.full_name || '—'}{a.id === user?.id && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                  </TableCell>
                  <TableCell className="text-sm">{a.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {a.last_sign_in_at ? new Date(a.last_sign_in_at).toLocaleString() : 'Never'}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button size="sm" variant="ghost" onClick={() => setPwTarget(a)} title="Reset password">
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" disabled={a.id === user?.id} onClick={() => handleRevoke(a)} title="Revoke admin">
                      <ShieldMinus className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" disabled={a.id === user?.id} onClick={() => handleDelete(a)} title="Delete account">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!pwTarget} onOpenChange={(o) => { if (!o) { setPwTarget(null); setNewPassword(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset password — {pwTarget?.email}</DialogTitle></DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <Label htmlFor="np">New password</Label>
              <Input id="np" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTeam;
