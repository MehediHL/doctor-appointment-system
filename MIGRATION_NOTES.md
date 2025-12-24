# Migration Notes: localStorage to MongoDB Atlas

## Changes Made

1. **Backend**: Created full Node.js/Express/MongoDB Atlas backend
2. **Frontend**: Updated to use API calls instead of localStorage
3. **Database**: All data now stored in MongoDB Atlas (auto-created)

## Files That Need Async/Await Updates

The following files need to be updated to use async/await for API calls:

- `pages/Home.tsx` - Search functionality
- `pages/Hospitals.tsx` - Hospital listing
- `pages/Doctors.tsx` - Doctor listing by hospital
- `pages/dashboards/AdminDashboard.tsx` - Admin operations
- `pages/dashboards/PatientDashboard.tsx` - Patient appointments
- `pages/dashboards/DoctorDashboard.tsx` - Doctor operations
- `pages/BookAppointment.tsx` - Appointment booking

## Pattern to Follow

Replace synchronous calls:
```typescript
const hospitals = db.getHospitals();
```

With async calls:
```typescript
const hospitals = await db.getHospitals();
```

And wrap in useEffect or async functions:
```typescript
useEffect(() => {
  const loadData = async () => {
    const hospitals = await db.getHospitals();
    setHospitals(hospitals);
  };
  loadData();
}, []);
```

## Backend Setup

1. `cd backend`
2. `npm install`
3. `node scripts/initAdmin.js` (creates admin user)
4. `npm run dev`

## Frontend Setup

1. `npm install`
2. `npm run dev`

## Important Notes

- All localStorage data has been removed
- MongoDB Atlas auto-creates database and collections
- Admin user: admin@gmail.com / password
- Backend runs on port 5000
- Frontend runs on port 5173

