import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { colors, radii } from '../tokens';

export interface PinConfirmationModalProps {
  open: boolean;
  operationCode: string;
  title?: string;
  description?: string;
  onConfirm: (pin: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function PinConfirmationModal({
  open,
  operationCode,
  title = 'Confirmar operación',
  description = 'Introduce el PIN de 4 dígitos para confirmar',
  onConfirm,
  onCancel,
  loading,
}: PinConfirmationModalProps) {
  const [pin, setPin] = useState('');

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26,26,26,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: colors.warmWhite,
          borderRadius: radii['2xl'],
          padding: '28px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem' }}>{title}</h2>
        <p style={{ margin: '0 0 8px', color: colors.gray[500], fontSize: '0.9375rem' }}>{description}</p>
        <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: colors.deepGreen[600], fontWeight: 600 }}>
          Código: {operationCode}
        </p>
        <Input
          label="PIN"
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
          style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px' }}
        />
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <Button variant="ghost" fullWidth onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            fullWidth
            loading={loading}
            disabled={pin.length !== 4}
            onClick={() => onConfirm(pin)}
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}
