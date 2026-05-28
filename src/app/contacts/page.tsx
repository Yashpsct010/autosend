"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  ChevronUp,
  ChevronDown,
  Trash2,
  Mail,
  RefreshCw,
  Send,
  UserPlus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type SortKey = "email" | "company" | "createdAt";
type SortDir = "asc" | "desc";

interface Outreach {
  status: string;
  sentAt?: string;
  template?: { name: string };
}

interface Contact {
  id: string;

  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  createdAt: string;
  outreaches: Outreach[];
}

const STATUS_COLORS: Record<string, string> = {
  Sent: "bg-emerald-500/20 text-emerald-400",
  Queued: "bg-amber-500/20 text-amber-400",
  Failed: "bg-rose-500/20 text-rose-400",
  Draft: "bg-blue-500/20 text-blue-400",
};

const STATUS_OPTIONS = ["", "Sent", "Queued", "Failed", "Draft"];

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Add Contact Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ email: "", firstName: "", lastName: "", company: "", title: "" });
  const [addingContact, setAddingContact] = useState(false);
  const [addError, setAddError] = useState("");

  const pageSize = 20;

  const handleComposeOutreach = () => {
    if (selected.size === 0) return;
    sessionStorage.setItem("outreach_contact_ids", JSON.stringify([...selected]));
    router.push("/compose");
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingContact(true);
    setAddError("");
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContact),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || "Failed to add contact");
      } else {
        setShowAddModal(false);
        setNewContact({ email: "", firstName: "", lastName: "", company: "", title: "" });
        fetchContacts();
      }
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAddingContact(false);
    }
  };

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      search,
      page: String(page),
      pageSize: String(pageSize),
      ...(statusFilter ? { status: statusFilter } : {}),
    });
    const res = await fetch(`/api/contacts?${params}`);
    const data = await res.json();
    setContacts(data.contacts ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [search, page, statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchContacts, 300);
    return () => clearTimeout(t);
  }, [fetchContacts]);

  const sortedContacts = [...contacts].sort((a, b) => {
    let av = (a[sortKey] as string) ?? "";
    let bv = (b[sortKey] as string) ?? "";
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (selected.size === sortedContacts.length) setSelected(new Set());
    else setSelected(new Set(sortedContacts.map((c) => c.id)));
  };

  const deleteSelected = async () => {
    await Promise.all([...selected].map((id) =>
      fetch(`/api/contacts/${id}`, { method: "DELETE" })
    ));
    setSelected(new Set());
    fetchContacts();
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      : null;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Contacts</h1>
          <p className="text-white/40 mt-1 text-sm">
            {total.toLocaleString()} total contacts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition shadow-lg shadow-violet-500/20"
          >
            <UserPlus className="h-4 w-4" />
            Add Contact
          </button>
          <button
            onClick={fetchContacts}
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm text-white/70 transition"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Search by name, email or company…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500 transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 transition"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} className="bg-[#1a1a2e]">
              {s || "All Statuses"}
            </option>
          ))}
        </select>
        {selected.size > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handleComposeOutreach}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition"
            >
              <Send className="h-4 w-4" />
              Compose Outreach ({selected.size})
            </button>
            <button
              onClick={deleteSelected}
              className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2.5 text-sm font-medium text-rose-400 transition"
            >
              <Trash2 className="h-4 w-4" />
              Delete ({selected.size})
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 text-violet-400 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.size === sortedContacts.length && sortedContacts.length > 0}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </th>
                  {(["email", "company"] as SortKey[]).map((k) => (
                    <th
                      key={k}
                      onClick={() => toggleSort(k)}
                      className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider cursor-pointer hover:text-white/70 transition"
                    >
                      <span className="flex items-center gap-1">
                        {k} <SortIcon k={k} />
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Last Contact</th>
                </tr>
              </thead>
              <tbody>
                {sortedContacts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-white/30 py-16">
                      No contacts found
                    </td>
                  </tr>
                ) : (
                  sortedContacts.map((c) => {
                    const latestOutreach = c.outreaches?.[0];
                    const status = latestOutreach?.status ?? "—";
                    return (
                      <tr
                        key={c.id}
                        className={cn(
                          "border-b border-white/5 hover:bg-white/5 transition",
                          selected.has(c.id) && "bg-violet-500/5"
                        )}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(c.id)}
                            onChange={() => toggleSelect(c.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-white/25 flex-shrink-0" />
                            <span className="text-white/70">{c.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white/60">{c.company ?? "—"}</td>
                        <td className="px-4 py-3 text-white/70">
                          {[c.firstName, c.lastName].filter(Boolean).join(" ") || "—"}
                        </td>
                        <td className="px-4 py-3 text-white/50">{c.title ?? "—"}</td>
                        <td className="px-4 py-3">
                          {status !== "—" ? (
                            <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", STATUS_COLORS[status] ?? "bg-white/10 text-white/50")}>
                              {status}
                            </span>
                          ) : (
                            <span className="text-white/25 text-xs">No outreach</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-white/30 text-xs">
                          {latestOutreach?.sentAt
                            ? formatDistanceToNow(new Date(latestOutreach.sentAt), { addSuffix: true })
                            : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-white/40">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 px-3 py-1.5 text-white/70 transition"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 px-3 py-1.5 text-white/70 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#131320] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Add Contact</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-white/40 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddContact} className="p-5 space-y-4">
              {addError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                  {addError}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newContact.email}
                  onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition"
                  placeholder="e.g. john@example.com"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={newContact.firstName}
                    onChange={(e) => setNewContact({...newContact, firstName: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={newContact.lastName}
                    onChange={(e) => setNewContact({...newContact, lastName: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition"
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Company</label>
                  <input
                    type="text"
                    value={newContact.company}
                    onChange={(e) => setNewContact({...newContact, company: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition"
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5">Job Title</label>
                  <input
                    type="text"
                    value={newContact.title}
                    onChange={(e) => setNewContact({...newContact, title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition"
                    placeholder="CEO"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-white/60 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingContact}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition shadow-lg shadow-violet-500/20 disabled:opacity-50"
                >
                  {addingContact ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
