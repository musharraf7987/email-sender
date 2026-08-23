'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  LayoutList,
  Loader2,
  MailCheck,
  Search,
  Send,
  X,
} from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  checkInboxReplies,
  deleteApplicationRecord,
  fetchApplicationsList,
  updateApplicationRecord,
  type ApplicationRecord,
} from '@/hooks/use-api';
import {
  APPLICATION_STATUSES,
  JOB_TYPES,
  PAGE_SIZE,
  PRIORITIES,
} from '@/lib/constants';
import { daysUntilExpiry, formatDate } from '@/lib/format';
import type { PaginationMeta } from '@/types';

type Application = ApplicationRecord;
type Pagination = PaginationMeta;

const statusVariant = (
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'muted' => {
  const map: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'muted'
  > = {
    applied: 'info',
    replied: 'secondary',
    interview: 'warning',
    offer: 'success',
    rejected: 'destructive',
    expired: 'muted',
    withdrawn: 'outline',
    hired: 'success',
  };
  return map[status] || 'secondary';
};

const emptyForm = {
  companyName: '',
  jobType: 'React Developer',
  jobTitle: '',
  status: 'applied',
  recruiterName: '',
  recruiterPhone: '',
  location: '',
  workMode: '',
  salary: '',
  source: '',
  notes: '',
  priority: 'medium',
  tags: '',
  followUpDate: '',
  lastContactAt: '',
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [editing, setEditing] = useState<Application | null>(null);
  const [deleting, setDeleting] = useState<Application | null>(null);
  const [deletingInProgress, setDeletingInProgress] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [checkingReplies, setCheckingReplies] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const autoCheckedRef = useRef(false);

  const hasActiveFilters = statusFilter !== 'all' || search.trim().length > 0;
  const totalAll = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim();
      setSearch((prev) => {
        if (prev !== next) {
          setPage(1);
          return next;
        }
        return prev;
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchApplications = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const data = await fetchApplicationsList({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
        page,
        limit: PAGE_SIZE,
      });

      if (controller.signal.aborted) return;

      setApplications(data.applications);
      setPagination(data.pagination);
      if (data.statusCounts) setStatusCounts(data.statusCounts);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Network error while loading applications',
      });
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchApplications();
    return () => abortRef.current?.abort();
  }, [fetchApplications]);

  const checkReplies = useCallback(async (silent = false) => {
    setCheckingReplies(true);
    if (!silent) setMessage(null);
    try {
      const data = await checkInboxReplies();

      if (data.matched > 0) {
        setMessage({
          type: 'success',
          text: `${data.matched} reply(ies) found and marked as replied`,
        });
        await fetchApplications();
      } else if (!silent) {
        setMessage({ type: 'success', text: 'No new replies found in inbox' });
      }
    } catch (error) {
      if (!silent) {
        setMessage({
          type: 'error',
          text: error instanceof Error ? error.message : 'Failed to check replies',
        });
      }
    } finally {
      setCheckingReplies(false);
    }
  }, [fetchApplications]);

  useEffect(() => {
    if (autoCheckedRef.current) return;
    autoCheckedRef.current = true;

    void (async () => {
      setCheckingReplies(true);
      try {
        const data = await checkInboxReplies();
        if (data.matched > 0) {
          await fetchApplicationsList({
            status: statusFilter !== 'all' ? statusFilter : undefined,
            search: search || undefined,
            page,
            limit: PAGE_SIZE,
          }).then((result) => {
            setApplications(result.applications);
            setPagination(result.pagination);
            if (result.statusCounts) setStatusCounts(result.statusCounts);
          });
        }
      } catch {
        // silent on auto-check
      } finally {
        setCheckingReplies(false);
      }
    })();
    // Only run inbox check once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  const openEdit = (app: Application) => {
    setEditing(app);
    setForm({
      companyName: app.companyName || '',
      jobType: app.jobType,
      jobTitle: app.jobTitle || '',
      status: app.status,
      recruiterName: app.recruiterName || '',
      recruiterPhone: app.recruiterPhone || '',
      location: app.location || '',
      workMode: app.workMode || '',
      salary: app.salary || '',
      source: app.source || '',
      notes: app.notes || '',
      priority: app.priority || 'medium',
      tags: app.tags || '',
      followUpDate: app.followUpDate ? app.followUpDate.slice(0, 10) : '',
      lastContactAt: app.lastContactAt ? app.lastContactAt.slice(0, 10) : '',
    });
    setMessage(null);
  };

  const closeEdit = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!editing) return;

    setSaving(true);
    setMessage(null);

    try {
      await updateApplicationRecord(editing.id, {
        ...form,
        followUpDate: form.followUpDate || null,
        lastContactAt: form.lastContactAt || null,
      });

      setMessage({ type: 'success', text: 'Application updated' });
      closeEdit();
      fetchApplications();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Network error while saving',
      });
    } finally {
      setSaving(false);
    }
  };

  const closeDelete = () => {
    if (deletingInProgress) return;
    setDeleting(null);
  };

  const confirmDelete = async () => {
    if (!deleting) return;

    setDeletingInProgress(true);
    setMessage(null);

    try {
      await deleteApplicationRecord(deleting.id);
      setMessage({ type: 'success', text: 'Application deleted' });
      setDeleting(null);
      fetchApplications();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Network error while deleting',
      });
    } finally {
      setDeletingInProgress(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/50 via-background to-background">
      <AppHeader
        title="Application Tracker"
        subtitle="Track applications, replies & auto-expiry"
        icon={<LayoutList className="h-4 w-4 text-primary" />}
        hiddenNavHrefs={['/']}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/">
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Send Application</span>
              </Link>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => checkReplies(false)}
              disabled={checkingReplies}
            >
              {checkingReplies ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MailCheck className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {checkingReplies ? 'Checking...' : 'Check Replies'}
              </span>
            </Button>
          </>
        }
      />

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
        {message && (
          <Alert variant={message.type === 'success' ? 'success' : 'destructive'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Main table card — fills remaining height */}
        <Card className="flex min-h-0 flex-1 flex-col border-border/60">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-lg">Applications</CardTitle>
                <CardDescription>
                  Auto-expire after 15 days · Inbox replies detected automatically
                </CardDescription>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1 sm:min-w-[280px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search email, company, domain..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses ({totalAll})</SelectItem>
                    {APPLICATION_STATUSES.map((status) => (
                      <SelectItem key={status} value={status} className="capitalize">
                        {status} ({statusCounts[status] || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            {loading ? (
              <div className="flex flex-1 items-center justify-center gap-2 p-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading applications...
              </div>
            ) : applications.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-16 text-center text-muted-foreground">
                <p>
                  {hasActiveFilters
                    ? statusFilter === 'replied' && (statusCounts.replied || 0) === 0
                      ? 'Abhi koi application "replied" mark nahi hai. Status dropdown se replied select karo.'
                      : 'No applications match your filters.'
                    : 'No applications yet. Send your first one from the home page.'}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="space-y-3 p-4 md:hidden">
                  {applications.map((app) => {
                    const daysLeft = daysUntilExpiry(app.expiresAt);
                    return (
                      <div
                        key={app.id}
                        className="space-y-3 rounded-lg border border-border/60 bg-card p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate font-medium">{app.companyName || '—'}</div>
                            <div className="truncate text-xs text-muted-foreground">{app.domain}</div>
                          </div>
                          <Badge variant={statusVariant(app.status)} className="shrink-0 capitalize">
                            {app.status}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="break-all text-muted-foreground">{app.email}</div>
                          <div>{app.jobType}</div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>Applied {formatDate(app.appliedAt)}</span>
                            <span>
                              Expires {formatDate(app.expiresAt)}
                              {app.status === 'applied' && daysLeft >= 0 ? ` · ${daysLeft}d left` : ''}
                            </span>
                          </div>
                          {!app.emailSent && (
                            <div className="text-xs text-destructive">Send failed</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(app)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => setDeleting(app)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop table */}
                <div className="hidden min-h-0 flex-1 overflow-auto md:block">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-[1] bg-muted/80 backdrop-blur-sm">
                      <tr className="border-b bg-muted/40 text-left">
                        <th className="px-4 py-3 font-medium text-muted-foreground">Company</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">Email</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">Job</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">Applied</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">Expires</th>
                        <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app) => {
                        const daysLeft = daysUntilExpiry(app.expiresAt);
                        return (
                          <tr key={app.id} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="px-4 py-3 align-top">
                              <div className="font-medium">{app.companyName || '—'}</div>
                              <div className="text-xs text-muted-foreground">{app.domain}</div>
                            </td>
                            <td className="max-w-[200px] truncate px-4 py-3 align-top">{app.email}</td>
                            <td className="px-4 py-3 align-top">{app.jobType}</td>
                            <td className="px-4 py-3 align-top">
                              <Badge variant={statusVariant(app.status)} className="capitalize">
                                {app.status}
                              </Badge>
                              {!app.emailSent && (
                                <div className="mt-1 text-xs text-destructive">Send failed</div>
                              )}
                            </td>
                            <td className="px-4 py-3 align-top">{formatDate(app.appliedAt)}</td>
                            <td className="px-4 py-3 align-top">
                              {formatDate(app.expiresAt)}
                              {app.status === 'applied' && daysLeft >= 0 && (
                                <div className="text-xs text-muted-foreground">{daysLeft}d left</div>
                              )}
                            </td>
                            <td className="px-4 py-3 align-top">
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => openEdit(app)}>
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setDeleting(app)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {pagination && pagination.total > 0 && (
                  <div className="flex flex-col gap-3 border-t bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm text-muted-foreground">
                      Showing {(pagination.page - 1) * pagination.limit + 1}–
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total}
                    </span>
                    <div className="flex items-center justify-between gap-2 sm:justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPage((p) => p - 1)}
                        disabled={!pagination.hasPrevPage}
                      >
                        ← Prev
                      </Button>
                      <span className="min-w-[100px] text-center text-sm text-muted-foreground">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={!pagination.hasNextPage}
                      >
                        Next →
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={!!editing} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
            <DialogDescription>
              {editing?.email} · applied {formatDate(editing?.appliedAt || null)}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Job Type</Label>
              <Select
                value={form.jobType}
                onValueChange={(value) => setForm({ ...form, jobType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Job Title</Label>
              <Input
                value={form.jobTitle}
                onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => setForm({ ...form, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPLICATION_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Recruiter Name</Label>
              <Input
                value={form.recruiterName}
                onChange={(e) => setForm({ ...form, recruiterName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Recruiter Phone</Label>
              <Input
                type="tel"
                value={form.recruiterPhone}
                onChange={(e) => setForm({ ...form, recruiterPhone: e.target.value })}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Work Mode</Label>
              <Input
                placeholder="Remote / Hybrid / Onsite"
                value={form.workMode}
                onChange={(e) => setForm({ ...form, workMode: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Salary</Label>
              <Input
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Source</Label>
              <Input
                placeholder="LinkedIn, Naukri, referral..."
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(value) => setForm({ ...form, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <Input
                placeholder="startup, remote, dream-company"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Follow-up Date</Label>
              <Input
                type="date"
                value={form.followUpDate}
                onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Last Contact</Label>
              <Input
                type="date"
                value={form.lastContactAt}
                onChange={(e) => setForm({ ...form, lastContactAt: e.target.value })}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Notes</Label>
              <Textarea
                rows={4}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeEdit} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(open) => !open && closeDelete()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete application?</DialogTitle>
            <DialogDescription>
              This will permanently remove{' '}
              <span className="font-medium text-foreground">{deleting?.email}</span>
              {deleting?.companyName ? ` (${deleting.companyName})` : ''} from your tracker.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeDelete} disabled={deletingInProgress}>
              Discard
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deletingInProgress}>
              {deletingInProgress ? (
                <>
                  <Loader2 className="animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
