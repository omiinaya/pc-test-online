const i18n = require('i18n');
const path = require('path');

// Configure i18n
i18n.configure({
  locales: ['en', 'es', 'fr', 'de', 'zh'], // Supported locales
  defaultLocale: 'en',
  directory: path.join(__dirname, '../locales'),
  objectNotation: true,
  updateFiles: false, // Don't auto-create missing translation files
  register: global, // Make i18n available globally
  api: {
    __: 't', // Shorthand for translations
    __n: 'tn' // Shorthand for plural translations
  },
  // Language detection from headers
  queryParameter: 'lang',
  header: 'accept-language',
  cookie: 'lang',
  autoReload: false,
  syncFiles: false,
  // Function to parse accept-language header
  parseLocaleFn (locale) {
    return locale.toLowerCase().split('-')[0];
  }
});

// Custom middleware for enhanced language detection
i18n.detectLanguage = function(req) {
  // Check query parameter first
  if (req.query && req.query.lang) {
    return req.query.lang;
  }
  
  // Check cookie
  if (req.cookies && req.cookies.lang) {
    return req.cookies.lang;
  }
  
  // Check accept-language header
  if (req.headers && req.headers['accept-language']) {
    const acceptLanguage = req.headers['accept-language'];
    const languages = acceptLanguage.split(',');
    if (languages.length > 0) {
      const primaryLanguage = languages[0].split(';')[0].trim();
      return primaryLanguage.toLowerCase().split('-')[0];
    }
  }
  
  // Fall back to default
  return this.getLocale();
};

module.exports = i18n;