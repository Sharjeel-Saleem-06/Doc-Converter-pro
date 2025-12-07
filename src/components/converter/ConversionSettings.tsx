import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ConversionOptions, SupportedFormat } from '@/lib/conversionService';
import { Separator } from '@/components/ui/separator';

interface ConversionSettingsProps {
  options: ConversionOptions;
  onOptionsChange: (options: ConversionOptions) => void;
  outputFormat: SupportedFormat;
}

const ConversionSettings: React.FC<ConversionSettingsProps> = ({
  options,
  onOptionsChange,
  outputFormat
}) => {
  const updateOption = (key: keyof ConversionOptions, value: any) => {
    onOptionsChange({ ...options, [key]: value });
  };

  const showPDFSettings = outputFormat === 'pdf';
  const showImageSettings = outputFormat === 'png' || outputFormat === 'jpg';
  const showTextSettings = ['txt', 'html', 'md'].includes(outputFormat);

  return (
    <div className="space-y-6" data-id="zjafejhtx" data-path="src/components/converter/ConversionSettings.tsx">
      {/* General Settings */}
      <div className="space-y-4" data-id="vwgys2szs" data-path="src/components/converter/ConversionSettings.tsx">
        <h4 className="font-medium" data-id="7t2phky5p" data-path="src/components/converter/ConversionSettings.tsx">General Settings</h4>
        
        {showTextSettings &&
        <>
            <div className="space-y-2" data-id="r3r9pjjl7" data-path="src/components/converter/ConversionSettings.tsx">
              <Label htmlFor="fontSize" data-id="famidwvxh" data-path="src/components/converter/ConversionSettings.tsx">Font Size</Label>
              <div className="px-3" data-id="a3cchqsoc" data-path="src/components/converter/ConversionSettings.tsx">
                <Slider
                id="fontSize"
                min={8}
                max={24}
                step={1}
                value={[options.fontSize || 14]}
                onValueChange={(value) => updateOption('fontSize', value[0])}
                className="w-full" data-id="22wgijxbc" data-path="src/components/converter/ConversionSettings.tsx" />

                <div className="flex justify-between text-xs text-muted-foreground mt-1" data-id="sw2w0nse3" data-path="src/components/converter/ConversionSettings.tsx">
                  <span data-id="9g1k5g97o" data-path="src/components/converter/ConversionSettings.tsx">8px</span>
                  <span data-id="0a8kh3f59" data-path="src/components/converter/ConversionSettings.tsx">{options.fontSize || 14}px</span>
                  <span data-id="h2e4pvym1" data-path="src/components/converter/ConversionSettings.tsx">24px</span>
                </div>
              </div>
            </div>

            <div className="space-y-2" data-id="jcq37mon1" data-path="src/components/converter/ConversionSettings.tsx">
              <Label htmlFor="fontFamily" data-id="c1gjbufpr" data-path="src/components/converter/ConversionSettings.tsx">Font Family</Label>
              <Select
              value={options.fontFamily || 'Arial'}
              onValueChange={(value) => updateOption('fontFamily', value)} data-id="0p2b7fou0" data-path="src/components/converter/ConversionSettings.tsx">

                <SelectTrigger data-id="68h882zup" data-path="src/components/converter/ConversionSettings.tsx">
                  <SelectValue data-id="mn14nsoxw" data-path="src/components/converter/ConversionSettings.tsx" />
                </SelectTrigger>
                <SelectContent data-id="ysqsr4t6y" data-path="src/components/converter/ConversionSettings.tsx">
                  <SelectItem value="Arial" data-id="os6gsx86h" data-path="src/components/converter/ConversionSettings.tsx">Arial</SelectItem>
                  <SelectItem value="Times New Roman" data-id="eyfvw1ld6" data-path="src/components/converter/ConversionSettings.tsx">Times New Roman</SelectItem>
                  <SelectItem value="Courier New" data-id="lge1odcfj" data-path="src/components/converter/ConversionSettings.tsx">Courier New</SelectItem>
                  <SelectItem value="Georgia" data-id="1ld7g6wvz" data-path="src/components/converter/ConversionSettings.tsx">Georgia</SelectItem>
                  <SelectItem value="Verdana" data-id="5f5t0iofz" data-path="src/components/converter/ConversionSettings.tsx">Verdana</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        }

        {showPDFSettings &&
        <>
            <div className="space-y-2" data-id="1sbqniui6" data-path="src/components/converter/ConversionSettings.tsx">
              <Label htmlFor="pageSize" data-id="cowok9ozh" data-path="src/components/converter/ConversionSettings.tsx">Page Size</Label>
              <Select
              value={options.pageSize || 'A4'}
              onValueChange={(value: 'A4' | 'A3' | 'Letter') => updateOption('pageSize', value)} data-id="zqxkvlwza" data-path="src/components/converter/ConversionSettings.tsx">

                <SelectTrigger data-id="28flazt4x" data-path="src/components/converter/ConversionSettings.tsx">
                  <SelectValue data-id="4udgupfaq" data-path="src/components/converter/ConversionSettings.tsx" />
                </SelectTrigger>
                <SelectContent data-id="eyzsbhked" data-path="src/components/converter/ConversionSettings.tsx">
                  <SelectItem value="A4" data-id="rtu2x7ec9" data-path="src/components/converter/ConversionSettings.tsx">A4</SelectItem>
                  <SelectItem value="A3" data-id="vcqy0fwoe" data-path="src/components/converter/ConversionSettings.tsx">A3</SelectItem>
                  <SelectItem value="Letter" data-id="mb3tfduh6" data-path="src/components/converter/ConversionSettings.tsx">Letter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2" data-id="xvwlwq0qy" data-path="src/components/converter/ConversionSettings.tsx">
              <Label htmlFor="margin" data-id="gjukzpm21" data-path="src/components/converter/ConversionSettings.tsx">Page Margin (mm)</Label>
              <div className="px-3" data-id="i9dopqfrw" data-path="src/components/converter/ConversionSettings.tsx">
                <Slider
                id="margin"
                min={10}
                max={50}
                step={5}
                value={[options.margin || 20]}
                onValueChange={(value) => updateOption('margin', value[0])}
                className="w-full" data-id="jopw1yskb" data-path="src/components/converter/ConversionSettings.tsx" />

                <div className="flex justify-between text-xs text-muted-foreground mt-1" data-id="n1g0csy7y" data-path="src/components/converter/ConversionSettings.tsx">
                  <span data-id="mm43x5azt" data-path="src/components/converter/ConversionSettings.tsx">10mm</span>
                  <span data-id="hgwmsfnio" data-path="src/components/converter/ConversionSettings.tsx">{options.margin || 20}mm</span>
                  <span data-id="sna39pv8x" data-path="src/components/converter/ConversionSettings.tsx">50mm</span>
                </div>
              </div>
            </div>

            <div className="space-y-2" data-id="52eucouow" data-path="src/components/converter/ConversionSettings.tsx">
              <Label htmlFor="watermark" data-id="t1mc8m0d8" data-path="src/components/converter/ConversionSettings.tsx">Watermark Text (Optional)</Label>
              <Input
              id="watermark"
              placeholder="Enter watermark text"
              value={options.watermark || ''}
              onChange={(e) => updateOption('watermark', e.target.value)} data-id="8b1y3l1rk" data-path="src/components/converter/ConversionSettings.tsx" />

            </div>
          </>
        }

        {showImageSettings &&
        <>
            <div className="space-y-2" data-id="3jcz5g3gv" data-path="src/components/converter/ConversionSettings.tsx">
              <Label htmlFor="quality" data-id="irswrrhs3" data-path="src/components/converter/ConversionSettings.tsx">Image Quality</Label>
              <Select
              value={options.quality || 'medium'}
              onValueChange={(value: 'low' | 'medium' | 'high') => updateOption('quality', value)} data-id="53nv7j3qq" data-path="src/components/converter/ConversionSettings.tsx">

                <SelectTrigger data-id="h03uaxwmn" data-path="src/components/converter/ConversionSettings.tsx">
                  <SelectValue data-id="31o7d98oe" data-path="src/components/converter/ConversionSettings.tsx" />
                </SelectTrigger>
                <SelectContent data-id="ss7gzaqkf" data-path="src/components/converter/ConversionSettings.tsx">
                  <SelectItem value="low" data-id="cgtp5tbw4" data-path="src/components/converter/ConversionSettings.tsx">Low (Faster)</SelectItem>
                  <SelectItem value="medium" data-id="duxcac4a6" data-path="src/components/converter/ConversionSettings.tsx">Medium</SelectItem>
                  <SelectItem value="high" data-id="zwowbgj4q" data-path="src/components/converter/ConversionSettings.tsx">High (Best Quality)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2" data-id="9tzo09ecb" data-path="src/components/converter/ConversionSettings.tsx">
              <Label htmlFor="imageResolution" data-id="l7uyzob1m" data-path="src/components/converter/ConversionSettings.tsx">Resolution (DPI)</Label>
              <div className="px-3" data-id="nnje7q640" data-path="src/components/converter/ConversionSettings.tsx">
                <Slider
                id="imageResolution"
                min={72}
                max={600}
                step={24}
                value={[options.imageResolution || 300]}
                onValueChange={(value) => updateOption('imageResolution', value[0])}
                className="w-full" data-id="kmxtid3wy" data-path="src/components/converter/ConversionSettings.tsx" />

                <div className="flex justify-between text-xs text-muted-foreground mt-1" data-id="eovoqru4e" data-path="src/components/converter/ConversionSettings.tsx">
                  <span data-id="gglv55p47" data-path="src/components/converter/ConversionSettings.tsx">72 DPI</span>
                  <span data-id="gqjftzjq2" data-path="src/components/converter/ConversionSettings.tsx">{options.imageResolution || 300} DPI</span>
                  <span data-id="ru1ovk6dk" data-path="src/components/converter/ConversionSettings.tsx">600 DPI</span>
                </div>
              </div>
            </div>
          </>
        }
      </div>

      <Separator data-id="ina52nyxc" data-path="src/components/converter/ConversionSettings.tsx" />

      {/* Advanced Settings */}
      <div className="space-y-4" data-id="oeop6oeui" data-path="src/components/converter/ConversionSettings.tsx">
        <h4 className="font-medium" data-id="gzqg1xqh6" data-path="src/components/converter/ConversionSettings.tsx">Advanced Settings</h4>
        
        <div className="space-y-2" data-id="epeosrk7z" data-path="src/components/converter/ConversionSettings.tsx">
          <Label htmlFor="password" data-id="mnasvvy3h" data-path="src/components/converter/ConversionSettings.tsx">Password Protection (Optional)</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter password"
            value={options.password || ''}
            onChange={(e) => updateOption('password', e.target.value)}
            disabled={outputFormat !== 'pdf'} data-id="9wt1v82i0" data-path="src/components/converter/ConversionSettings.tsx" />

          {outputFormat !== 'pdf' &&
          <p className="text-xs text-muted-foreground" data-id="zir37kx6r" data-path="src/components/converter/ConversionSettings.tsx">
              Password protection is only available for PDF files
            </p>
          }
        </div>
      </div>

      <Separator data-id="zcbx957v3" data-path="src/components/converter/ConversionSettings.tsx" />

      {/* Quick Presets */}
      <div className="space-y-4" data-id="uumj07a2d" data-path="src/components/converter/ConversionSettings.tsx">
        <h4 className="font-medium" data-id="0ssbi9xlg" data-path="src/components/converter/ConversionSettings.tsx">Quick Presets</h4>
        
        <div className="grid grid-cols-1 gap-2" data-id="18erol31l" data-path="src/components/converter/ConversionSettings.tsx">
          <button
            className="text-left p-2 rounded border hover:bg-muted transition-colors"
            onClick={() => {
              onOptionsChange({
                fontSize: 12,
                fontFamily: 'Arial',
                pageSize: 'A4',
                margin: 15,
                quality: 'medium',
                imageResolution: 300
              });
            }} data-id="6ij28urr8" data-path="src/components/converter/ConversionSettings.tsx">

            <div className="font-medium text-sm" data-id="mamw6gqs2" data-path="src/components/converter/ConversionSettings.tsx">Standard</div>
            <div className="text-xs text-muted-foreground" data-id="0o3e5rbfp" data-path="src/components/converter/ConversionSettings.tsx">Balanced quality and size</div>
          </button>
          
          <button
            className="text-left p-2 rounded border hover:bg-muted transition-colors"
            onClick={() => {
              onOptionsChange({
                fontSize: 14,
                fontFamily: 'Times New Roman',
                pageSize: 'A4',
                margin: 25,
                quality: 'high',
                imageResolution: 600
              });
            }} data-id="19vk69w6i" data-path="src/components/converter/ConversionSettings.tsx">

            <div className="font-medium text-sm" data-id="5zo5vsytc" data-path="src/components/converter/ConversionSettings.tsx">High Quality</div>
            <div className="text-xs text-muted-foreground" data-id="n01nvmqxd" data-path="src/components/converter/ConversionSettings.tsx">Best quality output</div>
          </button>
          
          <button
            className="text-left p-2 rounded border hover:bg-muted transition-colors"
            onClick={() => {
              onOptionsChange({
                fontSize: 10,
                fontFamily: 'Arial',
                pageSize: 'A4',
                margin: 10,
                quality: 'low',
                imageResolution: 150
              });
            }} data-id="ainsga4hb" data-path="src/components/converter/ConversionSettings.tsx">

            <div className="font-medium text-sm" data-id="4uovid065" data-path="src/components/converter/ConversionSettings.tsx">Compact</div>
            <div className="text-xs text-muted-foreground" data-id="9yqf7hk3o" data-path="src/components/converter/ConversionSettings.tsx">Smaller file size</div>
          </button>
        </div>
      </div>
    </div>);

};

export default ConversionSettings;