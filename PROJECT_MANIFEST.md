# 📋 Manifiesto del Proyecto: AnatoCut 3D Didáctico

> **Desarrollado por:** Ambystoma Technologies (*Science and Technology Applications*)  
> **Contacto oficial y soporte:** [ambystomatechnologies@gmail.com](mailto:ambystomatechnologies@gmail.com)

---

## 🌐 Enlaces y Publicación en Producción

| Recurso | Enlace |
| :--- | :--- |
| **Sitio Web Público en Vivo** | [https://antoniovagritte.github.io/visor-3d/](https://antoniovagritte.github.io/visor-3d/) |
| **Repositorio en GitHub** | [https://github.com/AntoniovaGritte/visor-3d](https://github.com/AntoniovaGritte/visor-3d) |
| **URL Remota Git (Clone / Push)** | `https://github.com/AntoniovaGritte/visor-3d.git` |
| **Rama de Publicación (Branch)** | `main` |
| **Hosting** | GitHub Pages (Gratuito, SSL/HTTPS automático, CDN global) |

---

## 🚀 Procedimiento Rápido para Futuras Actualizaciones

Cada vez que realices cambios, agregues nuevos modelos 3D o modifiques el visor, se actualiza en vivo con un solo clic:

### Método 1 (Automático - 1 Clic):
Hacé doble clic en el archivo:
👉 **`publicar_a_github.bat`**  
Este script guardará automáticamente todos los cambios, creará el commit y lo enviará a GitHub. En aproximadamente 30 a 60 segundos, GitHub Pages actualizará la web en vivo.

### Método 2 (Desde la consola / Terminal):
```bash
git add .
git commit -m "Descripción de los cambios realizados"
git push origin main
```

> **Consejo de actualización en el navegador:**  
> Cuando actualices la web, si tu navegador guarda en memoria la versión vieja, recargá la página usando **`Ctrl + F5`** (o vaciando la caché de la pestaña). También podés incrementar el parámetro `?v=...` en `index.html`.

---

## 🦴 Catálogo de Modelos de Muestra Integrados

Ubicación de los archivos: Carpeta `/Muestras/`

1. **Vértebra de Ave** (`Muestras/vertebra de ave.glb`) - *Aves / Ornitología*
2. **Cráneo de Pájaro** (`Muestras/Cráneo de pájaro.glb`) - *Aves / Ornitología*
3. **Cráneo de Perro** (`Muestras/Cráneo de perro.glb`) - *Mamíferos / Cánidos*
4. **Cráneo de Oveja** (`Muestras/Cráneo de oveja.glb`) - *Mamíferos / Rumiantes*
5. **Cráneo de Cabra** (`Muestras/Cráneo de cabras.glb`) - *Mamíferos / Bóvidos*
6. **Vértebra de Caballo** (`Muestras/Vértebra caballo.glb`) - *Mamíferos / Équidos*
7. **Vértebra de Pez** (`Muestras/Vertebra pez.glb`) - *Ictiología / Peces*
8. **Vértebra de Corvina** (`Muestras/vertebra corbina.glb`) - *Ictiología / Peces marinos*

---

## 🛠️ Arquitectura y Tecnologías del Proyecto

- **Motor 3D:** Three.js (v0.165.0 vía ES Modules / CDN)
- **Técnica de Sección Transversal:** Hardware Stencil Buffer con materiales duales (Forward & Back facing) y Solid Cap con tono medular/óseo.
- **Controles de Cámara y Muestra:**
  - `OrbitControls` sin inercia residual (`enableDamping = false`) para detención instantánea al soltar el ratón.
  - Mesa giratoria continua (`autoRotate = true` por defecto al abrir la aplicación).
  - Rotación anatómica independiente de la muestra en **Eje X (Inclinación Vertical)** y **Eje Z (Rotación Frontal / Roll)** sin alterar el espacio ni la cámara.
- **Soporte de Formatos:** `.glb`, `.gltf`, `.obj + .mtl + texturas`, `.stl`, `.ply`.
- **Compatibilidad:** 100% estático, sin dependencias de Node.js ni compilación en tiempo de ejecución.
