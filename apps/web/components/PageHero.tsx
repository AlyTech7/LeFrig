import { AppIcon, type AppIconName } from '@/components/AppIcon';
import type { ReactNode } from 'react';

type Props = {
  icon: AppIconName;
  title: string;
  subtitle?: string;
  badge?: string;
  action?: ReactNode;
  maxWidth?: number;
};

export function PageHero({ icon, title, subtitle, badge, action, maxWidth = 1100 }: Props) {
  return (
    <section className="lf-page-hero">
      <div className="lf-page-hero-inner sv-glass--glow" style={{ maxWidth }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div className="lf-page-icon">
            <AppIcon name={icon} size={28} color="var(--sv-dune)" />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            {badge ? (
              <span className="sv-kicker" style={{ marginBottom: 6 }}>
                <span className="sv-live" />
                {badge}
              </span>
            ) : null}
            <h1 className="lf-page-title" style={{ margin: badge ? '4px 0 0' : 0 }}>
              {title}
            </h1>
            {subtitle ? (
              <p className="lf-page-sub" style={{ margin: '6px 0 0' }}>
                {subtitle}
              </p>
            ) : null}
          </div>
          {action}
        </div>
      </div>
    </section>
  );
}

export function PageBody({ children, maxWidth = 1100 }: { children: ReactNode; maxWidth?: number }) {
  return (
    <div className="lf-page-body" style={{ maxWidth }}>
      {children}
    </div>
  );
}
