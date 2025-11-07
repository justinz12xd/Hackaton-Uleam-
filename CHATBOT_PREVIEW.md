# 🎨 Vista Previa del Chatbot

## Ubicación Visual

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  NAVBAR                                         │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│                                                 │
│         CONTENIDO DE LA PÁGINA                  │
│                                                 │
│                                                 │
│                                                 │
│                                          ┌──┐   │
│                                          │💬│   │ <- Botón Flotante
│                                          └──┘   │    (cuando chat cerrado)
└─────────────────────────────────────────────────┘
```

## Chat Abierto

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  NAVBAR                                         │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│                                        ┌──────┐ │
│                                        │  IA  │ │
│         CONTENIDO                      │ Chat │ │
│                                        ├──────┤ │
│                                        │ Msg1 │ │
│                                        │ Msg2 │ │
│                                        │ Msg3 │ │
│                                        ├──────┤ │
│                                        │[____]│ │
│                                        └──────┘ │
└─────────────────────────────────────────────────┘
```

## Ejemplo de Conversación

```
┌────────────────────────────────────────────────┐
│ 🤖 Asistente de Eventos IA               [X]  │
├────────────────────────────────────────────────┤
│                                                │
│  🤖 ¡Hola! 👋 Soy tu asistente de eventos     │
│     con IA. Puedo ayudarte a encontrar        │
│     eventos que se ajusten a tus intereses... │
│                                                │
│                 ¿Qué eventos me recomiendas? 💬│
│                                                │
│  🤖 ¡Claro! Veo que te has registrado a       │
│     eventos de tecnología como "DevFest".     │
│     Te recomiendo estos eventos similares:    │
│                                                │
│     1. **Hackathon ULEAM 2025** (ID: abc123)  │
│        - Fecha: 15 de Diciembre               │
│        - Similar a DevFest, enfocado en...    │
│                                                │
│     2. **Workshop IA Aplicada** (ID: def456)  │
│        - Fecha: 20 de Diciembre               │
│        - Como has mostrado interés en...      │
│                                                │
│                                                │
├────────────────────────────────────────────────┤
│ [Escribe tu mensaje...          ] [📤 Enviar] │
└────────────────────────────────────────────────┘
```

## Características Implementadas

✅ **Botón Flotante**
   - Posición: Esquina inferior derecha
   - Color: Gradiente azul-morado
   - Icono: 💬 MessageCircle

✅ **Ventana de Chat**
   - Tamaño: 384px × 600px
   - Responsive y moderno
   - Header con gradiente
   - Botón para cerrar

✅ **Mensajes**
   - Usuario: Alineado a la derecha (azul)
   - Asistente: Alineado a la izquierda (gris)
   - Scroll automático al final
   - Loading spinner mientras responde

✅ **Inteligencia**
   - Analiza eventos registrados del usuario
   - Obtiene eventos disponibles
   - Llama 3.3 70B de Groq genera recomendaciones personalizadas
   - Respuestas ultrarrápidas (mucho más rápido que GPT)
   - Respuestas en español
   - Contexto conversacional
   - **100% GRATIS** sin necesidad de tarjeta

✅ **Seguridad**
   - Solo visible para usuarios autenticados
   - API key en servidor (no expuesta)
   - Límites de tokens configurados
