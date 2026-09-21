# 🦴 AnatoCut 3D - Visor Anatómico Didáctico

> **🌐 Sitio Web en Vivo:** [https://ambystomatechnologies.github.io/visor-3d/](https://antoniovagritte.github.io/visor-3d/)  
> **Desarrollado por:** Ambystoma Technologies (*Science and Technology Applications*)  
> **Contacto:** [ambystomatechnologies@gmail.com](mailto:ambystomatechnologies@gmail.com)

Un visor 3D médico/anatómico interactivo, ultraligero y fluido, desarrollado con **Three.js** y **Vanilla Web Standards (ES Modules)**. Diseñado específicamente para que docentes de anatomía, medicina y biología puedan compartir modelos 3D de huesos y órganos con sus estudiantes mediante **GitHub Pages** sin necesidad de servidores ni bases de datos.

---

## 🌟 Características Destacadas

- 🔪 **Herramienta de Corte Didáctica (Cross-Section Slicing)**:
  - Realiza secciones en los 3 planos anatómicos estándar: **Axial (Transversal)**, **Sagital** y **Coronal (Frontal)**, además de un modo de **Ángulo Libre**.
  - **Tapa de corte sólida (Solid Stencil Cap)**: Rellena la sección cortada con color anatómico (médula ósea / tejido esponjoso) para evitar que el hueso se vea hueco.
  - **Inversión de vista**: Permite alternar con un solo clic entre ver la mitad anterior o posterior del hueso.
  - **Escaneo continuo animado**: Modo de reproducción automática tipo tomografía computarizada (TAC) a 60 FPS.
  - **Guía visual de corte**: Plano semitransparente con borde luminoso orientativo.
  - **100% no destructivo**: Diseñado exclusivamente para visualización y aprendizaje, sin alterar los archivos originales.

- 📦 **Carga Universal de Modelos 3D y Texturas**:
  - **GLTF / GLB**: Carga directa y optimizada con texturas PBR integradas.
  - **OBJ + MTL + Texturas (PNG, JPG, WebP)**: Arrastra el archivo `.obj` junto con su `.mtl` y las imágenes de textura al mismo tiempo. El visor mapea automáticamente las texturas en la memoria del navegador.
  - **STL y PLY**: Soporte nativo para mallas de tomografías clínicas y escáneres 3D.
  - **Drag & Drop**: Arrastra archivos directamente sobre cualquier parte de la ventana.

- ⚡ **Rendimiento Fluido a 60 FPS**:
  - Renderizado acelerado por hardware WebGL.
  - Control de cámara con inercia suave (`OrbitControls`), iluminación de estudio médico de 3 puntos (Key, Fill, Rim) y sombra de contacto.
  - Modos visuales: *Realista con texturas*, *Hueso Yeso*, *Rayos X translúcido* y *Malla poligonal*.

- 🚀 **100% Compatible con GitHub Pages**:
  - No requiere compiladores (`npm run build`), Node.js ni bundlers. Funciona directamente con solo subir los archivos.

---

## 🚀 Cómo Publicar en GitHub Pages (en 2 minutos)

1. **Crea un repositorio en GitHub**:
   - Por ejemplo: `visor-anatomico-3d`.
2. **Sube todos los archivos de esta carpeta a la raíz del repositorio**:
   ```bash
   git init
   git add .
   git commit -m "Versión inicial de AnatoCut 3D"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/visor-anatomico-3d.git
   git push -u origin main
   ```
3. **Activa GitHub Pages**:
   - Ve a tu repositorio en GitHub > **Settings** (Configuración) > **Pages** (en el menú lateral izquierdo).
   - En **Build and deployment > Source**, selecciona `Deploy from a branch`.
   - En **Branch**, selecciona `main` y la carpeta `/(root)`.
   - Haz clic en **Save**.
4. ¡Listo! En un minuto tu visor estará activo y disponible públicamente en:  
   `https://TU_USUARIO.github.io/visor-anatomico-3d/`

---

## 💻 Cómo Probar Localmente

### Opción 1 (La más fácil - Doble clic):
Simplemente haz **doble clic en el archivo [`start.bat`](file:///d:/Mis%20Documentos/Proyectos/Visor%203d/start.bat)**. Iniciará el servidor y abrirá tu navegador automáticamente en `http://localhost:8080`.

### Opción 2 (Desde terminal con Python):
Abre una terminal en esta carpeta y ejecuta:
```bash
python -m http.server 8080
```
Luego abre tu navegador en: [http://localhost:8080](http://localhost:8080)

---

## 📖 Guía de Uso para Docentes

1. **Probar de inmediato**:
   - Al abrir el visor, ya se incluye un **fémur anatómico humano de muestra** con morfología realista (cabeza femoral, cuello, trocánter, diáfisis arqueada y cóndilos distales) y textura ósea natural.
2. **Activar el corte**:
   - Activa el interruptor en el panel derecho *"Herramienta de Sección y Corte"*.
   - Elige el plano: **Axial**, **Sagital** o **Coronal**.
   - Desplaza el slider de posición para navegar por las distintas capas y secciones del hueso.
   - Pulsa *"Invertir Vista"* para cambiar la perspectiva de la pieza.
3. **Cargar huesos de tus clases**:
   - Si tienes un hueso en formato `.obj` con sus texturas en imágenes, simplemente selecciona o arrastra juntos los archivos `.obj`, `.mtl` y los `.jpg`/`.png`.
4. **Tomar capturas para exámenes o presentaciones**:
   - Haz clic en el icono de cámara fotográfica en la barra superior para descargar instantáneamente una imagen PNG nítida de la sección anatómica actual.
