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
  },
  ur: {
    // Navigation
    home: 'گھر',
    converter: 'کنورٹر',
    batchProcessor: 'بیچ پروسیسر',
    editor: 'ایڈیٹر',
    history: 'تاریخ',
    settings: 'ترتیبات',
    
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
  },
  // Add more languages as needed
  es: {
    home: 'Inicio',
    converter: 'Convertidor',
    batchProcessor: 'Procesador por Lotes',
    editor: 'Editor',
    history: 'Historial',
    settings: 'Configuración',
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
  },
  fr: {
    home: 'Accueil',
    converter: 'Convertisseur',
    batchProcessor: 'Traitement par lots',
    editor: 'Éditeur',
    history: 'Historique',
    settings: 'Paramètres',
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
  },
  de: {
    home: 'Startseite',
    converter: 'Konverter',
    batchProcessor: 'Stapelverarbeitung',
    editor: 'Editor',
    history: 'Verlauf',
    settings: 'Einstellungen',
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
  },
  zh: {
    home: '首页',
    converter: '转换器',
    batchProcessor: '批处理器',
    editor: '编辑器',
    history: '历史记录',
    settings: '设置',
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
  },
};

export function useTranslation() {
  const { language } = useTheme();
  
  const t = (key: keyof typeof translations.en): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };
  
  return { t, language };
} 