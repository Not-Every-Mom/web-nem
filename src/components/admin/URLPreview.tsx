import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface URLMetadata {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  siteName?: string;
  isValid: boolean;
  statusCode?: number;
}

interface URLPreviewProps {
  url: string;
  onChange: (url: string) => void;
  onMetadataChange?: (metadata: URLMetadata | null) => void;
  className?: string;
}

export const URLPreview: React.FC<URLPreviewProps> = ({
  url,
  onChange,
  onMetadataChange,
  className
}) => {
  const [metadata, setMetadata] = useState<URLMetadata | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateURL = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const fetchMetadata = async (url: string): Promise<URLMetadata> => {
    // In a real implementation, this would be handled by an edge function
    // For now, we'll do basic validation and mock metadata
    const isValid = validateURL(url);
    
    if (!isValid) {
      throw new Error('Invalid URL format');
    }

    // Mock metadata - in production this would fetch real metadata
    const mockMetadata: URLMetadata = {
      title: "Example Title",
      description: "This is a mock description for the provided URL.",
      image: "https://via.placeholder.com/300x200",
      favicon: "https://via.placeholder.com/32x32",
      siteName: new URL(url).hostname,
      isValid: true,
      statusCode: 200
    };

    return mockMetadata;
  };

  useEffect(() => {
    if (!url) {
      setMetadata(null);
      setValidationError(null);
      onMetadataChange?.(null);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsValidating(true);
      setValidationError(null);

      try {
        const urlMetadata = await fetchMetadata(url);
        setMetadata(urlMetadata);
        onMetadataChange?.(urlMetadata);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to validate URL';
        setValidationError(errorMessage);
        setMetadata(null);
        onMetadataChange?.(null);
      } finally {
        setIsValidating(false);
      }
    }, 1000);

    return () => clearTimeout(debounceTimer);
  }, [url, onMetadataChange]);

  const getValidationIcon = () => {
    if (isValidating) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
    if (validationError) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    if (metadata?.isValid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return null;
  };

  const getValidationMessage = () => {
    if (validationError) {
      return validationError;
    }
    if (metadata?.isValid) {
      return 'URL is valid and accessible';
    }
    return null;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <div className="relative">
          <Input
            id="url"
            type="url"
            value={url}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com"
            className="pr-10"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {getValidationIcon()}
          </div>
        </div>
        {getValidationMessage() && (
          <p className={cn(
            "text-sm",
            validationError ? "text-destructive" : "text-green-600"
          )}>
            {getValidationMessage()}
          </p>
        )}
      </div>

      {metadata && metadata.isValid && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {metadata.image && (
                <img
                  src={metadata.image}
                  alt="Preview"
                  className="w-24 h-16 object-cover rounded border"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {metadata.favicon && (
                    <img
                      src={metadata.favicon}
                      alt="Favicon"
                      className="w-4 h-4"
                    />
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {metadata.siteName}
                  </Badge>
                </div>
                <h4 className="font-medium text-sm truncate mb-1">
                  {metadata.title || 'No title available'}
                </h4>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {metadata.description || 'No description available'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(url, '_blank')}
                    className="h-7 text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Visit
                  </Button>
                  {metadata.statusCode && (
                    <Badge variant="outline" className="text-xs">
                      {metadata.statusCode}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};