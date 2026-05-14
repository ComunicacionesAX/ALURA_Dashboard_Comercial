export default function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-pulse">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        {[120, 100, 140, 100].map((w, i) => (
          <div key={i} className="h-9 bg-[#DBE2EB] rounded-[6px]" style={{ width: w }} />
        ))}
      </div>

      {/* KPIs */}
      <div>
        <div className="h-5 w-40 bg-[#DBE2EB] rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-[8px] border border-[#DBE2EB] p-4 h-[90px]">
              <div className="h-3 w-20 bg-[#DBE2EB] rounded mb-3" />
              <div className="h-7 w-24 bg-[#DBE2EB] rounded mb-2" />
              <div className="h-2 w-16 bg-[#EFF2F6] rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Chart + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[8px] border border-[#DBE2EB] p-4 h-[360px]">
          <div className="h-4 w-48 bg-[#DBE2EB] rounded mb-4" />
          <div className="h-[280px] bg-[#EFF2F6] rounded-[6px]" />
        </div>
        <div className="bg-white rounded-[8px] border border-[#DBE2EB] p-4 h-[360px]">
          <div className="h-4 w-32 bg-[#DBE2EB] rounded mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-[#EFF2F6] rounded-[6px] mb-2" />
          ))}
        </div>
      </div>

      {/* Productos + Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[0, 1].map((col) => (
          <div key={col} className="bg-white rounded-[8px] border border-[#DBE2EB] p-4">
            <div className="h-4 w-40 bg-[#DBE2EB] rounded mb-4" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-[#EFF2F6] rounded-[6px] mb-2" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
