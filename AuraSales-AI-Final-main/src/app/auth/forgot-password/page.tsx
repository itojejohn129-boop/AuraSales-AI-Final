import { Navigation } from "@/components/navigation/Navigation";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <Navigation />
      <div className="flex items-center justify-center px-4 py-24">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
