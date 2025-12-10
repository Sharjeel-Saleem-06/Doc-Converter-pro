import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';
type Language = 'en' | 'ur' | 'es' | 'fr' | 'de' | 'zh';

interface ThemeSettings {
  theme: Theme;
  language: Language;
  fontSize: 'small' | 'medium' | 'large';
  animations: boolean;
  autoSave: boolean;
  compactMode: boolean;
  highContrast: boolean;
  autoDownload: boolean;
}

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  language: Language;
  settings: ThemeSettings;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  updateSettings: (settings: Partial<ThemeSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: ThemeSettings = {
  theme: 'system',
  language: 'en',
  fontSize: 'medium',
  animations: true,
  autoSave: true,
  compactMode: false,
  highContrast: false,
  autoDownload: false,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('docconverter-settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }
    return defaultSettings;
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Resolve system theme
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateResolvedTheme = () => {
      if (settings.theme === 'system') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      } else {
        setResolvedTheme(settings.theme as 'light' | 'dark');
      }
    };

    updateResolvedTheme();
    mediaQuery.addEventListener('change', updateResolvedTheme);

    return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
  }, [settings.theme]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Remove previous theme classes
    root.classList.remove('light', 'dark');

    // Add current theme
    root.classList.add(resolvedTheme);

    // Apply other settings
    root.style.fontSize = settings.fontSize === 'small' ? '14px' :
      settings.fontSize === 'large' ? '18px' : '16px';

    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (settings.compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }

    // Disable animations if requested
    if (!settings.animations) {
      root.classList.add('no-animations');
    } else {
      root.classList.remove('no-animations');
    }
  }, [resolvedTheme, settings]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('docconverter-settings', JSON.stringify(settings));
  }, [settings]);

  const toggleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(settings.theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setSettings(prev => ({ ...prev, theme: nextTheme }));
  };

  const setTheme = (theme: Theme) => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const setLanguage = (language: Language) => {
    setSettings(prev => ({ ...prev, language }));
    // Update document language
    document.documentElement.lang = language;
  };

  const updateSettings = (newSettings: Partial<ThemeSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('docconverter-settings');
  };

  const contextValue: ThemeContextType = {
    theme: settings.theme,
    resolvedTheme,
    language: settings.language,
    settings,
    toggleTheme,
    setTheme,
    setLanguage,
    updateSettings,
    resetSettings,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Language translations
export const translations = {
  en: {
    // Navigation
    home: 'Home',
    converter: 'Converter',
    batchProcessor: 'Batch Processor',
    editor: 'Editor',
    history: 'History',
    settings: 'Settings',
    profile: 'Profile',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',

    // Common
    upload: 'Upload',
    download: 'Download',
    convert: 'Convert',
    converting: 'Converting...',
    success: 'Success',
    error: 'Error',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    clear: 'Clear',

    // Converter
    dragDropFiles: 'Drag and drop files here or click to browse',
    supportedFormats: 'Supported formats',
    convertTo: 'Convert to',
    conversionComplete: 'Conversion complete',
    conversionFailed: 'Conversion failed',

    // Settings
    theme: 'Theme',
    language: 'Language',
    fontSize: 'Font Size',
    animations: 'Animations',
    autoSave: 'Auto Save',
    compactMode: 'Compact Mode',
    highContrast: 'High Contrast',

    // Converter Page additional
    outputFormat: 'Output Format',
    document: 'Document',
    data: 'Data',
    browseFiles: 'Browse Files',
    quickStats: 'Quick Stats',
    totalFiles: 'Total files',
    totalSize: 'Total size',
    convertNow: 'Convert Now',
    convertFiles: 'Convert',
    selectFiles: 'Select Files',
    uploadFiles: 'Upload Files',
    dragAndDrop: 'Drag & drop files here',
    orClickToBrowse: 'or click to browse your computer',
    maximumFileSize: 'Maximum file size',
    maximumFiles: 'Maximum files',
    formatsSupported: 'formats supported',
    advancedOptions: 'Advanced Options',
    quality: 'Quality',
    pageSize: 'Page Size',
    orientation: 'Orientation',
    portrait: 'Portrait',
    landscape: 'Landscape',
    margin: 'Margin',
    preserveFormatting: 'Preserve Formatting',
  },
  ur: {
    // Navigation
    home: 'گھر',
    converter: 'کنورٹر',
    batchProcessor: 'بیچ پروسیسر',
    editor: 'ایڈیٹر',
    history: 'تاریخ',
    settings: 'ترتیبات',
    profile: 'پروفائل',
    signIn: 'سائن ان',
    signUp: 'سائن اپ',
    signOut: 'سائن آؤٹ',

    // Common
    upload: 'اپ لوڈ',
    download: 'ڈاؤن لوڈ',
    convert: 'تبدیل کریں',
    converting: 'تبدیل ہو رہا ہے...',
    success: 'کامیابی',
    error: 'خرابی',
    cancel: 'منسوخ',
    save: 'محفوظ کریں',
    delete: 'حذف کریں',
    clear: 'صاف کریں',

    // Converter
    dragDropFiles: 'فائلیں یہاں گھسیٹیں یا براؤز کرنے کے لیے کلک کریں',
    supportedFormats: 'معاون فارمیٹس',
    convertTo: 'میں تبدیل کریں',
    conversionComplete: 'تبدیلی مکمل',
    conversionFailed: 'تبدیلی ناکام',

    // Settings
    theme: 'تھیم',
    language: 'زبان',
    fontSize: 'فونٹ سائز',
    animations: 'حرکات',
    autoSave: 'خودکار محفوظ',
    compactMode: 'کمپیکٹ موڈ',
    highContrast: 'زیادہ کنٹراسٹ',

    // Converter Page additional
    outputFormat: 'آؤٹ پٹ فارمیٹ',
    document: 'دستاویز',
    data: 'ڈیٹا',
    browseFiles: 'فائلیں براؤز کریں',
    quickStats: 'فوری اعداد و شمار',
    totalFiles: 'کل فائلیں',
    totalSize: 'کل سائز',
    convertNow: 'ابھی تبدیل کریں',
    convertFiles: 'تبدیل کریں',
    selectFiles: 'فائلیں منتخب کریں',
    uploadFiles: 'فائلیں اپ لوڈ کریں',
    dragAndDrop: 'فائلیں یہاں چھوڑیں',
    orClickToBrowse: 'یا براؤز کرنے کے لیے کلک کریں',
    maximumFileSize: 'زیادہ سے زیادہ فائل سائز',
    maximumFiles: 'زیادہ سے زیادہ فائلیں',
    formatsSupported: 'فارمیٹس معاون ہیں',
    advancedOptions: 'اعلی ترتیبات',
    quality: 'معیار',
    pageSize: 'صفحہ سائز',
    orientation: 'سمت',
    portrait: 'عمودی',
    landscape: 'افقی',
    margin: 'مارجن',
    preserveFormatting: 'فارمیٹنگ محفوظ رکھیں',
  },
  // Add more languages as needed
  es: {
    home: 'Inicio',
    converter: 'Convertidor',
    batchProcessor: 'Procesador por Lotes',
    editor: 'Editor',
    history: 'Historial',
    settings: 'Configuración',
    profile: 'Perfil',
    signIn: 'Iniciar sesión',
    signUp: 'Registrarse',
    signOut: 'Cerrar sesión',
    upload: 'Subir',
    download: 'Descargar',
    convert: 'Convertir',
    converting: 'Convirtiendo...',
    success: 'Éxito',
    error: 'Error',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    clear: 'Limpiar',
    dragDropFiles: 'Arrastra y suelta archivos aquí o haz clic para navegar',
    supportedFormats: 'Formatos compatibles',
    convertTo: 'Convertir a',
    conversionComplete: 'Conversión completa',
    conversionFailed: 'Conversión fallida',
    theme: 'Tema',
    language: 'Idioma',
    fontSize: 'Tamaño de fuente',
    animations: 'Animaciones',
    autoSave: 'Guardado automático',
    compactMode: 'Modo compacto',
    highContrast: 'Alto contraste',

    // Converter Page additional
    outputFormat: 'Formato de salida',
    document: 'Documento',
    data: 'Datos',
    browseFiles: 'Explorar archivos',
    quickStats: 'Estadísticas rápidas',
    totalFiles: 'Total de archivos',
    totalSize: 'Tamaño total',
    convertNow: 'Convertir ahora',
    convertFiles: 'Convertir',
    selectFiles: 'Seleccionar archivos',
    uploadFiles: 'Subir archivos',
    dragAndDrop: 'Arrastra y suelta archivos aquí',
    orClickToBrowse: 'o haz clic para explorar',
    maximumFileSize: 'Tamaño máximo de archivo',
    maximumFiles: 'Máximo de archivos',
    formatsSupported: 'formatos compatibles',
    advancedOptions: 'Opciones avanzadas',
    quality: 'Calidad',
    pageSize: 'Tamaño de página',
    orientation: 'Orientación',
    portrait: 'Vertical',
    landscape: 'Horizontal',
    margin: 'Margen',
    preserveFormatting: 'Preservar formato',
  },
  fr: {
    home: 'Accueil',
    converter: 'Convertisseur',
    batchProcessor: 'Traitement par lots',
    editor: 'Éditeur',
    history: 'Historique',
    settings: 'Paramètres',
    profile: 'Profil',
    signIn: 'Se connecter',
    signUp: "S'inscrire",
    signOut: 'Se déconnecter',
    upload: 'Télécharger',
    download: 'Télécharger',
    convert: 'Convertir',
    converting: 'Conversion...',
    success: 'Succès',
    error: 'Erreur',
    cancel: 'Annuler',
    save: 'Sauvegarder',
    delete: 'Supprimer',
    clear: 'Effacer',
    dragDropFiles: 'Glissez-déposez les fichiers ici ou cliquez pour parcourir',
    supportedFormats: 'Formats pris en charge',
    convertTo: 'Convertir en',
    conversionComplete: 'Conversion terminée',
    conversionFailed: 'Échec de la conversion',
    theme: 'Thème',
    language: 'Langue',
    fontSize: 'Taille de police',
    animations: 'Animations',
    autoSave: 'Sauvegarde automatique',
    compactMode: 'Mode compact',
    highContrast: 'Contraste élevé',

    // Converter Page additional
    outputFormat: 'Format de sortie',
    document: 'Document',
    data: 'Données',
    browseFiles: 'Parcourir les fichiers',
    quickStats: 'Statistiques rapides',
    totalFiles: 'Total des fichiers',
    totalSize: 'Taille totale',
    convertNow: 'Convertir maintenant',
    convertFiles: 'Convertir',
    selectFiles: 'Sélectionner des fichiers',
    uploadFiles: 'Télécharger des fichiers',
    dragAndDrop: 'Glissez-déposez les fichiers ici',
    orClickToBrowse: 'ou cliquez pour parcourir',
    maximumFileSize: 'Taille maximale du fichier',
    maximumFiles: 'Fichiers maximum',
    formatsSupported: 'formats pris en charge',
    advancedOptions: 'Options avancées',
    quality: 'Qualité',
    pageSize: 'Taille de page',
    orientation: 'Orientation',
    portrait: 'Portrait',
    landscape: 'Paysage',
    margin: 'Marge',
    preserveFormatting: 'Conserver le formatage',
  },
  de: {
    home: 'Startseite',
    converter: 'Konverter',
    batchProcessor: 'Stapelverarbeitung',
    editor: 'Editor',
    history: 'Verlauf',
    settings: 'Einstellungen',
    profile: 'Profil',
    signIn: 'Anmelden',
    signUp: 'Registrieren',
    signOut: 'Abmelden',
    upload: 'Hochladen',
    download: 'Herunterladen',
    convert: 'Konvertieren',
    converting: 'Konvertierung...',
    success: 'Erfolg',
    error: 'Fehler',
    cancel: 'Abbrechen',
    save: 'Speichern',
    delete: 'Löschen',
    clear: 'Löschen',
    dragDropFiles: 'Dateien hier ablegen oder zum Durchsuchen klicken',
    supportedFormats: 'Unterstützte Formate',
    convertTo: 'Konvertieren zu',
    conversionComplete: 'Konvertierung abgeschlossen',
    conversionFailed: 'Konvertierung fehlgeschlagen',
    theme: 'Design',
    language: 'Sprache',
    fontSize: 'Schriftgröße',
    animations: 'Animationen',
    autoSave: 'Automatisches Speichern',
    compactMode: 'Kompaktmodus',
    highContrast: 'Hoher Kontrast',

    // Converter Page additional
    outputFormat: 'Ausgabeformat',
    document: 'Dokument',
    data: 'Daten',
    browseFiles: 'Dateien durchsuchen',
    quickStats: 'Schnellstatistik',
    totalFiles: 'Dateien insgesamt',
    totalSize: 'Gesamtgröße',
    convertNow: 'Jetzt konvertieren',
    convertFiles: 'Konvertieren',
    selectFiles: 'Dateien auswählen',
    uploadFiles: 'Dateien hochladen',
    dragAndDrop: 'Dateien hier ablegen',
    orClickToBrowse: 'oder zum Durchsuchen klicken',
    maximumFileSize: 'Maximale Dateigröße',
    maximumFiles: 'Maximale Dateien',
    formatsSupported: 'unterstützte Formate',
    advancedOptions: 'Erweiterte Optionen',
    quality: 'Qualität',
    pageSize: 'Seitengröße',
    orientation: 'Ausrichtung',
    portrait: 'Hochformat',
    landscape: 'Querformat',
    margin: 'Rand',
    preserveFormatting: 'Formatierung beibehalten',
  },
  zh: {
    home: '首页',
    converter: '转换器',
    batchProcessor: '批处理器',
    editor: '编辑器',
    history: '历史记录',
    settings: '设置',
    profile: '个人资料',
    signIn: '登录',
    signUp: '注册',
    signOut: '退出',
    upload: '上传',
    download: '下载',
    convert: '转换',
    converting: '转换中...',
    success: '成功',
    error: '错误',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    clear: '清除',
    dragDropFiles: '将文件拖放到此处或点击浏览',
    supportedFormats: '支持的格式',
    convertTo: '转换为',
    conversionComplete: '转换完成',
    conversionFailed: '转换失败',
    theme: '主题',
    language: '语言',
    fontSize: '字体大小',
    animations: '动画',
    autoSave: '自动保存',
    compactMode: '紧凑模式',
    highContrast: '高对比度',

    // Converter Page additional
    outputFormat: '输出格式',
    document: '文档',
    data: '数据',
    browseFiles: '浏览文件',
    quickStats: '快速统计',
    totalFiles: '文件总数',
    totalSize: '总大小',
    convertNow: '立即转换',
    convertFiles: '转换',
    selectFiles: '选择文件',
    uploadFiles: '上传文件',
    dragAndDrop: '将文件拖放到此处',
    orClickToBrowse: '或点击浏览',
    maximumFileSize: '最大文件大小',
    maximumFiles: '最大文件数',
    formatsSupported: '支持的格式',
    advancedOptions: '高级选项',
    quality: '质量',
    pageSize: '页面大小',
    orientation: '方向',
    portrait: '纵向',
    landscape: '横向',
    margin: '边距',
    preserveFormatting: '保留格式',
  },
};

export function useTranslation() {
  const { language } = useTheme();

  const t = (key: keyof typeof translations.en): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return { t, language };
} 