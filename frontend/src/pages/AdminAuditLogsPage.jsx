import React, { useEffect, useMemo, useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';

export const AdminAuditLogsPage = () => {
  usePageTitle('Audit trail');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get('/admin/audit-logs')
      .then((res) => setLogs(res.data))
      .catch((err) => setError(err.message || 'Could not load the audit trail'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => !q || [l.action, l.performedBy, l.details, l.entityName].some((v) => v?.toLowerCase().includes(q)));
  }, [logs, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Audit trail</h1>
        <p className="text-xs text-slate-500 mt-0.5">The latest {logs.length} security and operational events: sign-ins, bookings, payments, gate scans and admin changes</p>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <label htmlFor="audit-search" className="sr-only">Search audit trail</label>
          <input id="audit-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search action, user or details…" className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
        </div>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" /> {error}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500" role="status">Loading audit trail…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th scope="col" className="py-3 px-4">Action</th>
                  <th scope="col" className="py-3 px-4">Performed by</th>
                  <th scope="col" className="py-3 px-4">Entity</th>
                  <th scope="col" className="py-3 px-4">Details</th>
                  <th scope="col" className="py-3 px-4">IP</th>
                  <th scope="col" className="py-3 px-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4"><span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{log.action}</span></td>
                    <td className="py-3 px-4 text-slate-800 font-semibold">{log.performedBy || 'System'}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{log.entityName} #{log.entityId}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={log.details}>{log.details}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{log.ipAddress || '—'}</td>
                    <td className="py-3 px-4 text-right text-slate-500 text-[11px] font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No events match.</p>}
          </div>
        )}
      </div>
    </div>
  );
};
