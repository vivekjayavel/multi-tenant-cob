export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      <div className="aspect-square bg-stone-100 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-stone-100 rounded-lg animate-pulse w-3/4" />
        <div className="h-3 bg-stone-100 rounded-lg animate-pulse w-full" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-6 bg-stone-100 rounded-lg animate-pulse w-20" />
          <div className="h-8 bg-stone-100 rounded-xl animate-pulse w-16" />
        </div>
      </div>
    </div>
  );
}
