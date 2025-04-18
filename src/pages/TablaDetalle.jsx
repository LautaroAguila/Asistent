import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc
} from "firebase/firestore";
import { db, auth } from "../FireBase/firebaseConfig";
import AdministrarMiembros from "../components/AdministrarMiembros";
import { useAuth } from "../hooks/useAuth";

function TablaDetalle() {
  const { id } = useParams();
  const [tabla, setTabla] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [alumnoExpandido, setAlumnoExpandido] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [turnoFiltro, setTurnoFiltro] = useState("");
  const [ordenAsc, setOrdenAsc] = useState(true);
  const [rolUsuario, setRolUsuario] = useState(null);

  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [nuevoAlumno, setNuevoAlumno] = useState({
    nombre: "", apellido: "", edad: "", escuela: "", grado: "", turno: "mañana",
    dni: "", grupo_familiar: "", tel_contacto: "", nombre_tutor: "", dni_tutor: "",
    dias_por_semana: "", asistencias: 0, inasistencias: 0, profesionales: "",
    observaciones: "", fechaNacimiento: "", direccion: ""
  });

  const esDueño = useMemo(() => {
    return tabla?.creadorUid && user?.uid && tabla.creadorUid === user.uid;
  }, [tabla, user]);

  const esEditor = useMemo(() => {
    return esDueño || rolUsuario === "editor";
  }, [esDueño, rolUsuario]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const obtenerRolUsuario = async () => {
      if (!user) return;
      try {
        console.log("Buscando rol para:", user.uid);
        const q = query(
          collection(db, "miembros_tabla"),
          where("tablaId", "==", id),
          where("usuarioId", "==", user.uid),
          where("estado", "==", "aceptado")
        );
        
        const snap = await getDocs(q);
        if (!snap.empty) {
          const miembro = snap.docs[0].data();
          console.log("Rol encontrado:", miembro.rol);
          setRolUsuario(miembro.rol);
        } else {
          console.log("No se encontró rol (no hay miembro con estado aceptado)");
          setRolUsuario(null);
        }
      } catch (err) {
        console.error("Error obteniendo rol", err);
        setRolUsuario(null);
      }
    };
    obtenerRolUsuario();
  }, [id, user]);
  

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, "tablas_asistencia", id);
      const tablaSnap = await getDoc(docRef);
      setTabla(tablaSnap.data());

      const q = query(collection(db, "alumnos"), where("tablaId", "==", id));
      const querySnapshot = await getDocs(q);
      const lista = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const asistencias = Number(data.asistencias || 0);
        const inasistencias = Number(data.inasistencias || 0);
        const total = asistencias + inasistencias;
        const porcentaje_asistencia = total ? ((asistencias / total) * 100).toFixed(2) : 0;
        lista.push({ id: doc.id, ...data, porcentaje_asistencia });
      });
      setAlumnos(lista);
    };
    fetchData();
  }, [id]);

  const alumnosFiltrados = alumnos
    .filter((a) =>
      (a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.apellido.toLowerCase().includes(busqueda.toLowerCase()))
    )
    .filter((a) => (turnoFiltro ? a.turno === turnoFiltro : true))
    .sort((a, b) => {
      if (ordenAsc) return a.escuela.localeCompare(b.escuela);
      else return b.escuela.localeCompare(a.escuela);
    });

  const handleChange = (e) => {
    setNuevoAlumno({ ...nuevoAlumno, [e.target.name]: e.target.value });
  };

  const handleAgregarAlumno = async (e) => {
    e.preventDefault();
    const alumnoConTabla = {
      ...nuevoAlumno,
      tablaId: id,
      asistencias: Number(nuevoAlumno.asistencias),
      inasistencias: Number(nuevoAlumno.inasistencias),
    };
    try {
      await addDoc(collection(db, "alumnos"), alumnoConTabla);
      alert("Alumno agregado correctamente");
      setNuevoAlumno({
        nombre: "", apellido: "", edad: "", escuela: "", grado: "", turno: "mañana",
        dni: "", grupo_familiar: "", tel_contacto: "", nombre_tutor: "", dni_tutor: "",
        dias_por_semana: "", asistencias: 0, inasistencias: 0, profesionales: "",
        observaciones: "", fechaNacimiento: "", direccion: ""
      });
      setMostrarFormulario(false);
      const q = query(collection(db, "alumnos"), where("tablaId", "==", id));
      const snapshot = await getDocs(q);
      const lista = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const asistencias = Number(data.asistencias || 0);
        const inasistencias = Number(data.inasistencias || 0);
        const total = asistencias + inasistencias;
        const porcentaje_asistencia = total ? ((asistencias / total) * 100).toFixed(2) : 0;
        lista.push({ id: doc.id, ...data, porcentaje_asistencia });
      });
      setAlumnos(lista);
    } catch (error) {
      console.error(error);
      alert("Error al agregar alumno");
    }
  };

  const actualizarAsistencias = async (idAlumno, tipo) => {
    if (!esEditor) return;
    const alumno = alumnos.find((a) => a.id === idAlumno);
    const nuevoValor = {
      asistencias: alumno.asistencias + (tipo === "asistencia" ? 1 : 0),
      inasistencias: alumno.inasistencias + (tipo === "inasistencia" ? 1 : 0)
    };
    const total = nuevoValor.asistencias + nuevoValor.inasistencias;
    const porcentaje_asistencia = total ? ((nuevoValor.asistencias / total) * 100).toFixed(2) : 0;

    await updateDoc(doc(db, "alumnos", idAlumno), nuevoValor);

    setAlumnos(alumnos.map((a) =>
      a.id === idAlumno
        ? { ...a, ...nuevoValor, porcentaje_asistencia }
        : a
    ));
  };

  const handleCampoExpandido = (id, campo, valor) => {
    if (!esEditor) return;
    setAlumnos(alumnos.map((a) =>
      a.id === id ? { ...a, [campo]: valor } : a
    ));
  };

  const guardarCambiosAlumno = async (alumno) => {
    if (!esEditor) return;
    const alumnoActualizado = { ...alumno };
    delete alumnoActualizado.id;
    await updateDoc(doc(db, "alumnos", alumno.id), alumnoActualizado);
    alert("Datos actualizados correctamente");
  };

  if (loading || !tabla || (user && rolUsuario === null && !esDueño)) {
    return <div className="text-center mt-5">Cargando permisos...</div>;
  }

  return (
    <div className="container mt-4">
      <div className="row mb-3">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre o apellido"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={turnoFiltro}
            onChange={(e) => setTurnoFiltro(e.target.value)}
          >
            <option value="">Todos los turnos</option>
            <option value="mañana">Mañana</option>
            <option value="tarde">Tarde</option>
            <option value="noche">Noche</option>
          </select>
        </div>
      </div>

      <h3>Tabla: {tabla?.escuela} ({tabla?.turno})</h3>
      <hr />
      <h5>Alumnos registrados:</h5>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Edad</th>
            <th onClick={() => setOrdenAsc(!ordenAsc)} style={{ cursor: "pointer" }}>
              Escuela {ordenAsc ? "▲" : "▼"}
            </th>
            <th>Asistencias</th>
            <th>Inasistencias</th>
            <th>% Asistencia</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {alumnosFiltrados.map((alumno) => (
            <>
              <tr key={alumno.id}>
                <td><button className="btn btn-link p-0" onClick={() => setAlumnoExpandido(alumno.id === alumnoExpandido ? null : alumno.id)}>{alumno.nombre}</button></td>
                <td>{alumno.apellido}</td>
                <td>{alumno.edad}</td>
                <td>{alumno.escuela}</td>
                <td>{alumno.asistencias}</td>
                <td>{alumno.inasistencias}</td>
                <td>{alumno.porcentaje_asistencia}%</td>
                <td>
                  {esEditor && (
                    <>
                      <button className="btn btn-success btn-sm me-1" onClick={() => actualizarAsistencias(alumno.id, "asistencia")}>+1 ✅</button>
                      <button className="btn btn-danger btn-sm" onClick={() => actualizarAsistencias(alumno.id, "inasistencia")}>+1 ❌</button>
                    </>
                  )}
                </td>
              </tr>
              {alumnoExpandido === alumno.id && (
                <tr>
                  <td colSpan="8">
                    <div className="p-3 border bg-light rounded">
                      <button className="btn-close end-10" onClick={() => setAlumnoExpandido(null)}></button>
                      {[
                        "dni", "grupo_familiar", "tel_contacto", "nombre_tutor", "dni_tutor", "dias_por_semana",
                        "profesionales", "observaciones", "fechaNacimiento", "direccion"
                      ].map((campo) => (
                        <div key={campo} className="mb-2">
                          <strong>{campo.replaceAll("_", " ")}:</strong>
                          <input
                            className="form-control"
                            value={alumno[campo] || ""}
                            onChange={(e) => handleCampoExpandido(alumno.id, campo, e.target.value)}
                            readOnly={!esEditor}
                          />
                        </div>
                      ))}
                      {esEditor && (
                        <button className="btn btn-primary mt-2" onClick={() => guardarCambiosAlumno(alumno)}>Guardar cambios</button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>

      {esEditor && (
        <>
          <button className="btn btn-secondary my-3" onClick={() => setMostrarFormulario(!mostrarFormulario)}>
            {mostrarFormulario ? "Ocultar formulario" : "Agregar nuevo alumno"}
          </button>

          {mostrarFormulario && (
            <form onSubmit={handleAgregarAlumno}>
              <div className="row">
                {["nombre", "apellido", "turno", "escuela", "grado", "dni"].map((campo, idx) => (
                  <div className="col-md-4 mb-2" key={idx}>
                    <label>{campo.charAt(0).toUpperCase() + campo.slice(1)}</label>
                    <input className="form-control" name={campo} value={nuevoAlumno[campo]} onChange={handleChange} required />
                  </div>
                ))}
              </div>
              <button className="btn btn-primary mt-3">Agregar alumno</button>
            </form>
          )}
        </>
      )}

      {esDueño && (
        <AdministrarMiembros tablaId={id} esDueño={esDueño} />
      )}
    </div>
  );
}

export default TablaDetalle;
