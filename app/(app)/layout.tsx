import { TopNav } from "@/components/layout/top-nav";
import { BottomTabs } from "@/components/layout/bottom-tabs";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col min-h-screen bg-background overflow-x-hidden">
      {/* Dynamic Background Sync */}
      <div className="fixed inset-0 -z-10 bg-grid-refined [mask-image:radial-gradient(ellipse_at_center,black,transparent)] opacity-[0.03] dark:opacity-[0.05]" />
      <div className="absolute inset-0 -z-20 overflow-hidden pointer-events-none min-h-full">
        {/* Ambient Glows */}
        <div className="absolute top-[15%] left-[5%] size-[500px] rounded-full bg-indigo-500/10 blur-[130px] animate-blob" />
        <div className="absolute bottom-[25%] right-[5%] size-[600px] rounded-full bg-rose-500/8 blur-[150px] animate-blob [animation-delay:4s]" />
        
        {/* Brand blobs */}
        <div className="absolute top-[-10%] right-[-5%] size-[600px] rounded-full bg-brand/5 blur-[100px] animate-blob [animation-delay:2s]" />
        <div className="absolute bottom-[-5%] left-[-5%] size-[500px] rounded-full bg-primary/5 blur-[120px] animate-blob [animation-delay:6s]" />
      </div>

      <TopNav />
      <main className="flex-1 pb-24 md:pb-32 relative z-0">{children}</main>
      <BottomTabs />
    </div>
  );
}

