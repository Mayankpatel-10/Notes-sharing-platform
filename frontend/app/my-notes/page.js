'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trash2, ArrowLeft } from 'lucide-react'

export default function MyNotes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyNotes()
  }, [])

  const fetchMyNotes = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notes/user/notes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      setNotes(data)
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setNotes(notes.filter(note => note._id !== noteId))
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          <h2 className="text-3xl font-bold mt-4">My Notes</h2>
          <p className="text-gray-600">Manage your uploaded notes</p>
        </div>

        {notes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-xl">You haven't uploaded any notes yet</p>
            <Link
              href="/upload"
              className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Upload Your First Note
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <div key={note._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">{note.subject}</span>
                  <span className="text-gray-500 text-sm">{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
                <h4 className="text-xl font-semibold mb-2">{note.title}</h4>
                <p className="text-gray-600 mb-4 line-clamp-2">{note.description}</p>
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span>❤️ {note.likes}</span>
                  <span>📥 {note.downloads}</span>
                </div>
                <div className="flex gap-2">
                  <a
                    href={note.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-center"
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleDelete(note._id)}
                    className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
