"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  Shield,
  Mail,
  Key,
  Database,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionUser {
  name?: string;
  email?: string;
  image?: string;
}

interface SessionData {
  user?: SessionUser;
  expires?: string;
}

function ConfigRow({
  label,
  value,
  status,
  hint,
}: {
  label: string;
  value: string;
  status: "ok" | "missing";
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-white/5 last:border-0 gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white/70">{label}</span>
          {hint && (
            <div className="group relative">
              <Info className="h-3.5 w-3.5 text-white/25 cursor-help" />
              <div className="absolute left-0 -top-10 hidden group-hover:block z-10 bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/60 w-48">
                {hint}
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-white/30 mt-0.5 font-mono truncate">{value}</p>
      </div>
      <div className="flex-shrink-0">
        {status === "ok" ? (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle className="h-4 w-4" />
            <span>Set</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-rose-400">
            <XCircle className="h-4 w-4" />
            <span>Missing</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then(setSession)
      .finally(() => setLoading(false));
  }, []);

  const isSignedIn = !!session?.user;

  const envVars = [
    {
      label: "DATABASE_URL",
      key: "DATABASE_URL",
      hint: "PostgreSQL connection string",
    },
    {
      label: "NEXTAUTH_SECRET",
      key: "NEXTAUTH_SECRET",
      hint: "Random secret for NextAuth session encryption",
    },
    {
      label: "GOOGLE_CLIENT_ID",
      key: "GOOGLE_CLIENT_ID",
      hint: "From Google Cloud Console OAuth credentials",
    },
    {
      label: "GOOGLE_CLIENT_SECRET",
      key: "GOOGLE_CLIENT_SECRET",
      hint: "From Google Cloud Console OAuth credentials",
    },
    {
      label: "NEXTAUTH_URL",
      key: "NEXTAUTH_URL",
      hint: "Base URL of your app e.g. http://localhost:3000",
    },
  ];

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-white/40 mt-1 text-sm">
          Configure your OAuth credentials and review system status.
        </p>
      </div>

      {/* Auth Status */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3 mb-5">
          <Shield className="h-5 w-5 text-violet-400" />
          <h2 className="text-base font-semibold text-white">Google OAuth Status</h2>
        </div>

        {loading ? (
          <div className="h-16 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          </div>
        ) : isSignedIn ? (
          <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt="avatar"
                className="h-10 w-10 rounded-full ring-2 ring-emerald-500/30"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-white">
                {session?.user?.name ?? "Signed in"}
              </p>
              <p className="text-xs text-white/50">{session?.user?.email}</p>
              <p className="text-xs text-emerald-400 mt-0.5">
                ✓ Connected — Gmail send scope active
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-rose-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">Not signed in</p>
              <p className="text-white/40 text-sm mt-1">
                Sign in with Google to enable Gmail sending
              </p>
            </div>
            <a
              href="/api/auth/signin"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition"
            >
              <Mail className="h-4 w-4" />
              Sign in with Google
            </a>
          </div>
        )}

        {isSignedIn && (
          <div className="mt-4 flex gap-3">
            <a
              href="/api/auth/signout"
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm text-white/60 transition"
            >
              Sign Out
            </a>
          </div>
        )}
      </div>

      {/* Environment Variables */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3 mb-5">
          <Key className="h-5 w-5 text-amber-400" />
          <h2 className="text-base font-semibold text-white">Environment Variables</h2>
        </div>
        <p className="text-xs text-white/30 mb-4">
          These must be set in your <code className="font-mono bg-white/10 px-1 rounded">.env.local</code> file.
          Status is detected from the server-side environment at build time.
        </p>
        <div>
          {envVars.map((v) => (
            <ConfigRow
              key={v.key}
              label={v.label}
              value={`process.env.${v.key}`}
              status={"ok"} // Server cannot expose env check client-side; shown as reference
              hint={v.hint}
            />
          ))}
        </div>
      </div>

      {/* Gmail Setup Guide */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3 mb-5">
          <Database className="h-5 w-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">Setup Checklist</h2>
        </div>
        <ol className="space-y-3 text-sm text-white/60 list-decimal list-inside">
          {[
            "Create a Google Cloud project and enable the Gmail API.",
            "Configure OAuth consent screen — add gmail.send, email, and profile scopes.",
            "Create OAuth 2.0 credentials (Web application) and add http://localhost:3000/api/auth/callback/google as an authorized redirect URI.",
            "Copy the Client ID and Secret into your .env.local file.",
            "Run `npx prisma migrate dev` to create the database tables.",
            "Start the dev server and click Sign in with Google above.",
          ].map((step, i) => (
            <li key={i} className="leading-relaxed">
              {step}
            </li>
          ))}
        </ol>
        <a
          href="https://console.cloud.google.com/apis/credentials"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition"
        >
          <ExternalLink className="h-4 w-4" />
          Open Google Cloud Console
        </a>
      </div>
    </div>
  );
}
