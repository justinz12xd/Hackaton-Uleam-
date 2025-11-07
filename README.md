# 🧱 Adaptación del Sistema a Eventos con Recursos Opcionales

## 🎯 Objetivo General
Permitir que los **instructores creen eventos o talleres académicos** y, de forma opcional, puedan asociarles **recursos digitales** (videos, guías, PDFs, presentaciones) accesibles únicamente para los participantes que hayan sido validados y cuenten con una microcredencial emitida.

---

## 🧩 Nueva estructura lógica

1. **Evento/Taller (principal)**  
   - Representa la actividad académica registrada en el sistema.  
   - Es la base para el registro de asistencia y la emisión de microcredenciales.

2. **Microcredencial (verificación)**  
   - Se emite automáticamente tras validar la asistencia del participante.  
   - Contiene código único y código QR verificable públicamente.  
   - Está vinculada al evento o taller correspondiente.

3. **Recursos del evento (opcional)**  
   - Son materiales digitales complementarios que el instructor puede asociar al evento.  
   - Se gestionan desde un editor tipo Udemy.  
   - Solo son accesibles por usuarios con microcredencial válida para ese evento.

---

## ⚙️ Flujo general del sistema

1. **Creación del evento**
   - El instructor registra un nuevo evento o taller.  
   - Define título, descripción, fechas y modalidad.

2. **Registro de participantes**
   - Los usuarios se inscriben o son añadidos por el administrador.  
   - El sistema asocia los datos del estudiante al evento.

3. **Ejecución del evento**
   - Se lleva a cabo el taller o curso (presencial o virtual).  
   - El instructor registra la asistencia real de los participantes.

4. **Validación de asistencia**
   - Solo los participantes con asistencia válida son marcados como “Aprobados”.

5. **Emisión de microcredenciales**
   - El sistema genera la microcredencial para cada asistente validado.  
   - Se incluye un código único y un QR que lleva a la página pública de verificación.

6. **(Opcional) Asociación de recursos**
   - El instructor puede subir materiales adicionales del evento:  
     - Videos (enlaces YouTube/Vimeo)  
     - Documentos (PDF, DOCX, PPTX)  
     - Archivos comprimidos (ZIP)  
   - Estos recursos se almacenan en Supabase Storage y se registran en la columna `content` del evento.

7. **Acceso a los recursos**
   - Los estudiantes con microcredencial válida pueden acceder a `/resources/[evento_id]`.  
   - Allí podrán ver y descargar los materiales complementarios.

8. **Verificación pública**
   - Cualquier persona puede validar la autenticidad de una microcredencial desde la página `/verify/[codigo]`.

---

## 🔐 Condiciones de acceso

| Tipo de usuario | Acceso a recursos | Descripción |
|-----------------|------------------|--------------|
| **Instructor** | Total | Puede crear eventos y subir recursos |
| **Estudiante con microcredencial** | Permitido | Puede ver y descargar materiales del evento |
| **Estudiante sin microcredencial** | Denegado | Debe haber sido validado primero |
| **Administrador** | Total | Puede ver, editar y verificar todo |

---

## 🧱 Estructura de datos simplificada

- **Tabla `events` (antes `courses`)**  
  - id  
  - instructor_id  
  - title  
  - description  
  - date_start  
  - date_end  
  - is_published  
  - content (JSONB opcional con recursos)

- **Tabla `microcredentials`**  
  - id  
  - event_id  
  - student_id  
  - status (issued, revoked)  
  - qr_code_url  
  - verification_code  

---

## 🧠 Ejemplo de uso

1. El docente **crea el evento “Introducción a la IA aplicada”**.  
2. Durante el evento, registra los asistentes.  
3. Al finalizar, valida asistencia y el sistema emite microcredenciales.  
4. Luego decide subir materiales: diapositivas y un video resumen.  
5. Los asistentes pueden ingresar a la plataforma, validar su microcredencial y acceder a los materiales.

---

## 📦 Beneficios de esta adaptación

- Se alinea con los requerimientos de **emisión, validación y consulta** de microcredenciales.  
- El módulo tipo Udemy se convierte en un **valor agregado** para los talleres.  
- Los recursos digitales fomentan el aprendizaje posterior y mejoran la experiencia del participante.  
- Todo se mantiene dentro del ecosistema de **Supabase (Auth + DB + Storage)**.  
- Permite futuras extensiones, como incluir evaluaciones o foros.

---

## 🏁 Resultado esperado
El sistema final ofrecerá:

1. **Módulo principal tipo Luma** (hecho por tu compañero)  
   - Registro, validación y emisión de microcredenciales.

2. **Módulo complementario tipo Udemy** (tu parte adaptada)  
   - Recursos digitales asociados a los eventos.  
   - Acceso exclusivo para usuarios validados.

Ambos módulos compartirán base de datos y autenticación, funcionando como partes integradas de un solo sistema.
