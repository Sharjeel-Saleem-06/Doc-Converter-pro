import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Loader2, CheckCircle, XCircle, Zap, Sparkles,
    Code, MessageSquare, PlayCircle, StopCircle,
    CheckCheck, AlertCircle, Clock, Cpu
} from 'lucide-react';

import { langchainUtils } from '@/lib/langchain/llm';
import { LANGCHAIN_CONFIG, validateConfig } from '@/lib/langchain/config';
import type { StreamChunk } from '@/lib/langchain/types';

/**
 * Module 1.4: LangChain Integration Test Page
 * Comprehensive testing of LangChain + Groq integration
 */

interface TestResult {
    name: string;
    status: 'pending' | 'running' | 'success' | 'error';
    message: string;
    time?: number;
    output?: string;
    tokensEstimate?: number;
}

const LangChainTestPage: React.FC = () => {
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    // Custom test states
    const [customPrompt, setCustomPrompt] = useState('Write a haiku about coding');
    const [customResult, setCustomResult] = useState('');
    const [customTime, setCustomTime] = useState(0);

    // Streaming test states
    const [streamingText, setStreamingText] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamTokens, setStreamTokens] = useState(0);

    // Batch test state
    const [batchPrompts, setBatchPrompts] = useState([
        'What is AI?',
        'Explain machine learning',
        'What is TypeScript?',
    ]);
    const [batchResults, setBatchResults] = useState<string[]>([]);

    /**
     * Check configuration
     */
    const configValidation = validateConfig();

    /**
     * Update test result
     */
    const updateTest = (index: number, updates: Partial<TestResult>) => {
        setTestResults(prev => {
            const newResults = [...prev];
            newResults[index] = { ...newResults[index], ...updates };
            return newResults;
        });
    };

    /**
     * Run individual test
     */
    const runTest = async (
        index: number,
        testFn: () => Promise<string>,
        testName: string
    ) => {
        updateTest(index, { status: 'running' });
        const startTime = performance.now();

        try {
            const result = await testFn();
            const endTime = performance.now();
            const timeTaken = Math.round(endTime - startTime);

            updateTest(index, {
                status: 'success',
                message: '✅ Test passed',
                time: timeTaken,
                output: result,
                tokensEstimate: langchainUtils.estimateTokens(result),
            });
        } catch (error) {
            const endTime = performance.now();
            updateTest(index, {
                status: 'error',
                message: error instanceof Error ? error.message : 'Test failed',
                time: Math.round(endTime - startTime),
            });
        }
    };

    /**
     * Run all tests
     */
    const runAllTests = async () => {
        setIsRunning(true);

        const tests: TestResult[] = [
            {
                name: '1. LangChain Configuration',
                status: 'pending',
                message: 'Validating configuration...',
            },
            {
                name: '2. Basic LLM Call',
                status: 'pending',
                message: 'Testing basic completion...',
            },
            {
                name: '3. Grammar Correction',
                status: 'pending',
                message: 'Testing grammar operation...',
            },
            {
                name: '4. Text Rewriting',
                status: 'pending',
                message: 'Testing rewrite operation...',
            },
            {
                name: '5. Input Validation',
                status: 'pending',
                message: 'Testing input validation...',
            },
        ];

        setTestResults(tests);

        // Test 1: Configuration
        updateTest(0, { status: 'running' });
        if (configValidation.valid) {
            updateTest(0, {
                status: 'success',
                message: '✅ Configuration valid',
                output: `Model: ${LANGCHAIN_CONFIG.model}\nAPI Key: ${LANGCHAIN_CONFIG.apiKey ? 'Configured' : 'Missing'}`,
            });
        } else {
            updateTest(0, {
                status: 'error',
                message: configValidation.errors.join(', '),
            });
            setIsRunning(false);
            return;
        }

        // Test 2: Basic LLM Call
        await runTest(
            1,
            () => langchainUtils.complete('Say hello in a friendly way', undefined, 'generate'),
            'Basic LLM Call'
        );

        // Test 3: Grammar Correction
        await runTest(
            2,
            () => langchainUtils.complete(
                'Fix this: "their are many reasons why AI is importent for the futur"',
                'You are a grammar expert. Fix only the errors, keep the same meaning.',
                'grammar'
            ),
            'Grammar Correction'
        );

        // Test 4: Text Rewriting
        await runTest(
            3,
            () => langchainUtils.complete(
                'Rewrite this text to be more formal: "Hey, can you help me out with this?"',
                'You are an expert editor.',
                'rewrite'
            ),
            'Text Rewriting'
        );

        // Test 5: Input Validation
        updateTest(4, { status: 'running' });
        const validationTests = [
            langchainUtils.validateInput('Valid text'),
            langchainUtils.validateInput(''),
            langchainUtils.validateInput('a'.repeat(10000)),
        ];

        const allValid = validationTests[0].valid && !validationTests[1].valid && !validationTests[2].valid;

        updateTest(4, {
            status: allValid ? 'success' : 'error',
            message: allValid ? '✅ Validation working correctly' : '❌ Validation failed',
            output: `Valid: ${validationTests[0].valid}\nEmpty: ${validationTests[1].valid}\nToo long: ${validationTests[2].valid}`,
        });

        setIsRunning(false);
    };

    /**
     * Test custom prompt
     */
    const testCustomPrompt = async () => {
        if (!customPrompt.trim()) return;

        setCustomResult('');
        setCustomTime(0);
        setIsRunning(true);

        try {
            const startTime = performance.now();
            const result = await langchainUtils.complete(customPrompt, undefined, 'generate');
            const endTime = performance.now();
            const timeTaken = Math.round(endTime - startTime);

            setCustomTime(timeTaken);
            setCustomResult(result);
        } catch (error) {
            setCustomResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsRunning(false);
        }
    };

    /**
     * Test streaming
     */
    const testStreaming = async () => {
        setStreamingText('');
        setStreamTokens(0);
        setIsStreaming(true);

        try {
            await langchainUtils.streamComplete(
                'Write a short paragraph about the future of AI',
                (chunk: StreamChunk) => {
                    if (!chunk.done) {
                        setStreamingText(prev => prev + chunk.content);
                        setStreamTokens(chunk.metadata?.tokenCount || 0);
                    } else {
                        setIsStreaming(false);
                    }
                },
                'You are a tech writer.',
                'generate'
            );
        } catch (error) {
            setStreamingText(`❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
            setIsStreaming(false);
        }
    };

    /**
     * Test batch processing
     */
    const testBatch = async () => {
        setIsRunning(true);
        setBatchResults([]);

        try {
            const results = await langchainUtils.batchComplete(
                batchPrompts,
                'You are a helpful assistant. Answer in 1-2 sentences.',
                'generate'
            );
            setBatchResults(results);
        } catch (error) {
            setBatchResults([`Error: ${error instanceof Error ? error.message : 'Unknown'}`]);
        } finally {
            setIsRunning(false);
        }
    };

    /**
     * Status icon
     */
    const getStatusIcon = (status: TestResult['status']) => {
        switch (status) {
            case 'running':
                return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
        }
    };

    /**
     * Calculate stats
     */
    const passedTests = testResults.filter(t => t.status === 'success').length;
    const totalTests = testResults.length;
    const avgTime = testResults.reduce((acc, t) => acc + (t.time || 0), 0) / (passedTests || 1);

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
                        <Code className="w-10 h-10 text-primary" />
                        LangChain Integration Tests
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Module 1.4: Testing LangChain + Groq Setup
                    </p>
                </motion.div>

                {/* Configuration Status */}
                <Card className="mb-6 border-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Cpu className="w-5 h-5" />
                            Configuration Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {configValidation.valid ? (
                            <Alert className="bg-green-50 border-green-200">
                                <CheckCheck className="h-4 w-4 text-green-600" />
                                <AlertTitle className="text-green-800">Configuration Valid</AlertTitle>
                                <AlertDescription className="text-green-700">
                                    <div className="space-y-1 mt-2">
                                        <div><strong>Model:</strong> {LANGCHAIN_CONFIG.model}</div>
                                        <div><strong>Temperature:</strong> {LANGCHAIN_CONFIG.temperature}</div>
                                        <div><strong>Max Tokens:</strong> {LANGCHAIN_CONFIG.maxTokens}</div>
                                        <div><strong>Streaming:</strong> {LANGCHAIN_CONFIG.streaming ? 'Enabled' : 'Disabled'}</div>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Configuration Error</AlertTitle>
                                <AlertDescription>
                                    <ul className="list-disc list-inside">
                                        {configValidation.errors.map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Main Tests */}
                <Tabs defaultValue="automated" className="mb-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="automated">Automated Tests</TabsTrigger>
                        <TabsTrigger value="custom">Custom Prompt</TabsTrigger>
                        <TabsTrigger value="streaming">Streaming</TabsTrigger>
                        <TabsTrigger value="batch">Batch Processing</TabsTrigger>
                    </TabsList>

                    {/* Automated Tests Tab */}
                    <TabsContent value="automated">
                        <Card>
                            <CardHeader>
                                <CardTitle>Automated Test Suite</CardTitle>
                                <CardDescription>
                                    Run all integration tests automatically
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button
                                    onClick={runAllTests}
                                    disabled={isRunning || !configValidation.valid}
                                    size="lg"
                                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                >
                                    {isRunning ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Running Tests...
                                        </>
                                    ) : (
                                        <>
                                            <PlayCircle className="w-5 h-5 mr-2" />
                                            Run All Tests
                                        </>
                                    )}
                                </Button>

                                {testResults.length > 0 && (
                                    <div className="space-y-3 mt-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold">Results</h3>
                                            <Badge variant={passedTests === totalTests ? "default" : "secondary"}>
                                                {passedTests}/{totalTests} Passed
                                            </Badge>
                                        </div>

                                        {testResults.map((test, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="border rounded-lg p-4 bg-card"
                                            >
                                                <div className="flex items-start gap-3">
                                                    {getStatusIcon(test.status)}
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold">{test.name}</h4>
                                                        <p className="text-sm text-muted-foreground">{test.message}</p>

                                                        {test.time && (
                                                            <div className="flex items-center gap-4 mt-2 text-xs">
                                                                <span className="flex items-center gap-1 text-green-600">
                                                                    <Clock className="w-3 h-3" />
                                                                    {test.time}ms
                                                                </span>
                                                                {test.tokensEstimate && (
                                                                    <span className="text-muted-foreground">
                                                                        ~{test.tokensEstimate} tokens
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}

                                                        {test.output && (
                                                            <div className="mt-2 p-3 bg-muted rounded-md">
                                                                <pre className="text-xs whitespace-pre-wrap font-mono">
                                                                    {test.output.length > 200
                                                                        ? test.output.substring(0, 200) + '...'
                                                                        : test.output
                                                                    }
                                                                </pre>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}

                                        {passedTests > 0 && (
                                            <Alert className="bg-blue-50 border-blue-200">
                                                <Zap className="h-4 w-4 text-blue-600" />
                                                <AlertTitle className="text-blue-800">Performance Summary</AlertTitle>
                                                <AlertDescription className="text-blue-700">
                                                    Average response time: <strong>{avgTime.toFixed(0)}ms</strong>
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Custom Prompt Tab */}
                    <TabsContent value="custom">
                        <Card>
                            <CardHeader>
                                <CardTitle>Custom Prompt Test</CardTitle>
                                <CardDescription>
                                    Test with your own prompt
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Textarea
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    placeholder="Enter your test prompt..."
                                    rows={4}
                                    className="font-mono"
                                />

                                <Button
                                    onClick={testCustomPrompt}
                                    disabled={isRunning || !customPrompt.trim() || !configValidation.valid}
                                    className="w-full"
                                >
                                    {isRunning ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Test Prompt
                                        </>
                                    )}
                                </Button>

                                {customResult && (
                                    <AnimatePresence>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <Alert>
                                                <MessageSquare className="h-4 w-4" />
                                                <AlertTitle>Response {customTime > 0 && `(${customTime}ms)`}</AlertTitle>
                                                <AlertDescription className="mt-2">
                                                    <div className="p-3 bg-muted rounded-md">
                                                        <pre className="text-sm whitespace-pre-wrap">{customResult}</pre>
                                                    </div>
                                                </AlertDescription>
                                            </Alert>
                                        </motion.div>
                                    </AnimatePresence>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Streaming Tab */}
                    <TabsContent value="streaming">
                        <Card>
                            <CardHeader>
                                <CardTitle>Streaming Test</CardTitle>
                                <CardDescription>
                                    Test real-time streaming responses
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Button
                                    onClick={testStreaming}
                                    disabled={isStreaming || !configValidation.valid}
                                    className="w-full"
                                >
                                    {isStreaming ? (
                                        <>
                                            <StopCircle className="w-4 h-4 mr-2" />
                                            Streaming... ({streamTokens} chunks)
                                        </>
                                    ) : (
                                        <>
                                            <PlayCircle className="w-4 h-4 mr-2" />
                                            Start Streaming
                                        </>
                                    )}
                                </Button>

                                {streamingText && (
                                    <div className="border rounded-lg p-4 min-h-[200px] bg-card relative">
                                        <div className="prose prose-sm max-w-none">
                                            {streamingText}
                                            {isStreaming && (
                                                <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                                            )}
                                        </div>
                                        {streamTokens > 0 && (
                                            <div className="absolute top-2 right-2">
                                                <Badge variant="outline">{streamTokens} chunks</Badge>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Batch Tab */}
                    <TabsContent value="batch">
                        <Card>
                            <CardHeader>
                                <CardTitle>Batch Processing Test</CardTitle>
                                <CardDescription>
                                    Test multiple prompts at once
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    {batchPrompts.map((prompt, i) => (
                                        <Input
                                            key={i}
                                            value={prompt}
                                            onChange={(e) => {
                                                const newPrompts = [...batchPrompts];
                                                newPrompts[i] = e.target.value;
                                                setBatchPrompts(newPrompts);
                                            }}
                                            placeholder={`Prompt ${i + 1}`}
                                        />
                                    ))}
                                </div>

                                <Button
                                    onClick={testBatch}
                                    disabled={isRunning || !configValidation.valid}
                                    className="w-full"
                                >
                                    {isRunning ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Processing Batch...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-4 h-4 mr-2" />
                                            Run Batch
                                        </>
                                    )}
                                </Button>

                                {batchResults.length > 0 && (
                                    <div className="space-y-3">
                                        {batchResults.map((result, i) => (
                                            <div key={i} className="border rounded-lg p-3 bg-card">
                                                <div className="text-xs text-muted-foreground mb-1">
                                                    Result {i + 1}
                                                </div>
                                                <div className="text-sm">{result}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Status Footer */}
                {passedTests === totalTests && totalTests > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                    >
                        <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <AlertTitle className="text-green-800 text-lg">All Tests Passed! 🎉</AlertTitle>
                            <AlertDescription className="text-green-700">
                                LangChain integration is working perfectly. Ready for Phase 2!
                            </AlertDescription>
                        </Alert>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default LangChainTestPage;
