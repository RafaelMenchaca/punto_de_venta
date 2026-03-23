# Arquitectura base

El monorepo queda separado en:

- `apps/web`: frontend web con Next.js App Router.
- `apps/api`: backend con NestJS y Prisma.
- `packages/config`: constantes compartidas.
- `packages/types`: contratos y tipos compartidos.
- `packages/utils`: utilidades puras reutilizables.

La fase actual implementa caja, ventas, inventario y auditoría básica, dejando la preparación para Tauri 2 documentada pero fuera de alcance funcional.
