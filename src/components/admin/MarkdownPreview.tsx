import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  className
}) => {
  return (
    <div className={cn("border border-input rounded-md bg-background", className)}>
      <div className="p-2 border-b border-input bg-muted/50">
        <span className="text-sm font-medium">Preview</span>
      </div>
      <div className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
            // Customize link rendering
            a: ({ href, children, ...props }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80"
                {...props}
              >
                {children}
              </a>
            ),
            // Customize image rendering
            img: ({ src, alt, ...props }) => (
              <img
                src={src}
                alt={alt}
                className="max-w-full h-auto rounded-md border border-input"
                {...props}
              />
            ),
            // Customize code block rendering
            code: ({ className, children, ...props }) => {
              const isInline = !className;
              if (isInline) {
                return (
                  <code
                    className="bg-muted px-1 py-0.5 rounded text-sm font-mono"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }
              return (
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code className="text-sm font-mono" {...props}>
                    {children}
                  </code>
                </pre>
              );
            },
            // Customize table rendering
            table: ({ children, ...props }) => (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-input" {...props}>
                  {children}
                </table>
              </div>
            ),
            th: ({ children, ...props }) => (
              <th className="border border-input px-4 py-2 bg-muted font-medium text-left" {...props}>
                {children}
              </th>
            ),
            td: ({ children, ...props }) => (
              <td className="border border-input px-4 py-2" {...props}>
                {children}
              </td>
            ),
            // Customize blockquote rendering
            blockquote: ({ children, ...props }) => (
              <blockquote className="border-l-4 border-primary pl-4 italic" {...props}>
                {children}
              </blockquote>
            ),
            }}
          >
            {content || "*No content to preview*"}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};