# Hospital Digital Asset Management System (HDAMS) 🏥

Welcome to the **Hospital Digital Asset Management System (HDAMS)**! This project is a comprehensive health-tech solution designed to seamlessly bridge the gap between hospital administration, medical professionals, lab technicians, and patients. 

HDAMS organizes medical records, diagnostic reports, prescriptions, and complex hospital workflows into a highly secure, digital-first experience.

---

## 🚀 Tech Stack

- **Frontend:** React.js, Tailwind CSS, Vite (Single Page Application architecture)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (using Mongoose ODM)
- **Authentication & Security:** JWT (JSON Web Tokens), Role-Based Access Control (RBAC), OTP Verification for sensitive report sharing, Helmet, CORS, Express Rate Limit.
- **File Handling:** Multer (Local static file uploads)

---

## 👥 User Roles & Complete Workflow

The architecture of HDAMS relies on strict Role-Based Access Control. Each user role gets a uniquely tailored dashboard and distinct responsibilities:

### 1. Administration (Admin)
The **Admin** sits at the top of the hierarchy and acts as the system overseer.
- **Staff Management:** Can invite, view, create, and manage the access of all clinical staff (Doctors, Receptionists, Lab Technicians).
- **System Monitoring:** Has analytics and activity logs to oversee total reports uploaded, patient registry size, system health, and staff activity.

### 2. Receptionist
The **Receptionist** is the frontline of the patient data workflow.
- **Patient Onboarding:** Creates new patient profiles, schedules next visits, assigns patients to specific doctors, and fills in critical demographic information (MRN, Age, Contacts).
- **Directory Management:** Helps maintain the active queue of patients interacting with the hospital.

### 3. Lab Technician
The **Lab Technician** acts as the diagnostic data source for doctors.
- **Dashboard:** Views a prioritized list of patients newly added by Receptionists.
- **Upload Workflow:** Selects a patient and uploads diagnostic records (Blood Tests, X-Rays, MRI, CT Scans). 
- **Upload Status Mapping:** Tracks patients instantly—the system shows a live status (`Uploaded` vs `Not Uploaded`) so technicians know who is pending lab results.

### 4. Doctor
The **Doctor** focuses entirely on clinical review and patient care.
- **My Patients:** Upon login, doctors immediately see a list of patients uniquely assigned to them by the receptionist.
- **Reports & Labs Review:** They securely access diagnostic files directly uploaded by the lab technicians, bypassing patient-locking mechanisms for seamless clinical review.
- **Quick Prescriptions:** Write detailed medical notes, specify medicinal dosages/frequencies, schedule follow-up visits, and directly attach documentation to the patient’s permanent file.

### 5. Patient
The **Patient** empowers users to own and manage their health outcomes.
- **Dashboard:** At-a-glance view of their assigned doctor, new reports, and total active prescriptions.
- **Profile Management:** Patients can dynamically edit their personal addresses, contact numbers, and basic bio-metrics directly.
- **Prescription Interface:** They can view detailed medicinal breakdown schedules natively on the web or print/download their medical charts.
- **Secure File Access (OTP Vault):** Some highly sensitive diagnostic files are protected. When a patient tries to access them, the system requires an Email OTP validation lock before releasing the temporary file URL.

---

## 🔄 The Life Cycle of a Patient Visit

1. **Registration:** A Patient walks in. The **Receptionist** creates an account, logging their history and assigning them to **Dr. Smith**.
2. **Diagnostic Testing:** The Patient is sent to the Lab. The **Lab Technician** logs in, sees the new patient in their queue, takes the X-Ray, and uploads the PDF/Image report securely against the patient's ID.
3. **Clinical Review:** **Dr. Smith** opens their dashboard. They see the patient and note that a fresh X-Ray report is available. They review the X-Ray directly from their terminal.
4. **Prescription Checkout:** **Dr. Smith** writes up a post-visit summary, logs 2 medications, and schedules a follow-up 3 weeks out.
5. **Patient Handoff:** The Patient heads home, logs into the web portal, updates their home address, downloads their newly written prescription to their phone, and requests an OTP to safely review their X-Ray records.

---

## 🛠️ Installation & Getting Started

### Prerequisites:
Make sure you have [Node.js](https://nodejs.org/en/) and [MongoDB](https://www.mongodb.com/) installed on your machine.

### 1. Clone the repository
```bash
git clone <repository-url>
cd Hospital-Digital-Asset-Management-System
```

### 2. Install Dependencies
Install frontend and backend library dependencies.
```bash
npm install
```

*(Note: Depending on your specific package setup, you might need to CD into the `server` folder to install backend dependencies separately).*

### 3. Environment Variables (.env)
Create a `.env` file in the root/server directory. You will need variables like:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hdams
JWT_SECRET=your_jwt_strong_secret
```

### 4. Run the Application

**Terminal 1 (Backend Server):**
```bash
node server/index.js
```

**Terminal 2 (Frontend Client):**
```bash
npm run dev
```

The app will compile and be available locally (usually at `http://localhost:5173`).

---

## 🛡️ Security Best Practices Addressed
- **Rate-Limiting:** Active brute-force resistance on critical API paths.
- **JWT Middleware:** Complete backend protection utilizing dual-authentication token drops.
- **Isolated State Contexts:** React auth-wrapping ensuring complete UI blockade if an un-authorized user breaks in.

---

*Thank you for exploring HDAMS! Building a healthier tomorrow through organized data integration.*
