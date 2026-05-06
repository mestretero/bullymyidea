export default function Loading() {
  return (
    <div className="pt-32 pb-24 px-6 md:px-20 max-w-7xl mx-auto">

      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-end gap-10 mb-24">
        <div className="w-48 h-48 md:w-64 md:h-64 bg-surface-container-highest animate-pulse flex-shrink-0" />
        <div className="flex-grow space-y-6 w-full">
          <div className="space-y-3">
            <div className="h-3 w-24 bg-surface-container-high animate-pulse" />
            <div className="h-16 md:h-24 w-2/3 bg-surface-container-high animate-pulse" />
            <div className="h-4 w-1/2 bg-surface-container-low animate-pulse" />
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="h-8 w-40 bg-surface-container-high animate-pulse" />
            <div className="h-8 w-40 bg-surface-container-high animate-pulse" />
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-1 mb-24">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-surface-container-low p-10 space-y-4">
            <div className="h-3 w-32 bg-surface-container-high animate-pulse" />
            <div className="h-12 w-20 bg-surface-container-high animate-pulse" />
          </div>
        ))}
      </section>

      {/* Tabs + grid skeleton */}
      <div className="space-y-8">
        <div className="flex gap-12 border-b border-white/5 pb-4">
          <div className="h-6 w-32 bg-surface-container-high animate-pulse" />
          <div className="h-6 w-32 bg-surface-container-low animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface-container-low overflow-hidden">
              <div className="aspect-video bg-surface-container-highest animate-pulse" />
              <div className="p-8 space-y-4">
                <div className="h-5 w-3/4 bg-surface-container-high animate-pulse" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-surface-container-low animate-pulse" />
                  <div className="h-3 w-5/6 bg-surface-container-low animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
