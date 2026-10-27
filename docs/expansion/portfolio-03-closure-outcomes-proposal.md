# PORTFOLIO-03 · Resultado de cierre comercial

**Estado: propuesta funcional para decisión; no implementado.** Fecha: 2026-10-27.

## Problema

El estado `CLOSED` de `expansion_prospects` expresa únicamente que la oportunidad se cerró. No permite diferenciar una oportunidad ganada, perdida o descartada. **No cambiar el CHECK actual ni inferir que `CLOSED` equivale a tienda aprobada.**

## Modelo recomendado: estado + resultado

Mantener el campo `commercial_status` existente para el ciclo operativo: `IDENTIFIED`, `CONTACTED`, `IN_CONVERSATION`, `PAUSED`, `CLOSED`.

Proponer un atributo adicional, sujeto a aprobación, `closure_outcome`:
- `WON`: se acordó continuar a formalización; **no** implica contrato firmado, tienda aprobada ni comisión causada.
- `LOST`: no se logró el acuerdo comercial.
- `DISQUALIFIED`: la oportunidad no cumple criterios de elegibilidad o se registró por error; no borrar su trazabilidad.

`closure_reason` debe registrar una explicación comercial breve, distinta del motivo técnico de auditoría; revisar necesidad de catálogo de razones antes de implementación. `closed_at` y `closed_by` permiten atribuir la decisión de cierre, sin sustituir `originated_by` ni `created_by`.

## Invariantes de datos

1. `commercial_status='CLOSED'` requiere resultado, motivo y actor; cualquier estado distinto de `CLOSED` requiere resultado de cierre NULL (salvo que se decida conservar historial en una tabla de eventos).
2. Cerrar no crea automáticamente `stores`, `partners`, `locations`, inventario, contratos, comisiones ni pagos.
3. Un cierre `WON` puede habilitar un **proceso separado de formalización**, con sus propios controles y autorizaciones.
4. El cierre es una operación auditada, con estado previo y posterior, actor y correlación.
5. La reapertura de `CLOSED` permanece bloqueada en PORTFOLIO-02 hasta diseñar una operación especial y su auditoría.
6. Las oportunidades perdidas o descalificadas permanecen consultables conforme a permisos y políticas de retención.

## Reglas de transición por resolver

El borrador PORTFOLIO-02 permite `IN_CONVERSATION → CLOSED` y `PAUSED → CLOSED`, pero no `IDENTIFIED → CLOSED` ni `CONTACTED → CLOSED`. Esto impide descartar inmediatamente una ficha duplicada o un contacto que rechazó participar. **Recomendación pendiente de aprobación**: permitir `IDENTIFIED/CONTACTED → CLOSED` solo con `DISQUALIFIED` o `LOST` según el caso; evitar cerrar `WON` sin evidencia de acuerdo.

## Decisiones que debe tomar Dirección

- D1. ¿Aprobar `WON`, `LOST` y `DISQUALIFIED` como resultados iniciales?
- D2. ¿Un `WON` representa acuerdo verbal, intención documentada o aceptación de condiciones?
- D3. ¿Permitir cierre desde `IDENTIFIED` y `CONTACTED` con justificación?
- D4. ¿Quién puede cerrar como `WON`? ¿Requiere revisión SUPER_ADMIN?
- D5. ¿Permitir reapertura? Si sí, quién, con qué motivo y con qué registro de auditoría.

## Implicación técnica: gate antes de ejecución

**No ejecutar el SQL de PORTFOLIO-02 todavía.** Su función `change_expansion_prospect_status` permite `CLOSED` sin resultado. Antes de autorizar la instalación, ajustar el contrato de cierre, añadir columnas o tabla de resultados según decisión, restricciones consistentes, permiso específico si procede y pruebas de cierre y rollback.

## Secuencia posterior

1. Aprobar decisiones D1–D5.
2. Diseñar migración versionada con preflight, funciones y eventos de auditoría, sin ejecutar.
3. Revisar permisos, RLS, SECURITY DEFINER y tests.
4. Solicitar autorización explícita para aplicar en Supabase real.
5. Conectar expediente en Preview; no publicar en producción sin autorización independiente.
