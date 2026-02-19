'use client'

import type { CSSProperties } from 'react'
import ReactMarkdown from 'react-markdown'
import Image from 'next/image'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'

interface MarkdownRendererProps {
  content: string
  className?: string
  truncate?: number
  firstLineOnly?: boolean
  maxFirstLineLength?: number
}

export default function MarkdownRenderer({
  content,
  className = '',
  truncate,
  firstLineOnly,
  maxFirstLineLength = 60
}: MarkdownRendererProps) {
  // If firstLineOnly is set, show only the first line with "..." and limit characters
  if (firstLineOnly) {
    // Strip markdown and get first line
    const plainText = content
      .replace(/#{1,6}\s/g, '') // headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
      .replace(/\*([^*]+)\*/g, '$1') // italic
      .replace(/__([^_]+)__/g, '$1') // bold
      .replace(/_([^_]+)_/g, '$1') // italic
      .replace(/~~([^~]+)~~/g, '$1') // strikethrough
      .replace(/`([^`]+)`/g, '$1') // inline code
      .replace(/```[\s\S]*?```/g, '[code]') // code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[image]') // images
      .replace(/^\s*[-*+]\s/gm, '') // list items
      .replace(/^\s*\d+\.\s/gm, '') // numbered lists
      .replace(/^\s*>\s/gm, '') // blockquotes
      .trim()

    // Get first line only
    const firstLine = plainText.split('\n')[0].trim()
    const hasMoreContent = plainText.includes('\n') || firstLine.length > maxFirstLineLength

    // Truncate if longer than maxFirstLineLength
    const displayText =
      firstLine.length > maxFirstLineLength ? firstLine.substring(0, maxFirstLineLength) : firstLine

    return (
      <span className={className}>
        {displayText}
        {hasMoreContent ? '...' : ''}
      </span>
    )
  }

  // If truncate is set, show plain text preview
  if (truncate && content.length > truncate) {
    // Strip markdown for preview
    const plainText = content
      .replace(/#{1,6}\s/g, '') // headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
      .replace(/\*([^*]+)\*/g, '$1') // italic
      .replace(/__([^_]+)__/g, '$1') // bold
      .replace(/_([^_]+)_/g, '$1') // italic
      .replace(/~~([^~]+)~~/g, '$1') // strikethrough
      .replace(/`([^`]+)`/g, '$1') // inline code
      .replace(/```[\s\S]*?```/g, '[code]') // code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[image]') // images
      .replace(/^\s*[-*+]\s/gm, '') // list items
      .replace(/^\s*\d+\.\s/gm, '') // numbered lists
      .replace(/^\s*>\s/gm, '') // blockquotes
      .replace(/\n+/g, ' ') // newlines
      .trim()

    return (
      <span className={className}>
        {plainText.substring(0, truncate)}
        {plainText.length > truncate ? '...' : ''}
      </span>
    )
  }

  return (
    <div
      className={`markdown-content ${className}`}
      style={{ color: 'var(--color-text)' } as CSSProperties}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // Line breaks
          br: () => <br />,
          // Headings
          h1: ({ children }) => (
            <h1
              className="text-2xl font-bold mb-4 mt-6 first:mt-0"
              style={{ color: 'var(--color-text)' } as CSSProperties}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className="text-xl font-bold mb-3 mt-5 first:mt-0"
              style={{ color: 'var(--color-text)' } as CSSProperties}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className="text-lg font-semibold mb-2 mt-4 first:mt-0"
              style={{ color: 'var(--color-text)' } as CSSProperties}
            >
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4
              className="text-base font-semibold mb-2 mt-3 first:mt-0"
              style={{ color: 'var(--color-text)' } as CSSProperties}
            >
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5
              className="text-sm font-semibold mb-1 mt-2 first:mt-0"
              style={{ color: 'var(--color-text)' } as CSSProperties}
            >
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6
              className="text-xs font-semibold mb-1 mt-2 first:mt-0"
              style={{ color: 'var(--color-text)' } as CSSProperties}
            >
              {children}
            </h6>
          ),
          // Paragraph
          p: ({ children }) => (
            <p
              className="mb-3 last:mb-0 leading-relaxed"
              style={{ color: 'var(--color-text)' } as CSSProperties}
            >
              {children}
            </p>
          ),
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80 transition-opacity"
              style={{ color: 'var(--color-primary)' } as CSSProperties}
            >
              {children}
            </a>
          ),
          // Bold
          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
          // Italic
          em: ({ children }) => <em className="italic">{children}</em>,
          // Strikethrough
          del: ({ children }) => <del className="line-through opacity-60">{children}</del>,
          // Inline code
          code: ({ className, children, ...props }) => {
            const isBlock = className?.includes('language-')
            if (isBlock) {
              return (
                <code className={`${className} block overflow-x-auto`} {...props}>
                  {children}
                </code>
              )
            }
            return (
              <code
                className="px-1.5 py-0.5 rounded text-sm font-mono"
                style={
                  {
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-secondary)'
                  } as CSSProperties
                }
                {...props}
              >
                {children}
              </code>
            )
          },
          // Code blocks
          pre: ({ children }) => (
            <pre
              className="p-4 rounded-xl mb-4 overflow-x-auto text-sm font-mono"
              style={
                {
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)'
                } as CSSProperties
              }
            >
              {children}
            </pre>
          ),
          // Blockquote
          blockquote: ({ children }) => (
            <blockquote
              className="pl-4 my-4 italic"
              style={
                {
                  borderLeftWidth: '4px',
                  borderLeftColor: 'var(--color-primary)',
                  color: 'var(--color-text)',
                  opacity: 0.8
                } as CSSProperties
              }
            >
              {children}
            </blockquote>
          ),
          // Unordered list
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-4 space-y-1 ml-2">{children}</ul>
          ),
          // Ordered list
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-4 space-y-1 ml-2">{children}</ol>
          ),
          // List item
          li: ({ children }) => (
            <li className="leading-relaxed" style={{ color: 'var(--color-text)' } as CSSProperties}>
              {children}
            </li>
          ),
          // Horizontal rule
          hr: () => (
            <hr className="my-6" style={{ borderColor: 'var(--color-border)' } as CSSProperties} />
          ),
          // Table
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table
                className="min-w-full border-collapse"
                style={{ borderColor: 'var(--color-border)' } as CSSProperties}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead style={{ backgroundColor: 'var(--color-background)' } as CSSProperties}>
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th
              className="px-4 py-2 text-left font-semibold border"
              style={
                {
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)'
                } as CSSProperties
              }
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              className="px-4 py-2 border"
              style={
                {
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)'
                } as CSSProperties
              }
            >
              {children}
            </td>
          ),
          // Checkbox (GFM task lists)
          input: ({ type, checked, ...props }) => {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mr-2 rounded"
                  style={{ accentColor: 'var(--color-primary)' } as CSSProperties}
                  {...props}
                />
              )
            }
            return <input type={type} {...props} />
          },
          // Images
          img: ({ src, alt }) => {
            if (!src) return null
            return (
              <div className="relative rounded-lg my-4 overflow-hidden" style={{ maxHeight: '400px' }}>
                <Image
                  src={src as string}
                  alt={alt || ''}
                  width={800}
                  height={400}
                  sizes="(max-width: 768px) 100vw, 800px"
                  style={{ objectFit: 'contain' }}
                  className="w-full h-auto"
                />
              </div>
            )
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
