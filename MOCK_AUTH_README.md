# Mock Authentication Setup

This project now includes mock authentication for testing the nurse interface without requiring a backend connection.

## How to Use Mock Authentication

### 1. Start the Frontend Application
```bash
npm run dev
# or
yarn dev
```

### 2. Access the Login Page
Navigate to `http://localhost:5173`

### 3. Use Mock Credentials

#### Nurse Interface (INFIRMIER)
- **Username**: `inf`
- **Password**: `inf`
- **Access**: Dashboard, Consultations, Patients, Medicines List

#### Admin Interface (ADMIN)
- **Username**: `admin`
- **Password**: `admin`
- **Access**: All admin features including stock management, personnel, suppliers, reports

#### Doctor Interface (MEDECIN)
- **Username**: `med`
- **Password**: `med`
- **Access**: Same as nurse interface

## What's Changed

1. **AuthContext.tsx**: Modified to include mock authentication
2. **API Call**: The original login API call is commented out but preserved
3. **Mock Users**: Three mock users are available for testing different roles

## Nurse Interface Pages Available

Once logged in as a nurse (`inf`/`inf`), you can access:

1. **Dashboard** (`/dashboard`)
   - Medical statistics and quick actions
   - Recent activities display

2. **Consultations** (`/consultations`)
   - View all consultations
   - Create new consultations
   - Edit existing consultations
   - Delete consultations
   - Add medicines to stock exits

3. **Patients** (`/patients`)
   - View patient list
   - Access medical records
   - Add new consultations for patients

4. **Medicines List** (`/medicines-list`)
   - View medicine inventory
   - Search and filter medicines
   - Edit medicine details
   - Monitor stock levels

## Reverting to API Authentication

To revert back to API authentication:

1. Open `src/context/AuthContext.tsx`
2. Uncomment the original API call code (lines 95-130)
3. Comment out or remove the mock authentication code (lines 52-94)

## Notes

- The mock authentication stores user data in localStorage
- Session persists across browser refreshes
- All role-based access control still works as expected
- The original API code is preserved and can be easily restored
