'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Heart, MessageCircle, Download, Trash2 } from 'lucide-react'

export default function NoteDetail() {
  const params = useParams()
  const router = useRouter()
  const [note, setNote] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) setUser(JSON.parse(userData))
    fetchNote()
    fetchComments()
  }, [params.id])

  const fetchNote = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notes/${params.id}`)
      const data = await response.json()
      setNote(data)
    } catch (error) {
      console.error('Error fetching note:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/comments/${params.id}`)
      const data = await response.json()
      setComments(data)
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleLike = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notes/${params.id}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      setNote({ ...note, likes: data.likes })
    } catch (error) {
      console.error('Error liking note:', error)
    }
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notes/${params.id}/download`)
      const data = await response.json()
      if (data.fileUrl) {
        window.open(data.fileUrl, '_blank')
        setNote({ ...note, downloads: note.downloads + 1 })
      }
    } catch (error) {
      console.error('Error downloading note:', error)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          noteId: params.id,
          text: newComment,
        }),
      })

      if (response.ok) {
        setNewComment('')
        fetchComments()
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notes/${params.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        router.push('/')
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

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Note not found</div>
      </div>
    )
  }

  const isOwner = user && note.uploadedBy._id === user.id

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex justify-between items-start mb-4">
            <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">{note.subject}</span>
            {isOwner && (
              <button
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>

          <h1 className="text-3xl font-bold mb-4">{note.title}</h1>
          <p className="text-gray-600 mb-6">{note.description}</p>

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
            <span>Uploaded by {note.uploadedBy?.name || 'Unknown'}</span>
            <span>{new Date(note.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 bg-pink-100 text-pink-600 px-4 py-2 rounded-lg hover:bg-pink-200"
            >
              <Heart size={20} />
              {note.likes}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Download size={20} />
              Download ({note.downloads})
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <MessageCircle size={24} />
            Comments ({comments.length})
          </h3>

          {user ? (
            <form onSubmit={handleComment} className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Post Comment
              </button>
            </form>
          ) : (
            <p className="text-gray-600 mb-6">
              Please <a href="/login" className="text-blue-600 hover:underline">login</a> to comment
            </p>
          )}

          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment._id} className="border-b border-gray-200 pb-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold">{comment.userId?.name || 'Unknown'}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700">{comment.text}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-gray-500 text-center py-4">No comments yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
