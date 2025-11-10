import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ko from './locales/ko.json';

const resources = {
  en: { translation: en },
  ko: { translation: ko },
};

// 브라우저 언어 감지 또는 localStorage에서 가져오기
const savedLanguage = localStorage.getItem('p-write-vacy-language');
const browserLanguage = navigator.language.split('-')[0]; // 'ko-KR' -> 'ko'
const defaultLanguage = savedLanguage || (browserLanguage === 'ko' ? 'ko' : 'en');

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

// 언어 변경 시 localStorage에 저장
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('p-write-vacy-language', lng);
});

export default i18n;
