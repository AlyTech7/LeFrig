# Política de seguridad — Lefrig

## Reportar una vulnerabilidad

Si descubres un problema de seguridad en Lefrig (API, web, móvil, infra o dependencias), **no** abras un issue público.

Envía un correo a:

- **hola@lefrig.app** — asuntos de seguridad y abuso
- **privacidad@lefrig.app** — si implica datos personales

Incluye, si puedes:

1. Descripción del impacto
2. Pasos para reproducirlo o PoC mínima
3. Versión / entorno (prod, staging, commit)
4. Tu contacto para seguimiento

## Qué esperamos

- Acusaremos recibo en un plazo razonable
- No pediremos divulgación pública hasta tener un arreglo o mitigación
- No perseguiremos la investigación de buena fe en entornos a los que tengas acceso legítimo

## Alcance

Cubierto: autenticación, autorización, inyección, exposición de datos, secretos, XSS/CSRF relevantes, abuso de APIs internas.

Fuera de alcance típico: denegación de servicio volumétrica, phishing genérico, vulnerabilidades solo en dependencias de terceros ya reportadas vía Dependabot sin exploit en Lefrig.

## Dependabot

Este repositorio usa **Dependabot alerts** y **security updates** para avisar y proponer parches de dependencias con CVE conocidas.
