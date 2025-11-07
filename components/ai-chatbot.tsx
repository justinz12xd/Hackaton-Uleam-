"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle, X, Send, Loader2, ExternalLink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/lib/store/auth-store"
import { Link } from "@/lib/i18n/routing"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface EventLink {
  id: string
  title: string
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [hasGreeted, setHasGreeted] = useState(false)
  const [eventLinks, setEventLinks] = useState<EventLink[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // Usar selector para evitar re-renders innecesarios
  const user = useAuthStore((state) => state.user)
  // Memoizar el cliente de Supabase para evitar recrearlo en cada render
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Memoizar scrollToBottom para evitar recrearlo en cada render
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  // Memoizar renderMessageWithLinks para evitar recrearlo en cada render
  const renderMessageWithLinks = useCallback((content: string, messageIndex: number) => {
    // Match pattern: [EventTitle](eventId)
    const linkPattern = /\[([^\]]+)\]\(([a-f0-9-]{36})\)/g
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match
    let linkIndex = 0

    while ((match = linkPattern.exec(content)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index))
      }

      // Add the link
      const title = match[1]
      const eventId = match[2]
      // Usar Link solo si está montado, sino usar <a> normal
      if (mounted) {
        parts.push(
          <Link
            key={`msg-${messageIndex}-link-${linkIndex}`}
            href={`/events/${eventId}`}
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline font-semibold"
            onClick={() => setIsOpen(false)}
          >
            {title}
            <ExternalLink className="h-3 w-3" />
          </Link>
        )
      } else {
        parts.push(
          <a
            key={`msg-${messageIndex}-link-${linkIndex}`}
            href={`/es/events/${eventId}`}
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline font-semibold"
            onClick={() => setIsOpen(false)}
          >
            {title}
            <ExternalLink className="h-3 w-3" />
          </a>
        )
      }

      lastIndex = match.index + match[0].length
      linkIndex++
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex))
    }

    return parts.length > 0 ? <>{parts}</> : content
  }, [mounted])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (isOpen && !hasGreeted && user) {
      sendGreeting()
      setHasGreeted(true)
    }
  }, [isOpen, user])

  const sendGreeting = async () => {
    const greetingMessage: Message = {
      role: "assistant",
      content: `¡Hola! 👋 Soy tu asistente de eventos con IA. Puedo ayudarte a encontrar eventos que se ajusten a tus intereses basándome en los eventos a los que te has registrado anteriormente. ¿Te gustaría que te recomiende algunos eventos?`
    }
    setMessages([greetingMessage])
  }

  const getUserRegistrations = async () => {
    if (!user) return []

    const { data: registrations } = await supabase
      .from("event_registrations")
      .select("event_id")
      .eq("user_id", user.id)

    if (!registrations || registrations.length === 0) return []

    const eventIds = registrations.map(r => r.event_id)
    const { data: events } = await supabase
      .from("events")
      .select("title, description")
      .in("id", eventIds)

    return events || []
  }

  const getAvailableEvents = async () => {
    const { data: events } = await supabase
      .from("events")
      .select("id, title, description, event_date, location, max_attendees")
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true })
      .limit(20)

    return events || []
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: input }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Get user's event history and available events
      const [userEvents, availableEvents] = await Promise.all([
        getUserRegistrations(),
        getAvailableEvents()
      ])

      console.log("Sending to API:", { userEvents, availableEvents })

      // Call the API endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userEvents,
          availableEvents
        })
      })

      console.log("API Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("API Error:", errorData)
        throw new Error(errorData.error || "Error al obtener respuesta")
      }

      const data = await response.json()
      console.log("API Response data:", data)
      
      const assistantMessage: Message = {
        role: "assistant",
        content: data.message
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error completo:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: `Lo siento, hubo un error: ${error instanceof Error ? error.message : 'Error desconocido'}. Por favor, verifica que la API key de Groq esté configurada correctamente en .env.local y reinicia el servidor.`
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!user) return null

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Asistente de Eventos IA
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.role === "assistant" 
                        ? renderMessageWithLinks(message.content, index)
                        : message.content
                      }
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
