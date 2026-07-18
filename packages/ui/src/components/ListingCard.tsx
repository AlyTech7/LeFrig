import React from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { colors } from '../tokens';
import type { ListingSummary } from '@lefrig/shared';

export interface ListingCardProps {
  listing: ListingSummary;
  onClick?: () => void;
  locale?: 'ar' | 'es';
  tone?: 'light' | 'mirage';
}

function acceptsCash(listing: ListingSummary): boolean {
  if (!listing.paymentMethods || listing.paymentMethods.length === 0) return true;
  return listing.paymentMethods.includes('cash') || listing.paymentMethods.includes('cash_on_delivery');
}

export function ListingCard({ listing, onClick, locale = 'es', tone = 'mirage' }: ListingCardProps) {
  const dark = tone === 'mirage';
  const showCash = acceptsCash(listing);
  const showVerified = Boolean(listing.sellerVerified);

  return (
    <Card padding="sm" hover onClick={onClick} tone={tone}>
      <div
        style={{
          height: '160px',
          background: listing.imageUrl
            ? `url(${listing.imageUrl}) center/cover`
            : 'linear-gradient(135deg, #020306 0%, #0bb87a 45%, #d4a853 100%)',
          borderRadius: '16px',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-start',
          padding: '12px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {!listing.imageUrl && (
          <span
            style={{
              fontSize: '3rem',
              opacity: 0.35,
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
            }}
            aria-hidden
          >
            📦
          </span>
        )}
        {showCash ? (
          <Badge variant="gold" size="sm">
            {locale === 'ar' ? 'نقداً' : '💵 Efectivo'}
          </Badge>
        ) : null}
      </div>
      <h3
        style={{
          margin: '0 0 6px',
          fontSize: '1.05rem',
          fontWeight: 700,
          lineHeight: 1.3,
          color: dark ? '#f4f1ea' : '#1a1f26',
          letterSpacing: '-0.02em',
        }}
      >
        {listing.title}
      </h3>
      {listing.attributeLabels && listing.attributeLabels.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {listing.attributeLabels.map((chip) => (
            <span
              key={chip}
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 999,
                background: dark ? 'rgba(212, 168, 83, 0.15)' : colors.sand[200],
                color: dark ? 'rgba(212, 168, 83, 0.95)' : colors.gray[600],
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      )}
      <p
        style={{
          margin: '0 0 10px',
          fontSize: '1.25rem',
          fontWeight: 800,
          color: dark ? '#3dffa8' : '#0d9488',
          letterSpacing: '-0.02em',
        }}
      >
        {listing.price.toLocaleString()} {listing.currency}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: '0.8125rem',
            color: dark ? 'rgba(244, 241, 234, 0.55)' : colors.gray[500],
            fontWeight: 500,
          }}
        >
          {listing.sellerName}
        </span>
        {showVerified ? (
          <span style={{ fontSize: '0.75rem', color: dark ? 'rgba(212, 168, 83, 0.85)' : colors.gray[400] }}>
            ⭐ {locale === 'ar' ? 'موثّق' : 'Verificado'}
          </span>
        ) : null}
      </div>
    </Card>
  );
}
