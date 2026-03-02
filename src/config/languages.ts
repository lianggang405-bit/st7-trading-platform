/**
 * 支持的语言配置
 */
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const languages: Language[] = [
  {
    code: 'zh-TW',
    name: '繁体中文',
    nativeName: '繁體中文',
    flag: '🇹🇼',
  },
  {
    code: 'en',
    name: '英语',
    nativeName: 'English',
    flag: '🇬🇧',
  },
  {
    code: 'th',
    name: '泰语',
    nativeName: 'ไทย',
    flag: '🇹🇭',
  },
  {
    code: 'vi',
    name: '越南语',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
  },
  {
    code: 'ru',
    name: '俄语',
    nativeName: 'Русский язык',
    flag: '🇷🇺',
  },
  {
    code: 'de',
    name: '德语',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
  },
];
