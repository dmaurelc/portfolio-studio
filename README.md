# Portfolio Studio

Aplicación web para generar y presentar capturas profesionales de sitios web en fichas de portfolio. Recibe una o varias URLs, detecta secciones relevantes, captura cada vista y permite aplicar una presentación visual consistente antes de descargar las imágenes.

![Interfaz de Portfolio Studio](docs/portfolio-studio-cover.jpg?v=2)

## Características

- Procesamiento de hasta **10 URLs por lote** y 2 sitios simultáneos.
- Perfil **Landing page**: portada 16:9 y hasta 3 secciones.
- Perfil **Sitio informativo**: portada 16:9 y hasta 6 secciones o páginas internas.
- Galerías con proporciones 4:3, 1:1, 3:2, 16:9, 4:5 o personalizadas.
- Exportación en WebP, PNG y JPG.
- Control de dimensiones y calidad de salida.
- Marcos de navegador, fondos sólidos o degradados, bordes, radios y sombras.
- Ajustes independientes de rotación, zoom y posición para cada imagen.
- Lightbox con navegación mediante botones y teclado.
- Descarga individual, ZIP por proyecto o ZIP del lote completo.
- Nombres automáticos: `nombre-sitio-portada` y `nombre-sitio-preview-X`.

## Arquitectura

```text
Navegador
  ├─ Interfaz React/Vinext
  ├─ Editor visual con Canvas
  └─ Exportación y creación de ZIP
        │
        ▼
/api/capture (servidor)
        │ autorización privada
        ▼
Cloudflare Worker + Browser Rendering
  ├─ Analiza títulos, secciones y enlaces internos
  └─ Genera capturas con viewport 1920 × 1080
```

El secreto del servicio de captura nunca se envía al navegador. La aplicación llama a `/api/capture`, que actúa como proxy protegido hacia el Worker.

## Requisitos

- Node.js 22.13 o posterior.
- Una cuenta de Cloudflare con Browser Rendering para capturas reales.
- Un Worker desplegado desde `backend/browser-worker.js`.

## Instalación local

```bash
corepack enable
pnpm install
pnpm dev
```

Crea un archivo `.dev.vars` en la raíz:

```dotenv
CAPTURE_ENDPOINT=https://tu-worker.example.workers.dev
CAPTURE_SECRET=un-secreto-largo-y-aleatorio
```

`.dev.vars` está ignorado por Git y no debe subirse al repositorio.

## Configuración del capturador

El archivo `backend/browser-worker.js` necesita:

1. Un binding de Cloudflare Browser Rendering llamado `BROWSER`.
2. Un secreto de Worker llamado `CAPTURE_SECRET`.
3. La misma clave configurada como `CAPTURE_SECRET` en el frontend alojado.
4. La URL pública del Worker configurada como `CAPTURE_ENDPOINT`.

El endpoint acepta dos operaciones internas:

- `analyze`: inspecciona la página y devuelve secciones y enlaces internos candidatos.
- `shot`: genera una captura de la URL y posición solicitadas.

## Comandos

```bash
pnpm dev       # servidor de desarrollo
pnpm build     # build de producción
pnpm start     # ejecuta localmente el Worker compilado
pnpm lint      # revisión de código
```

## Estructura principal

```text
app/page.tsx                 Interfaz, lote, estados y lightbox
app/api/capture/route.ts     Proxy seguro hacia el capturador
app/globals.css              Sistema visual y responsive
lib/render.ts                Canvas, formatos, nombres y ZIP
backend/browser-worker.js    Capturas con Cloudflare Browser Rendering
public/                      Iconos y recursos públicos
```

## Flujo de uso

1. Selecciona **Agregar URLs**.
2. Pega una URL por línea y elige Landing o Informativo.
3. Genera el lote.
4. Selecciona una captura para ajustar rotación, zoom y posición.
5. Configura formato, medidas, proporción y estilo general.
6. Descarga una imagen, un ZIP del sitio o el lote completo.

Las imágenes se mantienen temporalmente en la memoria del navegador. Deben descargarse antes de cerrar o recargar la pestaña.

## Seguridad y límites

- Solo se aceptan URLs HTTP y HTTPS públicas.
- El backend bloquea patrones de red local, credenciales embebidas y puertos no permitidos.
- Cada lote está limitado a 10 proyectos.
- El servidor aplica tiempo máximo a cada solicitud.
- El acceso al motor requiere `CAPTURE_SECRET`.
- Algunos sitios pueden impedir las capturas mediante protección anti-bot, autenticación o restricciones de red.

## Despliegue

La interfaz está preparada para Sites/Vinext:

```bash
pnpm build
```

En producción deben configurarse `CAPTURE_ENDPOINT` y `CAPTURE_SECRET` como variables del entorno de servidor. El Worker de Cloudflare se despliega por separado con su binding `BROWSER`.

## Licencia

Copyright © Daniel Maurel. El repositorio no incluye todavía una licencia de redistribución.
