# 📚 Guía de Implementación: Sistema de Contenido de Cursos (Opción JSONB)

## 🎯 Objetivo General
Permitir que los docentes o instructores puedan crear, estructurar y publicar el contenido de sus cursos dentro de la plataforma.  
Cada curso podrá incluir videos, materiales descargables (como PDF o ZIP), textos explicativos y cualquier otro recurso académico necesario.

---

## 🧩 Descripción General
El sistema de contenido se implementará directamente sobre la tabla `courses`, agregando una columna llamada `content` que almacenará la estructura del curso en formato JSON.  
De esta forma, no es necesario crear nuevas tablas y todo el contenido estará vinculado al curso correspondiente.

Esta solución está pensada para proyectos de hackathon, donde se busca funcionalidad real con una implementación rápida y completamente integrada a Supabase.

---

## 🪶 Cambios necesarios en la base de datos
Se agregará una nueva columna llamada `content` de tipo **JSONB** dentro de la tabla `courses`.  
Esa columna servirá para guardar toda la información relacionada con el contenido del curso: módulos, lecciones, materiales y enlaces.

Ejemplo de lo que contendrá:
- Nombre de los módulos o secciones.
- Títulos de las clases o lecciones.
- Tipo de contenido (video, pdf, texto, etc.).
- Enlaces de YouTube, Vimeo o archivos alojados en Supabase Storage.
- Material de apoyo descargable (PDF, ZIP, DOCX, etc.).

---

## 📦 Almacenamiento de materiales
Los archivos del curso se guardarán en **Supabase Storage**.  
Para esto se debe crear un bucket público con el nombre `course-documents`.  
En ese espacio los instructores podrán subir materiales como guías, presentaciones o archivos de ejercicios.

Los videos no se subirán directamente a Supabase, sino que se enlazarán desde plataformas externas como YouTube o Vimeo para optimizar el almacenamiento.

---

## 👩‍🏫 Funcionalidad para instructores
Los instructores podrán:
1. Crear un curso desde su panel personal.
2. Agregar secciones o módulos al curso.
3. Añadir lecciones dentro de cada módulo.
4. Enlazar videos o subir materiales descargables.
5. Guardar y actualizar el contenido del curso.
6. Publicar el curso cuando esté completo.

El sistema registrará automáticamente el ID del instructor en el curso, por lo que cada docente podrá ver los cursos que ha publicado en su propio dashboard.

---

## 🧑‍🎓 Funcionalidad para estudiantes
Los estudiantes podrán:
1. Ver el listado de cursos disponibles.
2. Inscribirse en los cursos que deseen.
3. Acceder al contenido completo del curso.
4. Reproducir videos directamente desde la plataforma.
5. Descargar materiales complementarios (PDF, ZIP, etc.).
6. Marcar las lecciones como completadas.
7. Completar el curso y generar automáticamente su microcredencial o certificado digital.

---

## 🎓 Flujo de interacción entre docente y estudiante
1. **El instructor crea y publica un curso.**  
   Define el título, descripción, categoría y nivel de dificultad.

2. **El instructor agrega el contenido del curso.**  
   Estructura las secciones, sube materiales y añade enlaces a videos.

3. **El curso se publica y aparece en el catálogo general.**

4. **El estudiante se inscribe y accede al contenido.**  
   Puede ver los módulos, reproducir videos y descargar materiales.

5. **El estudiante completa las lecciones.**  
   El progreso se actualiza automáticamente en el sistema.

6. **Al finalizar el curso, se emite una microcredencial.**  
   Se genera un certificado con identificador único y código QR.

---

## 📊 Panel del instructor
Cada instructor dispondrá de un panel donde podrá:
- Consultar los cursos que ha creado.
- Ver el estado de publicación (borrador o publicado).
- Editar el contenido de cada curso.
- Actualizar materiales o enlaces.
- Visualizar cuántos estudiantes están inscritos en cada curso.

---

## 🧱 Estructura general del contenido
Cada curso estará compuesto por:
- **Módulos o secciones:** agrupan temas o unidades de aprendizaje.  
- **Lecciones:** cada lección puede contener videos, documentos o textos.  
- **Recursos:** materiales descargables relacionados con cada lección.

Ejemplo:
- Módulo 1: Introducción  
  - Lección 1: Video de bienvenida  
  - Lección 2: Guía en PDF  
- Módulo 2: Fundamentos  
  - Lección 3: Conceptos básicos  
  - Lección 4: Actividades prácticas

---

## 🔐 Integración con Supabase Auth
El sistema usará Supabase Auth para controlar los roles:
- **Instructor:** puede crear, editar y publicar cursos.
- **Estudiante:** puede inscribirse, ver contenido y completar cursos.
- **Administrador:** puede supervisar todos los cursos y credenciales emitidas.

Las políticas de seguridad (RLS) ya implementadas en la base garantizan que:
- Un instructor solo pueda modificar sus propios cursos.
- Un estudiante solo pueda acceder a los cursos en los que está inscrito.

---

## 🪪 Integración con microcredenciales
Una vez que el estudiante complete todas las lecciones del curso:
1. El progreso se registra como 100% en la tabla `course_enrollments`.
2. Automáticamente se crea una nueva microcredencial vinculada al curso y al estudiante.
3. Se genera un certificado digital con:
   - Código único.
   - Código QR.
   - Enlace público de validación.
4. El estudiante podrá visualizar, descargar y compartir su certificado.

---

## 🌐 Verificación pública de certificados
Cada certificado emitido contará con un identificador único y un código QR.  
Al escanear el QR o ingresar el código manualmente, se accederá a una página pública donde se mostrará:
- Nombre del estudiante.
- Nombre del curso.
- Fecha de emisión.
- Estado del certificado (válido o inválido).
- Nombre del instructor o institución emisora.

Esta página será pública y no requerirá inicio de sesión.

---

## 💡 Beneficios de este enfoque
- Se usa únicamente **Supabase** (Auth, Database y Storage).
- No requiere nuevas tablas, solo una columna adicional.
- Fácil de implementar y mantener.
- Permite subir y organizar materiales sin depender de servicios externos.
- Cumple con todos los **requerimientos del hackathon**.
- Escalable: puede evolucionar luego a un sistema modular con tablas de lecciones.

---

## ✅ Resultado esperado
Al finalizar la implementación, el sistema permitirá que:
- Los docentes creen y gestionen sus propios cursos con contenido multimedia.
- Los estudiantes accedan al contenido, registren su progreso y obtengan microcredenciales automáticas.
- La institución pueda emitir, validar y listar todas las microcredenciales generadas.

