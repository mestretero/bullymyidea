// Idea detail skeleton — matches the real layout so the swap feels instant.
export default function Loading() {
  return (
    <main className="pt-32 pb-20 px-6 md:px-10 max-w-7xl mx-auto">
      {/* media */}
      <div className="w-full aspect-video md:h-[600px] mb-20 bg-surface-container-low animate-pulse" />

      {/* hero header */}
      <div className="mb-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-6 w-24 bg-surface-container-high animate-pulse" />
          <div className="w-12 h-[1px] bg-[#494847]/30" />
          <div className="h-3 w-32 bg-surface-container-high animate-pulse" />
        </div>

        {/* title — 2 lines of giant pulse */}
        <div className="space-y-4 mb-10">
          <div className="h-16 md:h-24 w-3/4 bg-surface-container-high animate-pulse" />
          <div className="h-16 md:h-24 w-1/2 bg-surface-container-high animate-pulse" />
        </div>

        {/* description */}
        <div className="space-y-3 mb-12">
          <div className="h-4 w-full bg-surface-container-low animate-pulse" />
          <div className="h-4 w-11/12 bg-surface-container-low animate-pulse" />
          <div className="h-4 w-9/12 bg-surface-container-low animate-pulse" />
        </div>

        {/* author block */}
        <div className="border-y-2 border-white/10 my-12">
          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="md:col-span-5 flex items-center gap-5 p-6">
              <div className="w-24 h-24 md:w-28 md:h-28 bg-surface-container-highest animate-pulse" />
              <div className="flex-1 space-y-3">
                <div className="h-3 w-20 bg-surface-container-high animate-pulse" />
                <div className="h-8 w-40 bg-surface-container-high animate-pulse" />
                <div className="h-3 w-32 bg-surface-container-low animate-pulse" />
              </div>
            </div>
            <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-1 divide-x md:divide-x-0 md:divide-y divide-white/10">
              <div className="p-6 space-y-2">
                <div className="h-3 w-12 bg-surface-container-low animate-pulse" />
                <div className="h-10 w-12 bg-surface-container-high animate-pulse" />
              </div>
              <div className="p-6 space-y-2">
                <div className="h-3 w-16 bg-surface-container-low animate-pulse" />
                <div className="h-10 w-12 bg-surface-container-high animate-pulse" />
              </div>
            </div>
            <div className="md:col-span-4 p-6 space-y-3">
              <div className="h-3 w-24 bg-surface-container-low animate-pulse" />
              <div className="h-3 w-full bg-surface-container-low animate-pulse" />
              <div className="h-3 w-3/4 bg-surface-container-low animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* feedback section heading */}
      <div className="mb-10">
        <div className="h-12 w-64 bg-surface-container-high animate-pulse" />
      </div>

      {/* feedback cards */}
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-[#131313] border border-[#494847]/10 p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-surface-container-highest rounded-full animate-pulse" />
              <div className="h-4 w-32 bg-surface-container-high animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[0, 1, 2].map(j => (
                <div key={j} className="space-y-2">
                  <div className="h-3 w-16 bg-surface-container-low animate-pulse" />
                  <div className="h-3 w-full bg-surface-container-low animate-pulse" />
                  <div className="h-3 w-5/6 bg-surface-container-low animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
