import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { getUserMemorySettings, upsertUserMemorySettings } from "@/lib/memory/settings";
import { User, Bell, Shield, HelpCircle, FileText, Scale, LogOut, Loader2, ChevronRight, RefreshCw, Zap, Cloud, CloudUpload, CloudDownload, Trash2, Calendar, HardDrive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLocalMemory } from "@/hooks/useLocalMemory";
import { useBackupRestore } from "@/hooks/useBackupRestore";

// ANN Index Stats interface
interface ANNIndexStats {
  currentElements: number;
  maxElements: number;
  dimension: number;
  isIndexed: boolean;
  lastRebuild?: string;
}

const SettingsPage = () => {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rememberSensitive, setRememberSensitive] = useState(false);
  const [sensitivity, setSensitivity] = useState<"low"|"medium"|"high">("medium");
  const [cooldown, setCooldown] = useState<number>(120);
  const [savingSettings, setSavingSettings] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
const [devPanelEnabled, setDevPanelEnabled] = useState(false);
// Local memory controls
const [kekInput, setKekInput] = useState("");
const [activeKek, setActiveKek] = useState<string | undefined>(() => {
  try { return localStorage.getItem('localMemory.kek') || undefined; } catch { return undefined; }
});
const [localMemoryEnabled, setLocalMemoryEnabled] = useState(() => {
  try { return localStorage.getItem('localMemory.enabled') !== 'false'; } catch { return true; }
});
const localMem = useLocalMemory(activeKek, localMemoryEnabled);
const [persisted, setPersisted] = useState<boolean | null>(null);
const [usage, setUsage] = useState<{ used: number; quota: number } | null>(null);
const [memoryStats, setMemoryStats] = useState<{ node_count: number; ann_stats?: ANNIndexStats } | null>(null);
const [rebuildingANN, setRebuildingANN] = useState(false);

// Backup & Restore
const backupRestore = useBackupRestore();
const [backupName, setBackupName] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) { if (mounted) setLoadingSettings(false); return; }
      try {
        const { effective } = await getUserMemorySettings(user.id);
        if (!mounted) return;
        setRememberSensitive(effective.remember_sensitive);
        setSensitivity(effective.sensitivity);
        setCooldown(effective.cooldown_minutes);
      } finally {
        if (mounted) setLoadingSettings(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  useEffect(() => {
    try {
      setDevPanelEnabled(localStorage.getItem('dev.memoryPanel.enabled') === 'true');
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const p = await (navigator.storage as any)?.persisted?.();
        if (typeof p !== 'undefined') setPersisted(!!p);
        const est = await (navigator.storage as any)?.estimate?.();
        if (est) setUsage({ used: est.usage || 0, quota: est.quota || 0 });
      } catch {
        // Storage API not supported
      }
    })();
  }, [localMem.isReady]);

  useEffect(() => {
    (async () => {
      if (localMem.isReady && localMem.enabled) {
        try {
          const stats = await localMem.getStats();
          setMemoryStats(stats);
        } catch {
          // Stats loading failed
        }
      }
    })();
  }, [localMem.isReady, localMem.enabled]);

  const handleSaveSettings = async () => {
    if (!user) return;
    setSavingSettings(true);
    try {
      await upsertUserMemorySettings(user.id, { remember_sensitive: rememberSensitive, sensitivity, cooldown_minutes: cooldown });
      toast({ title: "Saved", description: "Memory preferences updated." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not save memory preferences." });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleDevPanel = (val: boolean) => {
    setDevPanelEnabled(val);
    try {
      localStorage.setItem('dev.memoryPanel.enabled', String(val));
      window.dispatchEvent(new CustomEvent('dev-memory-pref-changed', { detail: val }));
    } catch {
      // localStorage failed
    }
    toast({ title: 'Developer Panel', description: val ? 'Enabled' : 'Disabled' });
  };

  const handleToggleLocalMemory = (val: boolean) => {
    setLocalMemoryEnabled(val);
    try {
      localStorage.setItem('localMemory.enabled', String(val));
    } catch {
      // localStorage failed
    }
    toast({
      title: 'Local Memory Engine',
      description: val ? 'Enabled - Reload to take effect' : 'Disabled - Reload to take effect'
    });
  };

  const applyKek = () => {
    try {
      if (kekInput) {
        localStorage.setItem('localMemory.kek', kekInput);
        setActiveKek(kekInput);
        toast({ title: 'Local encryption', description: 'Passphrase applied.' });
      } else {
        localStorage.removeItem('localMemory.kek');
        setActiveKek(undefined);
        toast({ title: 'Local encryption', description: 'Encryption disabled.' });
      }
    } catch {
      // localStorage failed
    }
  };

  const makePersistent = async () => {
    try {
      const res = await (navigator.storage as any)?.persist?.();
      setPersisted(typeof res === 'boolean' ? res : null);
      toast({ title: 'Storage', description: res ? 'Persistence granted' : 'Persistence denied' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Storage', description: 'Could not request persistence' });
    }
  };

  const persistNow = async () => {
    try {
      await localMem.persist();
      toast({ title: 'Local memory', description: 'Saved to disk' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Local memory', description: 'Persist failed' });
    }
  };

  const clearLocal = async () => {
    try {
      await localMem.clear();
      setMemoryStats({ node_count: 0 });
      toast({ title: 'Local memory', description: 'Cleared' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Local memory', description: 'Clear failed' });
    }
  };

  const exportLocal = async () => {
    try {
      const data = await localMem.exportData();
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kindred-memory-${new Date().toISOString().split('T')[0]}.kmem`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'Local memory', description: 'Exported successfully' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Local memory', description: 'Export failed' });
    }
  };

  const importLocal = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.kmem';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const data = await file.arrayBuffer();
        await localMem.importData(data);
        // Refresh stats
        const stats = await localMem.getStats();
        setMemoryStats(stats);
        toast({ title: 'Local memory', description: 'Imported successfully' });
      } catch (e) {
        toast({ variant: 'destructive', title: 'Local memory', description: 'Import failed' });
      }
    };
    input.click();
  };

  const rebuildANNIndex = async () => {
    try {
      setRebuildingANN(true);
      await localMem.rebuildANNIndex();
      // Refresh stats
      const stats = await localMem.getStats();
      setMemoryStats(stats);
      toast({
        title: 'ANN Index',
        description: 'Semantic search index rebuilt successfully'
      });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'ANN Index',
        description: 'Failed to rebuild semantic search index'
      });
    } finally {
      setRebuildingANN(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await signOut();
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "You have been signed out successfully.",
        });
      }
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      icon: User,
      title: "Account Settings",
      description: "Manage your profile, email, and password",
      onClick: () => navigate('/app/settings/account'),
      color: "text-primary"
    },
    {
      icon: HelpCircle,
      title: "FAQ / Support",
      description: "Get help and find answers to common questions",
      onClick: () => navigate('/app/settings/faq'),
      color: "text-primary"
    },
    {
      icon: Shield,
      title: "Privacy Policy",
      description: "Read our privacy policy and data handling practices",
      onClick: () => navigate('/app/settings/privacy'),
      color: "text-primary"
    },
    {
      icon: Scale,
      title: "Terms of Service",
      description: "View our terms and conditions of use",
      onClick: () => navigate('/app/settings/terms'),
      color: "text-primary"
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header Section */}
        <header className="mb-8">
          <h1 className="font-heading-bold text-3xl text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground font-body">
            Manage your account settings and preferences
          </p>
        </header>

        <div className="space-y-6">
          {/* Settings Menu */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Settings & Support</CardTitle>
              <CardDescription className="text-muted-foreground">
                Access your account settings and support resources
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {menuItems.map((item, index) => (
                  <div key={item.title}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-4 hover:bg-accent/50 transition-colors"
                      onClick={item.onClick}
                    >
                      <div className="flex items-center gap-4 w-full">
                        <div className="flex-shrink-0">
                          <item.icon className={`w-5 h-5 ${item.color}`} />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="font-medium text-foreground mb-1">{item.title}</div>
                          <div className="text-sm text-muted-foreground leading-relaxed">
                            {item.description}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Button>
                    {index < menuItems.length - 1 && (
                      <Separator className="mx-4" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Memory Preferences */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Memory Preferences</CardTitle>
              <CardDescription className="text-muted-foreground">
                Control how your companion remembers conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <fieldset className="space-y-6">
                <legend className="sr-only">Memory Preference Settings</legend>
                
                {/* Remember Sensitive Topics */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-medium text-foreground mb-1" id="sensitive-label">
                      Remember sensitive topics
                    </div>
                    <div className="text-sm text-muted-foreground leading-relaxed" id="sensitive-desc">
                      Allow storing potentially sensitive information in conversation memory
                    </div>
                  </div>
                  <div className="flex-shrink-0 pt-1">
                    <Switch 
                      checked={rememberSensitive} 
                      onCheckedChange={setRememberSensitive}
                      aria-labelledby="sensitive-label"
                      aria-describedby="sensitive-desc"
                    />
                  </div>
                </div>

              <Separator />

                {/* Settings Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sensitivity-select" className="text-sm font-medium text-foreground">
                      Sensitivity Level
                    </Label>
                    <Select value={sensitivity} onValueChange={(v) => setSensitivity(v as any)}>
                      <SelectTrigger id="sensitivity-select" className="w-full" aria-describedby="sensitivity-desc">
                        <SelectValue placeholder="Select sensitivity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - Minimal filtering</SelectItem>
                        <SelectItem value="medium">Medium - Balanced approach</SelectItem>
                        <SelectItem value="high">High - Maximum privacy protection</SelectItem>
                      </SelectContent>
                    </Select>
                    <p id="sensitivity-desc" className="text-xs text-muted-foreground">
                      Controls how carefully sensitive information is filtered
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cooldown-input" className="text-sm font-medium text-foreground">
                      Cooldown (minutes)
                    </Label>
                    <Input 
                      id="cooldown-input"
                      type="number" 
                      min={0} 
                      value={cooldown} 
                      onChange={(e) => setCooldown(parseInt(e.target.value || '0', 10))}
                      className="w-full"
                      aria-describedby="cooldown-desc"
                    />
                    <p id="cooldown-desc" className="text-xs text-muted-foreground">
                      Time between memory consolidation cycles
                    </p>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-2">
                  <Button 
                    onClick={handleSaveSettings} 
                    disabled={savingSettings || loadingSettings}
                    className="min-w-[140px]"
                    aria-busy={savingSettings}
                    aria-describedby={savingSettings ? "saving-status" : undefined}
                  >
                    {savingSettings ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Preferences'
                    )}
                  </Button>
                  {savingSettings && (
                    <span id="saving-status" className="sr-only" aria-live="polite">
                      Saving memory preferences, please wait
                    </span>
                  )}
                </div>
              </fieldset>
            </CardContent>
          </Card>

          {/* Local Memory (On-Device) */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Local Memory (On-Device)</CardTitle>
              <CardDescription className="text-muted-foreground">
                Private, offline-capable memory engine with optional encryption
              </CardDescription>
            </CardHeader>
            <CardContent>
              <fieldset className="space-y-6">
                <legend className="sr-only">Local Memory Engine Settings</legend>
                
                {/* Enable/Disable Toggle */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-medium text-foreground mb-1" id="local-memory-label">
                      Enable Local Memory Engine
                    </div>
                    <div className="text-sm text-muted-foreground leading-relaxed" id="local-memory-desc">
                      Store memories locally on this device for offline access and improved privacy
                    </div>
                  </div>
                  <div className="flex-shrink-0 pt-1">
                    <Switch
                      checked={localMemoryEnabled}
                      onCheckedChange={handleToggleLocalMemory}
                      aria-labelledby="local-memory-label"
                      aria-describedby="local-memory-desc"
                    />
                  </div>
                </div>

              {localMemoryEnabled && (
                <>
                  <Separator />
                  
                  {/* Encryption */}
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Encryption passphrase (optional)</Label>
                      <Input
                        type="password"
                        placeholder="Enter passphrase to enable encryption"
                        value={kekInput}
                        onChange={(e) => setKekInput(e.target.value)}
                        disabled={!localMemoryEnabled}
                      />
                      <p className="text-xs text-muted-foreground">Leave blank to disable encryption. Applied locally only.</p>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button onClick={applyKek} className="h-10" disabled={!localMemoryEnabled}>Apply</Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Enhanced Status Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-md border border-input/40 p-3 bg-muted/40">
                      <div className="text-xs text-muted-foreground mb-1">Engine</div>
                      <div className="text-sm text-foreground">{localMem.isReady ? 'Ready' : 'Initializing…'}</div>
                    </div>
                    <div className="rounded-md border border-input/40 p-3 bg-muted/40">
                      <div className="text-xs text-muted-foreground mb-1">Worker</div>
                      <div className="text-sm text-foreground">{localMem.workerType || 'Unknown'}</div>
                    </div>
                    <div className="rounded-md border border-input/40 p-3 bg-muted/40">
                      <div className="text-xs text-muted-foreground mb-1">Encryption</div>
                      <div className="text-sm text-foreground">{localMem.encrypted ? 'Enabled' : 'Disabled'}</div>
                    </div>
                    <div className="rounded-md border border-input/40 p-3 bg-muted/40">
                      <div className="text-xs text-muted-foreground mb-1">Memories</div>
                      <div className="text-sm text-foreground">{memoryStats?.node_count ?? '—'}</div>
                    </div>
                  </div>

                  {/* ANN Index Statistics */}
                  {memoryStats?.ann_stats && (
                    <div className="rounded-md border border-input/40 p-4 bg-muted/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-primary" />
                          <div className="text-sm font-medium text-foreground">Semantic Search Index</div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {memoryStats.ann_stats.isIndexed ? 'Active' : 'Not built'}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-foreground">
                            {memoryStats.ann_stats.currentElements}
                          </div>
                          <div className="text-xs text-muted-foreground">Indexed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-foreground">
                            {memoryStats.ann_stats.dimension}
                          </div>
                          <div className="text-xs text-muted-foreground">Dimensions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-foreground">
                            {Math.round((memoryStats.ann_stats.currentElements / memoryStats.ann_stats.maxElements) * 100)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Capacity</div>
                        </div>
                      </div>

                      {memoryStats.ann_stats.currentElements === 0 && (
                        <div className="text-xs text-muted-foreground">
                          Add memories with embeddings to enable semantic search
                        </div>
                      )}
                    </div>
                  )}

                  {/* Storage Info */}
                  <div className="rounded-md border border-input/40 p-4 bg-muted/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-foreground">Browser Storage</div>
                      <div className="text-sm text-muted-foreground">
                        {usage ? `${Math.round((usage.used/1024/1024)*10)/10} MB used of ${Math.round((usage.quota/1024/1024)*10)/10} MB` : 'Unknown'}
                      </div>
                    </div>
                    
                    {usage && usage.quota > 0 && (
                      <div className="space-y-2">
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              (usage.used / usage.quota) > 0.8 ? 'bg-destructive' :
                              (usage.used / usage.quota) > 0.6 ? 'bg-yellow-500' : 'bg-primary'
                            }`}
                            style={{ width: `${Math.min((usage.used / usage.quota) * 100, 100)}%` }}
                          />
                        </div>
                        {(usage.used / usage.quota) > 0.8 && (
                          <p className="text-xs text-destructive">Warning: Storage is nearly full</p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Persistence: <span className="text-foreground font-medium">{persisted === null ? 'Unknown' : (persisted ? 'Granted' : 'Not granted')}</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={makePersistent}>Request persistence</Button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={exportLocal}>Export data</Button>
                    <Button variant="outline" onClick={importLocal}>Import data</Button>
                    <Button onClick={persistNow}>Save to disk</Button>
                    <Button variant="destructive" onClick={clearLocal}>Clear all data</Button>
                  </div>
                </>
              )}
              </fieldset>
            </CardContent>
          </Card>

          {/* Developer Tools */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Developer Tools</CardTitle>
              <CardDescription className="text-muted-foreground">
                Advanced diagnostics for memory retrieval and debugging
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="font-medium text-foreground mb-1">Memory Debug Panel</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    Show detailed memory retrieval information and debug logs
                  </div>
                </div>
                <div className="flex-shrink-0 pt-1">
                  <Switch 
                    checked={devPanelEnabled} 
                    onCheckedChange={handleToggleDevPanel}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sign Out */}
          <Card className="shadow-sm border-destructive/20 bg-destructive/5">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-destructive" />
                <div>
                  <CardTitle className="text-xl text-destructive">Sign Out</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">
                    End your current session and return to the login screen
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                onClick={handleSignOut}
                disabled={loading}
                className="w-full h-11"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing out...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
