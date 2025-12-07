import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Image, Code, FileSpreadsheet } from 'lucide-react';
import { ConversionFile } from '@/contexts/ConversionContext';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FilePreviewProps {
  file: ConversionFile;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
  const getFileIcon = (format: string) => {
    switch (format) {
      case 'txt':
      case 'md':
      case 'html':
        return FileText;
      case 'png':
      case 'jpg':
        return Image;
      case 'json':
      case 'xml':
        return Code;
      case 'csv':
        return FileSpreadsheet;
      default:
        return FileText;
    }
  };

  const renderPreview = () => {
    const content = typeof file.content === 'string' ? file.content : '';
    const preview = content.slice(0, 1000); // Limit preview to first 1000 characters

    switch (file.originalFormat) {
      case 'md':
        return (
          <div className="prose prose-sm max-w-none" data-id="3ffdx6h7p" data-path="src/components/converter/FilePreview.tsx">
            <pre className="whitespace-pre-wrap text-xs" data-id="z69xhy4ux" data-path="src/components/converter/FilePreview.tsx">{preview}</pre>
            {content.length > 1000 &&
            <p className="text-muted-foreground text-xs mt-2" data-id="0m49b6p5c" data-path="src/components/converter/FilePreview.tsx">
                ... and {content.length - 1000} more characters
              </p>
            }
          </div>);


      case 'html':
        return (
          <div className="text-xs" data-id="zwo5j8zz5" data-path="src/components/converter/FilePreview.tsx">
            <code className="block whitespace-pre-wrap" data-id="h0d0eqbmp" data-path="src/components/converter/FilePreview.tsx">{preview}</code>
            {content.length > 1000 &&
            <p className="text-muted-foreground mt-2" data-id="mbczwy5f2" data-path="src/components/converter/FilePreview.tsx">
                ... and {content.length - 1000} more characters
              </p>
            }
          </div>);


      case 'json':
        try {
          const jsonData = JSON.parse(content);
          const formatted = JSON.stringify(jsonData, null, 2);
          const jsonPreview = formatted.slice(0, 1000);
          return (
            <div className="text-xs" data-id="nqud7ks03" data-path="src/components/converter/FilePreview.tsx">
              <pre className="whitespace-pre-wrap" data-id="ld6nv68xa" data-path="src/components/converter/FilePreview.tsx">{jsonPreview}</pre>
              {formatted.length > 1000 &&
              <p className="text-muted-foreground mt-2" data-id="u9v3gsg7h" data-path="src/components/converter/FilePreview.tsx">
                  ... and {formatted.length - 1000} more characters
                </p>
              }
            </div>);

        } catch {
          return (
            <div className="text-xs" data-id="4lm3yhj7b" data-path="src/components/converter/FilePreview.tsx">
              <pre className="whitespace-pre-wrap" data-id="mbsd79o14" data-path="src/components/converter/FilePreview.tsx">{preview}</pre>
            </div>);

        }

      case 'csv':
        const lines = content.split('\n').slice(0, 10);
        return (
          <div className="text-xs" data-id="d7jvpf0xq" data-path="src/components/converter/FilePreview.tsx">
            <table className="w-full border-collapse" data-id="spzjtjma4" data-path="src/components/converter/FilePreview.tsx">
              <tbody data-id="55uf72xvk" data-path="src/components/converter/FilePreview.tsx">
                {lines.map((line, index) => {
                  const cells = line.split(',');
                  return (
                    <tr key={index} className={index === 0 ? 'font-semibold' : ''} data-id="q3t3eof9r" data-path="src/components/converter/FilePreview.tsx">
                      {cells.slice(0, 3).map((cell, cellIndex) =>
                      <td key={cellIndex} className="border border-border p-1 truncate" data-id="40jrlc6of" data-path="src/components/converter/FilePreview.tsx">
                          {cell.trim()}
                        </td>
                      )}
                      {cells.length > 3 &&
                      <td className="border border-border p-1 text-muted-foreground" data-id="4mxppxm6f" data-path="src/components/converter/FilePreview.tsx">
                          ... +{cells.length - 3} cols
                        </td>
                      }
                    </tr>);

                })}
              </tbody>
            </table>
            {content.split('\n').length > 10 &&
            <p className="text-muted-foreground mt-2" data-id="aov2nim6r" data-path="src/components/converter/FilePreview.tsx">
                ... and {content.split('\n').length - 10} more rows
              </p>
            }
          </div>);


      default:
        return (
          <div className="text-xs" data-id="lrypqgsxk" data-path="src/components/converter/FilePreview.tsx">
            <pre className="whitespace-pre-wrap" data-id="uo2q9ol2k" data-path="src/components/converter/FilePreview.tsx">{preview}</pre>
            {content.length > 1000 &&
            <p className="text-muted-foreground mt-2" data-id="zdtlbtaaw" data-path="src/components/converter/FilePreview.tsx">
                ... and {content.length - 1000} more characters
              </p>
            }
          </div>);

    }
  };

  const Icon = getFileIcon(file.originalFormat);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4" data-id="0kqoy4a18" data-path="src/components/converter/FilePreview.tsx">

      {/* File Info */}
      <div className="flex items-center justify-between" data-id="bazkfyjlb" data-path="src/components/converter/FilePreview.tsx">
        <div className="flex items-center space-x-2" data-id="ckyyj40k2" data-path="src/components/converter/FilePreview.tsx">
          <Icon className="h-4 w-4 text-muted-foreground" data-id="rd98c3uae" data-path="src/components/converter/FilePreview.tsx" />
          <span className="text-sm font-medium truncate" data-id="co3cu3e56" data-path="src/components/converter/FilePreview.tsx">{file.name}</span>
        </div>
        <Badge variant="outline" className="text-xs" data-id="gua1egyh8" data-path="src/components/converter/FilePreview.tsx">
          {file.originalFormat.toUpperCase()}
        </Badge>
      </div>

      {/* File Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground" data-id="wjxvtg8sx" data-path="src/components/converter/FilePreview.tsx">
        <div data-id="voni7p2z2" data-path="src/components/converter/FilePreview.tsx">
          <span className="font-medium" data-id="5q1x8ask2" data-path="src/components/converter/FilePreview.tsx">Size:</span> {(file.size / 1024).toFixed(1)} KB
        </div>
        <div data-id="5swwy9532" data-path="src/components/converter/FilePreview.tsx">
          <span className="font-medium" data-id="fxr75uwuo" data-path="src/components/converter/FilePreview.tsx">Type:</span> {file.type || 'Unknown'}
        </div>
      </div>

      {/* Preview Content */}
      <div data-id="m4cs7ixxh" data-path="src/components/converter/FilePreview.tsx">
        <h4 className="text-sm font-medium mb-2" data-id="whdwbzzkt" data-path="src/components/converter/FilePreview.tsx">Preview</h4>
        <ScrollArea className="h-48 w-full border rounded-md p-3" data-id="8fx9pkyga" data-path="src/components/converter/FilePreview.tsx">
          {renderPreview()}
        </ScrollArea>
      </div>
    </motion.div>);

};

export default FilePreview;