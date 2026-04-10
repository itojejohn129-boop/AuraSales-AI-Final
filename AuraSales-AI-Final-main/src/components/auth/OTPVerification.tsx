"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

type OTPType = "signup" | "recovery";

interface Props {
  email: string;
  type: OTPType;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function OTPVerification({ email, type, onSuccess, onCancel }: Props) {
  const [code, setCode] = useState<string[]>(new Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const router = useRouter();
  const supabase = createClient();

  const assignCompany = async (userId: string) => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem("signup:company_info") : null;
      const info = raw ? JSON.parse(raw) : null;
      if (!info?.companyName) return;

      await fetch("/api/admin/assign-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, companyName: info.companyName, monthlySalesVolume: info.monthlySalesVolume }),
      });
    } catch (err) {
      console.error("assignCompany failed", err);
    }
  };

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (idx: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    const next = [...code];
    next[idx] = value.slice(-1);
    setCode(next);
    if (value && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const verify = async () => {
    const token = code.join("");
    if (token.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token, type });
      if (error) {
        toast.error(error.message || "Invalid code");
        return;
      }

      toast.success("Verification successful");
      // After verification, attempt to attach company_id via server admin client
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const userId = user?.id;
        if (userId) await assignCompany(userId);
      } catch (e) {
        console.error("Failed to attach company after verify:", e);
      }

      if (onSuccess) return onSuccess();
      // Default: redirect to dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const resend = async () => {
    try {
      // For signup we can trigger a new signUp email flow; for recovery call resetPasswordForEmail
      if (type === "signup") {
        // Use OTP/magic-link flow to resend the verification code
        await supabase.auth.signInWithOtp({ email });
        toast.success("Verification code re-sent to your email");
      } else {
        await supabase.auth.resetPasswordForEmail(email);
        toast.success("Recovery code re-sent to your email");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to resend code");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="backdrop-blur-sm bg-slate-900/60 border border-slate-700 rounded-2xl p-8 text-center shadow-xl">
        <h3 className="text-2xl font-bold text-slate-50 mb-2">Enter verification code</h3>
        <p className="text-sm text-slate-400 mb-6">A 6-digit code was sent to <span className="font-semibold text-slate-200">{email}</span></p>

        <div className="flex justify-center gap-3 mb-6">
          {code.map((c, i) => (
            <input
              key={i}
              ref={(el) => { inputsRef.current[i] = el }}
              value={c}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              inputMode="numeric"
              maxLength={1}
              className="w-12 h-14 bg-slate-800/60 border border-slate-700 rounded-lg text-center text-xl text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow shadow-[0_0_20px_rgba(59,130,246,0.08)]"
            />
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={verify}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-slate-950 font-semibold rounded-lg"
          >
            {isLoading ? "Verifying..." : "Verify"}
          </button>
          <button
            onClick={resend}
            type="button"
            className="py-2.5 px-4 border border-slate-700 rounded-lg text-slate-200 hover:bg-slate-800/50"
          >
            Resend
          </button>
        </div>

        <div className="mt-4 text-sm text-slate-400">
          <button onClick={onCancel} className="text-blue-400 hover:text-blue-300 font-semibold">Cancel</button>
        </div>
      </div>
    </div>
  );
}
