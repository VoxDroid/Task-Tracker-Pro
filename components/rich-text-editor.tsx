'use client'

import type { CSSProperties } from 'react'
import { useState, useRef, useCallback, useMemo } from 'react'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Table,
  CheckSquare,
  Eye,
  Edit3,
  Minus
} from 'lucide-react'
import MarkdownRenderer from './markdown-renderer'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter description...',
  minHeight = 200
}: RichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertText = useCallback(
    (before: string, after: string = '', placeholder: string = '') => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = value.substring(start, end)
      const textToInsert = selectedText || placeholder

      const newValue =
        value.substring(0, start) + before + textToInsert + after + value.substring(end)
      onChange(newValue)

      // Set cursor position after update
      setTimeout(() => {
        textarea.focus()
        const newCursorPos = start + before.length + textToInsert.length
        textarea.setSelectionRange(
          selectedText ? newCursorPos + after.length : start + before.length,
          selectedText
            ? newCursorPos + after.length
            : start + before.length + (placeholder ? placeholder.length : 0)
        )
      }, 0)
    },
    [value, onChange]
  )

  const insertAtLineStart = useCallback(
    (prefix: string) => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const lineStart = value.lastIndexOf('\n', start - 1) + 1

      const newValue = value.substring(0, lineStart) + prefix + value.substring(lineStart)
      onChange(newValue)

      setTimeout(() => {
        textarea.focus()
        const newPos = start + prefix.length
        textarea.setSelectionRange(newPos, newPos)
      }, 0)
    },
    [value, onChange]
  )

  const insertNewLine = useCallback(
    (text: string) => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const needsNewLine = start > 0 && value[start - 1] !== '\n'
      const prefix = needsNewLine ? '\n\n' : ''

      const newValue = value.substring(0, start) + prefix + text + value.substring(start)
      onChange(newValue)

      setTimeout(() => {
        textarea.focus()
        const newPos = start + prefix.length + text.length
        textarea.setSelectionRange(newPos, newPos)
      }, 0)
    },
    [value, onChange]
  )

  const toolbarButtons = useMemo(
    () => [
      { icon: Bold, label: 'Bold', actionKey: 'bold' },
      { icon: Italic, label: 'Italic', actionKey: 'italic' },
      { icon: Strikethrough, label: 'Strikethrough', actionKey: 'strikethrough' },
      { icon: Code, label: 'Inline Code', actionKey: 'inlineCode' },
      { type: 'divider' as const },
      { icon: Heading1, label: 'Heading 1', actionKey: 'h1' },
      { icon: Heading2, label: 'Heading 2', actionKey: 'h2' },
      { icon: Heading3, label: 'Heading 3', actionKey: 'h3' },
      { type: 'divider' as const },
      { icon: List, label: 'Bullet List', actionKey: 'bulletList' },
      { icon: ListOrdered, label: 'Numbered List', actionKey: 'numberedList' },
      { icon: CheckSquare, label: 'Task List', actionKey: 'taskList' },
      { icon: Quote, label: 'Quote', actionKey: 'quote' },
      { type: 'divider' as const },
      { icon: Link, label: 'Link', actionKey: 'link' },
      { icon: Image, label: 'Image', actionKey: 'image' },
      { icon: Minus, label: 'Horizontal Rule', actionKey: 'hr' },
      { type: 'divider' as const },
      { icon: Table, label: 'Table', actionKey: 'table' },
      { icon: Code, label: 'Code Block', actionKey: 'codeBlock', isCodeBlock: true }
    ],
    []
  )

  const handleToolbarAction = (key: string) => {
    switch (key) {
      case 'bold':
        insertText('**', '**', 'bold text')
        break
      case 'italic':
        insertText('*', '*', 'italic text')
        break
      case 'strikethrough':
        insertText('~~', '~~', 'strikethrough')
        break
      case 'inlineCode':
        insertText('`', '`', 'code')
        break
      case 'h1':
        insertAtLineStart('# ')
        break
      case 'h2':
        insertAtLineStart('## ')
        break
      case 'h3':
        insertAtLineStart('### ')
        break
      case 'bulletList':
        insertAtLineStart('- ')
        break
      case 'numberedList':
        insertAtLineStart('1. ')
        break
      case 'taskList':
        insertAtLineStart('- [ ] ')
        break
      case 'quote':
        insertAtLineStart('> ')
        break
      case 'link':
        insertText('[', '](url)', 'link text')
        break
      case 'image':
        insertText('![', '](image-url)', 'alt text')
        break
      case 'hr':
        insertNewLine('---\n')
        break
      case 'table':
        insertNewLine(
          '| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n'
        )
        break
      case 'codeBlock':
        insertText('```\n', '\n```', 'code here')
        break
      default:
        break
    }
  }

  return (
    <div
      className="rounded-xl border-2 overflow-hidden"
      style={
        {
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-background)'
        } as CSSProperties
      }
    >
      {/* Toolbar */}
      <div
        className="flex items-center flex-wrap gap-1 p-2 border-b-2"
        style={
          {
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface)'
          } as CSSProperties
        }
      >
        {toolbarButtons.map((button, index) => {
          if (button.type === 'divider') {
            return (
              <div
                key={index}
                className="w-px h-6 mx-1"
                style={{ backgroundColor: 'var(--color-border)' } as CSSProperties}
              />
            )
          }
          const Icon = button.icon!
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleToolbarAction((button as any).actionKey)}
              className="p-1.5 rounded-lg hover:bg-opacity-10 transition-colors"
              style={{ color: 'var(--color-text)' } as CSSProperties}
              title={button.label}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary)'
                e.currentTarget.style.opacity = '0.2'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.opacity = '1'
              }}
            >
              <Icon size={16} />
            </button>
          )
        })}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Edit/Preview Toggle Switch with Sliding Animation */}
        <div
          className="relative grid grid-cols-2 rounded-2xl border-2 overflow-hidden"
          style={
            {
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-background)',
              padding: '4px'
            } as CSSProperties
          }
        >
          {/* Sliding Background Indicator */}
          <div
            className="absolute rounded-xl transition-all duration-300 ease-in-out pointer-events-none"
            style={
              {
                backgroundColor: 'var(--color-primary)',
                top: '4px',
                bottom: '4px',
                left: '4px',
                right: '4px',
                width: 'calc(50% - 6px)',
                transform: isPreview ? 'translateX(calc(100% + 4px))' : 'translateX(0)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
              } as CSSProperties
            }
          />
          <button
            type="button"
            onClick={() => setIsPreview(false)}
            className="relative z-10 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300"
            style={
              {
                color: !isPreview ? 'white' : 'var(--color-text)',
                opacity: !isPreview ? 1 : 0.6
              } as CSSProperties
            }
          >
            <Edit3 size={14} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => setIsPreview(true)}
            className="relative z-10 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300"
            style={
              {
                color: isPreview ? 'white' : 'var(--color-text)',
                opacity: isPreview ? 1 : 0.6
              } as CSSProperties
            }
          >
            <Eye size={14} />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Editor/Preview Area */}
      {isPreview ? (
        <div
          className="p-4 overflow-auto"
          style={
            {
              minHeight: `${minHeight}px`,
              maxHeight: '400px',
              backgroundColor: 'var(--color-background)'
            } as CSSProperties
          }
        >
          {value ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p
              className="opacity-50 italic"
              style={{ color: 'var(--color-text)' } as CSSProperties}
            >
              Nothing to preview
            </p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 resize-none focus:outline-none font-mono text-sm"
          style={
            {
              minHeight: `${minHeight}px`,
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-text)'
            } as CSSProperties
          }
        />
      )}

      {/* Footer with markdown hint */}
      <div
        className="px-4 py-2 text-xs border-t-2 flex items-center justify-between"
        style={
          {
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            opacity: 0.6
          } as CSSProperties
        }
      >
        <span>Supports Markdown & HTML formatting</span>
        <a
          href="https://www.markdownguide.org/basic-syntax/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-100 underline"
          style={{ color: 'var(--color-primary)' } as CSSProperties}
        >
          Markdown Guide
        </a>
      </div>
    </div>
  )
}
