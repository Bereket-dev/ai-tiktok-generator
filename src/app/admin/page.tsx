"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Ban, Eye, Clock, Loader2, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerationRequest {
  id: string;
  session_id: string;
  selfie_url: string;
  result_url: string | null;
  style: string | null;
  status: string;
  unlocked: boolean;
  admin_note: string | null;
  created_at: string;
  banned?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-stone-700 text-stone-200",
  processing: "bg-blue-900 text-blue-200",
  ready: "bg-yellow-900 text-yellow-200",
  unlock_requested: "bg-orange-900 text-orange-200",
  approved: "bg-green-900 text-green-200",
  rejected: "bg-red-900 text-red-200",
  failed: "bg-red-950 text-red-300",
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [activeToken, setActiveToken] = useState("");
  const [filter, setFilter] = useState("unlock_requested");
  const [preview, setPreview] = useState<GenerationRequest | null>(null);
  const [note, setNote] = useState("");
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-requests", filter, activeToken],
    queryFn: async () => {
      const url = `/api/admin/requests?status=${filter}&token=${encodeURIComponent(activeToken)}`;
      const res = await fetch(url);
      if (res.status === 401) {
        setAuthed(false);
        throw new Error("Unauthorized");
      }
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ requests: GenerationRequest[] }>;
    },
    enabled: authed,
    refetchInterval: 5000,
  });

  const action = useMutation({
    mutationFn: async ({
      id,
      act,
      sessionId,
    }: {
      id: string;
      act: "approve" | "reject" | "ban";
      sessionId?: string;
    }) => {
      const res = await fetch(
        `/api/admin/requests/${id}/action?token=${encodeURIComponent(activeToken)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: act, note, session_id: sessionId }),
        }
      );
      if (!res.ok) throw new Error("Action failed");
      return res.json();
    },
    onSuccess: () => {
      setPreview(null);
      setNote("");
      qc.invalidateQueries({ queryKey: ["admin-requests"] });
    },
  });

  if (!authed) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center px-6">
        <div className="w-full max-w-xs flex flex-col gap-4">
          <h1 className="text-white font-black text-2xl text-center">Admin</h1>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Admin secret"
            className="bg-stone-800 text-white border border-stone-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500"
            onKeyDown={(e) => {
              if (e.key === "Enter" && token) {
                setActiveToken(token);
                setAuthed(true);
              }
            }}
          />
          <button
            onClick={() => {
              if (token) {
                setActiveToken(token);
                setAuthed(true);
              }
            }}
            className="bg-orange-600 text-white font-bold py-3 rounded-xl"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  const requests = data?.requests ?? [];

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      <div className="bg-stone-900 border-b border-stone-800 px-4 py-3 flex items-center justify-between">
        <h1 className="font-black text-lg">Who&apos;s using</h1>
        <button onClick={() => refetch()} className="text-stone-400 hover:text-white text-sm">
          ↻ Refresh
        </button>
      </div>

      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-stone-800">
        {["unlock_requested", "ready", "approved", "rejected", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f === "all" ? "" : f)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors",
              filter === f || (f === "all" && filter === "")
                ? "bg-orange-600 text-white"
                : "bg-stone-800 text-stone-400 hover:text-white"
            )}
          >
            {f === "unlock_requested"
              ? "🔔 Waiting"
              : f === "ready"
                ? "⏳ Ready"
                : f === "approved"
                  ? "✅ Allowed"
                  : f === "rejected"
                    ? "🚫 Banned"
                    : "All"}
          </button>
        ))}
      </div>

      <div className="p-4">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        )}

        {!isLoading && requests.length === 0 && (
          <div className="text-center py-12 text-stone-500">
            <p className="text-4xl mb-3">📭</p>
            <p>No one here yet</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {requests.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setPreview(r);
                setNote(r.admin_note ?? "");
              }}
              className="relative flex flex-col rounded-2xl overflow-hidden border border-stone-700 hover:border-orange-500 transition-colors bg-stone-900 text-left"
            >
              <div className="aspect-square bg-stone-800 relative">
                <img src={r.selfie_url} alt="" className="w-full h-full object-cover" />
                {r.result_url && (
                  <div className="absolute bottom-1 right-1 w-10 h-10 rounded-lg overflow-hidden border-2 border-orange-500 shadow-lg">
                    <img src={r.result_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                {r.banned && (
                  <div className="absolute top-1 left-1 bg-red-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    BANNED
                  </div>
                )}
              </div>
              <div className="p-2 flex flex-col gap-1">
                <span
                  className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full self-start",
                    STATUS_COLORS[r.status] ?? "bg-stone-700 text-stone-200"
                  )}
                >
                  {r.status}
                </span>
                <span className="text-stone-500 text-xs truncate" title={r.session_id}>
                  {r.session_id.slice(0, 16)}…
                </span>
                <span className="text-stone-500 text-xs">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {preview && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="w-full max-w-md bg-stone-900 rounded-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-2 gap-0.5 bg-stone-800">
              <div className="aspect-square bg-stone-700">
                <img src={preview.selfie_url} alt="Selfie" className="w-full h-full object-cover" />
              </div>
              <div className="aspect-square bg-stone-700 relative">
                {preview.result_url ? (
                  <img src={preview.result_url} alt="Result" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-500">
                    <Clock className="w-8 h-8" />
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "text-xs font-bold px-2 py-1 rounded-full",
                    STATUS_COLORS[preview.status]
                  )}
                >
                  {preview.status}
                </span>
                <span className="text-stone-400 text-xs">{preview.style ?? "—"}</span>
              </div>
              <p className="text-stone-500 text-xs break-all">Device: {preview.session_id}</p>

              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note (optional)"
                className="bg-stone-800 text-white border border-stone-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => action.mutate({ id: preview.id, act: "approve" })}
                  disabled={action.isPending}
                  className="flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 text-white font-bold py-3 rounded-xl disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" /> Allow
                </button>
                <button
                  onClick={() =>
                    action.mutate({
                      id: preview.id,
                      act: "ban",
                      sessionId: preview.session_id,
                    })
                  }
                  disabled={action.isPending}
                  className="flex items-center justify-center gap-2 bg-red-800 hover:bg-red-700 text-white font-bold py-3 rounded-xl disabled:opacity-50"
                >
                  <Ban className="w-5 h-5" /> Ban device
                </button>
              </div>

              <button
                onClick={() => action.mutate({ id: preview.id, act: "reject" })}
                disabled={action.isPending}
                className="flex items-center justify-center gap-2 border border-stone-600 text-stone-300 font-semibold py-2.5 rounded-xl disabled:opacity-50 text-sm"
              >
                <ShieldOff className="w-4 h-4" /> Reject this only
              </button>

              {preview.result_url && (
                <a
                  href={preview.result_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 border border-stone-600 text-stone-300 py-2 rounded-xl text-sm"
                >
                  <Eye className="w-4 h-4" /> View full image
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
