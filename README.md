# Punto de Venta

Base monorepo para un sistema de punto de venta con frontend web en Next.js y backend en NestJS, preparado para reutilizar la misma app en una futura versión desktop.

## Estructura

```txt
apps/
  api/    -> NestJS + Prisma
  web/    -> Next.js App Router + Tailwind + shadcn/ui base
packages/
  config/ -> constantes compartidas
  types/  -> contratos y tipos compartidos
  utils/  -> utilidades puras
docs/
```

## Fase actual

Se implementó la base operativa para:

- apertura y cierre de caja
- creación de ventas con pago
- descuento de inventario
- movimientos de inventario por venta
- ajuste manual de inventario
- auditoría básica

## Variables de entorno

Frontend en `apps/web/.env.example`:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_DEV_USER_ID`
- `NEXT_PUBLIC_DEV_BUSINESS_ID`
- `NEXT_PUBLIC_DEV_BRANCH_ID`
- `NEXT_PUBLIC_DEV_REGISTER_ID`

Backend en `apps/api/.env.example`:

- `PORT`
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `ALLOW_DEV_AUTH_BYPASS`

## Comandos

```bash
npm install
npm run prisma:generate
npm run dev
```

Validaciones:

```bash
npm run lint
npm run build
```

## Esquema Supabase

El proyecto quedó preparado para trabajar contra el esquema existente de Supabase/PostgreSQL sin crear tablas nuevas. Como en este entorno no se proporcionó un `DATABASE_URL` real, Prisma se dejó inicializado y el flujo real de introspección queda en:

```bash
npm run prisma:pull
```

## Documentación adicional

- `docs/architecture.md`
- `docs/local-development.md`
