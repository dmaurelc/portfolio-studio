# Diseño: Regeneración por captura, editor de secciones y marcos de dispositivo

Fecha: 2026-09-21 · Estado: aprobado · Ciclo: brainstorm → plan → implement

## Problema

Portfolio Studio obliga a rehacer el lote completo (hasta 10 sitios × 7 vistas) para ajustar una sola imagen, no permite corregir qué secciones se capturan, y sus marcos (navegador/minimal) no cubren el caso estrella de un portfolio: la ficha con mockup de dispositivo.

**Contexto de uso**: herramienta personal (un solo usuario). Filtro de decisión: YAGNI/KISS — nada de persistencia server-side, multiusuario ni editor tipo Figma.

## Requisitos

- R1: regenerar una captura individual sin tocar el resto del lote, conservando encuadre editado.
- R2: ver y editar la lista de secciones (Y + etiqueta) de cada proyecto; añadir/eliminar secciones manualmente.
- R3: marcos de portátil, monitor y móvil dibujados en canvas, nítidos a cualquier tamaño de export.
- R4: captura en viewport vertical (390×844) para que el marco de móvil tenga sentido.

## Opciones evaluadas

| Opción | Veredicto |
|--------|-----------|
| Preview interactivo del scroll (mini-mapa para elegir Y) | Descartada. Caro; el flujo "editar Y → ↻ regenerar" ya da feedback visual con F1. |
| Placeholders de capturas fallidas reintentables | Descartada. Ruido de estado; con F2 el usuario recrea la vista que falló. |
| PNG overlays de dispositivos | Descartada. Se degrada con export grande, ata a resoluciones, difícil de mantener. |
| Marcos procedurales en canvas | **Elegida.** Misma arquitectura que el marco navegador actual; vectorial, themeable. |
| Skeuomorfismo 3D en marcos | Descartada. Choque con estética flat Vercel-oro; riesgo de aspecto clipart. |

## Solución acordada

### F1 · Regeneración por captura

- **Cambio de modelo**: `Shot` gana `captureY:number` y `gallery:boolean` (hoy el Y de captura se descarta en `load()`, page.tsx:12; `y` es desplazamiento del editor).
- `runOne` (page.tsx:22) puebla ambos campos al capturar.
- Acción `regenerate(shot)`: `api({action:'shot', url:shot.url, y:shot.captureY, gallery:shot.gallery})` → decodificar → reemplazar `src/image` **conservando** `angle/zoom/x/y` del editor → `URL.revokeObjectURL` del anterior.
- **UI**: botón ↻ en cada miniatura del filmstrip y en la imagebar; spinner aislado por tarjeta (estado `regenerating:Set<index>`); error → `.notice`.
- Bloqueada mientras `busy` (generación de lote en curso).

### F2 · Editor de secciones

- **Cambio de modelo**: `Project.sections: {y:number,label:string}[]` pasa a ser fuente de verdad; `runOne` la guarda tras `analyze` (hoy los targets se descartan). `shots` se regeneran desde sections.
- **UI**: panel "Secciones" bajo el filmstrip. Fila: miniatura · input label · input Y (0–30000, tope del worker) · ↻ · ✕. Botón "+ Añadir sección" (captura inmediata con spinner).
- Cambiar Y en una fila existente = editar + ↻ (no auto-captura al teclear).
- Eliminar sección elimina su shot. Portada (index 0) no editable en Y, sí renombrable.
- El `<select>` de tipo (landing/informativo) sigue definiendo el nº de secciones del lote, pero el usuario puede excederlo manualmente.

### F3 · Marcos de dispositivo + worker

- **Worker** (`backend/browser-worker.js` + redeploy): `viewport` acepta `{width,height}`; height por defecto `round(width*1080/1920)` para mantener comportamiento actual. Nuevas vistas móvil envían 390×844. `valid()` y secretos no cambian.
- **render.ts**: `settings.frame` extiende a `none|browser|minimal|laptop|monitor|phone`.
  - Laptop: pantalla landscape con bisel fino + base trapezoidal plana; la imagen ocupa el área de pantalla.
  - Monitor: igual sin base, mástil inferior opcional — mantener simple.
  - Phone: marco portrait, radio grande, pastilla "dynamic island", botones laterales; **solo tiene sentido con shot capturada en viewport vertical**.
- Estilo flat: colores derivados de `settings.color`/neutrales, sin degradados fake-3D. `angle/zoom` rotan la imagen **dentro** del marco; el marco queda upright (igual que el chrome del navegador actual).
- **UI**: los 3 marcos nuevos en el select "Marco"; al elegir phone, ofrecer toggle "recapturar en móvil" que dispara regenerate con viewport 390×844 (marca `shot.mobile=true`, persiste en sections para regeneraciones futuras).

## Riesgos

- **Marcos con aspecto "clipart"** → geometría sobria, validación visual con capturas reales antes de cerrar.
- **Browser Rendering cobra por uso** en pruebas de viewport móvil → baratas, <10 capturas.
- **Regenerar durante lote** compite con el runner → ya bloqueado por `busy`.
- **Tipo `Shot` cambia** → sin persistencia entre sesiones, sin migraciones que hacer (ventaja de ser app en memoria).

## Métricas de éxito

1. Corregir 1 de 7 vistas cuesta 1 clic, no 1 lote (~35 s → ~6 s por vista).
2. Un proyecto con secciones mal detectadas es reparable sin salir de la app.
3. Ficha exportada con marco laptop y móvil se ve profesional a 1920 px y a 800 px.

## Addendum (2ª ronda): F4 CLI headless

**Pregunta del usuario**: ¿puede otra harness generar fichas por terminal sin tocar la UI? **Hoy**: solo capturas crudas vía HTTP al Worker (`analyze`/`shot` con Bearer). La composición (marco/fondo/formato/ZIP) vive en el canvas del navegador.

**Decisión**: ruta A — CLI Node (`scripts/capture-cli.mjs`) que comparte `draw()` con la app vía refactor `lib/render-core.ts` (un solo motor de render, sin segundo camino tipo Satori ni automatización de UI). Modo lote con ZIP. Flags mapeados 1:1 a `Settings` (ver contrato completo en phase-06). Secreto solo por env/`.dev.vars`, nunca argv.

**Orden**: Phase 6 tras F3 (nace con marcos dispositivo); prerequisito = refactor render-core en la propia fase 6. Effort +3h (total ~12h).

## Orden de implementación

1. Modelo (`captureY`, `sections`) + worker viewport → 2. F1 → 3. F2 → 4. F3 marcos → 5. validación visual UI → 6. F4 CLI headless (refactor render-core + flags + ZIP) + su validación.

## Archivos afectados

`app/page.tsx`, `lib/render.ts`, `backend/browser-worker.js` (redeploy), tipos compartidos en `lib/render.ts`.
