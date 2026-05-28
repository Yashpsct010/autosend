"use client";

import { useState, useEffect, useRef } from "react";
import { MERGE_TAGS, replaceMergeTags } from "@/lib/merge";
import { Eye, Send, Loader2, Save, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface Contact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
}

export default function ComposePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ email: string; status: string }[] | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  
  const [previewContacts, setPreviewContacts] = useState<Contact[]>([]);
  const [isAllContacts, setIsAllContacts] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setTemplates(d));
      
    // Load contacts
    const storedIds = sessionStorage.getItem("outreach_contact_ids");
    if (storedIds) {
      try {
        const ids = JSON.parse(storedIds);
        if (Array.isArray(ids) && ids.length > 0) {
          setSelectedContactIds(ids);
          setIsAllContacts(false);
          fetch("/api/contacts/batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: ids.slice(0, 3) }) // Fetch up to 3 for preview
          }).then(r => r.json()).then(d => {
            if (d.contacts) setPreviewContacts(d.contacts);
            setLoadingContacts(false);
          });
          return;
        }
      } catch (e) {
        console.error("Failed to parse contact ids", e);
      }
    }
    
    // Default to ALL contacts preview
    setIsAllContacts(true);
    fetch("/api/contacts?pageSize=3")
      .then(r => r.json())
      .then(d => {
        if (d.contacts) setPreviewContacts(d.contacts);
        setLoadingContacts(false);
      });
  }, []);

  const insertTag = (tag: string) => {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newBody = body.slice(0, start) + tag + body.slice(end);
    setBody(newBody);
    setTimeout(() => el.setSelectionRange(start + tag.length, start + tag.length), 0);
    el.focus();
  };

  const loadTemplate = (t: Template) => {
    setSelectedTemplate(t);
    setSubject(t.subject);
    setBody(t.body);
    setTemplateName(t.name);
  };

  const saveTemplate = async () => {
    if (!templateName || !subject || !body) return;
    setSaving(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: templateName, subject, body }),
      });
      const t = await res.json();
      setTemplates((prev) => [t, ...prev]);
      setSelectedTemplate(t);
    } finally {
      setSaving(false);
    }
  };

  const sendOutreach = async () => {
    if (!selectedTemplate) return;
    setSending(true);
    setSendResult(null);
    try {
      const payload = isAllContacts 
        ? { templateId: selectedTemplate.id, sendToAll: true }
        : { templateId: selectedTemplate.id, contactIds: selectedContactIds };

      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      setSendResult(d.results ?? []);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Compose Outreach</h1>
        <p className="text-white/40 mt-1 text-sm flex items-center gap-2">
          Write your template, insert merge tags, and preview personalized emails.
          <span className="inline-flex items-center rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-white/70 ring-1 ring-inset ring-white/20">
            {isAllContacts ? "Sending to ALL contacts" : `Sending to ${selectedContactIds.length} selected contacts`}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Template Library */}
        <div className="xl:col-span-1 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
            Templates
          </h2>
          <div className="space-y-1.5">
            {templates.length === 0 && (
              <p className="text-xs text-white/30 text-center py-4">No templates yet</p>
            )}
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => loadTemplate(t)}
                className={cn(
                  "w-full text-left rounded-xl px-3 py-2.5 text-sm transition",
                  selectedTemplate?.id === t.id
                    ? "bg-violet-500/20 text-violet-300"
                    : "text-white/60 hover:bg-white/5 hover:text-white/80"
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="xl:col-span-2 space-y-4">
          {/* Template name */}
          <input
            type="text"
            placeholder="Template name…"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500 transition"
          />
          {/* Subject */}
          <input
            type="text"
            placeholder="Subject line…"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500 transition"
          />
          {/* Merge Tags */}
          <div className="flex flex-wrap gap-2">
            {MERGE_TAGS.map(({ tag, label }) => (
              <button
                key={tag}
                onClick={() => insertTag(tag)}
                className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition"
              >
                <Tag className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
          {/* Body */}
          <textarea
            ref={bodyRef}
            placeholder="Write your email body here. Click a merge tag above to insert it…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-500 transition resize-none font-mono leading-relaxed"
          />
          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={saveTemplate}
              disabled={saving || !templateName || !subject || !body}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 disabled:opacity-40 px-4 py-2.5 text-sm font-medium text-white transition"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Template
            </button>
            <button
              onClick={sendOutreach}
              disabled={sending || !selectedTemplate}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Outreach
            </button>
          </div>

          {/* Send Result */}
          {sendResult && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Send Results</p>
              {sendResult.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-white/70">{r.email}</span>
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
                    r.status.startsWith("Sent") ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                  )}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Preview */}
        <div className="xl:col-span-1 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Live Preview</h2>
          </div>
          
          {loadingContacts ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 text-violet-400 animate-spin" />
            </div>
          ) : previewContacts.length === 0 ? (
            <p className="text-xs text-white/30 text-center py-4">No contacts available for preview</p>
          ) : (
            previewContacts.map((contact: any) => {
              const previewSubject = replaceMergeTags(subject, {
                FirstName: contact.firstName,
                LastName: contact.lastName,
                Company: contact.company,
                Title: contact.title,
                JobTitle: contact.title,
              });
              const previewBody = replaceMergeTags(body, {
                FirstName: contact.firstName,
                LastName: contact.lastName,
                Company: contact.company,
                Title: contact.title,
                JobTitle: contact.title,
              });
              return (
                <div key={contact.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {contact.firstName?.[0] ?? "?"}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">{contact.firstName} {contact.lastName}</p>
                      <p className="text-xs text-white/30">{contact.company}</p>
                    </div>
                  </div>
                  {previewSubject && (
                    <p className="text-xs font-semibold text-white/70 mb-1 truncate">
                      Subject: {previewSubject}
                    </p>
                  )}
                  <p className="text-xs text-white/40 whitespace-pre-wrap line-clamp-4">
                    {previewBody || <span className="italic">Start typing to preview…</span>}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
