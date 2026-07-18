# Lefrig — Documento de Producto

## Visión

Lefrig es la **superapp saharaui** que conecta campamentos, Tindouf y la diáspora en una sola plataforma digital comunitaria. Por fuera debe ser tan fácil como WhatsApp; por dentro debe ser una infraestructura económica completa centrada en **efectivo con confianza**.

## Problema

Los campamentos saharauis carecen de una plataforma digital unificada que combine:
- Comercio local (no solo anuncios)
- Pagos en efectivo organizados con PIN bilateral
- Transporte entre campamentos y desde Tindouf
- Conexión con la diáspora para enviar ayuda
- Empleo, servicios y comunidad
- Reputación basada en transacciones reales

Las soluciones existentes (Wallapop, Milanuncios, Facebook Marketplace) son genéricas, no cash-first, no entienden campamentos/dairas/marsas, y no integran transporte ni diáspora.

## Diferenciación

| Competidor | Lefrig |
|------------|--------|
| Anuncios clasificados | Economía digital comunitaria |
| Pago online obligatorio | Cash-first con PIN y recibos |
| Sin geografía campamentos | 7 campamentos + dairas + marsas |
| Sin transporte | Logística inter-campamentos + Tindouf |
| Sin diáspora | Pedidos para familiares |
| Sin confianza | Reputación, verificación, moderación local |
| Sin comunidad | Avisos, eventos, ayuda urgente |

> **Nota:** Fiado/libreta y vouchers ONG existen como esquema histórico en base de datos pero **están desmontados del producto** (no se aceptan en altas nuevas; superficies UI redirigen).

## Usuarios

### Ciudadano (citizen)
Persona en campamento que compra, vende, pide servicios, usa transporte.

### Vendedor (seller)
Publica anuncios en marketplace, confirma ventas en efectivo.

### Comerciante (shop_owner)
Tiene tienda/marsa, catálogo, pedidos en efectivo.

### Transportista (driver)
Taxis colectivos, entregas, traer de Tindouf, viajes compartidos.

### Diáspora (diaspora)
Persona fuera que compra/envía para familiares en campamentos.

### Moderador (moderator)
Revisa reportes por campamento, resuelve disputas.

### Admin (admin)
Dashboard, verificación, analytics agregada, soporte.

## Flujos clave

### Comprar con efectivo
1. Usuario encuentra anuncio
2. Reserva → genera operationCode + PIN
3. Acuerda encuentro (chat o WhatsApp)
4. Paga en efectivo al recibir
5. Confirma con PIN → recibo digital

### Fiado / Libreta _(desmontado)_
Flujo histórico; no disponible en producto activo. Ver nota arriba.

### Diáspora
1. Perfil diáspora elige tienda verificada
2. Selecciona beneficiario en campamento
3. Crea pedido → paymentStatus PENDING_MANUAL_CONFIRMATION
4. Admin/partner confirma pago manual
5. Tienda prepara → transporte → entrega con PIN

### Traer de Tindouf
1. Usuario solicita transporte tipo tindouf_import
2. Conductor acepta con ruta y precio
3. Pago efectivo al entregar
4. Confirmación PIN

## Campamentos

| Slug | Nombre | Tindouf |
|------|--------|---------|
| aaiun | Aaiún / Laayoune | No |
| smara | Smara | No |
| auserd | Auserd | No |
| dakhla | Dakhla | No |
| rabouni | Rabouni | No |
| 27-febrero | 27 de Febrero / Boujdour | No |
| tindouf | Tindouf | Sí |

## Métricas de éxito (fase 1)

- Arranque local completo (API + web + admin + mobile + seed)
- Flujos cash-first funcionales con PIN
- Libreta privada operativa
- UI premium que transmita identidad saharaui
- Offline queue en mobile
- Moderación y disputas básicas
- Analytics agregada sin PII

## Restricciones

- No biometría inicial
- No actuar como banco
- No exponer deudas en reputación pública
- No mezclar vouchers ONG con fiado privado
- Bajo consumo de datos (modo texto, compresión imágenes)
