"use client";

import { useState } from "react";
import {
  Settings,
  Link2,
  Bell,
  Download,
  Shield,
  ExternalLink,
} from "lucide-react";

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [deadlineReminders, setDeadlineReminders] = useState(true);
  const [savingsAlerts, setSavingsAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  function Toggle({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: (val: boolean) => void;
  }) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
          checked ? "bg-[#DC5700]" : "bg-[#35343A]"
        }`}
      >
        <span
          className={`pointer-events-none inline-block w-5 h-5 transform rounded-full bg-[#E4E1E9] shadow transition-transform mt-0.5 ml-0.5 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-2xl">
      {/* ── Editorial Header ── */}
      <div>
        <p className="text-xs font-medium text-[#4CD6FB] uppercase tracking-[0.2em] mb-2">
          ARCHITECT SETTINGS
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight text-[#E4E1E9]">
          System Configuration
        </h1>
        <p className="text-[#C7C5D3] mt-2 text-sm">
          Manage your account preferences and integrations.
        </p>
      </div>

      {/* ── Connected Accounts ── */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-[#E4E1E9] flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#4CD6FB]/10 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-[#4CD6FB]" />
          </div>
          Connected Accounts
        </h2>
        <div className="space-y-3">
          {[
            {
              name: "QuickBooks",
              description: "Sync business income and expenses",
              connected: false,
            },
            {
              name: "Bank Account",
              description: "Import transactions for categorization",
              connected: false,
            },
            {
              name: "Payroll Provider",
              description: "Sync W-2 and payroll data",
              connected: false,
            },
          ].map((account) => (
            <div
              key={account.name}
              className="flex items-center justify-between rounded-xl bg-[#1B1B20] p-4"
            >
              <div>
                <p className="text-sm font-bold text-[#E4E1E9]">{account.name}</p>
                <p className="text-xs text-[#C7C5D3]">{account.description}</p>
              </div>
              {account.connected ? (
                <span className="text-xs font-medium bg-[#FFB596]/10 text-[#FFB596] px-2.5 py-1 rounded-full">
                  Connected
                </span>
              ) : (
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-[#FFB596]/30 text-[#FFB596] hover:bg-[#FFB596]/10 transition-colors">
                  Connect
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Notification Preferences ── */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-[#E4E1E9] flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#BFC2FF]/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-[#BFC2FF]" />
          </div>
          Notification Preferences
        </h2>
        <div className="space-y-3">
          {[
            {
              label: "Email Notifications",
              description: "Receive important updates via email",
              checked: emailNotifications,
              onChange: setEmailNotifications,
            },
            {
              label: "Tax Deadline Reminders",
              description: "Get reminded before key tax dates",
              checked: deadlineReminders,
              onChange: setDeadlineReminders,
            },
            {
              label: "Savings Opportunity Alerts",
              description: "Notified when new savings are identified",
              checked: savingsAlerts,
              onChange: setSavingsAlerts,
            },
            {
              label: "Weekly Tax Digest",
              description: "Weekly summary of your tax planning status",
              checked: weeklyDigest,
              onChange: setWeeklyDigest,
            },
          ].map((pref) => (
            <div
              key={pref.label}
              className="flex items-center justify-between rounded-xl bg-[#1B1B20] p-4"
            >
              <div>
                <p className="text-sm font-bold text-[#E4E1E9]">{pref.label}</p>
                <p className="text-xs text-[#C7C5D3]">{pref.description}</p>
              </div>
              <Toggle checked={pref.checked} onChange={pref.onChange} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Data Export ── */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-[#E4E1E9] flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#FFB596]/10 flex items-center justify-center">
            <Download className="w-4 h-4 text-[#FFB596]" />
          </div>
          Data Export
        </h2>
        <p className="text-sm text-[#C7C5D3]">
          Download your tax planning data, review reports, and conversation history.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-[#4CD6FB]/30 text-[#4CD6FB] hover:bg-[#4CD6FB]/10 transition-colors">
            <Download className="w-4 h-4" />
            Export Tax Data (CSV)
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-[#4CD6FB]/30 text-[#4CD6FB] hover:bg-[#4CD6FB]/10 transition-colors">
            <Download className="w-4 h-4" />
            Export Review Reports (PDF)
          </button>
        </div>
      </div>

      {/* ── Security ── */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-[#E4E1E9] flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#BFC2FF]/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#BFC2FF]" />
          </div>
          Security
        </h2>
        <p className="text-sm text-[#C7C5D3]">
          Your data is encrypted at rest and in transit. Authentication is managed
          through Clerk with enterprise-grade security.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium bg-[#FFB596]/10 text-[#FFB596] px-2.5 py-1 rounded-full">
            Encrypted
          </span>
          <span className="text-xs font-medium bg-[#FFB596]/10 text-[#FFB596] px-2.5 py-1 rounded-full">
            SOC 2 Compliant
          </span>
          <span className="text-xs font-medium bg-[#FFB596]/10 text-[#FFB596] px-2.5 py-1 rounded-full">
            256-bit SSL
          </span>
        </div>
      </div>
    </div>
  );
}
