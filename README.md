# Medicare - Healthcare Management System

A full-stack healthcare management system built with React (Vite) frontend and Node.js/Express/MongoDB Atlas backend.

## Features

- **User Management**: Patient, Doctor, and Admin roles
- **Doctor Registration**: Pending approval workflow with BM&DC number verification
- **Hospital Management**: Add, edit, and manage hospitals
- **Appointment Booking**: Patients can book appointments with doctors
- **Availability Management**: Doctors can set availability by date or day of week
- **Email Verification**: Email verification during registration

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Lucide React Icons

### Backend
- Node.js
- Express
- MongoDB Atlas
- Mongoose

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Initialize admin user:
```bash
node scripts/initAdmin.js
```

4. Start the server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:5173` (or another port if 5173 is busy)

## Default Credentials

After running the initialization script:
- **Admin**: admin@gmail.com / password

## Project Structure

```
medi/
├── backend/              # Node.js backend
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── scripts/         # Utility scripts
│   └── server.js        # Express server
├── pages/               # React pages
│   ├── dashboards/      # Dashboard pages
│   └── ...
├── services/            # API services
├── components/          # React components
└── types.ts            # TypeScript types
```

## Environment Variables

Backend `.env` file:
```
MONGO_USERNAME=mehedihasanlemon
MONGO_PASSWORD=xF30vRmi0JL8LOiK
MONGO_CLUSTER=@cluster0.yi4q0qs.mongodb.net
MONGO_DB=medicare_db
PORT=5000
JWT_SECRET=medicare_secret_key_2024_random_xyz_abc_123_secure_token
```

## MongoDB Atlas

- Database and collections are auto-created when first data is inserted
- No manual database setup required
- Connection string format: `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}${MONGO_CLUSTER}/${MONGO_DB}?retryWrites=true&w=majority&appName=Cluster0`

## Development Notes

- All localStorage data has been removed
- All data is now stored in MongoDB Atlas
- Frontend uses API calls to interact with backend
- Backend API runs on port 5000
- Frontend runs on port 5173 (Vite default)
