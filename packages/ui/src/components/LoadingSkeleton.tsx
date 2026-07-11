import React from 'react';
import { colors, radii } from '../tokens';

export interface LoadingSkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: React.CSSProperties;
}

export function LoadingSkeleton({
  width = '100%',
  height = '20px',
  borderRadius = radii.lg,
  style,
}: LoadingSkeletonProps) {
  return (
    <div
      className="lefrig-skeleton"
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}

export function ListingCardSkeleton() {
  return (
    <div style={{ borderRadius: radii['2xl'], overflow: 'hidden', background: colors.warmWhite, padding: '12px' }}>
      <LoadingSkeleton height="140px" borderRadius={radii.lg} />
      <div style={{ padding: '12px 4px 4px' }}>
        <LoadingSkeleton height="16px" width="80%" style={{ marginBottom: '8px' }} />
        <LoadingSkeleton height="20px" width="40%" style={{ marginBottom: '8px' }} />
        <LoadingSkeleton height="14px" width="60%" />
      </div>
    </div>
  );
}
