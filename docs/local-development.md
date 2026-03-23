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
