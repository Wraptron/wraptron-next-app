export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        {/* Splash / launch screen: icon-512 */}
        <img
          src="/icon-512.png"
          alt="Wraptron"
          width={192}
          height={192}
          className="h-48 w-48 object-contain"
        />
        <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full animate-pulse rounded-full bg-muted-foreground/30"
            style={{ width: "40%" }}
          />
        </div>
      </div>
    </div>
  );
}
