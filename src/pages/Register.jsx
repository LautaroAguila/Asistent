// src/pages/Register.jsx
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../FireBase/firebaseConfig";
import { useNavigate, Link } from "react-router-dom";

function Register() {
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
    <div className="container mt-5">
      <h2>Registro</h2>
      <form onSubmit={handleRegister}>
        <div className="mb-3">
          <label>Nombre</label>
          <input className="form-control" name="nombre" onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label>Apellido</label>
          <input className="form-control" name="apellido" onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label>CUIL</label>
          <input className="form-control" name="cuil" onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label>Email</label>
          <input className="form-control" type="email" name="email" onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label>Contraseña</label>
          <input className="form-control" type="password" name="password" onChange={handleChange} required />
        </div>
        <button className="btn btn-success">Registrarse</button>
        <p className="mt-3">¿Ya tienes cuenta? <Link to="/">Inicia sesión</Link></p>
      </form>
    </div>
  );
}

export default Register;
