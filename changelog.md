# Changelog

## 0.1.0 - 2026-03-22

Estado base inicial del monorepo para el sistema de punto de venta.

### Versiones actuales

- Proyecto raíz: `0.1.0`
- Web (`@pos/web`): `0.1.0`
- API (`@pos/api`): `0.0.1`

### Estado general

- Monorepo creado con `npm workspaces`
- Arquitectura separada en `apps/web`, `apps/api`, `packages/config`, `packages/types`, `packages/utils`
- Documentación inicial creada en `README.md`, `docs/architecture.md` y `docs/local-development.md`
- Variables de entorno base documentadas para web y API

### Frontend implementado

- Next.js App Router con TypeScript
- Tailwind CSS configurado
- Base de `shadcn/ui` integrada con componentes reutilizables
- TanStack Query configurado para consumo de API
- Zustand configurado para carrito y contexto de caja
- Layout principal con navegación para:
  - dashboard
  - caja
  - POS
  - inventario
- Pantallas funcionales mínimas:
  - `/dashboard`
  - `/cash`
  - `/pos`
  - `/inventory`
- Flujo base de caja:
  - abrir caja
  - cerrar caja
  - consultar sesión abierta
- Flujo base de venta:
  - búsqueda de productos
  - carrito
  - resumen de venta
  - selección de método de pago
  - finalización de venta
- Flujo base de inventario:
  - búsqueda de producto
  - consulta de stock
  - ajuste manual de inventario
- Preparación para Supabase Auth en cliente sin UI completa de login

### Backend implementado

- NestJS modular con configuración global
- Prisma inicializado para PostgreSQL / Supabase
- Guard global preparado para:
  - Bearer token de Supabase
  - bypass controlado de desarrollo por headers
- Manejo global de validación y errores
- Módulos creados:
  - `health`
  - `cash`
  - `sales`
  - `inventory`
  - `audit`
  - `shared-db`

### Endpoints disponibles

- `GET /api/health`
- `GET /api/cash/registers/:registerId/open-session`
- `POST /api/cash/sessions/open`
- `POST /api/cash/sessions/close`
- `POST /api/sales`
- `GET /api/inventory/products/search`
- `GET /api/inventory/products/:productId/stock`
- `GET /api/inventory/locations/default`
- `POST /api/inventory/stock-adjustments`

### Reglas de negocio ya cubiertas

- Validación de membresía del usuario al negocio
- Validación de relación entre `business_id`, `branch_id` y `register_id`
- Restricción de una sola sesión abierta por caja
- Venta transaccional
- Validación de sesión de caja abierta antes de vender
- Validación de stock suficiente para productos inventariables
- Descuento de `stock_balances` en ventas
- Creación de `inventory_movements` por venta
- Ajuste manual de inventario con movimiento de entrada o salida
- Registro en `audit_logs` para:
  - `open_cash_session`
  - `close_cash_session`
  - `create_sale`
  - `stock_adjustment`

### Integración con base de datos

- Prisma configurado con `DATABASE_URL`
- Cliente Prisma generado en `apps/api/src/generated/prisma`
- Implementación operativa basada en SQL parametrizado con Prisma para no inventar modelos sin introspección real
- Preparado para correr:
  - `npm run prisma:generate`
  - `npm run prisma:pull`

### Validaciones y estado técnico

- `npm run lint`: OK
- `npm run build`: OK
- `npm run prisma:generate`: OK
- `npm run dev:api`: corregido para no regenerar Prisma en cada arranque

### Ajustes recientes importantes

- Se corrigió la carga de variables de entorno de Prisma desde `apps/api/.env`
- Se corrigió el flujo de desarrollo del API para evitar el error `EPERM` en Windows al renombrar `query_engine-windows.dll.node`
- Se documentó el uso de `Session pooler` de Supabase para evitar problemas de IPv6 con Prisma
- Se agregó diagnóstico más claro cuando falla la conexión al host directo de Supabase

### Pendientes para la siguiente fase

- Ejecutar `prisma db pull` contra la base real de Supabase para alinear el esquema tipado
- Confirmar columnas exactas del esquema real usadas por los SQL actuales
- Implementar selección real de negocio, sucursal y caja desde datos del backend
- Implementar login visual completo con Supabase Auth
- Añadir pruebas de integración contra base real
- Preparar capa compartida para futura app desktop con Tauri 2

### Limitaciones actuales

- La capa Prisma no fue introspectada aún contra la base real de Supabase
- Parte del acceso a datos usa SQL manual mientras se confirma el esquema real
- El frontend depende de contexto de desarrollo (`NEXT_PUBLIC_DEV_*`) mientras no exista flujo completo de autenticación y selección operativa
