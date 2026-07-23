import type { SupportedCurrency } from './pricing'

export interface Country {
  name: string
  code: string           // ISO 3166-1 alpha-2
  currency: SupportedCurrency
  dialCode: string
}

// 70+ countries — Africa (30+), Europe, Americas, Other.
// Currency mapped to nearest SupportedCurrency.
export const COUNTRIES: Country[] = [
  // ── Afrique de l'Ouest ──────────────────────────────────────────────────
  { name: 'Guinée',            code: 'GN', currency: 'GNF', dialCode: '+224' },
  { name: 'Côte d\'Ivoire',   code: 'CI', currency: 'XOF', dialCode: '+225' },
  { name: 'Sénégal',          code: 'SN', currency: 'XOF', dialCode: '+221' },
  { name: 'Mali',             code: 'ML', currency: 'XOF', dialCode: '+223' },
  { name: 'Burkina Faso',     code: 'BF', currency: 'XOF', dialCode: '+226' },
  { name: 'Togo',             code: 'TG', currency: 'XOF', dialCode: '+228' },
  { name: 'Bénin',            code: 'BJ', currency: 'XOF', dialCode: '+229' },
  { name: 'Niger',            code: 'NE', currency: 'XOF', dialCode: '+227' },
  { name: 'Mauritanie',       code: 'MR', currency: 'XOF', dialCode: '+222' },
  { name: 'Guinée-Bissau',    code: 'GW', currency: 'XOF', dialCode: '+245' },
  { name: 'Cap-Vert',         code: 'CV', currency: 'EUR', dialCode: '+238' },
  { name: 'Sierra Leone',     code: 'SL', currency: 'USD', dialCode: '+232' },
  { name: 'Liberia',          code: 'LR', currency: 'USD', dialCode: '+231' },
  { name: 'Gambie',           code: 'GM', currency: 'XOF', dialCode: '+220' },
  { name: 'Ghana',            code: 'GH', currency: 'GHS', dialCode: '+233' },
  { name: 'Nigeria',          code: 'NG', currency: 'NGN', dialCode: '+234' },

  // ── Afrique Centrale ────────────────────────────────────────────────────
  { name: 'Cameroun',         code: 'CM', currency: 'XAF', dialCode: '+237' },
  { name: 'Congo',            code: 'CG', currency: 'XAF', dialCode: '+242' },
  { name: 'RD Congo',         code: 'CD', currency: 'USD', dialCode: '+243' },
  { name: 'Gabon',            code: 'GA', currency: 'XAF', dialCode: '+241' },
  { name: 'Centrafrique',     code: 'CF', currency: 'XAF', dialCode: '+236' },
  { name: 'Tchad',            code: 'TD', currency: 'XAF', dialCode: '+235' },
  { name: 'Guinée Équatoriale', code: 'GQ', currency: 'XAF', dialCode: '+240' },
  { name: 'São Tomé-et-Príncipe', code: 'ST', currency: 'EUR', dialCode: '+239' },

  // ── Afrique de l'Est ────────────────────────────────────────────────────
  { name: 'Kenya',            code: 'KE', currency: 'USD', dialCode: '+254' },
  { name: 'Tanzanie',         code: 'TZ', currency: 'USD', dialCode: '+255' },
  { name: 'Ouganda',          code: 'UG', currency: 'USD', dialCode: '+256' },
  { name: 'Rwanda',           code: 'RW', currency: 'USD', dialCode: '+250' },
  { name: 'Burundi',          code: 'BI', currency: 'USD', dialCode: '+257' },
  { name: 'Éthiopie',         code: 'ET', currency: 'USD', dialCode: '+251' },
  { name: 'Djibouti',         code: 'DJ', currency: 'USD', dialCode: '+253' },
  { name: 'Somalie',          code: 'SO', currency: 'USD', dialCode: '+252' },
  { name: 'Érythrée',         code: 'ER', currency: 'USD', dialCode: '+291' },

  // ── Afrique du Nord ─────────────────────────────────────────────────────
  { name: 'Maroc',            code: 'MA', currency: 'MAD', dialCode: '+212' },
  { name: 'Algérie',          code: 'DZ', currency: 'EUR', dialCode: '+213' },
  { name: 'Tunisie',          code: 'TN', currency: 'EUR', dialCode: '+216' },
  { name: 'Égypte',           code: 'EG', currency: 'USD', dialCode: '+20'  },
  { name: 'Libye',            code: 'LY', currency: 'USD', dialCode: '+218' },

  // ── Afrique Australe ────────────────────────────────────────────────────
  { name: 'Afrique du Sud',   code: 'ZA', currency: 'USD', dialCode: '+27'  },
  { name: 'Angola',           code: 'AO', currency: 'USD', dialCode: '+244' },
  { name: 'Mozambique',       code: 'MZ', currency: 'USD', dialCode: '+258' },
  { name: 'Zambie',           code: 'ZM', currency: 'USD', dialCode: '+260' },
  { name: 'Zimbabwe',         code: 'ZW', currency: 'USD', dialCode: '+263' },
  { name: 'Botswana',         code: 'BW', currency: 'USD', dialCode: '+267' },
  { name: 'Namibie',          code: 'NA', currency: 'USD', dialCode: '+264' },
  { name: 'Madagascar',       code: 'MG', currency: 'EUR', dialCode: '+261' },
  { name: 'Comores',          code: 'KM', currency: 'EUR', dialCode: '+269' },
  { name: 'Maurice',          code: 'MU', currency: 'EUR', dialCode: '+230' },

  // ── Europe ──────────────────────────────────────────────────────────────
  { name: 'France',           code: 'FR', currency: 'EUR', dialCode: '+33'  },
  { name: 'Belgique',         code: 'BE', currency: 'EUR', dialCode: '+32'  },
  { name: 'Suisse',           code: 'CH', currency: 'CHF', dialCode: '+41'  },
  { name: 'Luxembourg',       code: 'LU', currency: 'EUR', dialCode: '+352' },
  { name: 'Portugal',         code: 'PT', currency: 'EUR', dialCode: '+351' },
  { name: 'Espagne',          code: 'ES', currency: 'EUR', dialCode: '+34'  },
  { name: 'Italie',           code: 'IT', currency: 'EUR', dialCode: '+39'  },
  { name: 'Allemagne',        code: 'DE', currency: 'EUR', dialCode: '+49'  },
  { name: 'Pays-Bas',         code: 'NL', currency: 'EUR', dialCode: '+31'  },
  { name: 'Autriche',         code: 'AT', currency: 'EUR', dialCode: '+43'  },
  { name: 'Finlande',         code: 'FI', currency: 'EUR', dialCode: '+358' },
  { name: 'Irlande',          code: 'IE', currency: 'EUR', dialCode: '+353' },
  { name: 'Royaume-Uni',      code: 'GB', currency: 'GBP', dialCode: '+44'  },
  { name: 'Suède',            code: 'SE', currency: 'EUR', dialCode: '+46'  },
  { name: 'Norvège',          code: 'NO', currency: 'EUR', dialCode: '+47'  },
  { name: 'Danemark',         code: 'DK', currency: 'EUR', dialCode: '+45'  },
  { name: 'Russie',           code: 'RU', currency: 'RUB', dialCode: '+7'   },

  // ── Amériques ───────────────────────────────────────────────────────────
  { name: 'Canada',           code: 'CA', currency: 'CAD', dialCode: '+1'   },
  { name: 'États-Unis',       code: 'US', currency: 'USD', dialCode: '+1'   },
  { name: 'Brésil',           code: 'BR', currency: 'USD', dialCode: '+55'  },
  { name: 'Mexique',          code: 'MX', currency: 'USD', dialCode: '+52'  },
  { name: 'Colombie',         code: 'CO', currency: 'USD', dialCode: '+57'  },
  { name: 'Argentine',        code: 'AR', currency: 'USD', dialCode: '+54'  },
  { name: 'Chili',            code: 'CL', currency: 'USD', dialCode: '+56'  },

  // ── Moyen-Orient & Asie ─────────────────────────────────────────────────
  { name: 'Émirats arabes unis', code: 'AE', currency: 'USD', dialCode: '+971' },
  { name: 'Arabie Saoudite',  code: 'SA', currency: 'USD', dialCode: '+966' },
  { name: 'Australie',        code: 'AU', currency: 'USD', dialCode: '+61'  },

  { name: 'Autre',            code: 'XX', currency: 'USD', dialCode: '' },
]

export function currencyForCountry(countryName: string): SupportedCurrency {
  return COUNTRIES.find(c => c.name === countryName)?.currency ?? 'USD'
}
