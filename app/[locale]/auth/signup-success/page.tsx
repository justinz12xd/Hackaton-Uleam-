import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "@/lib/i18n/routing"
import { getTranslations, setRequestLocale } from 'next-intl/server'

interface SignupSuccessPageProps {
  params: Promise<{ locale: string }>
}

export default async function SignupSuccessPage({ params }: SignupSuccessPageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('auth.signupSuccess')
  
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t('title')}</CardTitle>
              <CardDescription>{t('description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('message')}
              </p>
              <Link href="/auth/login" className="block">
                <Button className="w-full">{t('goToLogin')}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

