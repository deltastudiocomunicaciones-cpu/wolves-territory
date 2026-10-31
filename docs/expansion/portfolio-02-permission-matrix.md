# PORTFOLIO-02 · Matriz de permisos propuesta

**Estado: revisión, sin ejecución en Supabase.** El SQL compañero es `docs/expansion/portfolio-02-sql-review-draft.sql`.

| Operación | SUPER_ADMIN | EXPANSION | OPERATIONS | FINANCE | TESORERÍA | anon |
|---|---|---|---|---|---|---|
| Crear prospecto (existente) | Sí | Sí | No | No | No | No |
| Consultar asignados (existente) | Sí | Sí | No | No | No | No |
| Consultar todos (existente) | Sí | No | No | No | No | No |
| Ver expediente individual (nuevo) | Todos | Solo asignados | No | No | No | No |
| Editar contacto y ubicación (nuevo) | Todos | Solo asignados | No | No | No | No |
| Cambiar estado (nuevo) | Todos | Solo asignados | No | No | No | No |
| Reasignar prospecto | **No incluido** | **No incluido** | No | No | No | No |
| Reabrir CLOSED | **No incluido** | **No incluido** | No | No | No | No |

Los permisos nuevos son `EXPANSION_PROSPECT_EDIT` y `EXPANSION_PROSPECT_STATUS_CHANGE`. Ambos se asignarían exclusivamente a `SUPER_ADMIN` y `EXPANSION`. La lectura individual usa `EXPANSION_PROSPECT_VIEW` y, para alcance global, `EXPANSION_PROSPECT_VIEW_ALL`. El SQL revisado incorpora además `EXPANSION_PROSPECT_EDIT_ALL`, asignado únicamente a `SUPER_ADMIN`. La lectura global (`VIEW_ALL`) **no** concede edición global. Las funciones de edición y cambio de estado exigen el permiso específico de operación y, para registros ajenos, `EDIT_ALL`.

## Decisiones de diseño del borrador

1. Campos opcionales de contacto y ubicación: el SQL interpreta `NULL` como **borrar**; exige envío completo de los cinco campos, no actualización parcial. Confirmar semántica en UI antes de habilitar.
2. `originated_by`, `created_by`, `assigned_to`, `trade_name` y `prospect_type` no se modifican.
3. Cambios de estado admiten los cinco valores del CHECK actual, con bloqueo de reapertura desde `CLOSED`. El borrador incluye un grafo conservador de transiciones, pendiente de aprobación funcional; `CLOSED` es terminal.
4. Se requiere razón para toda modificación; la auditoría de contacto registra campos modificados y marcas temporales, evitando replicar teléfonos y correos en el log técnico.
5. Las tres funciones son `SECURITY DEFINER`: revisar propietario efectivo, grants, RLS y posibilidad de acceso indirecto antes de ejecutar.
6. No se crean cuentas de usuario, roles operativos ni registros de prospectos.

## Transiciones propuestas (pendientes de aprobación)

| Estado actual | Destinos permitidos en el borrador |
|---|---|
| `IDENTIFIED` | `CONTACTED`, `PAUSED` |
| `CONTACTED` | `IN_CONVERSATION`, `PAUSED` |
| `IN_CONVERSATION` | `PAUSED`, `CLOSED` |
| `PAUSED` | `CONTACTED`, `IN_CONVERSATION`, `CLOSED` |
| `CLOSED` | Ninguno; reapertura bloqueada |

Esta es una **propuesta de implementación**, no una decisión comercial aprobada. En particular, debe decidirse si se permite cerrar directamente un contacto sin conversación, cómo se distingue una venta de una oportunidad cerrada y quién puede reabrirla. El estado `CLOSED` no implica por sí mismo creación de tienda, contrato o comisión.

## Casos mínimos de prueba (no ejecutados)

- Usuario anónimo: no puede ejecutar las RPC.
- Usuario autenticado sin admin activo: denegado.
- OPERATIONS, FINANCE y TESORERÍA: denegados.
- EXPANSION: solo prospectos asignados; denegar prospectos ajenos.
- SUPER_ADMIN: lectura global mediante `VIEW_ALL`; edición global solo mediante `EDIT_ALL` más el permiso operativo correspondiente.
- EXPANSION con permiso de lectura global accidental pero sin `EDIT_ALL`: no debe editar expedientes ajenos.
- Permiso `EDIT_ALL` sin permiso de operación `EDIT`/`STATUS_CHANGE`: no habilita la operación por sí solo.
- Edición: rechazar cambios vacíos, textos demasiado largos y motivo ausente; conservar origen, creador y asignado.
- Estado: rechazar estado inválido, estado idéntico, versión obsoleta y reapertura de CLOSED.
- Auditoría: registrar actor, correlación y razón; provocar error de auditoría en transacción controlada y comprobar rollback.
- Concurrencia: dos cambios sobre estado previo idéntico; solo el primero debe prosperar.
- Seguridad: confirmar que no se conceden escrituras directas a tablas, que el RPC no expone prospectos ajenos y que los permisos están activos.

**Gate:** revisión del borrador y correcciones → autorización explícita → aplicación controlada → pruebas → UI Preview → producción separada.
