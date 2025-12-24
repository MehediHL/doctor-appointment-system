# Setup Guide - MongoDB Atlas Migration

## ✅ Completed Setup

### Backend (Node.js + Express + MongoDB Atlas)
- ✅ Full backend structure created
- ✅ MongoDB connection configured
- ✅ All models created (User, Doctor, Hospital, Appointment, Availability)
- ✅ All routes and controllers implemented
- ✅ Admin initialization script created

### Frontend Updates
- ✅ API service layer created (`services/api.ts`)
- ✅ Database service updated to use API (`services/db.ts`)
- ✅ Login page updated to use async/await
- ✅ Register page updated to use async/await
- ✅ AdminDashboard updated to use async/await

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
node scripts/initAdmin.js
npm run dev
```

The backend will start on `http://localhost:5000`

### 2. Frontend Setup

```bash
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

## 📝 Remaining Files to Update

These files still need async/await updates (they currently use synchronous db calls):

1. `pages/Home.tsx` - Search functionality
2. `pages/Hospitals.tsx` - Hospital listing
3. `pages/Doctors.tsx` - Doctor listing
4. `pages/BookAppointment.tsx` - Appointment booking
5. `pages/dashboards/PatientDashboard.tsx` - Patient appointments
6. `pages/dashboards/DoctorDashboard.tsx` - Doctor operations

### Pattern to Follow:

**Before:**
```typescript
useEffect(() => {
  const hospitals = db.getHospitals();
  setHospitals(hospitals);
}, []);
```

**After:**
```typescript
useEffect(() => {
  const loadData = async () => {
    const hospitals = await db.getHospitals();
    setHospitals(hospitals);
  };
  loadData();
}, []);
```

## 🔐 Default Credentials

After running `node scripts/initAdmin.js`:
- **Email**: admin@gmail.com
- **Password**: password
- **Role**: admin

## 📊 MongoDB Atlas

- Database: `medicare_db` (auto-created)
- Collections: Auto-created on first insert
- Connection: Configured in `backend/.env`

## ⚠️ Important Notes

1. **Backend must be running** before frontend can work
2. **Admin user must be created** using the init script
3. **All localStorage data removed** - everything is in MongoDB now
4. **CORS enabled** for localhost development

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB Atlas connection string in `.env`
- Ensure MongoDB Atlas IP whitelist includes your IP (or 0.0.0.0/0 for development)
- Check if port 5000 is available

### Frontend can't connect to backend
- Ensure backend is running on port 5000
- Check browser console for CORS errors
- Verify API_BASE_URL in `services/api.ts` matches backend port

### Admin login fails
- Run `node backend/scripts/initAdmin.js` again
- Check MongoDB Atlas for the created admin user

## 📁 Project Structure

```
medi/
├── backend/
│   ├── config/          # MongoDB connection
│   ├── controllers/     # API controllers
│   ├── models/          # Mongoose models
│   ├── routes/          # Express routes
│   ├── scripts/         # Utility scripts
│   └── server.js         # Main server file
├── pages/               # React pages
├── services/
│   ├── api.ts          # API client
│   └── db.ts           # Database wrapper (uses API)
└── ...
```

## 🎯 Next Steps

1. Update remaining frontend files to use async/await
2. Test all CRUD operations
3. Add error handling and loading states
4. Consider adding JWT authentication
5. Add password hashing (bcrypt) for production

