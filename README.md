# V-Connect Frontend – Backend Integration Guide  
---

## 🛠 Tech Stack  

- **Frontend:** React.js, Tailwind CSS, Framer Motion  
- **Backend (Expected):** RESTful API (any language/framework)  
- **Data Format:** JSON  
- **Authentication:** JWT-based system  

---

## 📂 Project Structure  


# V-Connect Platform

A modern volunteer and event management platform connecting volunteers, organizations, and administrators. Built with a React (Vite) frontend and a Ballerina backend.

---

## Tech Stack

### Frontend
- **React** (Vite)
- **Tailwind CSS**
- **React Icons**
- **Axios**
- **React Router**

### Backend
- **Ballerina** (RESTful APIs, JWT, SQL, HTTP, MIME, IO, Time)

### Database
- **SQL Database** (MySQL, PostgreSQL, or SQLite)

---

## Prerequisites

- [Node.js & npm](https://nodejs.org/)
- [Ballerina](https://ballerina.io/downloads/)
- SQL database (e.g., MySQL, PostgreSQL, or SQLite)

---

## Setup Instructions

### 1. Clone the Repository
```sh
git clone https://github.com/Pathum-Vimukthi-Kumara/VConnect-TargaryenX.git
cd VConnect-TargaryenX
```

### 2. Configure the Database
- Set up your SQL database (MySQL, PostgreSQL, or SQLite).
- Update the database connection details in the Ballerina backend code (see `Config.toml` or relevant config section).

### 3. Backend Setup (Ballerina)
```sh
cd VConnect
bal build
bal run
```
- The backend will start on [http://localhost:9000](http://localhost:9000)

### 4. Frontend Setup (React)
```sh
cd V-Connect-yRcd/frontend
npm install
npm run dev
```
- The frontend will start on [http://localhost:5173](http://localhost:5173)

---

## Usage
- Open your browser and go to [http://localhost:5173](http://localhost:5173)
- Register as a volunteer, organization, or admin.
- Explore event management, chat, applications, donations, and more.

---

## Advantages & Architecture
- **Separation of Concerns:** Modular backend services for org, volunteer, admin, chat, etc.
- **JWT Authentication:** Secure, role-based access for all APIs.
- **Declarative HTTP APIs:** Ballerina's service/resource model for clean REST endpoints.
- **Cloud-Native Ready:** Easy to containerize and deploy.
- **Efficient Resource Usage:** No polling; HTTP-based chat and notifications.

---

## Ballerina Usage Highlights
- **JWT Authentication** for all protected endpoints.
- **SQL Integration** for persistent storage.
- **CORS Management** for secure cross-origin requests.
- **Static File Serving** for uploads.
- **Error Handling** with meaningful HTTP status codes.

---

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## License
[MIT](LICENSE)
- **VolunteerProfile.jsx** → `/volunteers/:id` (GET/PUT), badges & skills, profile image upload  
