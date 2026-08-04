import { Skeleton } from "@/components/ui/skeleton";

/**
 * Placeholder matching the auth form's layout.
 *
 * Sized to the real form so the Suspense fallback does not cause a layout
 * shift when the client component hydrates in.
 */
export function AuthFormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div>
      <div className="mb-7 space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-full max-w-xs" />
      </div>

      <div className="space-y-5">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        ))}
        <Skeleton className="h-10 w-full rounded-md" />
      </div>

      <Skeleton className="mx-auto mt-6 h-4 w-48" />
    </div>
  );
}
