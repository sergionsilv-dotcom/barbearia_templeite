export interface CurrencyConfig {
  code: string;
  locale: string;
  symbol: string;
}

export const CURRENCY_BY_LANGUAGE: Record<string, CurrencyConfig> = {
  'pt-BR': { code: 'BRL', locale: 'pt-BR', symbol: 'R$' },
  'en-US': { code: 'USD', locale: 'en-US', symbol: '$'  },
  'es-ES': { code: 'EUR', locale: 'es-ES', symbol: '€'  },
  'fr-FR': { code: 'EUR', locale: 'fr-FR', symbol: '€'  },
  'en-GB': { code: 'GBP', locale: 'en-GB', symbol: '£'  },
};

/**
 * Retorna a configuração de moeda baseada no idioma.
 * Se não encontrar, retorna o padrão pt-BR.
 */
export const getCurrencyForLanguage = (language: string): CurrencyConfig => {
  return CURRENCY_BY_LANGUAGE[language] || CURRENCY_BY_LANGUAGE['pt-BR'];
};

/**
 * Formata um valor numérico para a moeda correspondente ao idioma.
 */
export const formatCurrency = (value: number, language: string = 'pt-BR'): string => {
  const config = getCurrencyForLanguage(language);
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
  }).format(value);
};
