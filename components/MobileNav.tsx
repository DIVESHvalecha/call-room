"use client";

interface MobileNavProps {
  currentTab: string;
  onSelectTab: (tab: "home" | "live" | "album" | "daily") => void;
  isLiveActive?: boolean;
}

export default function MobileNav({ currentTab, onSelectTab, isLiveActive = true }: MobileNavProps) {
  const tabs: Array<{
    id: "home" | "live" | "album" | "daily";
    label: string;
    isLive?: boolean;
    icon: React.ReactNode;
  }> = [
    {
      id: "home",
      label: "Home",
      isLive: false,
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: "live",
      label: "Live Room",
      isLive: true,
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      id: "album",
      label: "Cards",
      isLive: false,
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      id: "daily",
      label: "Trivia",
      isLive: false,
      icon: (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-[440px] mx-auto bg-[var(--surface-base)]/95 backdrop-blur-md border-t border-[var(--border-subtle)] px-2 py-1.5 shadow-xl">
      <div className="grid grid-cols-4 gap-1">
        {tabs.map((t) => {
          const active = currentTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTab(t.id)}
              className={`flex flex-col items-center justify-center py-1 rounded-md transition-colors relative ${
                active
                  ? "text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <div className="relative">
                {t.icon}
                {t.isLive && isLiveActive && (
                  <span className="absolute -top-0.5 -right-1 h-1.5 w-1.5 rounded-full bg-[var(--brand-live)] animate-pulse" />
                )}
              </div>
              <span
                className={`text-[10px] font-medium tracking-normal mt-0.5 ${
                  active
                    ? t.isLive
                      ? "text-[var(--brand-live)] font-semibold"
                      : "text-white font-semibold"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {t.label}
              </span>
              {active && (
                <span
                  className="absolute bottom-0 h-0.5 w-4 rounded-full"
                  style={{ background: t.isLive ? "var(--brand-live)" : "var(--brand-gold)" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
