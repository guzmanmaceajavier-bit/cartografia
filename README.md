# Cartografía de Paz · Sahagún, Córdoba

Aplicación web para documentar lugares, actores, afectaciones, memorias y experiencias de construcción de paz en el territorio. Incluye mapa interactivo basado en Leaflet, fichas, figuras, filtros, exportación/importación de respaldos e impresión.

## Tecnologías

- HTML, CSS y JavaScript sin framework de compilación.
- Leaflet incluido en `vendor/leaflet`.
- Función serverless `api/estado.js` para persistencia compartida.
- Turso/libSQL como base de datos, mediante variables de entorno del servidor.

## Ejecutar localmente

La página principal es `index.html`. Para probar también la API, utiliza un entorno compatible con funciones serverless de Vercel:

```bash
npm install
npx vercel dev
```

Configura en el entorno del servidor:

- `TURSO_URL`: URL de la base de datos Turso.
- `TURSO_TOKEN`: token de acceso de Turso.

No guardes estas credenciales en JavaScript del navegador ni en el repositorio. Sin las variables de entorno, la aplicación puede conservar cambios en el almacenamiento local del navegador, pero la persistencia compartida en la nube no estará disponible.

## Despliegue

Importa el repositorio en Vercel y configura las dos variables de entorno para el entorno que vayas a probar. Después de cambiarlas, vuelve a desplegar. Comprueba la ruta `/api/estado`: un GET debe responder JSON; si falta configuración, la API debe indicar que el servidor no está configurado.

## Comprobaciones antes de publicar

1. Crear una ficha y recargar la página.
2. Crear, editar y eliminar una ficha; comprobar el mapa y los filtros.
3. Dibujar una figura y verificar que persiste después de recargar.
4. Exportar e importar un respaldo JSON válido.
5. Probar la aplicación con la API disponible y sin las variables configuradas.
6. Revisar la consola del navegador y los logs de la función serverless.

## Importante sobre privacidad

La información de cartografía puede incluir testimonios o ubicaciones sensibles. Antes de publicar datos reales, configura controles de acceso y autorización en el servidor. La autenticación de la interfaz no protege por sí sola la API. Evita publicar datos identificables de víctimas o personas en riesgo sin consentimiento.
