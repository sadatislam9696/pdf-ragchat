import { useState } from 'react'
import './App.css'

function App() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [file, setFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploading, setUploading] = useState(false)

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

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      handleAsk()
    }
  }

  return (
    <div className="app">
      <h1>PDF Chatbot</h1>
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
        <input
          type="text"
          className="ask-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about the document..."
        />
        <button className="ask-button" onClick={handleAsk} disabled={loading}>
          Ask
        </button>
      </div>

      {loading && <p className="status status-loading">Thinking…</p>}
      {error && <p className="status status-error">{error}</p>}
      {answer && <div className="answer-box">{answer}</div>}
    </div>
  )
}

export default App
