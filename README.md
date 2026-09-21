# Portfolio Capture Studio

Mini aplicación para generar capturas consistentes y presentarlas como piezas de portfolio. Admite varias URLs por lote, portada 16:9, galerías con proporciones configurables, encuadre por imagen y descarga individual o en ZIP.

## Funciones

- Hasta 10 URLs por lote y 2 procesos simultáneos.
- Perfil **Landing**: portada y hasta 3 secciones.
- Perfil **Informativo**: portada y hasta 6 secciones o páginas internas.
- Salida WebP, PNG o JPG con tamaño, proporción y calidad configurables.
- Marcos de navegador, fondos, degradados, bordes, esquinas y sombras.
- Rotación, zoom y posición independientes para cada captura.
- Lightbox y nombres de archivo preparados para portfolio.

## Desarrollo local

Requiere Node.js 22.13 o posterior.

```bash
npm install
npm run dev
```

La ruta `/api/capture` usa un servicio remoto de navegador. Configura estas variables en `.dev.vars` para desarrollo:

```dotenv
CAPTURE_ENDPOINT=https://tu-worker.example.workers.dev
CAPTURE_SECRET=tu-secreto
```

## Producción

```bash
npm run build
```

El frontend está preparado para Sites/Vinext. El servicio de captura está en `backend/browser-worker.js` y requiere un Worker de Cloudflare con Browser Rendering enlazado como `BROWSER`, además del secreto `CAPTURE_SECRET`.

## Seguridad

El secreto del capturador permanece en el servidor. Las URLs se validan antes de enviarlas al motor y la aplicación limita cada lote a 10 proyectos.
