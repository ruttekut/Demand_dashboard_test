import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { DemandRequest, DemandRequestStatus } from '../../types';
import { useDashboardFilters } from '../../state/useDashboardFilters';
import { formatDistanceToNow } from '../../utils/date';
import { useTelemetry } from '../../telemetry/TelemetryProvider';

const statusLabels: Record<DemandRequestStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

const statusFilters: (DemandRequestStatus | 'all')[] = ['all', 'open', 'in_progress', 'completed', 'cancelled'];

const statusColors: Record<DemandRequestStatus, string> = {
  open: 'bg-emerald-100 text-emerald-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-rose-100 text-rose-700'
};

export default function DashboardPage() {
  const { data: requests = [], isLoading } = useQuery({ queryKey: ['requests'], queryFn: api.listRequests });
  const { status, search, sort, setStatus, setSearch, setSort } = useDashboardFilters();
  const { track } = useTelemetry();

  const filtered = useMemo(() => {
    return requests
      .filter((request) => (status && status !== 'all' ? request.status === status : true))
      .filter((request) => {
        if (!search.trim()) return true;
        const value = `${request.title} ${request.category}`.toLowerCase();
        return value.includes(search.toLowerCase());
      })
      .sort((a, b) => {
        const diff =
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        return sort === 'updated_desc' ? -diff : diff;
      });
  }, [requests, status, search, sort]);

  return (
    <div className="space-y-6" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Demand dashboard</h1>
          <p className="text-sm text-slate-600">Track every request at a glance and jump into conversations fast.</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span className="rounded-full bg-slate-200 px-3 py-1">{filtered.length} requests</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Status filters">
        {statusFilters.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className={`rounded-full px-4 py-2 text-sm font-medium focus:outline-none focus:ring ${
              status === value ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {value === 'all' ? 'All' : statusLabels[value]}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
          <span className="sr-only">Search requests</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title or category"
            className="w-64 rounded border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring"
            aria-label="Search requests"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Sort by
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as typeof sort)}
            className="rounded border border-slate-200 px-2 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring"
          >
            <option value="updated_desc">Recently updated</option>
            <option value="updated_asc">Oldest updated</option>
          </select>
        </label>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading requests…</p>
      ) : (
        <ul className="space-y-3" role="list">
          {filtered.map((request) => (
            <li key={request.id}>
              <Link
                to={`/requests/${request.id}`}
                onClick={() => track('request_opened', { requestId: request.id })}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-400 focus:outline-none focus:ring"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[request.status]}`}>
                      {statusLabels[request.status]}
                    </span>
                    <h2 className="text-lg font-semibold text-slate-900">{request.title}</h2>
                  </div>
                  <p className="text-xs text-slate-500">
                    Updated {formatDistanceToNow(request.updatedAt)} • {request.category}
                  </p>
                </div>
                <p className="line-clamp-2 text-sm text-slate-600">{request.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{request.location}</span>
                  {request.budget && (
                    <span>
                      Budget {request.budget.currency} {request.budget.min.toLocaleString()} –{' '}
                      {request.budget.max.toLocaleString()}
                    </span>
                  )}
                  {request.attachments.length > 0 && <span>{request.attachments.length} attachment(s)</span>}
                </div>
              </Link>
            </li>
          ))}
          {filtered.length === 0 && !isLoading && (
            <li className="rounded border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              No requests match your filters just yet.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
