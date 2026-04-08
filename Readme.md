# 🌍 How-Geo-Location-Works

Welcome to **How-Geo-Location-Works**! This project demonstrates the principles of geo-location matching using modern APIs, spatial databases, and the S2 Geometry Library. With a clean FastAPI backend and an intuitive frontend, this project helps you understand and experiment with geo-matching concepts.

---

## 🚀 Introduction

**How-Geo-Location-Works** is a full-stack template that showcases geo-location matching by leveraging S2 cells for spatial queries. It is ideal for developers, students, and anyone curious about how location-based services (like finding nearby users) are implemented in real-world applications.

---

## ✨ Features

- **FastAPI** backend for performant APIs
- **SQLAlchemy** ORM for database interactions
- **S2 Geometry Library** for efficient geo cell partitioning
- **Pydantic** for robust data validation
- **Simple HTML frontend** for easy testing and demonstration
- **CORS enabled** for frontend-backend communication
- **Environment-based config** with `.env` support

---

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Pranesh-2005/How-Geo-Location-Works.git
   cd How-Geo-Location-Works
   ```

2. **Create and activate a virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**

   Create a `.env` file at the project root:
   ```
   DB_URL=your_database_url
   ```

5. **Run database migrations**
   Make sure to create the database and tables as per your setup. (You may use Alembic or create them manually.)

6. **Start the backend server**
   ```bash
   uvicorn main:app --reload
   ```

7. **Open the frontend**
   Open `frontend/index.html` in your browser.

---

## 🧑‍💻 Usage

1. **Register a user with coordinates:**  
   Use the frontend or API endpoint to create a user, providing their name and location (latitude and longitude).

2. **Geo-matching:**  
   The backend maps user coordinates to S2 cells and efficiently queries for nearby users in the same or adjacent cells.

3. **API Documentation:**  
   When the server is running, browse to [http://localhost:8000/docs](http://localhost:8000/docs) for interactive API docs (powered by Swagger UI).

---

## 🤝 Contributing

Contributions are welcome!  
To get started:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/YourFeature`
5. Create a new Pull Request

Please follow best practices and add tests where applicable.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

> **Questions?**  
> Feel free to open an issue or submit a PR!  
> Happy mapping! 🌐

## License
This project is licensed under the **MIT** License.

---
🔗 GitHub Repo: https://github.com/Pranesh-2005/How-Geo-Location-Works