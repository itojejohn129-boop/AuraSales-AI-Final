export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-24">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="h-16 w-56 rounded-2xl bg-slate-800/80 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="h-20 w-full max-w-2xl rounded-2xl bg-slate-800/80 animate-pulse" />
            <div className="h-8 w-full max-w-xl rounded-2xl bg-slate-800/80 animate-pulse" />
            <div className="flex gap-4 pt-4">
              <div className="h-12 w-44 rounded-xl bg-slate-800/80 animate-pulse" />
              <div className="h-12 w-44 rounded-xl bg-slate-800/80 animate-pulse" />
            </div>
          </div>
          <div className="h-[28rem] rounded-3xl border border-slate-800 bg-slate-900/60 animate-pulse" />
        </div>
      </div>
    </main>
  );
}
