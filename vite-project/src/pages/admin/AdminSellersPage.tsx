import { useEffect, useState } from "react";
import { Check, X, Building, Stamp } from "lucide-react";
import {
  AdminPageHeader,
  AdminPanel,
  formatApiError,
} from "@/components/admin/AdminUi";
import { getPendingSellerProfiles, verifySeller, type SellerProfile } from "@/services/sellerService";

export default function AdminSellersPage() {
  const [applications, setApplications] = useState<SellerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadApps = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getPendingSellerProfiles();
      setApplications(data);
    } catch (error) {
      setLoadError(formatApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadApps();
  }, []);

  const handleAction = async (id: string, status: "VERIFIED" | "REJECTED") => {
    try {
      setActionId(id);
      let reason;
      if (status === "REJECTED") {
        reason = prompt("Please provide a reason for rejection (optional):") || undefined;
      }
      await verifySeller(id, status, reason);
      void loadApps();
    } catch (err) {
      alert("Failed to update application status: " + formatApiError(err));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Seller Applications"
        title="Approve new store owners"
        description="Review business applications before granting users the permission to list their own products on the platform."
      />

      {loadError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          Failed to load applications: {loadError}
        </div>
      )}

      <AdminPanel title="Pending Reviews">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading pending applications...</p>
        ) : applications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center bg-white">
            <Stamp className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900">All caught up!</h3>
            <p className="text-sm text-slate-500">There are no pending seller applications at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="overflow-hidden bg-white border border-slate-200 rounded-3xl shadow-sm hover:border-indigo-200 transition-colors">
                <div className="px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl flex-shrink-0">
                      <Building className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{app.businessName}</h3>
                      <p className="text-sm font-medium text-indigo-600 mb-3">Applicant: @{app.username}</p>
                      
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        <div>
                          <span className="text-slate-400 font-semibold block text-xs uppercase tracking-wider">GST Number</span>
                          <span className="text-slate-700 font-mono">{app.gstNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block text-xs uppercase tracking-wider">Contact</span>
                          <span className="text-slate-700">{app.phoneNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block text-xs uppercase tracking-wider mt-2">Bank Account</span>
                          <span className="text-slate-700 font-mono">{app.bankAccountNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block text-xs uppercase tracking-wider mt-2">IFSC</span>
                          <span className="text-slate-700 font-mono">{app.bankIfsc}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl flex md:flex-col items-center justify-center gap-3 md:w-48 self-stretch md:self-auto border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider w-full text-center hidden md:block mb-1">Actions</p>
                    <button
                      disabled={actionId === app.id}
                      onClick={() => void handleAction(app.id, "VERIFIED")}
                      className="flex-1 md:flex-none w-full inline-flex justify-center items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      disabled={actionId === app.id}
                      onClick={() => void handleAction(app.id, "REJECTED")}
                      className="flex-1 md:flex-none w-full inline-flex justify-center items-center gap-2 rounded-xl bg-rose-100 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-200 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
