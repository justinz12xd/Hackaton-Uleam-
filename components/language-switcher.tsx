"use client"

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';
import { routing } from '@/lib/i18n/routing';

const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export function LanguageSwitcher() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // useLocale debe estar dentro del NextIntlClientProvider
  // Si no está disponible, Next.js renderizará en el cliente
  const locale = useLocale();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLanguage = languages.find((lang) => lang.code === locale);

  const handleLanguageChange = (newLocale: string) => {
    console.log('Changing language from', locale, 'to', newLocale);
    console.log('Current pathname:', pathname);
    
    // Remove the current locale from pathname if it exists
    let newPathname = pathname;
    
    // Remove current locale prefix if it exists
    for (const loc of routing.locales) {
      if (pathname.startsWith(`/${loc}`)) {
        newPathname = pathname.slice(`/${loc}`.length) || '/';
        break;
      }
    }
    
    console.log('New pathname without locale:', newPathname);
    
    // Always add the locale prefix since we're using 'always' mode
    const finalPath = `/${newLocale}${newPathname}`;
    
    console.log('Final path:', finalPath);
    
    router.push(finalPath);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Languages className="w-4 h-4" />
          <span className="hidden sm:inline">{currentLanguage?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={locale === lang.code ? 'bg-accent' : ''}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
