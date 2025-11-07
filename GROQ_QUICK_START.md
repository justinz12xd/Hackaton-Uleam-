# 🚀 Guía Rápida: Obtener API Key de Groq

## ⚡ Por qué Groq es Mejor

✅ **100% GRATIS** - No necesitas tarjeta de crédito
✅ **Ultrarrápido** - Respuestas en milisegundos (vs segundos en OpenAI)
✅ **Potente** - Llama 3.3 70B (equivalente a GPT-4)
✅ **Generoso** - 30 req/min y 14,400 tokens/min gratis
✅ **Sin Sorpresas** - No te cobrarán nunca

## 📝 Pasos (5 minutos)

### 1. Crear Cuenta en Groq

🔗 **Ve a:** https://console.groq.com/

- Haz clic en "Sign Up" o "Get Started"
- Puedes registrarte con:
  - Google
  - GitHub
  - Email

### 2. Obtener API Key

Una vez dentro:

1. En el menú lateral, busca **"API Keys"**
2. Haz clic en **"Create API Key"**
3. Dale un nombre descriptivo: `EduCred Chatbot`
4. Haz clic en **"Submit"**
5. **¡COPIA la key!** (empieza con `gsk_`)

### 3. Agregar al Proyecto

Abre (o crea) `.env.local` en la raíz del proyecto:

```env
GROQ_API_KEY=gsk_tu_key_aqui_pegala_completa
```

### 4. Reiniciar Servidor

```bash
# En la terminal, presiona Ctrl+C
# Luego ejecuta:
npm run dev
# o
pnpm dev
```

### 5. ¡Listo! 🎉

- Inicia sesión en tu app
- Verás el botón 💬 en la esquina inferior derecha
- Haz clic y empieza a chatear

## 📸 Vista Previa

```
Groq Console
├── Dashboard
├── Playground  <- Aquí puedes probar los modelos
├── API Keys    <- AQUÍ obtienes tu key
├── Usage       <- Ver cuánto has usado
└── Docs        <- Documentación
```

## 🎯 Ejemplo de .env.local Completo

```env
# Supabase (las que ya tienes)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...tu-key

# Groq (la nueva)
GROQ_API_KEY=gsk_abcdefghijklmnopqrstuvwxyz123456789
```

## 💡 Tips

- La key de Groq NO expira (a menos que la regeneres)
- Puedes crear múltiples keys para diferentes proyectos
- El tier gratuito es MÁS que suficiente para desarrollo
- Si necesitas más, tienen planes de pago muy económicos

## 🆘 Problemas Comunes

**"Invalid API key"**
- Asegúrate de copiar la key completa (incluyendo `gsk_`)
- No dejes espacios al inicio o final
- Verifica que esté en `.env.local` (no en `.env.local.example`)

**"Chatbot no responde"**
- Reinicia el servidor después de agregar la key
- Revisa la consola del servidor (terminal) para ver errores
- Verifica que iniciaste sesión en la app

**"No veo el botón del chat"**
- Solo aparece si estás autenticado
- Inicia sesión primero

## 🔗 Enlaces Útiles

- **Groq Console:** https://console.groq.com/
- **API Keys:** https://console.groq.com/keys
- **Documentación:** https://console.groq.com/docs
- **Playground:** https://console.groq.com/playground (prueba los modelos)
- **Usage:** https://console.groq.com/usage (ver uso)

---

**¿Necesitas ayuda?** Abre un issue en el repo o contacta al equipo de desarrollo.
