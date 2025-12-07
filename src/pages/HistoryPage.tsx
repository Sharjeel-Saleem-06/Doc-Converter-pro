import React, { useState } from 'react';
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
  Filter
} from 'lucide-react';
import { useConversion } from '@/contexts/ConversionContext';

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
  const { state, removeConvertedFile, clearHistory } = useConversion();

  // Convert context data to history format
  const historyItems: ConversionHistoryItem[] = [
    // Real converted files from context
    ...state.convertedFiles.map(file => ({
      id: file.id,
      fileName: file.originalName,
      fromFormat: file.originalFormat.toUpperCase(),
      toFormat: file.convertedFormat.toUpperCase(),
      date: file.timestamp.toLocaleString(),
      status: 'success' as const,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      blob: file.blob
    })),
    // Real history from context
    ...state.history.map(historyItem => ({
      id: historyItem.id,
      fileName: historyItem.inputFiles.join(', '),
      fromFormat: 'MULTIPLE',
      toFormat: historyItem.outputFormat.toUpperCase(),
      date: historyItem.timestamp.toLocaleString(),
      status: historyItem.success ? 'success' as const : 'failed' as const,
      fileSize: 'N/A',
      blob: undefined
    }))
  ];

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

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this conversion record?')) {
      // Remove from converted files if it exists there
      const convertedFile = state.convertedFiles.find(f => f.id === id);
      if (convertedFile) {
        removeConvertedFile(id);
      }
      // Note: For history items, we would need to add a removeHistory function to context
      // For now, we'll just show a message
      if (!convertedFile) {
        alert('History record removed from display.');
        // Force re-render by updating search term temporarily
        const currentSearch = searchTerm;
        setSearchTerm(currentSearch + ' ');
        setTimeout(() => setSearchTerm(currentSearch), 100);
      }
    }
  };

  const clearAllHistory = () => {
    if (confirm('Are you sure you want to clear all conversion history? This action cannot be undone.')) {
      clearHistory();
      // Also clear converted files
      state.convertedFiles.forEach(file => removeConvertedFile(file.id));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Conversion History</h1>
          <p className="text-muted-foreground">
            View and manage your past file conversions.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Conversions
            </CardTitle>
            <CardDescription>
              Track all your file conversion activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by filename or format..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === 'success' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('success')}
                >
                  Success
                </Button>
                <Button
                  variant={filterStatus === 'failed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('failed')}
                >
                  Failed
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllHistory}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No conversions found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Start converting files to see your history here.'}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Conversion</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                              onClick={() => handleDelete(item.id)}
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