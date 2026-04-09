export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="space-y-3">
          <div className="h-10 w-72 rounded-xl bg-slate-800 animate-pulse" />
          <div className="h-5 w-[28rem] max-w-full rounded-xl bg-slate-800 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-32 rounded-xl bg-slate-800 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-2xl bg-slate-800 animate-pulse" />
          <div className="h-80 rounded-2xl bg-slate-800 animate-pulse" />
        </div>
      </div>
    </main>
  );
}
