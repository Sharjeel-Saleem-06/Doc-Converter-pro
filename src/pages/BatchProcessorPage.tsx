import React from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Upload, Settings, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const BatchProcessorPage = () => {
  return (
    <div className="container mx-auto px-4 py-8" data-id="kk4p27b8o" data-path="src/pages/BatchProcessorPage.tsx">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }} data-id="dx9fs59m6" data-path="src/pages/BatchProcessorPage.tsx">

        <div className="mb-8" data-id="fa8lwpsdd" data-path="src/pages/BatchProcessorPage.tsx">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" data-id="rj0m05fcf" data-path="src/pages/BatchProcessorPage.tsx">Batch Processor</h1>
          <p className="text-muted-foreground text-lg" data-id="xpgm0238k" data-path="src/pages/BatchProcessorPage.tsx">
            Convert multiple files efficiently with advanced batch processing features
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" data-id="zwi924pxk" data-path="src/pages/BatchProcessorPage.tsx">
          <div className="lg:col-span-2" data-id="prmsvncqa" data-path="src/pages/BatchProcessorPage.tsx">
            <Card data-id="lsedxz17y" data-path="src/pages/BatchProcessorPage.tsx">
              <CardHeader data-id="srz3oumb5" data-path="src/pages/BatchProcessorPage.tsx">
                <CardTitle className="flex items-center space-x-2" data-id="c3k3v9nqe" data-path="src/pages/BatchProcessorPage.tsx">
                  <FolderOpen className="h-5 w-5" data-id="avh3zz465" data-path="src/pages/BatchProcessorPage.tsx" />
                  <span data-id="7m555op9c" data-path="src/pages/BatchProcessorPage.tsx">Batch Upload</span>
                </CardTitle>
                <CardDescription data-id="kosz30u8a" data-path="src/pages/BatchProcessorPage.tsx">
                  Upload multiple files for batch conversion
                </CardDescription>
              </CardHeader>
              <CardContent data-id="x699cab5r" data-path="src/pages/BatchProcessorPage.tsx">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center" data-id="ulza4diqq" data-path="src/pages/BatchProcessorPage.tsx">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" data-id="4oduqx3uk" data-path="src/pages/BatchProcessorPage.tsx" />
                  <p className="text-lg font-medium mb-2" data-id="qkh8rk8ur" data-path="src/pages/BatchProcessorPage.tsx">Drop multiple files here</p>
                  <p className="text-sm text-muted-foreground" data-id="uytb7g1h3" data-path="src/pages/BatchProcessorPage.tsx">
                    Or click to browse for files
                  </p>
                  <Button className="mt-4" data-id="s4obdzb73" data-path="src/pages/BatchProcessorPage.tsx">Browse Files</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6" data-id="7p0ecb4z3" data-path="src/pages/BatchProcessorPage.tsx">
            <Card data-id="ortf20f5m" data-path="src/pages/BatchProcessorPage.tsx">
              <CardHeader data-id="nnek5pgmy" data-path="src/pages/BatchProcessorPage.tsx">
                <CardTitle className="flex items-center space-x-2" data-id="6w2qngxjt" data-path="src/pages/BatchProcessorPage.tsx">
                  <Settings className="h-5 w-5" data-id="s9s4s6d4r" data-path="src/pages/BatchProcessorPage.tsx" />
                  <span data-id="afmb6yi43" data-path="src/pages/BatchProcessorPage.tsx">Batch Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent data-id="zotfcptph" data-path="src/pages/BatchProcessorPage.tsx">
                <p className="text-muted-foreground" data-id="1mw5tzy1z" data-path="src/pages/BatchProcessorPage.tsx">
                  Configure batch processing options
                </p>
              </CardContent>
            </Card>

            <Card data-id="smp11m75a" data-path="src/pages/BatchProcessorPage.tsx">
              <CardHeader data-id="pffglmddb" data-path="src/pages/BatchProcessorPage.tsx">
                <CardTitle data-id="ocoznihfz" data-path="src/pages/BatchProcessorPage.tsx">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2" data-id="0l8va2h4w" data-path="src/pages/BatchProcessorPage.tsx">
                <Button className="w-full" data-id="od1u7oyo3" data-path="src/pages/BatchProcessorPage.tsx">
                  <Download className="h-4 w-4 mr-2" data-id="92kdxm2zr" data-path="src/pages/BatchProcessorPage.tsx" />
                  Download All
                </Button>
                <Button variant="outline" className="w-full" data-id="k3tnb712p" data-path="src/pages/BatchProcessorPage.tsx">
                  <Trash2 className="h-4 w-4 mr-2" data-id="7bn665o3x" data-path="src/pages/BatchProcessorPage.tsx" />
                  Clear All
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>);

};

export default BatchProcessorPage;