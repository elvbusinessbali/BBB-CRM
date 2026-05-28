'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/lib/i18n/LanguageProvider';

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useT();

  const items = [
    { href: '/dashboard', label: t('home'), icon: HomeIcon },
    { href: '/customers', label: t('customers'), icon: PeopleIcon },
    { href: '/customers/new', label: t('add'), icon: PlusIcon, primary: true },
    { href: '/ads', label: t('ads'), icon: AdsIcon },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-neutral-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-md mx-auto grid grid-cols-4">
        {items.map((it) => {
          const active = pathname === it.href || (it.href !== '/dashboard' && pathname.startsWith(it.href));
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className="flex flex-col items-center justify-center py-3 gap-1"
            >
              <span
                className={`flex items-center justify-center rounded-full transition-colors ${
                  it.primary
                    ? 'bg-brand text-white h-10 w-10'
                    : active
                    ? 'text-neutral-900'
                    : 'text-neutral-400'
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className={`text-[11px] ${active && !it.primary ? 'text-neutral-900 font-medium' : 'text-neutral-500'}`}>
                {it.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
function PeopleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M16 14c3 0 5.5 2 5.5 5" />
    </svg>
  );
}
function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function AdsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 11l13-5v12L3 13z" />
      <path d="M16 9v6" />
      <path d="M19 10v4" />
    </svg>
  );
}
