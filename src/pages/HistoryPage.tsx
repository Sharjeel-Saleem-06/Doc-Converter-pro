import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  History,
  Download,
  Trash2,
  Search,
  FileText,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useConversion } from '@/contexts/ConversionContext';
import { useUser } from '@clerk/clerk-react';
import { getConversionHistory, deleteConversionHistory, clearConversionHistory, ConversionHistory as SupabaseConversionHistory } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { useTranslation } from '@/contexts/ThemeContext';

interface ConversionHistoryItem {
  id: string;
  fileName: string;
  fromFormat: string;
  toFormat: string;
  date: string;
  status: 'success' | 'failed' | 'processing';
  fileSize: string;
  blob?: Blob;
}

const HistoryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [supabaseHistory, setSupabaseHistory] = useState<SupabaseConversionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { state, removeConvertedFile, clearHistory } = useConversion();
  const { user } = useUser();
  const { t } = useTranslation(); // Add translation hook

  // Load history from Supabase on component mount
  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const history = await getConversionHistory(user.id, 100); // Load last 100 conversions
      setSupabaseHistory(history);
      console.log(`✅ Loaded ${history.length} history records from Supabase`);
    } catch (error) {
      console.error('Failed to load history from Supabase:', error);
      toast.error('Failed to load conversion history');
    } finally {
      setIsLoading(false);
    }
  };

  // Convert Supabase data to history format - SINGLE SOURCE OF TRUTH
  // We only use Supabase for history, not the context state to avoid duplicates
  const historyItems: ConversionHistoryItem[] = supabaseHistory.map(item => ({
    id: item.id,
    fileName: item.file_name,
    fromFormat: item.source_format.toUpperCase(),
    toFormat: item.target_format.toUpperCase(),
    date: new Date(item.created_at).toLocaleString(),
    status: item.status === 'completed' ? 'success' as const :
      item.status === 'failed' ? 'failed' as const :
        'processing' as const,
    fileSize: item.file_size ? `${(item.file_size / (1024 * 1024)).toFixed(2)} MB` : 'N/A',
    blob: undefined // Blobs are not stored in DB, can only download from current session
  }));

  const filteredItems = historyItems.filter(item => {
    const matchesSearch = item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fromFormat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.toFormat.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDownload = (item: ConversionHistoryItem) => {
    if (item.blob) {
      // Create download link for the converted file
      const url = URL.createObjectURL(item.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.fileName.replace(/\.[^/.]+$/, '') + '.' + item.toFormat.toLowerCase();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Show message if file is not available
      alert('File is no longer available for download. Please convert again.');
    }
  };

  const handleDelete = async (id: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete the conversion record for "${fileName}"?`)) {
      return;
    }

    if (!user?.id) {
      toast.error('You must be logged in to delete history');
      return;
    }

    try {
      await deleteConversionHistory(id, user.id);
      // Refresh from database
      await loadHistory();
      toast.success('History record deleted');
    } catch (error) {
      console.error('Failed to delete history:', error);
      toast.error('Failed to delete history record');
    }
  };

  const clearAllHistory = async () => {
    if (!confirm('Are you sure you want to clear all conversion history? This action cannot be undone.')) {
      return;
    }

    if (!user?.id) {
      toast.error('You must be logged in to clear history');
      return;
    }

    try {
      await clearConversionHistory(user.id);
      await loadHistory();
      toast.success('All history cleared');
    } catch (error) {
      console.error('Failed to clear history:', error);
      toast.error('Failed to clear history');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('conversionHistory')}</h1>
          <p className="text-muted-foreground">
            {t('viewManagePastConversions')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t('recentConversions')}
            </CardTitle>
            <CardDescription>
              {t('trackConversionActivities')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('searchByFilename')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadHistory}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  {t('refresh')}
                </Button>
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                >
                  {t('all')}
                </Button>
                <Button
                  variant={filterStatus === 'success' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('success')}
                >
                  {t('success')}
                </Button>
                <Button
                  variant={filterStatus === 'failed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('failed')}
                >
                  {t('failed')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllHistory}
                  className="text-destructive hover:text-destructive"
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('clearAll')}
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-spin" />
                <h3 className="text-lg font-semibold mb-2">{t('loadingHistory')}</h3>
                <p className="text-muted-foreground">
                  {t('fetchingHistory')}
                </p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('noConversionsFound')}</h3>
                <p className="text-muted-foreground">
                  {searchTerm || filterStatus !== 'all'
                    ? t('tryAdjustingSearch')
                    : t('startConvertingFiles')}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('fileName')}</TableHead>
                      <TableHead>{t('conversion')}</TableHead>
                      <TableHead>{t('date')}</TableHead>
                      <TableHead>{t('size')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead className="text-right">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {item.fileName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{item.fromFormat}</Badge>
                            <span className="text-muted-foreground">→</span>
                            <Badge variant="outline">{item.toFormat}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {item.date}
                          </div>
                        </TableCell>
                        <TableCell>{item.fileSize}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {item.status === 'success' && item.blob && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(item)}
                                title="Download converted file"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id, item.fileName)}
                              className="text-destructive hover:text-destructive"
                              title="Delete conversion record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HistoryPage; 