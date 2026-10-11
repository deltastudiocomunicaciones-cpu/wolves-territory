# K7-09A — Alta controlada de cadenas comerciales

**Estado:** funcionalmente validado en Supabase principal; consolidación documental en revisión.
**Alcance:** preparación de dos archivos; sin ejecución SQL, cambios en Supabase, staging Git, commit, push o despliegue.

## 1. Resultado funcional observado

- `GET /api/admin/stores`: HTTP 200 con sesión SUPER_ADMIN y OPERATIONS.
- `POST /api/admin/stores`: HTTP 201 con SUPER_ADMIN y registro `CANDIDATE`.
- Código de prueba: `WT_TEST_K709A`; id de cadena `37aff21c-0559-4410-ab63-44f562d9c6d1`.
- Auditoría `STORE_CREATED`: id `0d7f100d-3dda-4165-9bfc-cebf66205647`, correlación `89fdf327-f110-472a-80b4-93b1abf9d038`.
- Segundo POST con mismo código: HTTP 409; un único registro y un único evento de alta.
- POST anónimo: HTTP 401.
- POST de OPERATIONS: HTTP 403, sin alta ni auditoría de creación.
- ESLint, TypeScript y build Next.js: aprobados para la ruta comprobada.

Estos resultados no equivalen a una prueba completa del flujo de sucursales, contratos, custodia, ventas o conciliación.

## 2. Arquitectura y brecha de reproducibilidad

La migración histórica `03B-009` define el catálogo `audit_event_types` con códigos `store.created` y campos de evento `actor_user_id`, `old_data`, `new_data`. La base principal actualmente expone un contrato evolucionado con `domain_code` / `STORE_CREATED`, `actor_id`, `before_state` y `after_state`.

Las migraciones `03B-014` y `03B-015` **invocan** `record_platform_audit_event`, pero una búsqueda de SQL en el repositorio no localizó su definición. En Supabase se recuperó su firma:

`record_platform_audit_event(text,text,text,uuid,text,uuid,text,uuid,text,jsonb,jsonb,jsonb)`

Propietario `postgres`, `SECURITY DEFINER`, `search_path = pg_catalog`, devuelve UUID de auditoría. Resuelve eventos activos y registra eventos en `audit_events`. El procedimiento acepta un `p_actor_id` suministrado por el invocador; por tanto, debe protegerse mediante grants y comandos que deriven la identidad del JWT. La función `create_commercial_store` sí obtiene `auth.uid()`.

No se encontró el esquema `supabase_migrations` ni la tabla `supabase_migrations.schema_migrations` en la base consultada. **No se puede inferir qué migraciones se aplicaron formalmente ni reconstruir el esquema actual solo desde el historial versionado.**

## 3. Alcance de la migración propuesta

Archivo: `supabase/migrations/20261011220000_03b_016_store_registry_creation.sql`.

- Comprueba dependencias; no intenta reconstruir ni alterar el motor de auditoría.
- Registra `STORE_CREATED` únicamente si no existe para el dominio STORE.
- Versiona `create_commercial_store` con permiso `STORE_CREATE`, alta `CANDIDATE` y auditoría transaccional.
- Restringe ejecución de la función a `authenticated` y revoca de `PUBLIC` y `anon`.

**Bloqueos previos a cualquier ejecución:** verificar columnas/constraints/grants del catálogo evolucionado; contrastar la definición SQL propuesta con `pg_get_functiondef` de `create_commercial_store` en vivo; confirmar el orden de dependencias y el plan de aplicación en entornos nuevos. La comprobación de existencia del evento no sustituye una reconciliación de atributos cuando ya existe. En la base principal el evento y la función ya están instalados: **no ejecutar esta migración allí como parte de CONS-10**.

## 4. Gobierno y aislamiento

El archivo `app/api/admin/stores/route.ts` es el único archivo de aplicación identificado como K7-09A. Los cambios K5 y `components/admin/TerritoryNavigation.tsx` quedan fuera del alcance. La prueba `WT_TEST_K709A` y su evento se preservan como evidencia; no se propone borrarlos.

**Pendiente:** revisión del SQL, autorización separada para incorporarlo al repositorio y, después, staging selectivo y commit. No existe autorización para mutar Supabase ni desplegar.
