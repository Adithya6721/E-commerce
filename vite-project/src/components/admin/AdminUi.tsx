import type { ReactNode } from "react";
import axios from "axios";
import { motion } from "framer-motion";

export type ToastTone = "success" | "error";

export interface ApiStatus {
  label: string;
  endpoint: string;
  ok: boolean;
  detail: string;
}

export function formatMoney(value: number | undefined) {
  return `Rs ${Math.round(value ?? 0).toLocaleString()}`;
}

export function formatApiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const endpoint = error.config?.url ?? "request";
    const status = error.response?.status;
    const message =
      typeof error.response?.data === "string"
        ? error.response.data
        : error.message;
    return `${endpoint}${status ? ` (${status})` : ""}: ${message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" } as any}
      className="rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur-[16px]"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-amber-600">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
        </div>
        {action}
      </div>
    </motion.section>
  );
}

export function AdminPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" } as any}
      className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur-[16px]"
    >
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-5">{children}</div>
    </motion.section>
  );
}

export function AdminStatCard({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string | number;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 } as any}
      className="rounded-[1.75rem] border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur-[16px]"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{title}</p>
        <motion.div
          whileHover={{ rotate: 10, scale: 1.1 }}
          className="rounded-2xl bg-white/80 border border-slate-100 p-3 text-slate-700 shadow-sm"
        >
          {icon}
        </motion.div>
      </div>
      <p className="mt-6 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </motion.div>
  );
}

export function AdminMiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function AdminField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white"
      />
    </label>
  );
}

export function AdminFieldArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <textarea
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white"
      />
    </label>
  );
}

export function AdminToast({
  toast,
}: {
  toast: { message: string; tone: ToastTone } | null;
}) {
  if (!toast) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl px-4 py-3 text-sm font-medium ${
        toast.tone === "success"
          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border border-rose-200 bg-rose-50 text-rose-700"
      }`}
    >
      {toast.message}
    </div>
  );
}

export function StatusList({ statuses }: { statuses: ApiStatus[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {statuses.map((status, i) => (
        <motion.div
          key={status.label}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ y: -3, boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}
          className={`rounded-3xl border px-4 py-4 backdrop-blur-sm ${
            status.ok
              ? "border-emerald-200/60 bg-emerald-50/70"
              : "border-rose-200/60 bg-rose-50/70"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">{status.label}</p>
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                status.ok
                  ? "bg-emerald-100/80 text-emerald-700"
                  : "bg-rose-100/80 text-rose-700"
              }`}
            >
              {status.ok ? "Connected" : "Failed"}
            </span>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">{status.endpoint}</p>
          <p className="mt-3 text-sm text-slate-600">{status.detail}</p>
        </motion.div>
      ))}
    </div>
  );
}
