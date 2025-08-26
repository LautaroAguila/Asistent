// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import TablaDetalle from "./pages/TablaDetalle";
import AlumnoDetalle from "./pages/AlumnoDetalle";

function App() {
  const auth = getAuth();
  const [userAuth, setUserAuth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuchar si hay un usuario logueado
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserAuth(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  if (loading) {
    return <div className="text-center mt-5">Cargando...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={userAuth ? <Navigate to="/profile" /> : <Login />} />
        <Route path="/login" element={userAuth ? <Navigate to="/profile" /> : <Login />} />
        <Route path="/register" element={userAuth ? <Navigate to="/profile" /> : <Register />} />

        {/* Rutas privadas */}
        <Route
          path="/profile"
          element={userAuth ? <Profile /> : <Navigate to="/login" />}
        />
        <Route
          path="/tabla/:id"
          element={userAuth ? <TablaDetalle /> : <Navigate to="/login" />}
        />
        <Route
          path="/alumno/:id"
          element={userAuth ? <AlumnoDetalle /> : <Navigate to="/login" />}
        />

        {/* Cualquier otra ruta */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
