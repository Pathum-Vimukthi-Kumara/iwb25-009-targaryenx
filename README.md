# V-Connect Frontend – Backend Integration Guide

## Overview

V-Connect is a modern web platform designed to connect volunteers, organizations, and administrators for event management, communication, and collaboration. The backend is built using **Ballerina**, a cloud-native programming language optimized for integration, APIs, and distributed systems.

---

## 📂 Project Structure  

## Architecture

### High-Level Architecture

- **Frontend:** React (Vite) SPA for volunteers, organizations, and admin dashboards.
- **Backend:** Ballerina microservices exposing RESTful APIs for authentication, chat, events, applications, donations, feedback, and more.
- **Database:** SQL-based persistent storage (accessed via Ballerina’s SQL module).
- **Authentication:** JWT-based authentication and authorization for secure access.
- **Deployment:** Easily containerized and deployable on any cloud or on-premises infrastructure.

### Service Structure

- `/api/org` — Organization management (profiles, events, applications, donations, feedback)
- `/api/vol` — Volunteer management (applications, badges, rankings)
- `/api/volunteers` — Volunteer profile and badge endpoints
- `/api/admin` — Admin-only endpoints (user management, badge awarding, event contributions)
- `/api/chat` — Event and private chat between organizations and volunteers
- `/api/auth` — Registration and login
- `/api/contact` — Contact and support messages
- `/pub` — Public endpoints (events, organizations, feedback, donations)
- `/uploads` — Static file serving for uploaded images

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
- **SQL Database** (MySQL)

---

## Prerequisites

- [Node.js & npm](https://nodejs.org/)
- [Ballerina](https://ballerina.io/downloads/)
- SQL database (MySQL

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
## API Documentation

For a complete list of API endpoints and request/response examples, see our interactive Postman documentation:

👉 [V-Connect API Documentation (Postman)](https://documenter.getpostman.com/view/40284138/2sB3BGJAME)

