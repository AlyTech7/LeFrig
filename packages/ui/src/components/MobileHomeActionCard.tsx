import React from 'react';
import { colors } from '../tokens';

export interface MobileHomeActionCardProps {
  icon: string;
  label: string;
  sublabel?: string;
  color: string;
  onClick?: () => void;
}

export function MobileHomeActionCard({ icon, label, sublabel, color, onClick }: MobileHomeActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '20px',
        borderRadius: '20px',
        border: 'none',
        background: `linear-gradient(145deg, ${color} 0%, ${color}dd 100%)`,
        color: colors.warmWhite,
        minHeight: '120px',
        cursor: 'pointer',
        textAlign: 'left',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        transition: 'transform 0.2s ease',
        width: '100%',
      }}
    >
      <span style={{ fontSize: '2.5rem' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '2px' }}>{label}</div>
        {sublabel && <div style={{ fontSize: '0.8125rem', opacity: 0.85 }}>{sublabel}</div>}
      </div>
    </button>
  );
}
