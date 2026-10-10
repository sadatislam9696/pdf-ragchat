import { useState, useRef } from 'react'
import './App.css'
import ReactMarkdown from 'react-markdown'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const NETWORK_ERROR = 'Cannot connect to the server. Please check your connection and try again.'

// Read a JSON body safely: an error response is not always valid JSON.
async function readJson(response) {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

function App() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [file, setFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploading, setUploading] = useState(false)

  const abortRef = useRef(null)
  const [copied, setCopied] = useState(false)

  async function handleUpload() {
    if (!file || uploading) return

    setUploading(true)
    setUploadStatus('')
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      })

      const data = await readJson(response)

      if (!response.ok) {
        setError(data.detail || `Upload failed (error ${response.status}).`)
      } else {
        setUploadStatus(data.message)
      }
    } catch (err) {
      console.error('Upload request failed:', err)
      setError(NETWORK_ERROR)
    }

    setUploading(false)
  }

  async function handleAsk() {
    if (!question.trim() || loading) return

    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setAnswer('')
    setError('')

    try {
      const response = await fetch(`${API_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question }),
        signal: controller.signal,
      })

      const data = await readJson(response)

      // readJson swallows errors, so check for a cancel that happened while reading the body
      if (controller.signal.aborted) {
        throw new DOMException('Aborted', 'AbortError')
      }

      if (!response.ok) {
        setError(data.detail || `Something went wrong (error ${response.status}).`)
      } else {
        setAnswer(data.answer)
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // Only show this for "Cancel waiting"; "Clear" detaches the request first
        if (abortRef.current === controller) {
          setError('Stopped waiting. The server may still finish processing the request.')
        }
      } else {
        console.error('Ask request failed:', err)
        setError(NETWORK_ERROR)
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
      }
      setLoading(false)
    }
  }

  function handleCancel() {
    abortRef.current?.abort()
  }

  function handleClear() {
    const controller = abortRef.current
    abortRef.current = null
    controller?.abort()
    setQuestion('')
    setAnswer('')
    setError('')
    setCopied(false)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(answer)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
      setError('Could not copy to the clipboard.')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  return (
    <div className="app">
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

      {(question || answer || error) && (
        <div className="clear-row">
          <button className="clear-button" onClick={handleClear}>
            Clear
          </button>
        </div>
      )}

      {loading && (
        <div className="status status-loading">
          <span>Thinking…</span>
          <button className="cancel-button" onClick={handleCancel}>
            Cancel waiting
          </button>
        </div>
      )}
      {error && <p className="status status-error">{error}</p>}
      {answer && (
        <div className="answer-wrap">
          <div className="answer-box">
            <ReactMarkdown>{answer}</ReactMarkdown>
          </div>
          <button className="copy-button" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy answer'}
          </button>
        </div>
      )}
    </div>
  )
}

export default App
