// ============================================================================
// CODE EDITOR
// ----------------------------------------------------------------------------
// A lightweight code editor: a transparent <textarea> layered over a
// syntax-highlighted <pre>, with a line-number gutter. Tab inserts spaces.
// Keeps the game self-contained (no heavy editor dependency) while still
// feeling like a real programming environment.
// ============================================================================

import { useEffect, useRef } from 'react'
import { playSfx } from '@/audio/sound'

interface CodeEditorProps {
  value: string
  onChange: (v: string) => void
  highlightLine?: number | null
}

const KEYWORDS = [
  'if', 'elif', 'else', 'for', 'while', 'in', 'def', 'return', 'and', 'or',
  'not', 'True', 'False', 'None', 'break', 'continue', 'range', 'print', 'len',
]

export function CodeEditor({ value, onChange, highlightLine }: CodeEditorProps) {
  const taRef = useRef<HTMLTextAreaElement>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)

  const lines = value.split('\n')

  // keep scroll in sync
  const syncScroll = () => {
    if (taRef.current && preRef.current && gutterRef.current) {
      preRef.current.scrollTop = taRef.current.scrollTop
      preRef.current.scrollLeft = taRef.current.scrollLeft
      gutterRef.current.scrollTop = taRef.current.scrollTop
    }
  }

  useEffect(() => {
    syncScroll()
  }, [value])

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.currentTarget
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const next = value.slice(0, start) + '    ' + value.slice(end)
      onChange(next)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4
      })
    } else if (e.key.length === 1) {
      playSfx('type')
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        background: '#070a16',
        border: '1px solid rgba(0,240,255,0.2)',
        borderRadius: 8,
        overflow: 'hidden',
        fontFamily: 'Consolas, "SF Mono", monospace',
        fontSize: 14,
        lineHeight: '20px',
        height: 260,
      }}
    >
      {/* gutter */}
      <div
        ref={gutterRef}
        style={{
          padding: '10px 8px',
          textAlign: 'right',
          color: '#3f4a73',
          userSelect: 'none',
          background: '#0a0f20',
          overflow: 'hidden',
          minWidth: 42,
        }}
      >
        {lines.map((_, i) => (
          <div
            key={i}
            style={{
              color: highlightLine === i + 1 ? '#00f0ff' : '#3f4a73',
              background: highlightLine === i + 1 ? 'rgba(0,240,255,0.1)' : 'transparent',
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* highlighted layer + textarea */}
      <div style={{ position: 'relative', flex: 1 }}>
        <pre
          ref={preRef}
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            margin: 0,
            padding: '10px 12px',
            overflow: 'auto',
            whiteSpace: 'pre',
            pointerEvents: 'none',
            color: '#e8f0ff',
          }}
        >
          {lines.map((line, i) => (
            <div
              key={i}
              style={{
                background: highlightLine === i + 1 ? 'rgba(0,240,255,0.08)' : 'transparent',
                minHeight: 20,
              }}
              dangerouslySetInnerHTML={{ __html: highlight(line) || '&nbsp;' }}
            />
          ))}
        </pre>
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          onScroll={syncScroll}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="Code editor"
          style={{
            position: 'absolute',
            inset: 0,
            margin: 0,
            padding: '10px 12px',
            border: 'none',
            outline: 'none',
            resize: 'none',
            background: 'transparent',
            color: 'transparent',
            caretColor: '#00f0ff',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            lineHeight: 'inherit',
            whiteSpace: 'pre',
            overflow: 'auto',
          }}
        />
      </div>
    </div>
  )
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function highlight(line: string): string {
  const safe = escapeHtml(line)
  // comments
  const commentIdx = findComment(line)
  let code = safe
  let comment = ''
  if (commentIdx >= 0) {
    code = escapeHtml(line.slice(0, commentIdx))
    comment = `<span style="color:#5a6488">${escapeHtml(line.slice(commentIdx))}</span>`
  }
  // strings
  code = code.replace(/(&quot;.*?&quot;|&#039;.*?&#039;|".*?"|'.*?')/g, '<span style="color:#ffcc88">$1</span>')
  // numbers
  code = code.replace(/\b(\d+(\.\d+)?)\b/g, '<span style="color:#9affc0">$1</span>')
  // keywords
  const kwRe = new RegExp(`\\b(${KEYWORDS.join('|')})\\b`, 'g')
  code = code.replace(kwRe, '<span style="color:#56c8ff;font-weight:600">$1</span>')
  return code + comment
}

function findComment(line: string): number {
  let inStr = false
  let q = ''
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inStr) {
      if (c === q) inStr = false
    } else if (c === '"' || c === "'") {
      inStr = true
      q = c
    } else if (c === '#') return i
  }
  return -1
}
