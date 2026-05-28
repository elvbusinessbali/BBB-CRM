import { BottomNav } from '@/components/BottomNav';
import { SetupNeeded } from '@/components/SetupNeeded';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return <SetupNeeded />;
  }
  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-md mx-auto">{children}</div>
      <BottomNav />
    </div>
  );
}
