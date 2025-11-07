# Función de Colaboradores en Eventos

## Descripción
Se ha agregado la funcionalidad para etiquetar personas como colaboradores cuando se registran a un evento. Los colaboradores son personas que ayudarán en la organización y ejecución del evento.

## Cambios Realizados

### 1. Base de Datos (SQL)
**Archivo:** `scripts/005_add_collaborator_field.sql`

Se agregó un nuevo campo `is_collaborator` a la tabla `event_registrations`:
- Tipo: BOOLEAN
- Valor por defecto: FALSE
- Índice: Se creó un índice compuesto para mejorar las consultas de colaboradores por evento

```sql
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS is_collaborator BOOLEAN DEFAULT FALSE;
```

### 2. Interfaz de Usuario
**Archivo:** `app/[locale]/events/[id]/page.tsx`

#### Nuevas interfaces TypeScript:
```typescript
interface Registration {
  id: string
  qr_code: string
  registered_at: string
  attended_at: string | null
  is_attended: boolean
  is_collaborator: boolean  // NUEVO
}

interface Collaborator {  // NUEVO
  id: string
  user_id: string
  profiles: {
    full_name: string
    email: string
  }
}
```

#### Cambios en el componente:
1. **Estado nuevo:**
   - `isCollaborator`: Para controlar si el usuario se registra como colaborador
   - `collaborators`: Array con la lista de colaboradores del evento

2. **Checkbox en el formulario de registro:**
   - Permite al usuario marcar que se registrará como colaborador
   - Se muestra antes del botón "Register Now"

3. **Sección de visualización:**
   - Nueva tarjeta "Colaboradores del Evento"
   - Muestra todos los usuarios registrados como colaboradores
   - Cada colaborador aparece con un badge "Colaborador" y su nombre

4. **Función actualizada:**
   - `handleRegister()`: Ahora incluye el campo `is_collaborator` al crear el registro
   - `fetchEvent()`: Obtiene la lista de colaboradores al cargar el evento

## Cómo Usar

### Para usuarios:
1. Al registrarse en un evento, aparecerá un checkbox "Registrarme como colaborador del evento"
2. Si el usuario marca este checkbox, se registrará como colaborador
3. Los colaboradores aparecerán listados en la página del evento

### Para desarrolladores:
1. **Ejecutar la migración SQL:**
   - Ir a Supabase Dashboard > SQL Editor
   - Copiar y ejecutar el contenido de `scripts/005_add_collaborator_field.sql`

2. **Verificar los cambios:**
   - La columna `is_collaborator` debe existir en `event_registrations`
   - El índice `idx_registrations_collaborator` debe estar creado

## Beneficios
- ✅ Identificación clara de quiénes ayudarán en el evento
- ✅ Mejor organización y coordinación
- ✅ Visibilidad de los colaboradores para todos los participantes
- ✅ Base para futuras funcionalidades (permisos especiales, badges, etc.)

## Próximas mejoras sugeridas
- [ ] Dashboard especial para colaboradores con herramientas de organización
- [ ] Notificaciones específicas para colaboradores
- [ ] Permisos adicionales para colaboradores (ej: ver lista de asistentes)
- [ ] Badges especiales en los certificados para colaboradores
