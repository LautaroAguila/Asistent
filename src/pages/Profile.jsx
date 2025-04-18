import { useEffect, useState } from "react";
import { auth, db } from "../FireBase/firebaseConfig";
import { signOut, onAuthStateChanged} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";

function Profile() {
  const [userData, setUserData] = useState(null);
  const [tablasCreadas, setTablasCreadas] = useState([]);
  const [tablasUnidas, setTablasUnidas] = useState([]);
  const [tablasPublicas, setTablasPublicas] = useState([]);
  const [clavePrivada, setClavePrivada] = useState("");
  const [tablaSeleccionada, setTablaSeleccionada] = useState(null);

  const navigate = useNavigate();

  const [formTabla, setFormTabla] = useState({
    escuela: "",
    grado: "",
    turno: "mañana",
    esPublica: true,
    clavePrivada: "",
  });

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

  const solicitarAcceso = async (tabla) => {
    if (!tabla.esPublica && clavePrivada !== tabla.clavePrivada) {
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
  };

  return (
    <div className="container mt-5">
      <h2>Perfil</h2>
      {userData ? (
        <>
          <p><strong>Nombre:</strong> {userData.nombre}</p>
          <p><strong>Apellido:</strong> {userData.apellido}</p>
          <p><strong>CUIL:</strong> {userData.cuil}</p>
          <p><strong>Email:</strong> {userData.email}</p>
          <button className="btn btn-danger mt-3" onClick={handleLogout}>Cerrar Sesión</button>

          <hr className="my-4" />
          <h4>Crear nueva tabla de asistencia</h4>
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

          <hr className="my-4" />
          <h5>Tablas creadas por vos</h5>
          <ul className="list-group mb-4">
            {tablasCreadas.map(tabla => (
              <li key={tabla.id} className="list-group-item d-flex justify-content-between align-items-center">
                {tabla.escuela} ({tabla.turno}) {tabla.grado && `- Grado ${tabla.grado}`}
                <a href={`/tabla/${tabla.id}`} className="btn btn-sm btn-outline-primary">Ver</a>
              </li>
            ))}
          </ul>

          <h5>Tablas a las que te uniste</h5>
          <ul className="list-group mb-4">
            {tablasUnidas.map(tabla => (
              <li key={tabla.id} className="list-group-item d-flex justify-content-between align-items-center">
                {tabla.escuela} ({tabla.turno})
                <a href={`/tabla/${tabla.id}`} className="btn btn-sm btn-outline-secondary">Ver</a>
              </li>
            ))}
          </ul>

          <h5>Tablas públicas disponibles</h5>
          <ul className="list-group">
            {tablasPublicas.map(tabla => (
              <li key={tabla.id} className="list-group-item">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{tabla.escuela}</strong> ({tabla.turno})
                  </div>
                  <div>
                    {!tabla.esPublica && (
                      <input
                        className="form-control form-control-sm d-inline-block me-2"
                        placeholder="Clave privada"
                        style={{ width: "150px" }}
                        onChange={(e) => {
                          setTablaSeleccionada(tabla.id);
                          setClavePrivada(e.target.value);
                        }}
                        disabled={tablaSeleccionada !== tabla.id}
                      />
                    )}
                    <button className="btn btn-sm btn-success" onClick={() => solicitarAcceso(tabla)}>Solicitar acceso</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>Cargando datos...</p>
      )}
    </div>
  );
}

export default Profile;
