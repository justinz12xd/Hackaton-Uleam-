import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    console.log("📨 Chat API called")
    
    const { messages, userEvents, availableEvents } = await req.json()
    
    console.log("📊 Data received:", {
      messagesCount: messages.length,
      userEventsCount: userEvents.length,
      availableEventsCount: availableEvents.length
    })

    // Check if API key is configured
    if (!process.env.GROQ_API_KEY) {
      console.error("❌ GROQ_API_KEY not configured!")
      return NextResponse.json(
        { error: "API key not configured. Please add GROQ_API_KEY to .env.local" },
        { status: 500 }
      )
    }

    console.log("✅ GROQ_API_KEY found")

    // Build context for AI
    const userEventsContext = userEvents.length > 0
      ? `Eventos a los que el usuario se ha registrado previamente:\n${userEvents
          .map((e: any) => `- ${e.title}: ${e.description}`)
          .join("\n")}`
      : "El usuario aún no se ha registrado a ningún evento."

    const availableEventsContext = availableEvents.length > 0
      ? `Eventos disponibles actualmente:\n${availableEvents
          .map(
            (e: any) =>
              `- ID: ${e.id}, Título: ${e.title}, Descripción: ${e.description}, Fecha: ${new Date(
                e.event_date
              ).toLocaleDateString()}, Ubicación: ${e.location}`
          )
          .join("\n")}`
      : "No hay eventos disponibles en este momento."

    const systemPrompt = `Eres un asistente inteligente de recomendación de eventos. Tu trabajo es ayudar a los usuarios a encontrar eventos que coincidan con sus intereses basándote en:

1. Los eventos a los que se han registrado previamente (para entender sus intereses)
2. Los eventos disponibles actualmente

${userEventsContext}

${availableEventsContext}

Tu objetivo es:
- Analizar los patrones de interés del usuario basándote en eventos anteriores
- Recomendar eventos similares o relacionados de la lista de eventos disponibles
- Explicar por qué crees que un evento podría interesarle
- Ser amable, profesional y útil
- Responder en español

IMPORTANTE: Cuando menciones un evento de la lista de disponibles, SIEMPRE usa este formato exacto:
[Nombre del Evento](id-del-evento)

Por ejemplo: [DevFest 2025](08648850-4524-44ce-ad2b-4c18c408c616)

Esto creará un enlace clicable para que el usuario pueda acceder directamente al evento.

Mantén tus respuestas concisas pero informativas (máximo 300 palabras).`

    console.log("🤖 Calling Groq API...")

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // Modelo gratuito y muy rápido de Groq
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 1024,
    })

    console.log("✅ Groq API response received")

    const assistantMessage = completion.choices[0].message.content

    console.log("📤 Sending response to client")

    return NextResponse.json({ message: assistantMessage })
  } catch (error: any) {
    console.error("❌ Error en chat API:", error)
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      type: error.type
    })
    return NextResponse.json(
      { error: "Error al procesar la solicitud", details: error.message },
      { status: 500 }
    )
  }
}
