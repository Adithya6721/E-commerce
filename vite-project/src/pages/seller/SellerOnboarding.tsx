import { useState } from "react";
import { applyToBecomeSeller, type SellerProfile } from "../../services/sellerService";
import { Store, Building2, Landmark, CheckCircle2, AlertCircle } from "lucide-react";

interface SellerOnboardingProps {
  onSuccess: (profile: SellerProfile) => void;
  status?: SellerProfile["verificationStatus"];
}

export default function SellerOnboarding({ onSuccess, status }: SellerOnboardingProps) {
  const [form, setForm] = useState({
    businessName: "",
    gstNumber: "",
    bankAccountNumber: "",
    bankIfsc: "",
    phoneNumber: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (status === "PENDING" || status === "UNDER_REVIEW") {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 bg-slate-50 min-h-screen">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 mb-6 border-4 border-white shadow-xl">
            <CheckCircle2 className="h-10 w-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Application Under Review</h2>
          <p className="text-slate-500 leading-relaxed">
            Your seller application has been submitted and is currently being verified by our team. 
            This process usually takes 24-48 hours. We'll notify you once you're approved to start selling!
          </p>
        </div>
      </div>
    );
  }

  if (status === "REJECTED") {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 bg-slate-50 min-h-screen">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 mb-6 border-4 border-white shadow-xl">
            <AlertCircle className="h-10 w-10 text-rose-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Application Rejected</h2>
          <p className="text-slate-500 leading-relaxed">
            Unfortunately, your seller profile verification was rejected. Please contact support to resolve this issue and update your documents.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName || !form.gstNumber || !form.bankAccountNumber || !form.bankIfsc || !form.phoneNumber) {
      setError("Please fill out all fields.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const profile = await applyToBecomeSeller(form);
      onSuccess(profile);
    } catch (err: any) {
      setError(err?.response?.data || "Failed to submit application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 p-6 md:p-12">
      <div className="mx-auto w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 text-white">
          <h1 className="text-2xl font-bold mb-2">Complete Your Seller Profile</h1>
          <p className="text-indigo-100">Unlock your dashboard by verifying your business details with our admin team.</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Store className="h-5 w-5 text-indigo-600" /> Basic Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Business/Store Name</label>
                  <input
                    required
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Business Mobile Number</label>
                  <input
                    required
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-600" /> Tax Information
              </h3>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">GSTIN Number</label>
                <input
                  required
                  value={form.gstNumber}
                  onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                  placeholder="22AAAAA0000A1Z5"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition uppercase focus:border-indigo-400 focus:bg-white"
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Landmark className="h-5 w-5 text-indigo-600" /> Bank Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Account Number</label>
                  <input
                    required
                    value={form.bankAccountNumber}
                    onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    required
                    value={form.bankIfsc}
                    onChange={(e) => setForm({ ...form, bankIfsc: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition uppercase focus:border-indigo-400 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-8 w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:bg-indigo-300"
            >
              {isSubmitting ? "Submitting Application..." : "Submit for Verification"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
