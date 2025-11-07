import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Award, Users, BookOpen, Zap } from "lucide-react"
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from "@/lib/i18n/routing"
import { createClient } from "@/lib/supabase/server"

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('home')
  const supabase = await createClient()

  // Fetch published courses
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(6)

  const featuredCourses = courses || []

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section with Static Image */}
      <section className="relative w-full h-[550px] md:h-[650px] overflow-hidden">
        <div className="absolute inset-0 grid md:grid-cols-[55%_45%]">
          {/* Left Side - Static Image */}
          <div className="relative h-full overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070"
              alt="Event presentation"
              className="w-full h-full object-cover object-center"
            />
            {/* Gradient Overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, transparent 60%, rgba(0,0,0,0.3) 80%, var(--background) 100%)'
              }}
            />
          </div>

          {/* Right Side - Hero Content */}
          <div className="relative h-full flex items-center px-8 sm:px-12 lg:px-16 bg-background">
            <div className="w-full space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                  {t('hero.title')}{' '}
                  <span className="text-primary block mt-2">{t('hero.titleHighlight')}</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                  {t('hero.subtitle')}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/signup">
                  <Button size="lg" className="gap-2 min-w-[180px]">
                    {t('hero.getStarted')} <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Featured Events Section with Image */}
      <section className="relative w-full overflow-hidden py-19 md:py-28">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-[55%_45%] gap-12 items-center">
            {/* Left Side - Static Image */}
            <div className="relative h-[450px] md:h-[550px] overflow-hidden rounded-1xl">
              <img
                src="https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=2012"
                alt="Events and conferences"
                className="w-full h-full object-cover object-center"
              />
              {/* Gradient Overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(270deg, var(--background) 0%, transparent 20%, transparent 100%)'
                }}
              />
            </div>

            {/* Right Side - Content */}
            <div className="space-y-8">
              <div className="space-y-5">
                <h2 className="text-4xl sm:text-5xl font-bold text-foreground">Eventos y Conferencias</h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Conecta con la comunidad educativa
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Participa en eventos exclusivos, conferencias y talleres prácticos. Conoce a expertos de la industria,
                  amplía tu red profesional y mantente actualizado con las últimas tendencias tecnológicas y educativas.
                  Cada evento es una oportunidad para aprender, compartir y crecer. Regístrate hoy y sé parte de nuestra comunidad.
                </p>
              </div>
              <Link href="/events">
                <Button size="lg" className="gap-2 text-base px-8">
                  Ver todos los eventos <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Section with Image */}
      <section className="relative w-full overflow-hidden bg-muted/20 py-20 md:py-30">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-[45%_55%] gap-12 items-center">
            {/* Left Side - Content */}
            <div className="space-y-8">
              <div className="space-y-5">
                <h2 className="text-4xl sm:text-5xl font-bold text-foreground">{t('coursesSection.title')}</h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {('coursesSection.subtitle')}
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Explora nuestra colección de cursos diseñados por expertos. Desde programación hasta diseño,
                  cada curso está estructurado para ayudarte a alcanzar tus objetivos profesionales con contenido
                  actualizado y práctico. Aprende a tu ritmo con material de alta calidad y obtén certificaciones reconocidas.
                </p>
              </div>
              <Link href="/courses">
                <Button size="lg" className="gap-2 text-base px-8">
                  Ver todos los cursos <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* Right Side - Static Image */}
            <div className="relative h-[450px] md:h-[550px] overflow-hidden rounded-1xl">
              <img
                src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070"
                alt="Programming and technology"
                className="w-full h-full object-cover object-center"
              />
              {/* Gradient Overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, var(--background) 0%, transparent 20%, transparent 100%)'
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground py-24 sm:py-32">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-5xl font-bold">{t('cta.title')}</h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">{t('cta.subtitle')}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary" className="gap-2 text-base px-8 shadow-lg hover:shadow-xl transition-shadow">
                {t('cta.button')} <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <h3 className="text-2xl font-bold text-primary mb-4">EduCred</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('footer.description')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground text-base">{t('footer.platform')}</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/courses" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('courses.title')}
                  </Link>
                </li>
                <li>
                  <Link href="/events" className="text-muted-foreground hover:text-primary transition-colors">
                    Eventos
                  </Link>
                </li>
                <li>
                  <Link href="/auth/login" className="text-muted-foreground hover:text-primary transition-colors">
                    Instructor
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground text-base">{t('footer.company')}</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('footer.about')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('footer.blog')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Contacto
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground text-base">{t('footer.legal')}</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('footer.privacy')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('footer.terms')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">&copy; 2025 EduCred. {t('footer.copyright')}</p>
            <div className="flex gap-4">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <span className="sr-only">GitHub</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
