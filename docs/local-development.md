# Desarrollo local

1. Copia `apps/web/.env.example` y `apps/api/.env.example` a sus archivos `.env.local` o `.env`.
2. Instala dependencias desde la raíz con `npm install`.
3. Genera el cliente de Prisma con `npm run prisma:generate`.
4. Si ya tienes `DATABASE_URL` real de Supabase, sincroniza el esquema con `npm run prisma:pull`.
5. Levanta web y API con `npm run dev`.

## Nota sobre Supabase y Prisma

Si tu `DATABASE_URL` apunta a `db.<project-ref>.supabase.co:5432` y tu red no soporta IPv6, Prisma fallará con `P1001`.
En ese caso usa la cadena `Session pooler` de Supabase, que termina en `pooler.supabase.com:5432`.

## Nota sobre auth

La base ya está preparada para Bearer tokens de Supabase. Mientras no exista la UI completa de autenticación, en desarrollo se permite un bypass controlado por headers y variables `NEXT_PUBLIC_DEV_*` junto con `ALLOW_DEV_AUTH_BYPASS=true`.

## Sprint 1B - auth real y selector operativo

El frontend ya soporta login real con Supabase Auth y protege las rutas privadas:

- `/dashboard`
- `/cash`
- `/inventory`
- `/pos`

Para usar auth real:

1. Configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `apps/web/.env`.
2. Deja `NEXT_PUBLIC_ENABLE_DEV_AUTH_BYPASS=false`.
3. MantÃ©n `NEXT_PUBLIC_API_URL` apuntando al backend local.

Si necesitas fallback local explÃ­cito para desarrollo:

1. Activa `NEXT_PUBLIC_ENABLE_DEV_AUTH_BYPASS=true` en `apps/web/.env`.
2. Configura `NEXT_PUBLIC_DEV_USER_ID`, `NEXT_PUBLIC_DEV_BUSINESS_ID`, `NEXT_PUBLIC_DEV_BRANCH_ID` y `NEXT_PUBLIC_DEV_REGISTER_ID`.
3. Deja `ALLOW_DEV_AUTH_BYPASS=true` en `apps/api/.env`.

La selecciÃ³n operativa de negocio, sucursal y caja se persiste en `localStorage`.
