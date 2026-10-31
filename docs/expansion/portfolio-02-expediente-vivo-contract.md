# EXPANSION · PORTFOLIO-02 — Contrato del expediente vivo

Estado: **Diseño técnico, no ejecutado**. Alcance: PORTFOLIO, sin cambios a Supabase ni a producción.

## Baseline verificado (27-10-2026)

- `public.expansion_prospects`: tabla existente con identidad, contacto, ubicación, estado y atribución (`originated_by`, `created_by`, `assigned_to`).
- Estados permitidos por CHECK: `IDENTIFIED`, `CONTACTED`, `IN_CONVERSATION`, `PAUSED`, `CLOSED`.
- RPC existentes: `create_expansion_prospect` y `list_expansion_prospects`, ambas SECURITY DEFINER con búsqueda de identidad activa y `has_platform_permission`.
- Permisos existentes: `EXPANSION_PROSPECT_CREATE`, `EXPANSION_PROSPECT_VIEW`, `EXPANSION_PROSPECT_VIEW_ALL`.
- Evento de auditoría existente: `EXPANSION/PROSPECT_CREATED`.
- No hay RPC de edición, seguimiento o cambio de estado verificada. No afirmar que existen.

## Invariantes

1. `originated_by` y `created_by` son inmutables desde la API comercial; la atribución nunca se infiere de la última edición.
2. `assigned_to` no cambia mediante la edición de datos de contacto ni el cambio de estado; reasignación será una operación separada con permiso específico y auditoría.
3. No hay escrituras directas del cliente a `expansion_prospects`; únicamente RPC con autorización en servidor.
4. Un prospecto no se convierte automáticamente en `store`, `partner`, contrato, inventario ni comisión.
5. Cambios relevantes se registran con actor autenticado, correlación, estado previo y posterior en la misma transacción.
6. Sin permisos no hay lectura ni modificación; SUPER_ADMIN puede consultar todos, EXPANSION solo los asignados, sujeto a las reglas actuales.

## Incremento A: lectura del expediente

Diseñar RPC `get_expansion_prospect(p_prospect_id uuid)`: validar UUID, identidad activa, permiso `EXPANSION_PROSPECT_VIEW`; permitir lectura si `assigned_to` coincide con el admin activo o posee `EXPANSION_PROSPECT_VIEW_ALL`. Devolver campos de la cartera existentes; no exponer datos privados de otras áreas. Probar acceso autorizado, ajeno y no autenticado.

## Incremento B: actualización de contacto y ubicación

Propuesta RPC `update_expansion_prospect_details(p_prospect_id uuid, p_contact_name text, p_contact_phone text, p_contact_email text, p_department text, p_city text, p_reason text)`. Definir semántica de NULL (borrado explícito vs conservar) antes de codificar. Validar longitud y formato, pertenencia o permiso global de edición, razón no vacía, registro de auditoría `PROSPECT_DETAILS_UPDATED`. Añadir permiso `EXPANSION_PROSPECT_EDIT` con matriz de roles revisada. Evitar modificaciones a identidad/atribución por este RPC.

## Incremento C: estado comercial

Propuesta RPC `change_expansion_prospect_status(p_prospect_id uuid, p_expected_status text, p_new_status text, p_reason text)`. Permiso `EXPANSION_PROSPECT_STATUS_CHANGE`. Validar estado actual contra `p_expected_status` (protección contra edición concurrente), estado permitido, razón y asignación. Auditar `PROSPECT_STATUS_CHANGED` con antes/después. Transiciones y reapertura de `CLOSED` sujetas a decisión funcional antes de ejecutar.

## Incremento D: memoria de gestiones

Modelo de eventos de seguimiento **append-only** con prospecto, tipo de actividad, fecha, resumen, próximo compromiso, actor y correlación. No reutilizar `audit_events` como notas de usuario ni exponer la auditoría técnica sin filtrado. Definir permisos de lectura/escritura y límites de texto; no implementar hasta revisar el esquema y acordar vocabulario.

## Secuencia de gates

- G1: contrato y matriz de permisos aprobados.
- G2: revisión de esquema, RLS, grants, funciones, eventos de auditoría y pruebas de denegación.
- G3: migración versionada y aplicación autorizada a Supabase real.
- G4: pruebas transaccionales, incluyendo rollback ante fallo de auditoría, no autorizado, concurrencia y conservación de atribución.
- G5: UI del expediente en Preview, prueba autenticada con datos autorizados y validación SUPER_ADMIN.
- G6: autorización separada para integrar en `main` / producción.

**No ejecutar SQL de escritura ni modificar datos reales a partir de este documento sin autorización expresa.**
