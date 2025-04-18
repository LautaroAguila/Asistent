// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import TablaDetalle from "./pages/TablaDetalle";
import AlumnoDetalle from "./pages/AlumnoDetalle";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/tabla/:id" element={<TablaDetalle />} />
        <Route path="/alumno/:id" element={<AlumnoDetalle />} />

      </Routes>
    </Router>
  );
}

export default App;


// Dentro de <Routes>

