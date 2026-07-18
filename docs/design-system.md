# Lefrig — Design System

## Filosofía visual

Lefrig debe hacer que un usuario saharaui abra la app y diga **"wow, esto es nuestro"**. No copiamos Wallapop, Mzad ni Facebook Marketplace. Creamos identidad propia inspirada en:

- **Desierto saharaui** — arena, calidez, amanecer
- **Jaima y comunidad** — cercanía, confianza
- **Rutas entre campamentos** — movimiento, conexión
- **Comercio local** — marsas, tiendas de barrio
- **Esperanza y dignidad** — futuro tecnológico con raíces

Estilo: **premium, limpio, cálido, moderno, humano**.

## Paleta de colores

### Base desierto (Sand)
| Token | Hex | Uso |
|-------|-----|-----|
| sand-50 | `#FDF8F3` | Fondos suaves |
| sand-100 | `#FAF0E4` | Cards secundarias |
| sand-200 | `#F2E0C8` | Bordes |
| sand-500 | `#C4A574` | Acentos tierra |

### Neutros cálidos
| Token | Hex | Uso |
|-------|-----|-----|
| warmWhite | `#FFFBF7` | Fondo principal |
| softBlack | `#1A1A1A` | Texto principal |
| charcoal | `#2D2D2D` | Texto secundario |

### Verde profundo (Confianza)
| Token | Hex | Uso |
|-------|-----|-----|
| deepGreen-500 | `#1B5E4B` | Primary, CTAs |
| deepGreen-400 | `#3DA876` | Hover |
| deepGreen-50 | `#E8F5EF` | Backgrounds success |

### Rojo acento (Acción/Urgencia)
| Token | Hex | Uso |
|-------|-----|-----|
| accentRed-500 | `#C45C26` | Vender, alertas |
| accentRed-50 | `#FEF2F0` | Background error |

### Dorado/Ámbar (Premium/Highlights)
| Token | Hex | Uso |
|-------|-----|-----|
| amber-500 | `#D4A017` | Vouchers, verificado |
| amber-600 | `#B8860B` | Transporte, badges gold |

### Estados
| Token | Hex | Uso |
|-------|-----|-----|
| success | `#2D6A4F` | Confirmado, efectivo |
| warning | `#E9C46A` | Pendiente |
| error | `#C45C26` | Error, deuda |
| info | `#457B9D` | Fiado, info |

## Gradientes

```css
/* Hero landing */
.lefrig-gradient-hero {
  background: linear-gradient(135deg, #1B5E4B 0%, #164D3E 40%, #B8860B 100%);
}

/* Amanecer desierto */
.lefrig-gradient-dawn {
  background: linear-gradient(135deg, #FDF8F3 0%, #FFE099 50%, #1B5E4B 100%);
}

/* Cards */
.lefrig-gradient-desert {
  background: linear-gradient(180deg, #FAF0E4 0%, #F2E0C8 100%);
}
```

## Tipografía

```css
font-family: 'Inter', 'Noto Sans Arabic', system-ui, sans-serif;
```

- **Inter** — Latin scripts (español, francés, inglés)
- **Noto Sans Arabic** — Árabe, RTL, legible en móvil
- Tamaños mínimos body: **16px** (accesibilidad)
- Headings: semibold/bold, generoso line-height

### Escala
| Token | Size | Uso |
|-------|------|-----|
| xs | 12px | Labels, badges |
| sm | 14px | Secondary text |
| base | 16px | Body |
| lg | 18px | Subtitles |
| xl | 20px | Section titles |
| 2xl | 24px | Page titles |
| 3xl | 30px | Hero subtitle |
| 4xl | 36px | Hero title |
| 5xl | 48px | Landing hero |

## Espaciado

Base 4px. Escala: 4, 8, 12, 16, 20, 24, 32, 48, 64, 80.

**Mucho aire visual** — no saturar pantallas.

## Radios

| Token | Value | Uso |
|-------|-------|-----|
| sm | 6px | Badges |
| md | 8px | Inputs |
| lg | 12px | Buttons small |
| xl | 16px | Buttons, inputs large |
| 2xl | 20px | Cards |
| 3xl | 24px | Modals |
| full | 9999px | Pills, avatars |

## Sombras

| Token | Value |
|-------|-------|
| sm | `0 1px 2px rgba(26,26,26,0.05)` |
| md | `0 4px 12px rgba(26,26,26,0.08)` |
| lg | `0 8px 24px rgba(26,26,26,0.12)` |
| xl | `0 16px 48px rgba(26,26,26,0.16)` |
| glow | `0 0 24px rgba(27,94,75,0.2)` |

## Touch targets

| Size | Min height |
|------|------------|
| min | 48px |
| comfortable | 56px |
| large | 64px |

Todos los botones principales ≥ 48px. Home actions ≥ 120px height.

## Componentes (`@lefrig/ui`)

Paquete **web-only** (Next.js). El admin usa sobre todo el CSS; móvil Expo no importa estos componentes (ver `packages/ui/README.md`).

| Componente | Uso |
|------------|-----|
| `Button` | primary, secondary, outline, ghost, danger |
| `Card` | Contenedor premium con sombra suave |
| `Badge` | Estados, métodos pago |
| `Input` | Formularios accesibles |
| `SearchBar` | Búsqueda protagonista home |
| `CampSelector` | Filtro campamento |
| `CategoryCard` | Grid categorías con icono |
| `ListingCard` | Anuncio marketplace |
| `ServiceCard` | Directorio servicios |
| `ShopCard` | Tienda/marsa |
| `TransportCard` | Solicitud transporte |
| `EmptyState` | Estados vacíos bonitos |
| `LoadingSkeleton` | Shimmer elegante |
| `AppShell` | Layout header/footer |
| `MobileHomeActionCard` | 6 acciones home grandes |
| `CashPaymentBadge` | 💵 Efectivo al recibir |
| `LedgerSummaryCard` | Mi libreta privada |
| `PinConfirmationModal` | Confirmación PIN 4 dígitos |
| `VoucherCard` | Cupón ONG |

## Home Mobile — Layout

```
┌─────────────────────────────┐
│  🌅 As-salamu, Ahmed        │
│  ¿Qué necesitas hoy?  [🔍]  │
├──────────────┬──────────────┤
│  🛒 Comprar  │  📢 Vender   │
├──────────────┼──────────────┤
│ 🔧 Servicios │ 🚐 Transporte│
├──────────────┼──────────────┤
│ 💼 Trabajo   │ 🌍 Familia   │
├─────────────────────────────┤
│ ⚡ Publicar en 30 segundos  │
│ 🎤 Cuéntanos qué quieres... │
└─────────────────────────────┘
```

Colores por acción (HOME_ACTIONS):
- Comprar: `#1B5E4B`
- Vender: `#C45C26`
- Servicios: `#2D6A4F`
- Transporte: `#B8860B`
- Trabajo: `#4A6741`
- Diáspora: `#8B4513`

## UX Cash-first

En TODA pantalla de compra/pedido/transporte mostrar claramente:

| Método | Copy ES | Copy AR |
|--------|---------|---------|
| Efectivo al recibir | Paga en efectivo al recibir | ادفع نقداً عند الاستلام |
| Contra entrega | Efectivo contra entrega | نقداً عند التسليم |
| Fiado | Comprar fiado (si tienda permite) | شراء بال fiado |
| WhatsApp | Acordar por WhatsApp | تواصل عبر واتساب |
| PIN | Confirmar con código | تأكيد بالرمز |

**Nunca** mostrar tarjeta bancaria como opción principal.

## Accesibilidad

- Contraste WCAG AA mínimo
- Touch targets ≥ 48px
- RTL completo (`dir="rtl"`)
- No depender solo de color (iconos + texto)
- Modo solo texto / sin imágenes
- Skeleton loaders (no spinners genéricos)

## Animaciones

- Transiciones suaves 150-200ms
- Shimmer skeleton loading
- Hover cards: translateY(-2px) + shadow lift
- Sin animaciones excesivas (bajo consumo batería/datos)

## Modo simple

Para usuarios con baja alfabetización digital:
- Botones grandes con icono + texto corto
- Una acción principal por pantalla
- Guía paso a paso (futuro: audio)
- Fallback WhatsApp visible

## Implementación

```typescript
import { Button, Card, colors, gradients } from '@lefrig/ui';
import '@lefrig/ui/styles.css';
```

Tokens en `packages/ui/src/tokens/index.ts`.

CSS variables en `packages/ui/src/styles/global.css`.

## Anti-patterns (NO hacer)

- ❌ UI genérica blanca/gris tipo Bootstrap
- ❌ Copiar Wallapop/Mzad/Facebook Marketplace
- ❌ 20 opciones en una pantalla
- ❌ Deuda visible en perfil público
- ❌ Tarjeta bancaria prominente
- ❌ Spinners genéricos sin skeleton
- ❌ Texto pequeño (< 14px body)
