# Changelog

## 0.1.0 - 2026-03-22

Estado base inicial del monorepo para el sistema de punto de venta.

### Versiones actuales

- Proyecto raÃ­z: `0.1.0`
- Web (`@pos/web`): `0.1.0`
- API (`@pos/api`): `0.0.1`

### Estado general

- Monorepo creado con `npm workspaces`
- Arquitectura separada en `apps/web`, `apps/api`, `packages/config`, `packages/types`, `packages/utils`
- DocumentaciÃ³n inicial creada en `README.md`, `docs/architecture.md` y `docs/local-development.md`
- Variables de entorno base documentadas para web y API

### Frontend implementado

- Next.js App Router con TypeScript
- Tailwind CSS configurado
- Base de `shadcn/ui` integrada con componentes reutilizables
- TanStack Query configurado para consumo de API
- Zustand configurado para carrito y contexto de caja
- Layout principal con navegaciÃ³n para:
  - dashboard
  - caja
  - POS
  - inventario
- Pantallas funcionales mÃ­nimas:
  - `/dashboard`
  - `/cash`
  - `/pos`
  - `/inventory`
- Flujo base de caja:
  - abrir caja
  - cerrar caja
  - consultar sesiÃ³n abierta
- Flujo base de venta:
  - bÃºsqueda de productos
  - carrito
  - resumen de venta
  - selecciÃ³n de mÃ©todo de pago
  - finalizaciÃ³n de venta
- Flujo base de inventario:
  - bÃºsqueda de producto
  - consulta de stock
  - ajuste manual de inventario
- PreparaciÃ³n para Supabase Auth en cliente sin UI completa de login

### Backend implementado

- NestJS modular con configuraciÃ³n global
- Prisma inicializado para PostgreSQL / Supabase
- Guard global preparado para:
  - Bearer token de Supabase
  - bypass controlado de desarrollo por headers
- Manejo global de validaciÃ³n y errores
- MÃ³dulos creados:
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

- ValidaciÃ³n de membresÃ­a del usuario al negocio
- ValidaciÃ³n de relaciÃ³n entre `business_id`, `branch_id` y `register_id`
- RestricciÃ³n de una sola sesiÃ³n abierta por caja
- Venta transaccional
- ValidaciÃ³n de sesiÃ³n de caja abierta antes de vender
- ValidaciÃ³n de stock suficiente para productos inventariables
- Descuento de `stock_balances` en ventas
- CreaciÃ³n de `inventory_movements` por venta
- Ajuste manual de inventario con movimiento de entrada o salida
- Registro en `audit_logs` para:
  - `open_cash_session`
  - `close_cash_session`
  - `create_sale`
  - `stock_adjustment`

### IntegraciÃ³n con base de datos

- Prisma configurado con `DATABASE_URL`
- Cliente Prisma generado en `apps/api/src/generated/prisma`
- ImplementaciÃ³n operativa basada en SQL parametrizado con Prisma para no inventar modelos sin introspecciÃ³n real
- Preparado para correr:
  - `npm run prisma:generate`
  - `npm run prisma:pull`

### Validaciones y estado tÃ©cnico

- `npm run lint`: OK
- `npm run build`: OK
- `npm run prisma:generate`: OK
- `npm run dev:api`: corregido para no regenerar Prisma en cada arranque

### Ajustes recientes importantes

- Se corrigiÃ³ la carga de variables de entorno de Prisma desde `apps/api/.env`
- Se corrigiÃ³ el flujo de desarrollo del API para evitar el error `EPERM` en Windows al renombrar `query_engine-windows.dll.node`
- Se documentÃ³ el uso de `Session pooler` de Supabase para evitar problemas de IPv6 con Prisma
- Se agregÃ³ diagnÃ³stico mÃ¡s claro cuando falla la conexiÃ³n al host directo de Supabase

### Pendientes para la siguiente fase

- Ejecutar `prisma db pull` contra la base real de Supabase para alinear el esquema tipado
- Confirmar columnas exactas del esquema real usadas por los SQL actuales
- Implementar selecciÃ³n real de negocio, sucursal y caja desde datos del backend
- Implementar login visual completo con Supabase Auth
- AÃ±adir pruebas de integraciÃ³n contra base real
- Preparar capa compartida para futura app desktop con Tauri 2

### Limitaciones actuales

- La capa Prisma no fue introspectada aÃºn contra la base real de Supabase
- Parte del acceso a datos usa SQL manual mientras se confirma el esquema real
- El frontend depende de contexto de desarrollo (`NEXT_PUBLIC_DEV_*`) mientras no exista flujo completo de autenticaciÃ³n y selecciÃ³n operativa

## 0.2.0 - 2026-03-24

Estado operativo validado sobre el esquema real descrito en `apps/api/db_setup.sql`.

### Versiones de referencia

- Entrada de changelog: `0.2.0`
- Proyecto raÃ­z en `package.json`: `0.1.0`
- Web (`@pos/web`): `0.1.0`
- API (`@pos/api`): `0.0.1`
- Nota: esta versiÃ³n documenta el avance funcional actual del repo; el bump formal de `package.json` sigue pendiente si se quiere alinear versionado semÃ¡ntico en archivos.

### Estado general actual

- El backend ya trabaja sobre tablas reales del esquema actual de Supabase, tomando `apps/api/db_setup.sql` como referencia funcional.
- El frontend ya no depende de mostrar UUIDs crudos para negocio, sucursal, caja y usuario.
- Caja, inventario y POS ya tienen flujo operativo base de punta a punta.
- Se mantiene la separaciÃ³n monorepo entre `apps/web` y `apps/api` sin refactor grande ni cambio de stack.

### Backend agregado o completado

- Nuevo mÃ³dulo `context` para resolver el contexto operativo real:
  - usuario
  - negocio
  - sucursal
  - caja
  - sesiÃ³n abierta
- Nuevos endpoints operativos:
  - `GET /api/context/operating`
  - `POST /api/inventory/products`
  - `POST /api/inventory/products/:productId/deactivate`
- `GET /api/inventory/products/search` ampliado para:
  - funcionar con query vacÃ­a
  - devolver categorÃ­a
  - devolver marca
  - devolver stock disponible
- Alta de productos conectada a tablas existentes:
  - `products`
  - `product_barcodes`
  - `stock_balances`
  - `inventory_movements`
  - `audit_logs`
- DesactivaciÃ³n lÃ³gica de productos usando `products.is_active = false`
- ReutilizaciÃ³n de ubicaciÃ³n por defecto real desde `inventory_locations`
- Validaciones reforzadas de membresÃ­a, sucursal y caja

### Frontend agregado o completado

- Dashboard, header y sidebar ahora muestran nombres reales del contexto operativo.
- Pantalla `/cash` actualizada para:
  - mostrar negocio, sucursal, caja y usuario reales
  - abrir caja
  - consultar sesiÃ³n abierta
  - cerrar caja
  - refrescar UI al instante despuÃ©s de abrir o cerrar
- Pantalla `/inventory` actualizada para:
  - listar catÃ¡logo real
  - buscar productos
  - crear productos
  - ver stock actual
  - ajustar stock
  - desactivar productos
- Pantalla `/pos` actualizada para:
  - mostrar contexto real del cajero y caja
  - buscar productos inventariados
  - agregar productos al carrito
  - validar cantidades contra stock disponible
  - registrar ventas
  - mostrar resumen de la Ãºltima venta sin exponer IDs crudos

### Ajustes tÃ©cnicos importantes

- Se corrigiÃ³ el cliente HTTP del frontend para evitar el error:
  - `Failed to execute 'json' on 'Response': Unexpected end of JSON input`
- El cliente ahora tolera respuestas vacÃ­as correctamente.
- Se mantuvo timeout y manejo explÃ­cito de errores para no dejar la UI en loading infinito.
- Se agregÃ³ invalidaciÃ³n del contexto operativo al abrir o cerrar caja para refresco inmediato.
- Se limpiaron varios textos visibles de UI para mostrar estados mÃ¡s claros y consistentes.

### Estado funcional validado

- `GET /api/health`: OK
- `GET /api/context/operating`: OK
- `GET /api/inventory/products/search`: OK
- Flujo real validado contra API local y Supabase:
  - crear producto temporal
  - abrir caja
  - registrar venta
  - cerrar caja
  - desactivar producto temporal
- Resultado de cierre validado:
  - `closing_expected = 150`
  - `closing_counted = 150`
  - `difference_amount = 0`

### Estado visible actual de la app

- `/dashboard`: operativo y con nombres reales
- `/cash`: operativo
- `/inventory`: operativo
- `/pos`: operativo con caja abierta

### Lo que ya funciona

- Consulta de sesiÃ³n abierta por caja
- Apertura de caja
- Cierre de caja
- BÃºsqueda real de productos
- Consulta real de stock
- Alta bÃ¡sica de productos
- Ajuste manual de inventario
- DesactivaciÃ³n lÃ³gica de productos
- Carrito de venta
- Registro de venta
- Descuento de stock
- Refresco inmediato de UI en flujos crÃ­ticos

### Lo que sigue pendiente

- Login visual real con Supabase Auth
- Selector visual real de negocio, sucursal y caja
- EdiciÃ³n de productos
- EliminaciÃ³n definitiva o restauraciÃ³n de productos
- Movimientos manuales de caja mÃ¡s allÃ¡ de apertura/cierre
- Clientes y tickets de venta
- Pagos mixtos completos
- Compras, recepciones y proveedores
- Reportes
- Pruebas automatizadas de integraciÃ³n y e2e

### Limitaciones actuales reales

- El sistema sigue usando bypass de desarrollo local mientras no exista login visual completo.
- El contexto operativo se apoya en `NEXT_PUBLIC_DEV_*` si no hay sesiÃ³n autenticada real.
- Inventario opera sobre ubicaciÃ³n por defecto; no hay selector visual de mÃºltiples ubicaciones todavÃ­a.
- "Eliminar producto" hoy significa desactivarlo, no borrarlo fÃ­sicamente.
- Persisten warnings de hidrataciÃ³n si el navegador inyecta atributos por extensiones; eso no pertenece al flujo del sistema.

### Validaciones tÃ©cnicas ejecutadas en esta versiÃ³n

- `npm run lint --workspace @pos/api`: OK
- `npx nest build` en `apps/api`: OK
- `npm run lint --workspace @pos/web`: OK
- `npm run build --workspace @pos/web`: OK

## 0.3.0 - 2026-03-25

Sprint 1A y 1B implementados sobre la arquitectura actual del monorepo y alineados con `apps/api/db_setup.sql` como fuente de verdad del esquema.

### Sprint 1A - Caja operativa real

- Caja extendida para operar sesiones reales con:
  - apertura
  - consulta de sesiÃ³n abierta por caja
  - resumen detallado de sesiÃ³n
  - movimientos manuales de caja
  - cierre con contado y diferencia
- Nuevos endpoints de caja:
  - `GET /api/cash/sessions/:cashSessionId/summary`
  - `POST /api/cash/sessions/:cashSessionId/movements`
- CÃ¡lculo centralizado del resumen de sesiÃ³n:
  - ventas totales
  - totales por mÃ©todo de pago
  - ingresos manuales
  - retiros
  - efectivo esperado
- Regla operativa aplicada:
  - `efectivo esperado = apertura + ventas en efectivo + ingresos manuales - retiros`
- AuditorÃ­a agregada para:
  - `open_cash_session`
  - `cash_income`
  - `cash_expense`
  - `close_cash_session`
- CorrecciÃ³n tÃ©cnica importante:
  - se corrigiÃ³ el cierre de caja para evitar el error de PostgreSQL `FOR UPDATE cannot be applied to the nullable side of an outer join`

### Sprint 1B - Auth real y selector operativo real

- Frontend preparado para auth real con Supabase:
  - nueva pantalla `/login`
  - `AuthProvider`
  - `AuthGuard`
  - logout desde UI
- El bypass dev deja de ser flujo principal en frontend.
- Nuevo selector operativo persistido en `localStorage` para:
  - negocio
  - sucursal
  - caja
- Nuevos endpoints de contexto:
  - `GET /api/context/businesses`
  - `GET /api/context/branches`
  - `GET /api/context/registers`
- `GET /api/context/operating` ampliado para devolver:
  - usuario actual
  - negocios accesibles
  - sucursales accesibles
  - cajas accesibles
  - selecciÃ³n vigente
  - sesiÃ³n abierta de la caja seleccionada
- Reglas de acceso reforzadas con `user_business_roles`:
  - si el usuario tiene rol a nivel negocio puede ver todas las sucursales activas del negocio
  - si el usuario estÃ¡ ligado a una sucursal concreta solo puede ver esa sucursal
  - las cajas listadas respetan negocio y sucursal seleccionados

### Frontend actualizado en esta versiÃ³n

- `/cash` ahora muestra:
  - contexto operativo real
  - tarjeta de sesiÃ³n abierta
  - resumen vivo de sesiÃ³n
  - formulario de ingreso/retiro
  - lista reciente de movimientos
  - cierre con diferencia en vivo
- `/pos` bloquea venta si no hay sesiÃ³n abierta con el mensaje:
  - `Debes abrir caja antes de vender.`
- `/dashboard`, `/cash`, `/inventory` y `/pos` ya consumen el selector operativo persistido, no solo IDs fijos de desarrollo.
- El cliente HTTP del frontend sigue tolerando respuestas vacÃ­as sin romper con `Unexpected end of JSON input`.

### ValidaciÃ³n funcional ejecutada

- Contexto operativo validado:
  - negocio: `Punto de Venta Nano`
  - sucursal: `Sucursal Principal`
  - caja: `Caja 1`
  - usuario: `Rafael Menchaca`
- Flujo de caja validado contra API local y Supabase:
  - cierre de sesiÃ³n previa con `difference_amount = 0`
  - apertura nueva con `opening_amount = 100`
  - venta ligada a la sesiÃ³n por `21.5`
  - ingreso manual por `20`
  - retiro manual por `5`
  - resumen con `expected_cash = 136.5`
  - cierre con `closing_counted = 136.5` y `difference_amount = 0`
- ValidaciÃ³n adicional:
  - el producto vendido descontÃ³ stock de `490` a `489`

### Validaciones tÃ©cnicas ejecutadas en esta versiÃ³n

- `npm run lint --workspace @pos/api`: OK
- `npx nest build` en `apps/api`: OK
- `npm run lint --workspace @pos/web`: OK
- `npm run build --workspace @pos/web`: OK

### Pendientes reales despuÃ©s de este sprint

- Probar login real extremo a extremo con credenciales reales de Supabase disponibles fuera del repo.
- Reemplazar el fallback dev en entornos reales.
- Ajustar documentaciÃ³n funcional de uso para usuarios finales.
- Continuar con siguientes bloques fuera de este sprint:
  - clientes
  - descuentos
  - devoluciones
  - tickets
  - compras
  - reportes
