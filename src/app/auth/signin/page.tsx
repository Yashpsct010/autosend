"use client";

import { Mail, Send } from "lucide-react";

import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#080812] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/30 mb-4">
            <Send className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">AutoSend</h1>
          <p className="text-white/40 text-sm mt-1">HR Outreach Dashboard</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8">
          <h2 className="text-xl font-semibold text-white mb-2 text-center">
            Sign in to continue
          </h2>
          <p className="text-white/40 text-sm text-center mb-8">
            Connect your Google account to send emails via Gmail.
          </p>

          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            id="google-signin-btn"
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 py-3 px-5 font-semibold text-white shadow-lg shadow-violet-500/20 transition-all duration-200 hover:scale-[1.02]"
          >
            <Mail className="h-5 w-5" />
            Continue with Google
          </button>

          <p className="text-xs text-white/25 text-center mt-6 leading-relaxed">
            By signing in, you grant AutoSend permission to send emails on your behalf via the Gmail API.
          </p>
        </div>
      </div>
    </div>
  );
}
