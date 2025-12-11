import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wand2,
    Sparkles,
    RefreshCw,
    Check,
    X,
    Loader2,
    ChevronDown,
    MessageSquare,
    Plus,
    Minus,
    Type,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import * as aiService from '@/services/aiService';
import { toast } from 'react-hot-toast';

interface AIToolbarProps {
    selectedText: string;
    onReplace: (newText: string) => void;
    onInsert: (text: string) => void;
    position?: { x: number; y: number };
    onClose?: () => void;
}

export const AIToolbar: React.FC<AIToolbarProps> = ({
    selectedText,
    onReplace,
    onInsert,
    position,
    onClose,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showGenerateDialog, setShowGenerateDialog] = useState(false);
    const [generatePrompt, setGeneratePrompt] = useState('');

    const handleAIAction = async (action: () => Promise<string>, successMessage: string) => {
        setIsLoading(true);
        try {
            const result = await action();
            onReplace(result);
            toast.success(successMessage);
            onClose?.();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'AI action failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateContent = async () => {
        if (!generatePrompt.trim()) return;

        setIsLoading(true);
        try {
            const result = await aiService.generateContent(generatePrompt);
            onInsert(result);
            toast.success('Content generated successfully!');
            setShowGenerateDialog(false);
            setGeneratePrompt('');
            onClose?.();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Generation failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-2"
                style={{
                    top: position?.y ? `${position.y - 60}px` : '50%',
                    left: position?.x ? `${position.x}px` : '50%',
                    transform: !position ? 'translate(-50%, -50%)' : undefined,
                }}
            >
                <div className="flex items-center gap-2">
                    {/* AI Pen Icon */}
                    <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-md">
                        <Wand2 className="w-4 h-4 text-white" />
                        <span className="text-xs font-medium text-white">AI</span>
                    </div>

                    {selectedText ? (
                        <>
                            {/* Quick Actions for Selected Text */}
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleAIAction(
                                    () => aiService.improveGrammar(selectedText),
                                    'Grammar improved!'
                                )}
                                disabled={isLoading}
                                className="text-xs"
                            >
                                <Check className="w-3 h-3 mr-1" />
                                Fix
                            </Button>

                            {/* More Options Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="ghost" disabled={isLoading} className="text-xs">
                                        <RefreshCw className="w-3 h-3 mr-1" />
                                        Rewrite
                                        <ChevronDown className="w-3 h-3 ml-1" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48">
                                    <DropdownMenuLabel>Change Tone</DropdownMenuLabel>
                                    <DropdownMenuItem
                                        onClick={() => handleAIAction(
                                            () => aiService.changeTone(selectedText, 'professional'),
                                            'Tone changed to professional'
                                        )}
                                    >
                                        <Type className="w-4 h-4 mr-2" />
                                        Professional
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleAIAction(
                                            () => aiService.changeTone(selectedText, 'formal'),
                                            'Tone changed to formal'
                                        )}
                                    >
                                        <Type className="w-4 h-4 mr-2" />
                                        Formal
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleAIAction(
                                            () => aiService.changeTone(selectedText, 'casual'),
                                            'Tone changed to casual'
                                        )}
                                    >
                                        <Type className="w-4 h-4 mr-2" />
                                        Casual
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleAIAction(
                                            () => aiService.changeTone(selectedText, 'friendly'),
                                            'Tone changed to friendly'
                                        )}
                                    >
                                        <Type className="w-4 h-4 mr-2" />
                                        Friendly
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel>Modify Length</DropdownMenuLabel>
                                    <DropdownMenuItem
                                        onClick={() => handleAIAction(
                                            () => aiService.expandText(selectedText),
                                            'Text expanded'
                                        )}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Expand
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleAIAction(
                                            () => aiService.shortenText(selectedText),
                                            'Text shortened'
                                        )}
                                    >
                                        <Minus className="w-4 h-4 mr-2" />
                                        Shorten
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <>
                            {/* Generate New Content */}
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowGenerateDialog(true)}
                                disabled={isLoading}
                                className="text-xs"
                            >
                                <Sparkles className="w-3 h-3 mr-1" />
                                Generate
                            </Button>
                        </>
                    )}

                    {isLoading && <Loader2 className="w-4 h-4 animate-spin text-purple-500" />}

                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onClose}
                        className="text-xs ml-auto"
                    >
                        <X className="w-3 h-3" />
                    </Button>
                </div>
            </motion.div>

            {/* Generate Content Dialog */}
            <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-500" />
                            Generate Content with AI
                        </DialogTitle>
                        <DialogDescription>
                            Describe what you want to write, and AI will generate it for you.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                What do you want to write about?
                            </label>
                            <Textarea
                                placeholder="E.g., Write a professional email about project updates..."
                                value={generatePrompt}
                                onChange={(e) => setGeneratePrompt(e.target.value)}
                                rows={4}
                                className="resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowGenerateDialog(false);
                                    setGeneratePrompt('');
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleGenerateContent}
                                disabled={!generatePrompt.trim() || isLoading}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generate
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
