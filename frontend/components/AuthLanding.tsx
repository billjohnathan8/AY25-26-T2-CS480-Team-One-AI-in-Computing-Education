import { FormEvent, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import type { AuthResponse, LoginPayload, SignupPayload } from "../lib/api";
import { login, signup } from "../lib/api";

type AuthLandingProps = {
  onAuthSuccess: (auth: AuthResponse, identity: { email: string; name?: string | null }) => void;
};

type AuthMode = "login" | "signup";

export function AuthLanding({ onAuthSuccess }: AuthLandingProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
  });

  const signupMutation = useMutation({
    mutationFn: (payload: SignupPayload) => signup(payload),
  });

  const isSubmitting = loginMutation.isPending || signupMutation.isPending;
  const activeError = mode === "login" ? loginMutation.error : signupMutation.error;
  const error =
    activeError instanceof Error
      ? activeError
      : activeError
        ? new Error("Authentication failed. Please verify your credentials.")
        : null;

  const title = useMemo(() => (mode === "login" ? "Welcome back" : "Create your account"), [mode]);
  const subtitle = useMemo(
    () =>
      mode === "login"
        ? "Sign in to access your course analytics workspace."
        : "Start tracking AI usage by creating your instructor account.",
    [mode],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = form.email.trim();
    const trimmedName = form.name.trim();
    if (mode === "login") {
      loginMutation.mutate(
        { email: trimmedEmail, password: form.password },
        {
          onSuccess: (auth) => onAuthSuccess(auth, { email: trimmedEmail }),
        },
      );
      return;
    }
    signupMutation.mutate(
      { email: trimmedEmail, password: form.password, name: trimmedName || undefined },
      {
        onSuccess: (auth) => onAuthSuccess(auth, { email: trimmedEmail, name: trimmedName || undefined }),
      },
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <div className="flex-1 bg-gray-900 text-white px-8 py-16 flex items-center">
        <div className="max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-sm uppercase tracking-wide">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Realtime AI Monitoring
          </div>
          <h1 className="text-4xl font-semibold leading-tight">
            AI Detection Analytics <span className="block text-emerald-300">for modern classrooms.</span>
          </h1>
          <p className="text-lg text-white/70">
            Track submissions, spot AI-assisted work, and keep your teaching teams aligned with a centralized dashboard.
          </p>
          <ul className="space-y-3 text-white/80">
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
              Securely onboard instructors with role-aware access.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
              Review course catalogs before entering detailed analytics.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
              Import registrar, LMS, and AI pipeline data with one click.
            </li>
          </ul>
        </div>
      </div>

      <div className="w-full lg:w-[420px] bg-white shadow-xl">
        <div className="px-10 py-12">
          <div className="mb-10 space-y-2">
            <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">Course Integrity Portal</p>
            <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
            <p className="text-gray-600">{subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <div>
                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Dr. Ada Lovelace"
                  required
                  disabled={isSubmitting}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="you@university.edu"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="••••••••"
                required
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error.message ?? "Authentication failed. Please try again."}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-gray-900 px-4 py-3 text-white font-semibold hover:bg-black focus:outline-none focus:ring-4 focus:ring-gray-200 disabled:opacity-70"
            >
              {isSubmitting ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {mode === "login" ? "New to the platform?" : "Already a member?"}
            </span>
            <button
              type="button"
              className="font-semibold text-blue-600 hover:text-blue-500"
              onClick={() => setMode((prev) => (prev === "login" ? "signup" : "login"))}
            >
              {mode === "login" ? "Create an account" : "Sign in instead"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
