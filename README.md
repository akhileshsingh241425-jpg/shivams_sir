# Maintenance Application

A full-stack maintenance management application with predictive maintenance features.

## Project Structure

```
maintainece/
├── backend/          # Flask backend API
└── frontend/         # React frontend
```

## Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- npm or yarn

## Installation & Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (optional but recommended):
```bash
python -m venv venv
```

3. Activate the virtual environment:
- Windows:
  ```bash
  venv\Scripts\activate
  ```
- Linux/Mac:
  ```bash
  source venv/bin/activate
  ```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Initialize the database (if needed):
```bash
python seed.py
```

6. Run the backend server:
```bash
python app.py
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Running on Server

### Quick Start Commands

After cloning the repository, run these commands:

```bash
# Backend
cd backend
pip install -r requirements.txt
python seed.py
python app.py

# In a new terminal - Frontend
cd frontend
npm install
npm start
```

### Production Deployment

#### Backend
```bash
cd backend
pip install -r requirements.txt
python seed.py
# Use a production WSGI server like gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

#### Frontend
```bash
cd frontend
npm install
npm run build
# Serve the build folder with a static server like nginx or serve
npm install -g serve
serve -s build -l 3000
```

## Technologies Used

### Backend
- Flask
- SQLAlchemy
- Flask-CORS
- Python-dateutil
- Openpyxl

### Frontend
- React 19
- React Router DOM
- Axios
- React Scripts

## Features

- Equipment management
- Preventive Maintenance (PM) tracking
- PM history
- Predictive maintenance
- Dashboard with analytics
- User authentication

## API Endpoints

The backend API runs on port 5000. Common endpoints:
- `/api/equipment` - Equipment management
- `/api/pm` - Preventive maintenance
- `/api/predictions` - Predictive analytics

## Default Ports

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`

## Troubleshooting

### Backend Issues
- Make sure Python 3.8+ is installed
- Ensure all dependencies are installed
- Check if port 5000 is available

### Frontend Issues
- Make sure Node.js and npm are installed
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## License

Private project
