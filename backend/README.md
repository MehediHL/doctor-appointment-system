# Medicare Backend API

Node.js + Express + MongoDB Atlas backend for the Medicare application.

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

The `.env` file is already created with your MongoDB Atlas credentials. Make sure the values are correct:

```
MONGO_USERNAME=username
MONGO_PASSWORD=mongopassword
MONGO_CLUSTER=clustername
MONGO_DB=medicare_db
PORT=5000
JWT_SECRET=medicare_secret_key_2024_random_xyz_abc_123_secure_token
```

### 3. Initialize Admin User

Run the initialization script to create the admin user:

```bash
node scripts/initAdmin.js
```

This will create:
- Email: `admin@gmail.com`
- Password: `password`
- Role: `admin`

### 4. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user/doctor

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Doctors
- `GET /api/doctors` - Get all doctors (optional ?status=pending|approved)
- `GET /api/doctors/pending` - Get pending doctors
- `GET /api/doctors/approved` - Get approved doctors
- `GET /api/doctors/hospital/:hospitalId` - Get doctors by hospital
- `GET /api/doctors/:id` - Get doctor by ID
- `PUT /api/doctors/:id/approve` - Approve pending doctor
- `PUT /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor

### Hospitals
- `GET /api/hospitals` - Get all hospitals
- `GET /api/hospitals/:id` - Get hospital by ID
- `POST /api/hospitals` - Create hospital
- `PUT /api/hospitals/:id` - Update hospital
- `DELETE /api/hospitals/:id` - Delete hospital

### Appointments
- `GET /api/appointments` - Get all appointments (optional filters: ?doctorId=, ?patientId=, ?status=)
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id/status` - Update appointment status
- `DELETE /api/appointments/:id` - Delete appointment

### Availability
- `GET /api/availability/:doctorId/:date` - Get availability for doctor on date
- `POST /api/availability/date` - Set date-specific availability
- `POST /api/availability/day` - Set day-of-week availability
- `GET /api/availability/day/:doctorId/:dayOfWeek` - Get day-of-week availability

## Database Schema

MongoDB Atlas will auto-create collections when data is inserted. The following collections are used:

- `users` - Patient and admin users
- `doctors` - Doctor profiles (with pending/approved status)
- `hospitals` - Hospital information
- `appointments` - Patient appointments
- `availabilities` - Doctor availability (date-specific and day-of-week)

## Notes

- All passwords are currently stored as plain text (for development). In production, use bcrypt hashing.
- MongoDB Atlas will automatically create the database and collections when first data is inserted.
- The admin user must be created using the initialization script before first use.
