# Instrucciones y Reglas de Desarrollo del Proyecto

## 🚫 REGLA ESTRICTA: NO REALIZAR PRUEBAS EN EL NAVEGADOR (NO BROWSER_SUBAGENT)

1. **El usuario es quien realiza el debug y las pruebas directamente en su navegador**:
   - Queda terminantemente **PROHIBIDO** invocar la herramienta `browser_subagent` o realizar pruebas automatizadas en el navegador por cuenta del agente.
   - El agente debe aplicar las modificaciones de código directamente, verificar la sintaxis de forma estática o mediante comandos rápidos no bloqueantes, y presentar los cambios al usuario para que él los pruebe.

2. **Flujo de trabajo para cada solicitud**:
   - Analizar el requerimiento del usuario.
   - Modificar los archivos correspondientes (`index.html`, `css/styles.css`, `js/*.js`, etc.).
   - Incrementar el parámetro de versión de ruptura de caché (`?v=...`) en `index.html` y los módulos JS si es necesario.
   - Explicar brevemente los cambios realizados de forma concisa y dejar que el usuario recargue su navegador y pruebe.
