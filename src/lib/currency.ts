/**
 * Currency formatting utility
 * Uses the browser's built-in Intl.NumberFormat for locale-aware formatting
 */

export interface CurrencyConfig {
  code: string;   // ISO 4217 code: BRL, USD, EUR, etc.
  locale: string; // BCP 47 locale: pt-BR, en-US, etc.
  symbol: string; // Display symbol: R$, $, €
}

export const CURRENCY_BY_LANGUAGE: Record<string, CurrencyConfig> = {
  'pt-BR': { code: 'BRL', locale: 'pt-BR', symbol: 'R$' },
  'en-US': { code: 'USD', locale: 'en-US', symbol: '$'  },
  'es-ES': { code: 'EUR', locale: 'es-ES', symbol: '€'  },
  'fr-FR': { code: 'EUR', locale: 'fr-FR', symbol: '€'  },
  'en-GB': { code: 'GBP', locale: 'en-GB', symbol: '£'  },
};

/**
 * Format a number as currency using the current locale
 * @example formatCurrency(45.5, 'BRL', 'pt-BR') → "R$ 45,50"
 * @example formatCurrency(45.5, 'USD', 'en-US') → "$45.50"
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'BRL',
  locale: string = 'pt-BR'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback if locale/currency is invalid
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

/**
 * Get currency config from language code
 */
export function getCurrencyForLanguage(languageCode: string): CurrencyConfig {
  return CURRENCY_BY_LANGUAGE[languageCode] ?? CURRENCY_BY_LANGUAGE['pt-BR'];
}
