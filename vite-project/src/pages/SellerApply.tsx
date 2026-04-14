import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  applyToBecomeSeller,
  getMySellerProfile,
  type SellerProfile,
} from "../services/sellerService";

const statusConfig = {
  PENDING: {
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: "⏳",
    label: "Application Pending",
    desc: "Your application is in the queue. Admin will review it soon.",
  },
  UNDER_REVIEW: {
    color: "bg-sky-100 text-sky-800 border-sky-200",
    icon: "🔍",
    label: "Under Review",
    desc: "Admin is currently reviewing your application.",
  },
  VERIFIED: {
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: "✅",
    label: "Verified Seller",
    desc: "Congratulations! You are now a verified seller. Please log out and log back in to access your seller dashboard.",
  },
  REJECTED: {
    color: "bg-rose-100 text-rose-800 border-rose-200",
    icon: "❌",
    label: "Application Rejected",
    desc: "Your application was rejected. You can reapply after 7 days.",
  },
};

export default function SellerApply() {
  const { username, role } = useAuth();
  const navigate = useNavigate();

  const [existingProfile, setExistingProfile] = useState<SellerProfile | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    businessName: "",
    gstNumber: "",
    bankAccountNumber: "",
    bankIfsc: "",
    phoneNumber: "",
  });

  // If already a verified seller, redirect
  useEffect(() => {
    if (role === "SELLER") {
      navigate("/");
      return;
    }

    if (!username) return;

    let cancelled = false;

    const checkProfile = async () => {
      setIsCheckingProfile(true);
      try {
        const profile = await getMySellerProfile();
        if (!cancelled) {
          setExistingProfile(profile);
        }
      } catch {
        // 404 = no profile yet — that's fine
        if (!cancelled) {
          setExistingProfile(null);
        }
      } finally {
        if (!cancelled) {
          setIsCheckingProfile(false);
        }
      }
    };

    void checkProfile();
    return () => {
      cancelled = true;
    };
  }, [username, role, navigate]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.businessName || !form.gstNumber || !form.bankAccountNumber || !form.bankIfsc || !form.phoneNumber) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const profile = await applyToBecomeSeller(form);
      setExistingProfile(profile);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Application failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-slate-500">
          Checking your seller status...
        </main>
      </div>
    );
  }

  // Show application status if already applied
  if (existingProfile && !success) {
    const cfg = statusConfig[existingProfile.verificationStatus];
    const canReapply =
      existingProfile.verificationStatus === "REJECTED" &&
      existingProfile.reviewedAt &&
      new Date(existingProfile.reviewedAt).getTime() + 7 * 24 * 60 * 60 * 1000 < Date.now();

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
          <div className="rounded-3xl bg-white p-8 shadow-xl">
            <h1 className="text-2xl font-bold text-slate-900">Seller Application</h1>

            <div className={`mt-6 rounded-2xl border px-5 py-5 ${cfg.color}`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{cfg.icon}</span>
                <div>
                  <p className="font-semibold">{cfg.label}</p>
                  <p className="mt-1 text-sm opacity-80">{cfg.desc}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 rounded-2xl bg-slate-50 p-5 text-sm text-slate-700">
              <Row label="Business Name" value={existingProfile.businessName} />
              <Row label="GST Number" value={existingProfile.gstNumber} />
              <Row label="Phone" value={existingProfile.phoneNumber} />
              <Row label="Bank IFSC" value={existingProfile.bankIfsc} />
              {existingProfile.appliedAt && (
                <Row label="Applied On" value={new Date(existingProfile.appliedAt).toLocaleDateString()} />
              )}
              {existingProfile.rejectionReason && (
                <Row label="Rejection Reason" value={existingProfile.rejectionReason} />
              )}
            </div>

            {canReapply && (
              <button
                onClick={() => setExistingProfile(null)}
                className="mt-6 w-full rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Reapply Now
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="rounded-3xl bg-white shadow-xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-7">
            <h1 className="text-2xl font-bold text-white">Apply to Become a Seller 🏪</h1>
            <p className="mt-1 text-sm text-indigo-200">
              Fill in your business details. Our admin team will review and verify your application.
            </p>
          </div>

          <div className="px-8 py-7 space-y-5">
            {success && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
                <p className="font-semibold">✅ Application submitted successfully!</p>
                <p className="mt-1">Admin will review your application shortly. Check back here for updates.</p>
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <FormField
              label="Business Name"
              placeholder="e.g. Adithya Electronics"
              value={form.businessName}
              onChange={(v) => updateField("businessName", v)}
            />
            <FormField
              label="GST Number"
              placeholder="e.g. 22AAAAA0000A1Z5"
              value={form.gstNumber}
              onChange={(v) => updateField("gstNumber", v)}
            />
            <FormField
              label="Phone Number"
              placeholder="e.g. 9876543210"
              value={form.phoneNumber}
              onChange={(v) => updateField("phoneNumber", v)}
            />
            <FormField
              label="Bank Account Number"
              placeholder="Your bank account number"
              value={form.bankAccountNumber}
              onChange={(v) => updateField("bankAccountNumber", v)}
            />
            <FormField
              label="Bank IFSC Code"
              placeholder="e.g. SBIN0001234"
              value={form.bankIfsc}
              onChange={(v) => updateField("bankIfsc", v)}
            />

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
              ⚠️ Your bank details are encrypted and only used for payment settlement. Admin cannot use them.
            </div>

            {!success && (
              <button
                onClick={() => void handleSubmit()}
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-4 text-sm font-semibold text-white transition hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting Application..." : "Submit Seller Application"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function FormField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
