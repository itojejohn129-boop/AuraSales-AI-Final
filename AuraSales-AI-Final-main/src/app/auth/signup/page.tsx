import { Navigation } from "@/components/navigation/Navigation";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <Navigation />
      <div className="flex items-center justify-center px-4 py-24">
        <SignUpForm />
      </div>
    </main>
  );
}
