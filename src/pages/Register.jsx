// src/pages/Register.jsx
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../FireBase/firebaseConfig";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    cuil: "",
    email: "",
    password: ""
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await setDoc(doc(db, "usuarios", userCredential.user.uid), {
        nombre: form.nombre,
        apellido: form.apellido,
        cuil: form.cuil,
        email: form.email
      });
      navigate("/profile");
    } catch (error) {
      alert("Error al registrar: " + error.message);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      <div className="card p-4 shadow" style={{ width: "100%", maxWidth: "500px" }}>
        <h2 className="text-center mb-4">Registro</h2>
        <form onSubmit={handleRegister}>
          <div className="mb-3">
            <label className="form-label">Nombre</label>
            <input className="form-control" name="nombre" onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Apellido</label>
            <input className="form-control" name="apellido" onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label">CUIL</label>
            <input className="form-control" name="cuil" onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" name="email" onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Contraseña</label>
            <div className="input-group">
              <input 
                type={mostrarPassword ? "text" : "password"}
                className="form-control"
                name="password"
                onChange={handleChange}
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
            <button className="btn btn-success">Registrarse</button>
          </div>
          <p className="mt-3 text-center">
            ¿Ya tienes cuenta? <Link to="/">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
