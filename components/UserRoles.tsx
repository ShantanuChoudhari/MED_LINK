
import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, UserCog } from 'lucide-react';
import { adminApi } from '../services/api';

const ROLE_COLORS: Record<string, string> = {
  admin:   'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  doctor:  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  patient: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
};

const UserRoles: React.FC = () => {
  const [users,     setUsers]     = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [updating,  setUpdating]  = useState<string | null>(null);
  const [toast,     setToast]     = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers();
      setUsers(res.data || []);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  };

  const changeRole = async (id: string, newRole: string) => {
    if (!confirm(`Change this user's role to "${newRole}"?`)) return;
    setUpdating(id);
    try {
      await adminApi.updateRole(id, newRole);
      showToast(`✅ Role updated to ${newRole}`);
      fetchUsers();
    } catch (e: any) { showToast(`❌ ${e.message}`); }
    finally { setUpdating(null); }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const groupedCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl text-sm font-medium">{toast}</div>}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Access Control</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{users.length} registered users</p>
        </div>
        <button onClick={fetchUsers} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700">
          <RefreshCw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </button>
      </div>

      {/* Role Summary */}
      <div className="grid grid-cols-3 gap-4">
        {(['admin','doctor','patient'] as const).map(r => (
          <div key={r} className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2 ${ROLE_COLORS[r]}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{groupedCounts[r] || 0}</p>
            <p className="text-xs font-bold text-slate-400 uppercase capitalize">{r}s</p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500">
            <UserCog className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Current Role</th>
                  <th className="px-6 py-4">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-sm">
                          {u.name[0]}
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">{u.email}</td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <select
                        value={u.role}
                        disabled={updating === u._id}
                        onChange={e => changeRole(u._id, e.target.value)}
                        className="text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="patient">Patient</option>
                        <option value="doctor">Doctor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRoles;