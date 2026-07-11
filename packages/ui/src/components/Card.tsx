import React from 'react';
import { colors, radii, shadows } from '../tokens';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
  tone?: 'light' | 'mirage';
}

const paddingMap = { sm: '12px', md: '20px', lg: '28px' };

const toneStyles: Record<NonNullable<CardProps['tone']>, React.CSSProperties> = {
  light: {
    background: colors.warmWhite,
    border: `1px solid ${colors.sand[200]}`,
    boxShadow: shadows.md,
    color: colors.gray[900],
  },
  mirage: {
    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
    color: '#f4f1ea',
    backdropFilter: 'blur(16px)',
  },
};

export function Card({
  children,
  className,
  style,
  padding = 'md',
  hover,
  onClick,
  tone = 'light',
}: CardProps) {
  const base = toneStyles[tone];

  return (
    <div
      className={className}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      style={{
        borderRadius: radii['2xl'],
        padding: paddingMap[padding],
        transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease, border-color 0.2s',
        cursor: onClick ? 'pointer' : 'default',
        ...base,
        ...style,
      }}
      onMouseEnter={
        hover || onClick
          ? (e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                tone === 'mirage'
                  ? '0 20px 50px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(212, 168, 83, 0.2)'
                  : shadows.lg;
            }
          : undefined
      }
      onMouseLeave={
        hover || onClick
          ? (e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = base.boxShadow as string;
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
