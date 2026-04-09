export default function AuthLoading() {
  return (
    <main className="min-h-screen bg-slate-950">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-24">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl space-y-6">
          <div className="h-10 w-40 rounded-xl bg-slate-800 animate-pulse" />
          <div className="h-5 w-full rounded-xl bg-slate-800 animate-pulse" />
          <div className="space-y-4">
            <div className="h-12 w-full rounded-xl bg-slate-800 animate-pulse" />
            <div className="h-12 w-full rounded-xl bg-slate-800 animate-pulse" />
            <div className="h-12 w-full rounded-xl bg-slate-800 animate-pulse" />
          </div>
          <div className="h-12 w-full rounded-xl bg-slate-800 animate-pulse" />
        </div>
      </div>
    </main>
  );
}
