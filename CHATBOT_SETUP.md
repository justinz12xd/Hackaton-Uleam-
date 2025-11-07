# 🤖 Configuración del Chatbot con IA (Groq)

## Paso 1: Obtener tu API Key de Groq (GRATIS)

1. Ve a [https://console.groq.com/](https://console.groq.com/)
2. Crea una cuenta (gratis)
3. Ve a **API Keys** en el menú lateral
4. Haz clic en **"Create API Key"**
5. Dale un nombre (ejemplo: "EduCred Chatbot")
6. Copia la key (empieza con `gsk_`)
7. **¡NO necesitas tarjeta de crédito!** - Groq tiene un tier gratuito muy generoso

## Paso 2: Configurar la API Key en tu proyecto

1. Abre (o crea) el archivo `.env.local` en la raíz del proyecto
2. Agrega la siguiente línea:

```env
GROQ_API_KEY=gsk_tu-api-key-aqui
```

3. Reemplaza `gsk_tu-api-key-aqui` con tu API key real

## Paso 3: Reiniciar el servidor

```bash
# Detén el servidor actual (Ctrl+C)
# Luego ejecuta:
npm run dev
```

## ✨ Características del Chatbot

- 🎯 **Recomendaciones Personalizadas**: Analiza los eventos a los que te has registrado
- 🤖 **IA Ultrarrápida**: Usa Llama 3.3 70B de Groq (¡respuestas en segundos!)
- 💬 **Conversación Natural**: Habla naturalmente, la IA entiende el contexto
- 📍 **Enlaces Directos**: Menciona IDs de eventos para acceder fácilmente
- 🎨 **UI Moderna**: Botón flotante en la esquina inferior derecha
- 🆓 **GRATIS**: Sin necesidad de tarjeta de crédito

## 💡 Cómo Usar

1. Haz clic en el botón del chat (esquina inferior derecha)
2. El chatbot te saludará automáticamente
3. Pregunta cosas como:
   - "¿Qué eventos me recomiendas?"
   - "Quiero eventos de tecnología"
   - "Muéstrame eventos similares a los que he asistido"
   - "¿Hay eventos esta semana?"

## 💰 Costos Estimados

- **¡100% GRATIS!** 🎉
- Modelo usado: **Llama 3.3 70B Versatile** (de Groq)
- Tier gratuito muy generoso:
  - **30 solicitudes/minuto**
  - **14,400 tokens/minuto**
  - Más que suficiente para uso normal
- **No necesitas tarjeta de crédito**
- Respuestas **ultrarrápidas** (mucho más rápido que OpenAI)

## 🔒 Seguridad

- ✅ La API key solo está en el servidor (nunca se expone al cliente)
- ✅ Solo usuarios autenticados pueden usar el chatbot
- ✅ Límites de tokens para evitar costos excesivos

## 🐛 Troubleshooting

**Error: "No se encuentra el módulo groq-sdk"**
- Solución: Ejecuta `pnpm add groq-sdk`

**Error: "Invalid API key"**
- Verifica que copiaste correctamente la key en `.env.local`
- Asegúrate de que la key comienza con `gsk_`
- Reinicia el servidor después de agregar la key

**Chatbot no responde**
- Revisa la consola del servidor para ver errores
- Verifica que `.env.local` existe y tiene la key correcta
- Asegúrate de que la key de Groq es válida

## 📚 Recursos Adicionales

- [Groq Console](https://console.groq.com/) - Tu panel de Groq
- [Groq Docs](https://console.groq.com/docs) - Documentación oficial
- [Modelos disponibles](https://console.groq.com/docs/models) - Lista de modelos de Groq
