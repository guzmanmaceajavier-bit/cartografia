# Cartografía de Paz · Sahagún, Córdoba

Aplicación web para documentar lugares, actores, afectaciones, memorias y experiencias de construcción de paz en el territorio. Incluye mapa interactivo basado en Leaflet, fichas, figuras, filtros, exportación/importación de respaldos e impresión.

## Actualización funcional — 24 de octubre de 2026

- Catálogo ampliado de símbolos para lugares y categorías temáticas.
- Búsqueda de símbolos por concepto (por ejemplo, iglesia, finca, violencia, salud, memoria y paz).
- Posibilidad de escribir o pegar un emoji o símbolo personalizado.
- Sincronización de los símbolos de las ocho categorías con el cuadro de convenciones y su representación en el mapa, sin alterar los símbolos específicos asignados a cada lugar.

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

La aplicación no requiere inicio de sesión, como corresponde a este ejercicio de cartografía. Por eso, si el sitio se publica en internet, cualquier persona que pueda acceder a él podría consultar o modificar los registros, según la configuración del servidor. No publiques testimonios, nombres de víctimas ni ubicaciones sensibles sin consentimiento. Para usarla con información privada o real de personas en riesgo, configura controles de acceso y autorización en el servidor.
