import React, { useState, useRef, useEffect } from 'react';
import { useUser, useAuth, UserButton } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import {
    User,
    Camera,
    Mail,
    Calendar,
    FileText,
    TrendingUp,
    Clock,
    Edit2,
    Check,
    X,
    LogOut,
    Shield,
    Palette,
    Globe,
    Bell,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useTheme, useTranslation } from '@/contexts/ThemeContext';
import { getConversionStats } from '@/lib/supabase';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const ProfilePage: React.FC = () => {
    const { user, isLoaded } = useUser();
    const { signOut } = useAuth();
    const { theme, setTheme, language, setLanguage, settings, updateSettings } = useTheme();
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState('');
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [stats, setStats] = useState({
        totalConversions: 0,
        filesConverted: 0,
        totalFilesSize: 0,
        memberSince: 'N/A',
    });

    // Fetch real stats from Supabase
    useEffect(() => {
        const fetchStats = async () => {
            if (!user?.id) {
                setIsLoadingStats(false);
                return;
            }

            try {
                const conversionStats = await getConversionStats(user.id);
                setStats({
                    totalConversions: conversionStats.totalConversions,
                    filesConverted: conversionStats.totalConversions, // Same as conversions
                    totalFilesSize: conversionStats.totalFilesSize,
                    memberSince: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
                });
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setIsLoadingStats(false);
            }
        };

        fetchStats();
    }, [user]);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && user) {
            try {
                await user.setProfileImage({ file });
            } catch (error) {
                console.error('Failed to upload image:', error);
            }
        }
    };

    const handleNameUpdate = async () => {
        if (newName.trim() && user) {
            try {
                await user.update({ firstName: newName.split(' ')[0], lastName: newName.split(' ').slice(1).join(' ') });
                setIsEditingName(false);
            } catch (error) {
                console.error('Failed to update name:', error);
            }
        }
    };

    const handleSignOut = () => {
        signOut();
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 text-center">
                        <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-xl font-bold mb-2">Not Signed In</h2>
                        <p className="text-muted-foreground mb-6">Please sign in to view your profile</p>
                        <Button asChild>
                            <a href="/sign-in">Sign In</a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="mb-8 overflow-hidden">
                        {/* Cover Image */}
                        <div className="h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 relative">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_50%)]" />
                        </div>

                        <CardContent className="relative pt-0">
                            {/* Profile Image */}
                            <div className="absolute -top-16 left-6">
                                <div className="relative group">
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className="w-32 h-32 rounded-2xl border-4 border-background bg-muted overflow-hidden shadow-xl"
                                    >
                                        {user.imageUrl ? (
                                            <img
                                                src={user.imageUrl}
                                                alt={user.fullName || 'Profile'}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                                                <User className="w-12 h-12 text-white" />
                                            </div>
                                        )}
                                    </motion.div>

                                    {/* Upload Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Camera className="w-5 h-5" />
                                    </motion.button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="pt-20 pb-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        {isEditingName ? (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    value={newName}
                                                    onChange={(e) => setNewName(e.target.value)}
                                                    placeholder="Enter your name"
                                                    className="w-64"
                                                />
                                                <Button size="icon" variant="ghost" onClick={handleNameUpdate}>
                                                    <Check className="w-4 h-4 text-green-500" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => setIsEditingName(false)}>
                                                    <X className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <h1 className="text-2xl font-bold">{user.fullName || 'User'}</h1>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8"
                                                    onClick={() => {
                                                        setNewName(user.fullName || '');
                                                        setIsEditingName(true);
                                                    }}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                            <Mail className="w-4 h-4" />
                                            <span>{user.primaryEmailAddress?.emailAddress}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>Member since {stats.memberSince}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <UserButton
                                            appearance={{
                                                elements: {
                                                    avatarBox: "w-10 h-10",
                                                }
                                            }}
                                        />
                                        <Button variant="outline" onClick={handleSignOut} className="gap-2">
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </Button>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className="text-center p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <FileText className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                                        {isLoadingStats ? (
                                            <Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
                                        ) : (
                                            <div className="text-2xl font-bold">{stats.totalConversions}</div>
                                        )}
                                        <div className="text-sm text-muted-foreground">Conversions</div>
                                    </motion.div>
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className="text-center p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-500" />
                                        {isLoadingStats ? (
                                            <Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
                                        ) : (
                                            <div className="text-2xl font-bold">
                                                {stats.totalFilesSize > 0 
                                                    ? `${(stats.totalFilesSize / (1024 * 1024)).toFixed(1)} MB` 
                                                    : '0 MB'}
                                            </div>
                                        )}
                                        <div className="text-sm text-muted-foreground">Data Processed</div>
                                    </motion.div>
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className="text-center p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <Clock className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                                        <div className="text-2xl font-bold">Free</div>
                                        <div className="text-sm text-muted-foreground">Account Type</div>
                                    </motion.div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Preferences Section */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Appearance */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Palette className="w-5 h-5 text-primary" />
                                    Appearance
                                </CardTitle>
                                <CardDescription>Customize how DocConverter looks</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Theme */}
                                <div className="space-y-2">
                                    <Label>{t('theme')}</Label>
                                    <Select value={theme} onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select theme" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="light">Light</SelectItem>
                                            <SelectItem value="dark">Dark</SelectItem>
                                            <SelectItem value="system">System</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Font Size */}
                                <div className="space-y-2">
                                    <Label>{t('fontSize')}</Label>
                                    <Select
                                        value={settings.fontSize}
                                        onValueChange={(value: 'small' | 'medium' | 'large') => updateSettings({ fontSize: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select size" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="small">Small</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="large">Large</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                {/* Toggle Options */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>{t('animations')}</Label>
                                        <p className="text-sm text-muted-foreground">Enable motion effects</p>
                                    </div>
                                    <Switch
                                        checked={settings.animations}
                                        onCheckedChange={(checked) => updateSettings({ animations: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>{t('compactMode')}</Label>
                                        <p className="text-sm text-muted-foreground">Reduce spacing</p>
                                    </div>
                                    <Switch
                                        checked={settings.compactMode}
                                        onCheckedChange={(checked) => updateSettings({ compactMode: checked })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Language & Region */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-primary" />
                                    Language & Region
                                </CardTitle>
                                <CardDescription>Set your preferred language</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>{t('language')}</Label>
                                    <Select
                                        value={language}
                                        onValueChange={(value: 'en' | 'ur' | 'es' | 'fr' | 'de' | 'zh') => setLanguage(value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">🇺🇸 English</SelectItem>
                                            <SelectItem value="ur">🇵🇰 اردو</SelectItem>
                                            <SelectItem value="es">🇪🇸 Español</SelectItem>
                                            <SelectItem value="fr">🇫🇷 Français</SelectItem>
                                            <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                                            <SelectItem value="zh">🇨🇳 中文</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                {/* Privacy & Security */}
                                <div className="space-y-4">
                                    <h4 className="font-medium flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        Privacy
                                    </h4>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Auto Download</Label>
                                            <p className="text-sm text-muted-foreground">Download files automatically</p>
                                        </div>
                                        <Switch
                                            checked={settings.autoDownload}
                                            onCheckedChange={(checked) => updateSettings({ autoDownload: checked })}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Auto Save</Label>
                                            <p className="text-sm text-muted-foreground">Save preferences automatically</p>
                                        </div>
                                        <Switch
                                            checked={settings.autoSave}
                                            onCheckedChange={(checked) => updateSettings({ autoSave: checked })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Account Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-6"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                Account
                            </CardTitle>
                            <CardDescription>Manage your account settings</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4">
                                <Badge variant="secondary" className="text-sm px-4 py-2">
                                    <Shield className="w-4 h-4 mr-2" />
                                    Account Verified
                                </Badge>
                                <Badge variant="outline" className="text-sm px-4 py-2">
                                    <Clock className="w-4 h-4 mr-2" />
                                    Active Session
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default ProfilePage;
