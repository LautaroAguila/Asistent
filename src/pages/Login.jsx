// src/pages/Login.jsx
import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../FireBase/firebaseConfig";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Verificar si existe en la colección "usuarios"
      const uid = userCredential.user.uid;
      const docRef = doc(db, "usuarios", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        navigate("/profile");
      } else {
        // Si no existe, lo desconectamos y mostramos alerta
        await signOut(auth);
        alert("Tu cuenta no está registrada. Por favor, regístrate primero.");
      }

    } catch (error) {
      alert("Error al iniciar sesión: " + error.message);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      <div className="card p-4 shadow" style={{ width: "100%", maxWidth: "400px" }}>
        <h2 className="text-center mb-4">Iniciar Sesión</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className="form-control" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Contraseña</label>
            <div className="input-group">
              <input 
                type={mostrarPassword ? "text" : "password"}
                className="form-control"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="btn btn-outline-secondary" 
                onClick={() => setMostrarPassword(!mostrarPassword)}
              >
                {mostrarPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          <div className="d-grid">
            <button className="btn btn-primary">Ingresar</button>
          </div>
          <p className="mt-3 text-center">
            ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
