import { useEffect, useState } from "react";
import { auth, db } from "../FireBase/firebaseConfig";
import { signOut, onAuthStateChanged} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {doc,getDoc,addDoc,collection,query,where,getDocs,updateDoc} from "firebase/firestore";

function Profile() {
  const [userData, setUserData] = useState(null);
  const [tablasCreadas, setTablasCreadas] = useState([]);
  const [tablasUnidas, setTablasUnidas] = useState([]);
  const [tablasPublicas, setTablasPublicas] = useState([]);
  const [clavePrivada, setClavePrivada] = useState("");
  const [tablaSeleccionada, setTablaSeleccionada] = useState(null);
  const [claveBusqueda, setClaveBusqueda] = useState("");
  const [tablaPrivadaEncontrada, setTablaPrivadaEncontrada] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const navigate = useNavigate();
  const [formTabla, setFormTabla] = useState({
    escuela: "",
    grado: "",
    turno: "mañana",
    esPublica: true,
    clavePrivada: "",
  });
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [filtroPublicas, setFiltroPublicas] = useState("");
  

  const handleChangeTabla = (e) => {
    const { name, value, type, checked } = e.target;
    setFormTabla({
      ...formTabla,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleCrearTabla = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "tablas_asistencia"), {
        escuela: formTabla.escuela,
        grado: formTabla.grado || null,
        turno: formTabla.turno,
        esPublica: formTabla.esPublica,
        clavePrivada: formTabla.esPublica ? "" : formTabla.clavePrivada,
        creadorNombre: userData.nombre,
        creadorCuil: userData.cuil,
        creadorUid: auth.currentUser.uid,
        creadaEn: new Date()
      });
      alert("Tabla creada exitosamente ✅");
      setFormTabla({ escuela: "", grado: "", turno: "mañana", esPublica: true, clavePrivada: "" });
      obtenerTablas(); // actualiza la lista
    } catch (error) {
      console.error(error);
      alert("Error al crear tabla");
    }
  };

  const obtenerTablas = async () => {
    if (!auth.currentUser) return;
  
    const usuarioId = auth.currentUser.uid;
  
    // Usuario
    const docRef = doc(db, "usuarios", usuarioId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;
  
    const userInfo = docSnap.data();
    setUserData(userInfo);
  
    // Tablas creadas por el usuario
    const q1 = query(collection(db, "tablas_asistencia"), where("creadorUid", "==", usuarioId));
    const snap1 = await getDocs(q1);
    const creadas = snap1.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setTablasCreadas(creadas);
  
    // Tablas en las que fue aceptado
    const q2 = query(
      collection(db, "miembros_tabla"),
      where("usuarioId", "==", usuarioId),
      where("estado", "==", "aceptado")
    );
    const snap2 = await getDocs(q2);
    const idsUnidas = snap2.docs.map(doc => doc.data().tablaId);
  
    if (idsUnidas.length > 0) {
      const q3 = query(collection(db, "tablas_asistencia"), where("__name__", "in", idsUnidas));
      const snap3 = await getDocs(q3);
      setTablasUnidas(snap3.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } else {
      setTablasUnidas([]);
    }
  
    // Tablas públicas que NO haya creado yo NI esté unido ya
    const q4 = query(collection(db, "tablas_asistencia"), where("esPublica", "==", true));
    const snap4 = await getDocs(q4);
    const publicasDisponibles = snap4.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(tabla => 
        tabla.creadorUid !== usuarioId &&
        !idsUnidas.includes(tabla.id)
      );

    setTablasPublicas(publicasDisponibles);

  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usuario) => {
      if (usuario) {
        const docRef = doc(db, "usuarios", usuario.uid);
        const docSnap = await getDoc(docRef);
        obtenerTablas();
        if (docSnap.exists()) {
          const userInfo = docSnap.data();
          setUserData(userInfo);
  
          // Tablas creadas por el usuario
          const q1 = query(collection(db, "tablas_asistencia"), where("creadorUid", "==", usuario.uid));
          const snap1 = await getDocs(q1);
          setTablasCreadas(snap1.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  
          // Tablas en las que fue aceptado
          const q2 = query(collection(db, "miembros_tabla"), where("usuarioId", "==", usuario.uid), where("estado", "==", "aceptado"));
          const snap2 = await getDocs(q2);
          const idsUnidas = snap2.docs.map(doc => doc.data().tablaId);
  
          if (idsUnidas.length > 0) {
            const q3 = query(collection(db, "tablas_asistencia"), where("__name__", "in", idsUnidas));
            const snap3 = await getDocs(q3);
            setTablasUnidas(snap3.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          }
  
          // Tablas públicas
          const q4 = query(collection(db, "tablas_asistencia"), where("esPublica", "==", true));
          const snap4 = await getDocs(q4);
          setTablasPublicas(snap4.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      }
    });
  
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const solicitarAcceso = async (tabla, claveIngresada = null) => {
    // Validar clave solo si la tabla no es pública Y se está llamando desde la lista de tablas públicas
    if (!tabla.esPublica && claveIngresada !== null && claveIngresada !== tabla.clavePrivada) {
      alert("Clave incorrecta");
      return;
    }
  
    const yaExiste = await getDocs(query(
      collection(db, "miembros_tabla"),
      where("tablaId", "==", tabla.id),
      where("usuarioId", "==", auth.currentUser.uid)
    ));
  
    if (!yaExiste.empty) {
      alert("Ya solicitaste acceso o ya estás en la tabla.");
      return;
    }
  
    await addDoc(collection(db, "miembros_tabla"), {
      tablaId: tabla.id,
      usuarioId: auth.currentUser.uid,
      nombreUsuario: `${userData.nombre} ${userData.apellido}`,
      cuil: userData.cuil,
      estado: "pendiente",
      rol: "lector"
    });
  
    alert("Solicitud enviada correctamente.");
    setTablaPrivadaEncontrada(null); // limpiar
  };

  const buscarTablaPrivada = async () => {
    if (!claveBusqueda) return;
  
    const q = query(
      collection(db, "tablas_asistencia"),
      where("esPublica", "==", false),
      where("clavePrivada", "==", claveBusqueda)
    );
  
    const snap = await getDocs(q);
  
    if (snap.empty) {
      alert("No se encontró ninguna tabla con esa clave.");
      setTablaPrivadaEncontrada(null);
      return;
    }
  
    const tabla = snap.docs[0];
    const datos = { id: tabla.id, ...tabla.data() };
  
    // Validación: evitar que aparezca si es el creador o ya está unido
    const esCreador = datos.creadorUid === auth.currentUser.uid;
    const yaUnido = tablasUnidas.some(t => t.id === datos.id);
  
    if (esCreador || yaUnido) {
      alert("Esta tabla ya te pertenece o ya estás unido.");
      setTablaPrivadaEncontrada(null);
      return;
    }
  
    setTablaPrivadaEncontrada(datos);
  };

  const handleImagenCambio = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
  
    const lector = new FileReader();
    lector.onloadend = async () => {
      const base64 = lector.result;
      try {
        setSubiendoImagen(true);
        const docRef = doc(db, "usuarios", auth.currentUser.uid);
        await updateDoc(docRef, { fotoPerfil: base64 });
        setUserData((prev) => ({ ...prev, fotoPerfil: base64 }));
      } catch (error) {
        console.error("Error al subir imagen:", error);
        alert("Error al subir imagen.");
      } finally {
        setSubiendoImagen(false);
      }
    };
    lector.readAsDataURL(archivo);
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Perfil</h2>

      {/* Primera Fila: Foto - Info - Tablas */}
      <div className="row">
        {/* Columna Izquierda: Foto de perfil */}
        <div className="col-md-3 text-center">
          {userData?.fotoPerfil && (
            <img
              src={userData.fotoPerfil}
              alt="Foto de perfil"
              className="img-fluid rounded-circle mb-3"
              style={{ width: "120px", height: "120px", objectFit: "cover" }}
            />
          )}
          <div className="mb-3">
            <label htmlFor="imagenPerfil" className="form-label">Cambiar foto</label>
            <input
              type="file"
              accept="image/*"
              className="form-control"
              id="imagenPerfil"
              onChange={handleImagenCambio}
              disabled={subiendoImagen}
            />
            {subiendoImagen && <small>Subiendo imagen...</small>}
          </div>
        </div>

        {/* Columna Central: Info personal y acciones */}
        <div className="col-md-6">
          {userData ? (
            <>
              <p><strong>Nombre:</strong> {userData.nombre}</p>
              <p><strong>Apellido:</strong> {userData.apellido}</p>
              <p><strong>CUIL:</strong> {userData.cuil}</p>
              <p><strong>Email:</strong> {userData.email}</p>

              <div className="d-flex flex-wrap gap-2 my-3">
                <button className="btn btn-danger" onClick={handleLogout}>Cerrar Sesión</button>
                <button
                  className="btn btn-primary"
                  onClick={() => setMostrarFormulario(!mostrarFormulario)}
                >
                  {mostrarFormulario ? "Ocultar formulario" : "Crear nueva tabla"}
                </button>
              </div>

              <div className={`collapse ${mostrarFormulario ? "show" : ""}`}>
                {/* FORMULARIO DE CREACIÓN DE TABLA */}
                <form onSubmit={handleCrearTabla}>
                  <div className="mb-3">
                    <label>Nombre de la escuela *</label>
                    <input
                      className="form-control"
                      name="escuela"
                      value={formTabla.escuela}
                      onChange={handleChangeTabla}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label>Grado (opcional)</label>
                    <input
                      className="form-control"
                      name="grado"
                      value={formTabla.grado}
                      onChange={handleChangeTabla}
                    />
                  </div>
                  <div className="mb-3">
                    <label>Turno</label>
                    <select
                      className="form-control"
                      name="turno"
                      value={formTabla.turno}
                      onChange={handleChangeTabla}
                    >
                      <option value="mañana">Mañana</option>
                      <option value="tarde">Tarde</option>
                      <option value="noche">Noche</option>
                    </select>
                  </div>
                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="esPublica"
                      name="esPublica"
                      checked={formTabla.esPublica}
                      onChange={handleChangeTabla}
                    />
                    <label className="form-check-label" htmlFor="esPublica">
                      Tabla pública (otros pueden solicitar acceso)
                    </label>
                  </div>
                  {!formTabla.esPublica && (
                    <div className="mb-3">
                      <label>Clave privada *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="clavePrivada"
                        value={formTabla.clavePrivada}
                        onChange={handleChangeTabla}
                        required
                      />
                    </div>
                  )}
                  <button className="btn btn-success">Crear tabla</button>
                </form>
              </div>
            </>
          ) : (
            <p>Cargando datos...</p>
          )}
        </div>

        {/* Columna Derecha: Tablas creadas y unidas */}
        <div className="col-md-3">
          <h5>Tablas creadas</h5>
          <ul className="list-group mb-4">
            {tablasCreadas.map(tabla => (
              <li key={tabla.id} className="list-group-item d-flex justify-content-between align-items-center">
                {tabla.escuela}
                <a href={`/tabla/${tabla.id}`} className="btn btn-sm btn-outline-primary">Ver</a>
              </li>
            ))}
          </ul>

          <h5>Tablas unidas</h5>
          <ul className="list-group">
            {tablasUnidas.map(tabla => (
              <li key={tabla.id} className="list-group-item d-flex justify-content-between align-items-center">
                {tabla.escuela}
                <a href={`/tabla/${tabla.id}`} className="btn btn-sm btn-outline-secondary">Ver</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Segunda Fila: Buscadores */}
      <hr className="my-5" />
      <div className="row">
        <div className="col-md-6">
          <h5>Buscar tabla privada por clave</h5>
          <div className="input-group mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Ingresá la clave privada"
              value={claveBusqueda}
              onChange={(e) => setClaveBusqueda(e.target.value)}
            />
            <button className="btn btn-outline-primary" onClick={buscarTablaPrivada}>Buscar</button>
          </div>

          {tablaPrivadaEncontrada && (
            <div className="alert alert-secondary d-flex justify-content-between align-items-center">
              <div>
                <strong>{tablaPrivadaEncontrada.escuela}</strong> ({tablaPrivadaEncontrada.turno})
              </div>
              <button
                className="btn btn-sm btn-success"
                onClick={() => solicitarAcceso(tablaPrivadaEncontrada)}
              >
                Solicitar acceso
              </button>
            </div>
          )}
        </div>

        <div className="col-md-6">
          <h5>Tablas públicas disponibles</h5>
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Buscar por nombre de escuela..."
            value={filtroPublicas}
            onChange={(e) => setFiltroPublicas(e.target.value)}
          />
          <ul className="list-group">
            {tablasPublicas
              .filter(tabla =>
                tabla.escuela.toLowerCase().includes(filtroPublicas.toLowerCase())
              )
              .map(tabla => (
                <li key={tabla.id} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{tabla.escuela}</strong> ({tabla.turno})
                    </div>
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => solicitarAcceso(tabla)}
                    >
                      Solicitar acceso
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Profile;
