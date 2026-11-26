# WOLVES FIT STUDIO — Motor 3D y ruta de realismo (prototipo)

**Estado:** rama de exploración privada. **No habilitar pagos, inventario, checkout ni EXPANSIÓN.**

## 1. Hechos observados y límites

- El prototipo anterior renderiza geometría Three.js y rota 360°; no representa anatomía o tejidos realistas.
- El video aportado muestra un configurador visual de prendas con modelo humano, pero no proporciona código fuente, dependencias ni prueba del motor 3D. Que el autor dijera que utilizó Claude describe una ayuda de desarrollo, **no** el motor gráfico ejecutado.
- Una sola fotografía facial no es una medición fiable del cuerpo ni permite prometer ajuste real, caída de telas o tallas.

## 2. Decisión arquitectónica

Conservar **Next.js 16** y **Three.js/WebGL** para la experiencia web; usar **GLB/glTF 2.0** como formato contractual de activos (mallas, materiales PBR, texturas, armature y posibles morph targets). No necesitamos Unreal Engine para el primer visor web y no instalaremos paquetes de visión computacional antes de necesitar sus capacidades.

Etapas del componente:
1. V0.2: inspeccionar avatares humanos GLB **locales**, sin subir archivos a servidores. El usuario puede volver al avatar geométrico. La ropa del avatar base no se aplica automáticamente a mallas externas.
2. V0.3: escoger un **avatar base aprobado** (propio o con licencia comercial documentada) y tres prendas Wolves modeladas sobre el **mismo cuerpo/rig**, con geometrías separadas y texturas correctas; carga optimizada y control móvil.
3. V0.4: identidad facial opcional, con extracción de puntos de referencia local mediante MediaPipe Face Landmarker y adaptación consentida al rig humano. Medir fallos con diferentes fotos, oclusiones, tonos, expresiones; alternativa sin foto.
4. V1: composición real de prendas, exportar look con avisos de carácter ilustrativo y registro de rendimiento. No agregar transacciones hasta autorización comercial.

## 3. Requisitos de los assets

- Avatar masculino de cuerpo completo, proporciones humanas y anatomía consistente.
- GLB optimizado para móvil; texturas PBR comprimidas; origen y escala homogéneos.
- Garments: hoodie, polo, bermuda y gorra como meshes independientes con topología y skinning compatibles; no recoloración ficticia de un mismo torso.
- Texturas de las prendas y branding de Wolves aprobados visualmente; verificar que representan mercancía real.
- Licencias comerciales conservadas por asset. No copiar modelos del video sin licencia.
- Presupuesto inicial de rendimiento: medir FPS, tiempo a interacción, transferencia de recursos y memoria en Android de gama media antes de fijar límites.

## 4. Privacidad y seguridad

- En la versión de prueba: la foto y el GLB se procesan en el navegador, no se cargan a Supabase.
- Debe existir eliminación explícita y no persistencia accidental de fotos.
- La función de exportación de imagen es optativa.
- Para cualquier procesamiento externo futuro: consentimiento inequívoco, retención definida y revisión de protección de datos personales.

## 5. Criterios de aceptación de la etapa siguiente

- El GLB importado representa un cuerpo real y puede rotarse 360° sin deformaciones.
- Ante un archivo inválido o excesivo, el avatar base sigue disponible y el error es comprensible.
- El modo fotográfico no promete identidad tridimensional exacta.
- El catálogo comercial de prendas no simula falsamente compatibilidad con un GLB arbitrario.
- No hay cambios a pagos, datos, RLS, checkout, EXPANSIÓN o release comercial.

**Próxima decisión de producción visual:** seleccionar y preparar un avatar base autorizado y los archivos 3D de prendas Wolves. Sin esos activos no es posible evaluar el realismo del vestido aunque el motor de renderizado esté listo.
