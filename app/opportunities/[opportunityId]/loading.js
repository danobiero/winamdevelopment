export default function Loading() {
  return (
    <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 xl:py-4 flex-1 flex flex-col justify-between lg:h-full lg:max-h-full lg:overflow-hidden min-h-0 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="w-full flex items-center justify-between gap-3 pb-2.5 sm:pb-3 border-b border-slate-200/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-28 bg-slate-200 rounded-xl" />
          <div className="h-6 w-48 bg-slate-200 rounded-lg hidden sm:block" />
        </div>
        <div className="h-6 w-20 bg-slate-200 rounded-full" />
      </div>

      {/* Main Grid Skeleton */}
      <div className="w-full flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3.5 xl:gap-5 py-2.5 sm:py-3 lg:overflow-hidden">
        {/* Left Col */}
        <div className="lg:col-span-5 flex flex-col min-h-0 gap-3 xl:gap-3.5 justify-between">
          <div className="w-full flex-1 min-h-[220px] sm:min-h-[280px] lg:min-h-0 rounded-2xl xl:rounded-3xl bg-slate-200" />
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5 shrink-0">
            <div className="h-16 bg-slate-200 rounded-xl" />
            <div className="h-16 bg-slate-200 rounded-xl" />
            <div className="h-16 bg-slate-200 rounded-xl" />
            <div className="h-16 bg-slate-200 rounded-xl" />
          </div>
        </div>

        {/* Right Col */}
        <div className="lg:col-span-7 flex flex-col min-h-0 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-6 xl:p-7 justify-between gap-4">
          <div className="space-y-4">
            <div className="h-5 w-24 bg-slate-100 rounded" />
            <div className="h-8 w-3/4 bg-slate-200 rounded-xl" />
            <div className="space-y-2 pt-2">
              <div className="h-4 bg-slate-100 rounded w-full" />
              <div className="h-4 bg-slate-100 rounded w-5/6" />
              <div className="h-4 bg-slate-100 rounded w-4/6" />
            </div>
            <div className="h-28 bg-slate-100 rounded-2xl w-full" />
          </div>

          <div className="h-20 bg-slate-100 rounded-2xl w-full shrink-0" />
        </div>
      </div>
    </div>
  );
}
