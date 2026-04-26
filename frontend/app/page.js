'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Upload, LogIn, UserPlus, LogOut, FileText } from 'lucide-react'

export default function Home() {
  const [user, setUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [notes, setNotes] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notes`)
      const data = await response.json()
      setNotes(data)
    } catch (error) {
      console.error('Error fetching notes:', error)
    }
  }

  const handleSearch = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notes?search=${searchQuery}`)
      const data = await response.json()
      setNotes(data)
    } catch (error) {
      console.error('Error searching notes:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const handleDownload = async (noteId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notes/${noteId}/download`)
      const data = await response.json()
      if (data.fileUrl) {
        // Add fl_attachment parameter to force download
        const downloadUrl = data.fileUrl.includes('?') 
          ? `${data.fileUrl}&fl_attachment=true` 
          : `${data.fileUrl}?fl_attachment=true`
        window.open(downloadUrl, '_blank')
      }
    } catch (error) {
      console.error('Error downloading note:', error)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Notes Sharing</h1>
          <nav className="flex gap-4 items-center">
            {user ? (
              <>
                <Link href="/upload" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  <Upload size={20} />
                  Upload
                </Link>
                <Link href="/my-notes" className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
                  <FileText size={20} />
                  My Notes
                </Link>
                <span className="text-gray-700">Welcome, {user.name}</span>
                <button onClick={handleLogout} className="flex items-center gap-2 text-gray-700 hover:text-red-600">
                  <LogOut size={20} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
                  <LogIn size={20} />
                  Login
                </Link>
                <Link href="/signup" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  <UserPlus size={20} />
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Share & Download Educational Notes</h2>
          <p className="text-xl mb-8">Access thousands of notes from students worldwide</p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto flex gap-2">
            <input
              type="text"
              placeholder="Search notes by title or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100">
              <Search size={24} />
            </button>
          </div>
        </div>
      </section>

      {/* Notes Grid */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h3 className="text-2xl font-bold mb-6">Recent Notes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <div key={note._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = `/note/${note._id}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">{note.subject}</span>
                <span className="text-gray-500 text-sm">{new Date(note.createdAt).toLocaleDateString()}</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">{note.title}</h4>
              <p className="text-gray-600 mb-4 line-clamp-2">{note.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                <span>By {note.uploadedBy?.name || 'Unknown'}</span>
                <div className="flex gap-4">
                  <span>❤️ {note.likes}</span>
                  <span>📥 {note.downloads}</span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownload(note._id)
                }}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download
              </button>
            </div>
          ))}
        </div>
        {notes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileText size={48} className="mx-auto mb-4" />
            <p className="text-xl">No notes found. Be the first to upload!</p>
          </div>
        )}
      </section>
    </div>
  )
}
