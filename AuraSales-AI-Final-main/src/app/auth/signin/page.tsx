import { Navigation } from "@/components/navigation/Navigation";
import { SignInForm } from "@/components/auth/SignInForm";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <Navigation />
      <div className="flex items-center justify-center px-4 py-24">
        <SignInForm />
      </div>
    </main>
  );
}
