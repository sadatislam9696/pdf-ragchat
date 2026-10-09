import { useState, useEffect } from 'react'
import './App.css'
import ReactMarkdown from 'react-markdown'

function getInitialTheme() {
  const saved = localStorage.getItem('theme')
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function App() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [file, setFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploading, setUploading] = useState(false)

  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  async function handleUpload() {
    if (!file || uploading) return

    setUploading(true)
    setUploadStatus('')
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || 'Upload failed.')
      } else {
        setUploadStatus(data.message)
      }
    } catch (err) {
      setError('Could not reach the server. Is the backend running?')
    }

    setUploading(false)
  }

  async function handleAsk() {
    if (!question.trim() || loading) return

    setLoading(true)
    setAnswer('')
    setError('')

    try {
      const response = await fetch('http://localhost:8000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || 'Something went wrong.')
      } else {
        setAnswer(data.answer)
      }
    } catch (err) {
      setError('Could not reach the server. Is the backend running?')
    }

    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  return (
    <div className="app">
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
      >
        {theme === 'dark' ? (
          /* Sun icon */
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          /* Moon icon */
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      <h1 className="project-name">PDF  CHATBOT</h1>
      <p className="tagline">Upload a PDF, then ask questions about it.</p>

      <div className="upload-row">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button className="ask-button" onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      {uploadStatus && <p className="status status-success">{uploadStatus}</p>}

      <div className="ask-row">
        <textarea
          className="ask-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about the document..."
          rows={3}
        />
        <button className="ask-button" onClick={handleAsk} disabled={loading}>
          Ask
        </button>
      </div>

      {loading && <p className="status status-loading">Thinking…</p>}
      {error && <p className="status status-error">{error}</p>}
      {answer && (
        <div className="answer-box">
          <ReactMarkdown>{answer}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}

export default App
