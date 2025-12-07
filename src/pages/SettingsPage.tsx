import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useTheme, useTranslation } from '@/contexts/ThemeContext';
import { useConversion } from '@/contexts/ConversionContext';
import { toast } from 'react-hot-toast';
import { 
  Settings, 
  Moon, 
  Sun, 
  Monitor,
  Download, 
  Upload, 
  Trash2, 
  Save,
  Bell,
  Shield,
  Database,
  Palette,
  Globe,
  Zap,
  FileText,
  Image,
  Cpu,
  HardDrive,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles,
  Eye,
  Type,
  Volume2,
  Accessibility,
  Languages,
  Gauge
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetSettings, setTheme, setLanguage } = useTheme();
  const { state: conversionState, updateSettings: updateConversionSettings, clearHistory } = useConversion();
  const { t } = useTranslation();
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 0 });

  // Calculate storage usage
  useEffect(() => {
    const calculateStorage = () => {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length;
        }
      }
      setStorageUsage({ used, total: 5 * 1024 * 1024 }); // 5MB typical limit
    };
    
    calculateStorage();
    const interval = setInterval(calculateStorage, 5000);
    return () => clearInterval(interval);
  }, []);

  // Track changes
  useEffect(() => {
    const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);
    setHasUnsavedChanges(hasChanges);
  }, [localSettings, settings]);

  const handleSettingChange = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    updateSettings(localSettings);
    toast.success('Settings saved successfully!', {
      icon: '✅',
      duration: 3000,
    });
    setHasUnsavedChanges(false);
  };

  const handleReset = async () => {
    setIsResetting(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
    resetSettings();
    setLocalSettings(settings);
    setIsResetting(false);
    toast.success('Settings reset to defaults!', {
      icon: '🔄',
      duration: 3000,
    });
  };

  const clearAllData = () => {
    clearHistory();
    localStorage.removeItem('docconverter-cache');
    toast.success('All data cleared!', {
      icon: '🗑️',
      duration: 3000,
    });
  };

  const exportSettings = () => {
    const settingsData = {
      theme: localSettings,
      conversion: conversionState.settings,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(settingsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'docconverter-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Settings exported!', {
      icon: '📤',
      duration: 3000,
    });
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (importedData.theme) {
          setLocalSettings(importedData.theme);
        }
        if (importedData.conversion) {
          updateConversionSettings(importedData.conversion);
        }
        toast.success('Settings imported successfully!', {
          icon: '📥',
          duration: 3000,
        });
      } catch (error) {
        toast.error('Invalid settings file!', {
          icon: '❌',
          duration: 3000,
        });
      }
    };
    reader.readAsText(file);
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ];

  const languageOptions = [
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'ur', label: 'اردو', flag: '🇵🇰' },
    { value: 'es', label: 'Español', flag: '🇪🇸' },
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
    { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { value: 'zh', label: '中文', flag: '🇨🇳' }
  ];

  const fontSizeOptions = [
    { value: 'small', label: 'Small (14px)', size: 14 },
    { value: 'medium', label: 'Medium (16px)', size: 16 },
    { value: 'large', label: 'Large (18px)', size: 18 }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Settings className="h-8 w-8 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {t('settings')}
              </h1>
              <p className="text-muted-foreground">Customize your DocConverter Pro experience</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <AnimatePresence>
              {hasUnsavedChanges && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Badge variant="secondary" className="animate-pulse">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Unsaved changes
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
            
            <Button onClick={saveSettings} disabled={!hasUnsavedChanges} className="relative overflow-hidden">
              <motion.div
                animate={hasUnsavedChanges ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </motion.div>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="appearance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-6">
            <TabsTrigger value="appearance" className="flex items-center space-x-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="conversion" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Conversion</span>
            </TabsTrigger>
            <TabsTrigger value="accessibility" className="flex items-center space-x-2">
              <Accessibility className="h-4 w-4" />
              <span className="hidden sm:inline">Accessibility</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center space-x-2">
              <Gauge className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center space-x-2">
              <Cpu className="h-4 w-4" />
              <span className="hidden sm:inline">Advanced</span>
            </TabsTrigger>
          </TabsList>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Palette className="h-5 w-5" />
                    <span>Theme & Appearance</span>
                  </CardTitle>
                  <CardDescription>
                    Customize the visual appearance of the application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Theme Selection */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Theme</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {themeOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <motion.div
                            key={option.value}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              variant={localSettings.theme === option.value ? "default" : "outline"}
                              className="w-full h-16 flex flex-col space-y-1"
                              onClick={() => {
                                handleSettingChange('theme', option.value);
                                setTheme(option.value as any);
                              }}
                            >
                              <Icon className="h-5 w-5" />
                              <span className="text-xs">{option.label}</span>
                            </Button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Language Selection */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium flex items-center space-x-2">
                      <Languages className="h-4 w-4" />
                      <span>Language</span>
                    </Label>
                    <Select
                      value={localSettings.language}
                      onValueChange={(value) => {
                        handleSettingChange('language', value);
                        setLanguage(value as any);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center space-x-2">
                              <span>{option.flag}</span>
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Font Size */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium flex items-center space-x-2">
                      <Type className="h-4 w-4" />
                      <span>Font Size</span>
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      {fontSizeOptions.map((option) => (
                        <motion.div
                          key={option.value}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            variant={localSettings.fontSize === option.value ? "default" : "outline"}
                            className="w-full h-12 text-xs"
                            onClick={() => handleSettingChange('fontSize', option.value)}
                            style={{ fontSize: `${option.size * 0.8}px` }}
                          >
                            {option.label}
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Visual Preferences */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Visual Preferences</Label>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="animations">Enable Animations</Label>
                      </div>
                      <Switch
                        id="animations"
                        checked={localSettings.animations}
                        onCheckedChange={(checked) => handleSettingChange('animations', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="compact">Compact Mode</Label>
                      </div>
                      <Switch
                        id="compact"
                        checked={localSettings.compactMode}
                        onCheckedChange={(checked) => handleSettingChange('compactMode', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Accessibility className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="contrast">High Contrast</Label>
                      </div>
                      <Switch
                        id="contrast"
                        checked={localSettings.highContrast}
                        onCheckedChange={(checked) => handleSettingChange('highContrast', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Conversion Settings */}
          <TabsContent value="conversion" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Conversion Preferences</span>
                  </CardTitle>
                  <CardDescription>
                    Configure default conversion settings and behavior
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Default Output Format */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Default Output Format</Label>
                    <Select
                      value={conversionState.settings.defaultOutputFormat}
                      onValueChange={(value) => updateConversionSettings({ defaultOutputFormat: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="docx">Word Document</SelectItem>
                        <SelectItem value="html">HTML</SelectItem>
                        <SelectItem value="md">Markdown</SelectItem>
                        <SelectItem value="txt">Plain Text</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Quality Settings */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Quality Settings</Label>
                    
                    <div className="space-y-3">
                      <Label className="text-sm">PDF Quality</Label>
                      <Select
                        value={conversionState.settings.qualitySettings.pdfQuality}
                        onValueChange={(value) => updateConversionSettings({
                          qualitySettings: {
                            ...conversionState.settings.qualitySettings,
                            pdfQuality: value as 'low' | 'medium' | 'high'
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low (Faster)</SelectItem>
                          <SelectItem value="medium">Medium (Balanced)</SelectItem>
                          <SelectItem value="high">High (Best Quality)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm">Image Resolution (DPI)</Label>
                      <div className="px-3">
                        <Slider
                          value={[conversionState.settings.qualitySettings.imageResolution]}
                          onValueChange={([value]) => updateConversionSettings({
                            qualitySettings: {
                              ...conversionState.settings.qualitySettings,
                              imageResolution: value
                            }
                          })}
                          max={600}
                          min={72}
                          step={24}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>72 DPI</span>
                          <span>{conversionState.settings.qualitySettings.imageResolution} DPI</span>
                          <span>600 DPI</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Batch Settings */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Batch Processing</Label>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="autoProcess">Auto-process on upload</Label>
                        <p className="text-xs text-muted-foreground">Automatically start conversion when files are uploaded</p>
                      </div>
                      <Switch
                        id="autoProcess"
                        checked={conversionState.settings.batchSettings.autoProcess}
                        onCheckedChange={(checked) => updateConversionSettings({
                          batchSettings: {
                            ...conversionState.settings.batchSettings,
                            autoProcess: checked
                          }
                        })}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm">Maximum files per batch</Label>
                      <div className="px-3">
                        <Slider
                          value={[conversionState.settings.batchSettings.maxFiles]}
                          onValueChange={([value]) => updateConversionSettings({
                            batchSettings: {
                              ...conversionState.settings.batchSettings,
                              maxFiles: value
                            }
                          })}
                          max={50}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>1 file</span>
                          <span>{conversionState.settings.batchSettings.maxFiles} files</span>
                          <span>50 files</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Accessibility Settings */}
          <TabsContent value="accessibility" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Accessibility className="h-5 w-5" />
                    <span>Accessibility Options</span>
                  </CardTitle>
                  <CardDescription>
                    Configure accessibility features for better usability
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="autoSave">Auto-save preferences</Label>
                      <p className="text-xs text-muted-foreground">Automatically save your work and preferences</p>
                    </div>
                    <Switch
                      id="autoSave"
                      checked={localSettings.autoSave}
                      onCheckedChange={(checked) => handleSettingChange('autoSave', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="reducedMotion">Reduce motion</Label>
                      <p className="text-xs text-muted-foreground">Minimize animations and transitions</p>
                    </div>
                    <Switch
                      id="reducedMotion"
                      checked={!localSettings.animations}
                      onCheckedChange={(checked) => handleSettingChange('animations', !checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="screenReader">Screen reader optimizations</Label>
                      <p className="text-xs text-muted-foreground">Enhanced support for assistive technologies</p>
                    </div>
                    <Switch id="screenReader" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="keyboardNav">Enhanced keyboard navigation</Label>
                      <p className="text-xs text-muted-foreground">Improved keyboard shortcuts and focus indicators</p>
                    </div>
                    <Switch id="keyboardNav" defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Performance Settings */}
          <TabsContent value="performance" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Gauge className="h-5 w-5" />
                    <span>Performance & Storage</span>
                  </CardTitle>
                  <CardDescription>
                    Monitor and optimize application performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Storage Usage */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium flex items-center space-x-2">
                        <HardDrive className="h-4 w-4" />
                        <span>Storage Usage</span>
                      </Label>
                      <Badge variant="outline">
                        {((storageUsage.used / storageUsage.total) * 100).toFixed(1)}% used
                      </Badge>
                    </div>
                    
                    <div className="w-full bg-secondary rounded-full h-2">
                      <motion.div
                        className="bg-primary h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(storageUsage.used / storageUsage.total) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{(storageUsage.used / 1024).toFixed(1)} KB used</span>
                      <span>{(storageUsage.total / (1024 * 1024)).toFixed(1)} MB total</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Cache Management */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Cache Management</Label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button variant="outline" onClick={clearHistory} className="h-auto p-4">
                        <div className="flex flex-col items-center space-y-2">
                          <Trash2 className="h-5 w-5" />
                          <div className="text-center">
                            <div className="font-medium">Clear History</div>
                            <div className="text-xs text-muted-foreground">Remove conversion history</div>
                          </div>
                        </div>
                      </Button>
                      
                      <Button variant="outline" onClick={clearAllData} className="h-auto p-4">
                        <div className="flex flex-col items-center space-y-2">
                          <Database className="h-5 w-5" />
                          <div className="text-center">
                            <div className="font-medium">Clear All Data</div>
                            <div className="text-xs text-muted-foreground">Reset everything</div>
                          </div>
                        </div>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Privacy & Security</span>
                  </CardTitle>
                  <CardDescription>
                    Control your privacy and data security preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="analytics">Usage analytics</Label>
                      <p className="text-xs text-muted-foreground">Help improve the app by sharing anonymous usage data</p>
                    </div>
                    <Switch id="analytics" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="crashReports">Crash reports</Label>
                      <p className="text-xs text-muted-foreground">Automatically send crash reports to help fix issues</p>
                    </div>
                    <Switch id="crashReports" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="localProcessing">Local processing only</Label>
                      <p className="text-xs text-muted-foreground">Process all files locally without sending to servers</p>
                    </div>
                    <Switch id="localProcessing" defaultChecked />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-base font-medium">Data Retention</Label>
                    <Select defaultValue="30">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="never">Never delete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Advanced Settings */}
          <TabsContent value="advanced" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Cpu className="h-5 w-5" />
                    <span>Advanced Options</span>
                  </CardTitle>
                  <CardDescription>
                    Advanced settings for power users and developers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Import/Export Settings */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Settings Management</Label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button onClick={exportSettings} variant="outline" className="h-auto p-4">
                        <div className="flex flex-col items-center space-y-2">
                          <Download className="h-5 w-5" />
                          <div className="text-center">
                            <div className="font-medium">Export Settings</div>
                            <div className="text-xs text-muted-foreground">Save current configuration</div>
                          </div>
                        </div>
                      </Button>
                      
                      <div className="relative">
                        <input
                          type="file"
                          accept=".json"
                          onChange={importSettings}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Button variant="outline" className="w-full h-auto p-4">
                          <div className="flex flex-col items-center space-y-2">
                            <Upload className="h-5 w-5" />
                            <div className="text-center">
                              <div className="font-medium">Import Settings</div>
                              <div className="text-xs text-muted-foreground">Load saved configuration</div>
                            </div>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Reset Options */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Reset Options</Label>
                    
                    <Button 
                      onClick={handleReset} 
                      variant="destructive" 
                      disabled={isResetting}
                      className="w-full"
                    >
                      {isResetting ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                        </motion.div>
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      {isResetting ? 'Resetting...' : 'Reset All Settings'}
                    </Button>
                  </div>

                  <Separator />

                  {/* Debug Information */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Debug Information</Label>
                    <div className="bg-muted p-4 rounded-lg font-mono text-xs space-y-1">
                      <div>Version: 1.0.0</div>
                      <div>Build: {new Date().toISOString().split('T')[0]}</div>
                      <div>User Agent: {navigator.userAgent.split(' ')[0]}</div>
                      <div>Storage: {(storageUsage.used / 1024).toFixed(1)} KB used</div>
                      <div>Language: {localSettings.language}</div>
                      <div>Theme: {localSettings.theme}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default SettingsPage; 