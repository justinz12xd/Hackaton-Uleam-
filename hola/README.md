# 🎓 Certificado React - Sistema de Certificados Dinámicos

Sistema de certificados elegante y profesional construido con React, conectado a base de datos para generar certificados dinámicos.

## 📋 Características

- ✅ **Componente React reutilizable** con props dinámicas
- ✅ **Conexión a base de datos** mediante custom hooks
- ✅ **Diseño responsive** y listo para impresión
- ✅ **Tipografías elegantes** de Google Fonts
- ✅ **Bordes y decoraciones** profesionales
- ✅ **Formato A4 horizontal** optimizado para certificados

## 🚀 Instalación

### 1. Instalar dependencias

```bash
npm install react react-dom
```

### 2. Estructura de archivos

```
proyecto/
├── src/
│   ├── components/
│   │   ├── Certificate.jsx       # Componente principal
│   │   └── Certificate.css       # Estilos del certificado
│   ├── hooks/
│   │   └── useCertificateData.js # Hook para obtener datos
│   ├── App.jsx                   # Ejemplo de uso
│   └── index.js                  # Punto de entrada
```

## 📦 Archivos incluidos

1. **Certificate.jsx** - Componente principal del certificado
2. **Certificate.css** - Estilos completos
3. **useCertificateData.js** - Custom hook para API
4. **App.jsx** - Ejemplos de uso
5. **README.md** - Esta documentación

## 💻 Uso básico

### Opción 1: Con datos de la base de datos

```jsx
import Certificate from './components/Certificate';
import { useCertificateData } from './hooks/useCertificateData';

function MyCertificate({ certificateId }) {
  const { data, loading, error } = useCertificateData(certificateId);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Certificate
      participantName={data.participantName}
      courseName={data.courseName}
      eventName={data.eventName}
      creatorName={data.creatorName}
      date={data.date}
    />
  );
}
```

### Opción 2: Con datos estáticos

```jsx
import Certificate from './components/Certificate';

function MyCertificate() {
  return (
    <Certificate
      participantName="Juan Pérez"
      courseName="React Avanzado"
      eventName="Bootcamp 2025"
      creatorName="Dr. Ana García"
    />
  );
}
```

## 🔌 Configuración de la API

### Formato esperado de la respuesta

Tu API debe devolver un objeto JSON con esta estructura:

```json
{
  "id": 123,
  "participantName": "María González Rodríguez",
  "courseName": "Desarrollo Web Avanzado con JavaScript",
  "eventName": "Semana de Tecnología e Innovación 2025",
  "creatorName": "Dr. Carlos Martínez López",
  "date": "2025-11-07T00:00:00Z"
}
```

### Endpoints sugeridos

```
GET /api/certificates/:id          # Obtener un certificado
GET /api/participants/:id/certificates  # Obtener certificados de un participante
POST /api/certificates             # Crear nuevo certificado
```

## 🗄️ Ejemplo de Backend (Node.js + Express)

```javascript
// server.js
const express = require('express');
const app = express();

// Obtener certificado por ID
app.get('/api/certificates/:id', async (req, res) => {
  const { id } = req.params;
  
  // Consultar base de datos (ejemplo con MySQL)
  const certificate = await db.query(
    'SELECT * FROM certificates WHERE id = ?',
    [id]
  );
  
  if (!certificate) {
    return res.status(404).json({ error: 'Certificado no encontrado' });
  }
  
  res.json({
    id: certificate.id,
    participantName: certificate.participant_name,
    courseName: certificate.course_name,
    eventName: certificate.event_name,
    creatorName: certificate.creator_name,
    date: certificate.created_at
  });
});

app.listen(3001, () => {
  console.log('API escuchando en puerto 3001');
});
```

## 🎨 Personalización

### Modificar colores

Edita `Certificate.css` para cambiar la paleta de colores:

```css
/* Color dorado del borde */
border: 1px solid #d4af37;

/* Color del título del evento */
.event-name {
  color: #3498db; /* Cambia este color */
}
```

### Agregar logo

En `Certificate.jsx`, agrega dentro de `.certificate-header`:

```jsx
<div className="certificate-header">
  <img src="/logo.png" alt="Logo" style={{ width: '100px', marginBottom: '20px' }} />
  <h1 className="certificate-title">Certificado</h1>
  <p className="certificate-subtitle">de Participación</p>
</div>
```

## 🖨️ Impresión

El certificado incluye estilos optimizados para impresión. Para imprimir:

1. Hacer clic en el botón "🖨️ Imprimir Certificado"
2. O usar Ctrl+P (Cmd+P en Mac)
3. Seleccionar orientación "Horizontal"
4. Seleccionar tamaño "A4"

## 📱 React Router (Opcional)

Para usar con React Router:

```jsx
import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom';
import Certificate from './components/Certificate';
import { useCertificateData } from './hooks/useCertificateData';

function CertificatePage() {
  const { id } = useParams();
  const { data, loading, error } = useCertificateData(id);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return <Certificate {...data} />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/certificate/:id" element={<CertificatePage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## 🔐 Ejemplo con autenticación

```jsx
import { useCertificateData } from './hooks/useCertificateData';

function ProtectedCertificate({ certificateId, token }) {
  const { data, loading, error } = useCertificateData(
    certificateId,
    '/api/certificates',
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  // ... resto del componente
}
```

## 🧪 Testing

Ejemplo con React Testing Library:

```jsx
import { render, screen } from '@testing-library/react';
import Certificate from './Certificate';

test('renders participant name', () => {
  render(
    <Certificate
      participantName="Juan Pérez"
      courseName="React"
      eventName="Bootcamp"
      creatorName="Instructor"
    />
  );
  
  expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
});
```

## 📝 Props del componente Certificate

| Prop | Tipo | Requerido | Default | Descripción |
|------|------|-----------|---------|-------------|
| `participantName` | string | No | '[Nombre del Participante]' | Nombre completo del participante |
| `courseName` | string | No | '[Nombre del Curso]' | Nombre del curso completado |
| `eventName` | string | No | '[Nombre del Evento]' | Nombre del evento donde se realizó |
| `creatorName` | string | No | '[Nombre del Creador]' | Nombre del organizador/creador |
| `date` | string/Date | No | Fecha actual | Fecha de emisión del certificado |
| `onPrint` | function | No | null | Callback que se ejecuta al imprimir |

## 🌐 Ejemplo completo con fetch

```jsx
import React, { useState, useEffect } from 'react';
import Certificate from './components/Certificate';

function App() {
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://tu-api.com/api/certificates/123')
      .then(res => res.json())
      .then(data => {
        setCertificate(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Cargando...</div>;
  if (!certificate) return <div>No se encontró el certificado</div>;

  return <Certificate {...certificate} />;
}

export default App;
```

## 🐛 Solución de problemas

### Las fuentes no se cargan

Asegúrate de tener conexión a internet o descarga las fuentes localmente:

```bash
npm install @fontsource/great-vibes @fontsource/playfair-display @fontsource/montserrat
```

### El certificado no se imprime correctamente

1. Verifica que la orientación sea "Horizontal"
2. Asegúrate de seleccionar tamaño "A4"
3. Desactiva "Márgenes" en la configuración de impresión

### CORS error al conectar con la API

Configura CORS en tu backend:

```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
```

## 📄 Licencia

MIT - Libre para uso personal y comercial

## 👨‍💻 Autor

Creado con ❤️ para generar certificados profesionales

---

¿Necesitas ayuda? Abre un issue en el repositorio.
