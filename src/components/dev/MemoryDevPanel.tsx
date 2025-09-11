import React, { useEffect, useState, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subscribeMemoryDebugEvents, MemoryDebugEvent, emitMemoryDebugEvent } from "@/lib/memory/debugBus";
import { localEngineClient } from "@/lib/memory/localEngineClient";
import { MemoryItem } from "@/lib/memory/types";
import { systemValidator, SystemValidationReport } from "@/lib/memory/integration/systemValidator";
import { memoryAnalytics, MemoryInsights } from "@/lib/memory/advanced/memoryAnalytics";
import { intelligentSearch, QuerySuggestion } from "@/lib/memory/advanced/intelligentSearch";

const LS_KEY = "dev.memoryPanel.enabled";

interface TestStatus {
  running: boolean;
  currentStep: string;
  progress: number;
  results: Array<{
    step: string;
    status: 'pending' | 'running' | 'success' | 'error';
    message?: string;
    duration?: number;
  }>;
}

interface DevPanelStats {
  engine?: {
    node_count: number;
    crypto_state?: {
      isLocked: boolean;
      hasWrappedDEK: boolean;
      keyDerivation: 'pbkdf2' | 'session' | null;
    };
    worker_type?: string;
    storage_type?: string;
  };
  ann?: {
    currentElements: number;
    maxElements: number;
    dimension: number;
    isIndexed: boolean;
    lastRebuild?: string;
  };
  sync?: {
    total_operations: number;
    active_devices: number;
    latest_operation?: string;
    earliest_operation?: string;
    add_operations: number;
    update_operations: number;
    delete_operations: number;
    pending_upload: number;
    last_sync?: string;
  };
  storage?: {
    usage?: number;
    quota?: number;
  };
}

const MemoryDevPanel: React.FC = () => {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("logs");
  const [events, setEvents] = useState<MemoryDebugEvent[]>([]);
  const [stats, setStats] = useState<DevPanelStats | null>(null);
  const [testStatus, setTestStatus] = useState<TestStatus>({
    running: false,
    currentStep: '',
    progress: 0,
    results: []
  });
  const [validationReport, setValidationReport] = useState<SystemValidationReport | null>(null);
  const [validationRunning, setValidationRunning] = useState(false);
  const [insights, setInsights] = useState<MemoryInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [querySuggestions, setQuerySuggestions] = useState<QuerySuggestion[]>([]);

  useEffect(() => {
    const read = () => {
      try {
        setEnabled(localStorage.getItem(LS_KEY) === "true");
      } catch {
        setEnabled(false);
      }
    };
    read();

    const onStorage = (e: StorageEvent) => {
      if (!e || e.key === LS_KEY) read();
    };
    const onCustom = () => read();

    window.addEventListener("storage", onStorage);
    window.addEventListener("dev-memory-pref-changed", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("dev-memory-pref-changed", onCustom as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const unsub = subscribeMemoryDebugEvents((evt) => {
      setEvents((prev) => {
        const next = [...prev, evt];
        if (next.length > 200) next.shift();
        return next;
      });
    });
    return () => unsub();
  }, [enabled]);

  const refreshStats = useCallback(async () => {
    try {
      await localEngineClient.init();
      const engineStats = await localEngineClient.getStats();
      const annStats = await localEngineClient.getANNStats();
      const syncStats = await localEngineClient.getSyncStats();
      
      // Get storage quota
      const storageEstimate = await navigator.storage.estimate();
      
      setStats({
        engine: engineStats,
        ann: annStats,
        sync: syncStats,
        storage: storageEstimate
      });
    } catch (error) {
      console.error("[MemoryDevPanel] Failed to refresh stats:", error);
    }
  }, []);

  // Refresh stats when panel opens
  useEffect(() => {
    if (open && enabled) {
      refreshStats();
    }
  }, [open, enabled, refreshStats]);

  const runSystemValidation = useCallback(async () => {
    if (validationRunning) return;

    setValidationRunning(true);
    setValidationReport(null);

    try {
      const report = await systemValidator.validateCompleteSystem();
      setValidationReport(report);
    } catch (error) {
      console.error('[MemoryDevPanel] System validation failed:', error);
      setValidationReport({
        success: false,
        totalDuration: 0,
        passed: 0,
        failed: 1,
        results: [{
          phase: 'System Error',
          success: false,
          duration: 0,
          details: error instanceof Error ? error.message : 'Unknown error'
        }],
        summary: 'Validation failed with system error'
      });
    } finally {
      setValidationRunning(false);
    }
  }, [validationRunning]);

  const generateInsights = useCallback(async () => {
    if (insightsLoading) return;

    setInsightsLoading(true);
    try {
      const memoryInsights = await memoryAnalytics.generateInsights();
      const suggestions = await intelligentSearch.generateQuerySuggestions();
      
      setInsights(memoryInsights);
      setQuerySuggestions(suggestions);
    } catch (error) {
      console.error('[MemoryDevPanel] Failed to generate insights:', error);
      setInsights(null);
      setQuerySuggestions([]);
    } finally {
      setInsightsLoading(false);
    }
  }, [insightsLoading]);

  const runEndToEndTest = useCallback(async () => {
    if (testStatus.running) return;

    const testSteps = [
      'Initialize Engine',
      'Add Test Memory',
      'Retrieve Memory',
      'Check Encryption',
      'Export Backup',
      'Import Backup Test',
      'Verify Data Integrity'
    ];

    setTestStatus({
      running: true,
      currentStep: testSteps[0],
      progress: 0,
      results: testSteps.map(step => ({ step, status: 'pending' }))
    });

    emitMemoryDebugEvent('test:start', { steps: testSteps });

    let currentStepIndex = 0;
    const updateStep = (status: 'running' | 'success' | 'error', message?: string, duration?: number) => {
      const stepName = testSteps[currentStepIndex];
      setTestStatus(prev => ({
        ...prev,
        progress: Math.round(((currentStepIndex + (status === 'success' ? 1 : 0)) / testSteps.length) * 100),
        currentStep: status === 'success' && currentStepIndex < testSteps.length - 1 ? testSteps[currentStepIndex + 1] : stepName,
        results: prev.results.map((result, i) =>
          i === currentStepIndex ? { ...result, status, message, duration } : result
        )
      }));
      emitMemoryDebugEvent('test:step', { step: stepName, status, message, duration });
    };

    try {
      // Step 1: Initialize Engine
      updateStep('running');
      const startTime = Date.now();
      await localEngineClient.init();
      updateStep('success', undefined, Date.now() - startTime);
      currentStepIndex++;

      // Step 2: Add Test Memory
      updateStep('running');
      const testMemoryId = `test-${Date.now()}`;
      const testContent = `Test memory created at ${new Date().toISOString()}`;
      const addStartTime = Date.now();
      const testMemoryItem: MemoryItem = {
        id: testMemoryId,
        user_id: 'test-user',
        memory_type: 'episodic',
        content: testContent,
        salience: 0.8,
        sensitive: false,
        usage_count: 0,
        last_used_at: null,
        cooldown_until: null,
        topic_tags: ['test'],
        source: 'dev-test',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await localEngineClient.addMemory(testMemoryItem, new Float32Array(384).fill(0.1));
      updateStep('success', `Added memory: ${testMemoryId}`, Date.now() - addStartTime);
      currentStepIndex++;

      // Step 3: Retrieve Memory
      updateStep('running');
      const retrieveStartTime = Date.now();
      const candidates = await localEngineClient.getCandidates("test", { limit: 5 });
      const retrieved = candidates.find(c => c.id === testMemoryId);
      updateStep(retrieved ? 'success' : 'error',
        retrieved ? `Retrieved: ${retrieved.content.slice(0, 50)}...` : 'Memory not found',
        Date.now() - retrieveStartTime);
      currentStepIndex++;

      // Step 4: Check Encryption
      updateStep('running');
      const cryptoStartTime = Date.now();
      const hasWrappedDEK = await localEngineClient.getWrappedDEK();
      updateStep(hasWrappedDEK ? 'success' : 'error',
        hasWrappedDEK ? 'Encryption keys available' : 'No encryption setup',
        Date.now() - cryptoStartTime);
      currentStepIndex++;

      // Step 5: Export Backup
      updateStep('running');
      const exportStartTime = Date.now();
      const exportData = await localEngineClient.exportData();
      const exportSize = exportData.byteLength;
      updateStep('success', `Exported ${exportSize} bytes`, Date.now() - exportStartTime);
      currentStepIndex++;

      // Step 6: Import Backup Test
      updateStep('running');
      const importStartTime = Date.now();
      await localEngineClient.importData(exportData);
      updateStep('success', `Imported ${exportSize} bytes`, Date.now() - importStartTime);
      currentStepIndex++;

      // Step 7: Verify Data Integrity
      updateStep('running');
      const verifyStartTime = Date.now();
      const verifyResults = await localEngineClient.getCandidates("test", { limit: 5 });
      const verified = verifyResults.find(c => c.id === testMemoryId);
      updateStep(verified ? 'success' : 'error',
        verified ? 'Data integrity verified' : 'Verification failed',
        Date.now() - verifyStartTime);

      emitMemoryDebugEvent('test:complete', {
        success: !!verified,
        totalDuration: Date.now() - startTime
      });

    } catch (error) {
      updateStep('error', error instanceof Error ? error.message : 'Unknown error');
      emitMemoryDebugEvent('test:error', { error: error instanceof Error ? error.message : error });
    } finally {
      setTestStatus(prev => ({ ...prev, running: false }));
    }
  }, [testStatus.running]);

  const clear = useCallback(() => setEvents([]), []);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(events, null, 2));
    } catch {
      // Ignore clipboard errors
    }
  }, [events]);

  if (!enabled) return null;

  const engineLogs = events.filter(e => e.type.startsWith('engine:') || e.type.startsWith('retrieval:'));
  const storageLogs = events.filter(e => e.type.startsWith('storage:'));
  const annLogs = events.filter(e => e.type.startsWith('ann:'));
  const cryptoLogs = events.filter(e => e.type.startsWith('crypto:'));
  const syncLogs = events.filter(e => e.type.startsWith('sync:'));

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-50 shadow-md"
        aria-label="Open Developer Memory Panel"
      >
        Memory Dev
        {events.length > 0 && (
          <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-[10px]">
            {events.length > 99 ? '99+' : events.length}
          </Badge>
        )}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[70vh] overflow-hidden">
          <SheetHeader>
            <SheetTitle>Developer Memory Panel</SheetTitle>
          </SheetHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 h-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="logs">
                Engine Logs
                {engineLogs.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-[10px]">
                    {engineLogs.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="storage">
                DB Stats
                {storageLogs.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-[10px]">
                    {storageLogs.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="ann">
                ANN Index
                {annLogs.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-[10px]">
                    {annLogs.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="crypto">
                Crypto
                {cryptoLogs.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-[10px]">
                    {cryptoLogs.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="tests">Tests</TabsTrigger>
            </TabsList>

            <TabsContent value="logs" className="h-[calc(100%-8rem)] overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <Button variant="secondary" size="sm" onClick={clear}>
                  Clear Logs
                </Button>
                <Button variant="outline" size="sm" onClick={copy}>
                  Copy JSON
                </Button>
                <Button variant="outline" size="sm" onClick={refreshStats}>
                  Refresh Stats
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                {engineLogs.length === 0 ? (
                  <div className="text-muted-foreground">
                    No engine events yet. Send a message to trigger retrieval.
                  </div>
                ) : (
                  engineLogs.map((e, i) => (
                    <div key={i} className="rounded-md border border-border bg-card p-2">
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">
                          {new Date(e.timestamp).toLocaleTimeString()}
                        </div>
                        <Badge variant={e.type.includes('error') ? 'destructive' : 'secondary'} className="text-xs">
                          {e.type}
                        </Badge>
                        {e.source && (
                          <Badge variant="outline" className="text-xs">
                            {e.source}
                          </Badge>
                        )}
                      </div>
                      <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words text-xs">
                        {JSON.stringify(e.payload, null, 2)}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="storage" className="h-[calc(100%-8rem)] overflow-y-auto">
              <div className="grid gap-4">
                {stats?.storage && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Storage Quota</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Used:</span>
                        <span>{Math.round((stats.storage.usage || 0) / 1024 / 1024)} MB</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Available:</span>
                        <span>{Math.round((stats.storage.quota || 0) / 1024 / 1024)} MB</span>
                      </div>
                      <Progress
                        value={(stats.storage.usage || 0) / (stats.storage.quota || 1) * 100}
                        className="w-full"
                      />
                    </CardContent>
                  </Card>
                )}
                
                {stats?.engine && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Engine Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Memory Count:</span>
                        <span>{stats.engine.node_count || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Worker Type:</span>
                        <span>{stats.engine.worker_type || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Storage Type:</span>
                        <span>{stats.engine.storage_type || 'Unknown'}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2 text-sm">
                  <h4 className="font-medium">Storage Events</h4>
                  {storageLogs.length === 0 ? (
                    <div className="text-muted-foreground">No storage events recorded.</div>
                  ) : (
                    storageLogs.slice(-10).map((e, i) => (
                      <div key={i} className="rounded-md border border-border bg-card p-2">
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-muted-foreground">
                            {new Date(e.timestamp).toLocaleTimeString()}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {e.type}
                          </Badge>
                        </div>
                        <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words text-xs">
                          {JSON.stringify(e.payload, null, 2)}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ann" className="h-[calc(100%-8rem)] overflow-y-auto">
              <div className="grid gap-4">
                {stats?.ann && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">ANN Index Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Current Elements:</span>
                        <span>{stats.ann.currentElements || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Elements:</span>
                        <span>{stats.ann.maxElements || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dimension:</span>
                        <span>{stats.ann.dimension || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Is Indexed:</span>
                        <span>{stats.ann.isIndexed ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Rebuild:</span>
                        <span>{stats.ann.lastRebuild ? new Date(stats.ann.lastRebuild).toLocaleString() : 'Never'}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2 text-sm">
                  <h4 className="font-medium">ANN Events</h4>
                  {annLogs.length === 0 ? (
                    <div className="text-muted-foreground">No ANN events recorded.</div>
                  ) : (
                    annLogs.slice(-10).map((e, i) => (
                      <div key={i} className="rounded-md border border-border bg-card p-2">
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-muted-foreground">
                            {new Date(e.timestamp).toLocaleTimeString()}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {e.type}
                          </Badge>
                        </div>
                        <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words text-xs">
                          {JSON.stringify(e.payload, null, 2)}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="crypto" className="h-[calc(100%-8rem)] overflow-y-auto">
              <div className="grid gap-4">
                {stats?.engine && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Encryption Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Encryption:</span>
                        <Badge variant={stats.engine.crypto_state?.hasWrappedDEK ? 'default' : 'secondary'}>
                          {stats.engine.crypto_state?.hasWrappedDEK ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Key Status:</span>
                        <Badge variant={stats.engine.crypto_state?.isLocked ? 'destructive' : 'default'}>
                          {stats.engine.crypto_state?.isLocked ? 'Locked' : 'Unlocked'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2 text-sm">
                  <h4 className="font-medium">Crypto Events</h4>
                  {cryptoLogs.length === 0 ? (
                    <div className="text-muted-foreground">No crypto events recorded.</div>
                  ) : (
                    cryptoLogs.slice(-10).map((e, i) => (
                      <div key={i} className="rounded-md border border-border bg-card p-2">
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-muted-foreground">
                            {new Date(e.timestamp).toLocaleTimeString()}
                          </div>
                          <Badge variant={e.type.includes('error') ? 'destructive' : 'secondary'} className="text-xs">
                            {e.type}
                          </Badge>
                        </div>
                        <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words text-xs">
                          {JSON.stringify(e.payload, null, 2)}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tests" className="h-[calc(100%-8rem)] overflow-y-auto">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">End-to-End Test</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Test the complete workflow: add → retrieve → encrypt → export → import
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={runEndToEndTest}
                        disabled={testStatus.running}
                        variant={testStatus.running ? "secondary" : "default"}
                      >
                        {testStatus.running ? "Running Test..." : "Run End-to-End Test"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={refreshStats}>
                        Refresh Stats
                      </Button>
                    </div>

                    {testStatus.running && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress:</span>
                          <span>{testStatus.progress}%</span>
                        </div>
                        <Progress value={testStatus.progress} className="w-full" />
                        <div className="text-sm text-muted-foreground">
                          Current: {testStatus.currentStep}
                        </div>
                      </div>
                    )}

                    {testStatus.results.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Test Results:</h4>
                        {testStatus.results.map((result, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Badge
                              variant={
                                result.status === 'success' ? 'default' :
                                result.status === 'error' ? 'destructive' :
                                result.status === 'running' ? 'secondary' : 'outline'
                              }
                              className="w-16 justify-center text-xs"
                            >
                              {result.status === 'success' ? '✓' :
                               result.status === 'error' ? '✗' :
                               result.status === 'running' ? '...' : '○'}
                            </Badge>
                            <span className="flex-1">{result.step}</span>
                            {result.duration && (
                              <span className="text-xs text-muted-foreground">
                                {result.duration}ms
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {stats?.sync && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Sync Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Operations:</span>
                        <span>{stats.sync.total_operations || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pending Upload:</span>
                        <span>{stats.sync.pending_upload || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Devices:</span>
                        <span>{stats.sync.active_devices || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Sync:</span>
                        <span>{stats.sync.last_sync ? new Date(stats.sync.last_sync).toLocaleString() : 'Never'}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="h-[calc(100%-8rem)] overflow-y-auto">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Memory Analytics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Discover insights about your memory collection and get intelligent search suggestions.
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={generateInsights}
                        disabled={insightsLoading}
                        variant={insightsLoading ? "secondary" : "default"}
                      >
                        {insightsLoading ? "Analyzing..." : "Generate Insights"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={refreshStats}>
                        Refresh Data
                      </Button>
                    </div>

                    {insights && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Collection Overview</h4>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span>Total Memories:</span>
                                <span className="font-medium">{insights.totalMemories}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Average Salience:</span>
                                <span className="font-medium">{insights.averageSalience.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Memory Clusters:</span>
                                <span className="font-medium">{insights.clusters.length}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Memory Types</h4>
                            <div className="text-sm space-y-1">
                              {Object.entries(insights.memoryTypes).map(([type, count]) => (
                                <div key={type} className="flex justify-between">
                                  <span>{type}:</span>
                                  <span className="font-medium">{count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {insights.topTopics.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Top Topics</h4>
                            <div className="flex flex-wrap gap-2">
                              {insights.topTopics.slice(0, 8).map((topic, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {topic.topic} ({topic.count})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {insights.clusters.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Memory Clusters</h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {insights.clusters.slice(0, 5).map((cluster, i) => (
                                <div key={i} className="p-2 rounded border text-sm">
                                  <div className="font-medium">{cluster.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {cluster.size} memories • {(cluster.coherence * 100).toFixed(0)}% coherence
                                  </div>
                                  <div className="text-xs mt-1">
                                    Keywords: {cluster.keywords.join(', ')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Query Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {querySuggestions.length > 0 ? (
                      <div className="space-y-2">
                        {querySuggestions.map((suggestion, i) => (
                          <div key={i} className="p-3 rounded border text-sm">
                            <div className="font-medium">{suggestion.query}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {suggestion.reasoning}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {suggestion.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                ~{suggestion.expectedResults} results
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {(suggestion.confidence * 100).toFixed(0)}% confidence
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Generate insights to see intelligent query suggestions.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MemoryDevPanel;
