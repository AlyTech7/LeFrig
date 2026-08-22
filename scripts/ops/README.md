# Scripts de operaciones

Scripts **solo para mantenedores** con acceso a Clerk, Vercel, Heroku o DigitalOcean.

No forman parte del flujo de desarrollo local. Antes de ejecutarlos, exporta las variables necesarias (ver `.env.ops.example`).

Los scripts que modifican infraestructura legacy de DigitalOcean requieren `DO_APP_ID`. La API de producción actual está en Heroku; usa `API_PUBLIC_URL` apuntando a tu despliegue.
