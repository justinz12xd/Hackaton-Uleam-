import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Award, Users, BookOpen, Zap } from "lucide-react"
import { getTranslations, setRequestLocale } from 'next-intl/server'

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const t = await getTranslations('home')
  
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground">
              {t('hero.title')} <span className="text-primary">{t('hero.titleHighlight')}</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('hero.subtitle')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="gap-2">
                {t('hero.getStarted')} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/courses">
              <Button size="lg" variant="outline">
                {t('hero.browseCourses')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-card border-t border-border py-20 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16 text-foreground">{t('features.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Award className="w-8 h-8 text-primary mb-4" />
                <CardTitle className="text-lg">{t('features.verified.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {t('features.verified.description')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BookOpen className="w-8 h-8 text-primary mb-4" />
                <CardTitle className="text-lg">{t('features.quality.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {t('features.quality.description')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="w-8 h-8 text-primary mb-4" />
                <CardTitle className="text-lg">{t('features.fast.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {t('features.fast.description')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="w-8 h-8 text-primary mb-4" />
                <CardTitle className="text-lg">{t('features.community.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {t('features.community.description')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="space-y-4 mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">{t('courses.title')}</h2>
          <p className="text-lg text-muted-foreground">
            {t('courses.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-br from-primary/20 to-accent/20 h-40" />
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                    {t(`courses.levels.${["beginner", "intermediate", "advanced"][i % 3] as "beginner" | "intermediate" | "advanced"}`)}
                  </span>
                  <span className="text-xs text-muted-foreground">{8 + i} {t('courses.hours')}</span>
                </div>
                <CardTitle>{t('courses.courseTitle')} {i + 1}</CardTitle>
                <CardDescription>{t('courses.courseDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/auth/signup">
                  <Button className="w-full">{t('courses.explore')}</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/courses">
            <Button variant="outline" size="lg" className="gap-2 bg-transparent">
              {t('courses.viewAll')} <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-20 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">{t('cta.title')}</h2>
            <p className="text-lg opacity-90">{t('cta.subtitle')}</p>
          </div>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary" className="gap-2">
              {t('cta.button')} <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-primary mb-4">EduCred</h3>
              <p className="text-sm text-muted-foreground">
                {t('footer.description')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">{t('footer.platform')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/courses" className="hover:text-foreground">
                    {t('courses.title')}
                  </Link>
                </li>
                <li>
                  <Link href="/auth/login" className="hover:text-foreground">
                    Instructor
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">{t('footer.company')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    {t('footer.about')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    {t('footer.blog')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">{t('footer.legal')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    {t('footer.privacy')}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    {t('footer.terms')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 EduCred. {t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
