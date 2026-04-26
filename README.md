# Notes Sharing Platform

A web-based platform for uploading, downloading, searching, and sharing educational notes. Built with Next.js, Node.js, Express, MongoDB, Cloudinary, and Firebase.

## Features

- **User Authentication**: Email/password login and Google OAuth via Firebase
- **Notes Upload**: Upload PDF/DOC files with title, subject, and description
- **Notes Download**: Direct download with download count tracking
- **Search & Filter**: Search by keywords and filter by subject
- **Interactions**: Like notes and add comments
- **User Profiles**: Manage your uploaded notes
- **Admin Panel**: Delete inappropriate content and manage users

## Tech Stack

### Frontend
- Next.js 14
- React 18
- Tailwind CSS
- Lucide React (icons)
- Firebase SDK
- Axios

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- Cloudinary (file storage)
- Firebase Admin SDK
- JWT (authentication)
- Multer (file uploads)

### Deployment
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas
- Storage: Cloudinary

## Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account
- Cloudinary account
- Firebase project

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd "Notes sharing"
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/notes-sharing
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

Start the backend server:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

Start the frontend development server:

```bash
npm run dev
```

### 4. MongoDB Atlas Setup

1. Create a free MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Whitelist your IP address (0.0.0.0/0 for development)
5. Get your connection string and add it to `.env`

### 5. Cloudinary Setup

1. Create a free Cloudinary account
2. Navigate to Dashboard > Settings > API Keys
3. Copy Cloud Name, API Key, and API Secret
4. Add them to your backend `.env` file

### 6. Firebase Setup

1. Create a Firebase project
2. Enable Google Sign-In in Authentication
3. Go to Project Settings > Service Accounts
4. Generate a private key
5. Copy the private key content and add to backend `.env`
6. Get API key, Auth Domain, and Project ID for frontend `.env.local`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/google` - Login with Google OAuth
- `GET /api/auth/users` - Get all users (Admin only)
- `DELETE /api/auth/users/:id` - Delete user (Admin only)

### Notes
- `POST /api/notes/upload` - Upload a new note (Auth required)
- `GET /api/notes` - Get all notes (with search/filter)
- `GET /api/notes/:id` - Get single note details
- `GET /api/notes/:id/download` - Download note (increments count)
- `POST /api/notes/:id/like` - Like/unlike note (Auth required)
- `DELETE /api/notes/:id` - Delete note (Auth required)
- `GET /api/notes/user/notes` - Get current user's notes (Auth required)

### Comments
- `POST /api/comments` - Add comment (Auth required)
- `GET /api/comments/:noteId` - Get comments for a note
- `DELETE /api/comments/:id` - Delete comment (Auth required)

## User Roles

### Guest
- Browse notes
- Download notes
- View comments

### Registered User
- Upload notes
- Like notes
- Add comments
- Manage own notes
- View profile

### Admin
- All user permissions
- Delete any note
- Delete any comment
- Manage users
- Access admin panel

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  role: String ('user' | 'admin'),
  firebaseUid: String,
  createdAt: Date
}
```

### Notes Collection
```javascript
{
  _id: ObjectId,
  title: String,
  subject: String,
  description: String,
  fileUrl: String,
  fileName: String,
  uploadedBy: ObjectId (ref: User),
  likes: Number,
  downloads: Number,
  likedBy: [ObjectId],
  createdAt: Date
}
```

### Comments Collection
```javascript
{
  _id: ObjectId,
  noteId: ObjectId (ref: Note),
  userId: ObjectId (ref: User),
  text: String,
  createdAt: Date
}
```

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Backend (Render)

1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy automatically on push

## Future Enhancements

- AI-based search and recommendations
- Mobile app (React Native)
- Paid notes system
- Rating system (1-5 stars)
- Note categories and tags
- User profiles with avatars
- Notification system
- Dark mode

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.
