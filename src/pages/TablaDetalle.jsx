import React from "react";
import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc} from "firebase/firestore";
import { db, auth } from "../FireBase/firebaseConfig";
import AdministrarMiembros from "../components/AdministrarMiembros";
import { useAuth } from "../hooks/useAuth";
import NavBar from "../components/NavBar";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable"; 

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
  const [tablasCreadas, setTablasCreadas] = useState([]);
  const [tablasUnidas, setTablasUnidas] = useState([]);
  const [mostrarAdministracion, setMostrarAdministracion] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [nuevoAlumno, setNuevoAlumno] = useState({
    nombre: "", apellido: "", edad: "", escuela: "", grado: "", turno: "mañana",
    dni: "", grupo_familiar: "", tel_contacto: "", nombre_tutor: "", dni_tutor: "",
    asistencias: 0, inasistencias: 0, profesionales: "",
    observaciones: "", fechaNacimiento: "", direccion: ""
  });

  const esDueño = useMemo(() => {
    return tabla?.creadorUid && user?.uid && tabla.creadorUid === user.uid;
  }, [tabla, user]);

  const esEditor = useMemo(() => {
    return esDueño || rolUsuario === "editor";
  }, [esDueño, rolUsuario]);

  const handleSeleccionarTabla = (tablaId) => {
    navigate(`/tabla/${tablaId}`);
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const obtenerTablasUsuario = async () => {
      if (!user) return;
      try {
        // Tablas creadas
        const creadasSnap = await getDocs(query(
          collection(db, "tablas_asistencia"),
          where("creadorUid", "==", user.uid)
        ));
        const creadas = creadasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
        // Tablas unidas
        const miembrosSnap = await getDocs(query(
          collection(db, "miembros_tabla"),
          where("usuarioId", "==", user.uid),
          where("estado", "==", "aceptado")
        ));
        const idsUnidas = miembrosSnap.docs.map(doc => doc.data().tablaId);
        const unidas = [];
  
        for (const tablaId of idsUnidas) {
          if (!creadas.find(c => c.id === tablaId)) {
            const tDoc = await getDoc(doc(db, "tablas_asistencia", tablaId));
            if (tDoc.exists()) {
              unidas.push({ id: tablaId, ...tDoc.data() });
            }
          }
        }
  
        setTablasCreadas(creadas);
        setTablasUnidas(unidas);
      } catch (err) {
        console.error("Error cargando tablas del usuario", err);
      }
    };
  
    obtenerTablasUsuario();
  }, [user]);

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
      const { name, value } = e.target;
    
      // Si es numérico, convertir a número en el estado
      if (["edad", "grado", "dni", "dni_tutor"].includes(name)) {
        setNuevoAlumno((prev) => ({ ...prev, [name]: value ? parseInt(value) : "" }));
      } else {
        setNuevoAlumno((prev) => ({ ...prev, [name]: value }));
      }
    };
    
    const handleAgregarAlumno = async (e) => {
      e.preventDefault();
    
      const alumnoConTabla = {
        ...nuevoAlumno,
        tablaId: id,
        edad: parseInt(nuevoAlumno.edad),
        grado: parseInt(nuevoAlumno.grado),
        dni: parseInt(nuevoAlumno.dni),
        dni_tutor: nuevoAlumno.dni_tutor ? parseInt(nuevoAlumno.dni_tutor) : null,
        asistencias: 0,
        inasistencias: 0,
      };
    
      try {
        await addDoc(collection(db, "alumnos"), alumnoConTabla);
        alert("Alumno agregado correctamente");
    
        // Limpiar formulario
        setNuevoAlumno({
          nombre: "", apellido: "", edad: "", escuela: "", grado: "", turno: "mañana",
          dni: "", grupo_familiar: "", tel_contacto: "", nombre_tutor: "", dni_tutor: "",
          asistencias: 0, inasistencias: 0, profesionales: "",
          observaciones: "", fechaNacimiento: "", direccion: ""
        });
        setMostrarFormulario(false);
    
        // Actualizar la lista
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
      if (!alumno) return;
    
      const nuevoValor = {
        asistencias: alumno.asistencias + (tipo === "asistencia" ? 1 : 0),
        inasistencias: alumno.inasistencias + (tipo === "inasistencia" ? 1 : 0)
      };
    
      const total = nuevoValor.asistencias + nuevoValor.inasistencias;
      const porcentaje_asistencia = total ? ((nuevoValor.asistencias / total) * 100).toFixed(2) : 0;
    
      try {
        // 1. Actualizamos los contadores en el documento del alumno
        await updateDoc(doc(db, "alumnos", idAlumno), nuevoValor);
    
        // 2. Registramos la asistencia o inasistencia con la fecha actual en la subcolección
        const asistenciasRef = collection(db, "alumnos", idAlumno, "asistencias_por_dia");
        await addDoc(asistenciasRef, {
          fecha: new Date(), // guardamos fecha actual
          tipo: tipo // "asistencia" o "inasistencia"
        });
    
        // 3. Actualizamos el estado local
        setAlumnos(alumnos.map((a) =>
          a.id === idAlumno
            ? { ...a, ...nuevoValor, porcentaje_asistencia }
            : a
        ));
      } catch (error) {
        console.error("Error actualizando asistencia:", error);
        alert("Hubo un error registrando la asistencia.");
      }
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

  const exportarAlumnosAExcel = () => {
    const data = alumnos.map((alumno) => ({
      "Nombre": alumno.nombre || "",
      "Apellido": alumno.apellido || "",
      "Edad": alumno.edad || "",
      "DNI": alumno.dni || "",
      "Escuela": alumno.escuela || "",
      "Grado": alumno.grado || "",
      "Turno": alumno.turno || "",
      "Grupo Familiar": alumno.grupo_familiar || "",
      "Teléfono de Contacto": alumno.tel_contacto || "",
      "Nombre del Tutor": alumno.nombre_tutor || "",
      "DNI del Tutor": alumno.dni_tutor || "",
      "Fecha de Nacimiento": alumno.fechaNacimiento || "",
      "Dirección": alumno.direccion || "",
      "Días por Semana": alumno.dias_por_semana || "",
      "Asistencias": alumno.asistencias || 0,
      "Inasistencias": alumno.inasistencias || 0,
      "Profesionales": alumno.profesionales || "",
      "Observaciones": alumno.observaciones || "",
      "Porcentaje de Asistencia": alumno.porcentaje_asistencia + "%" || "0%",
    }));
  
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Alumnos");
  
    const nombreArchivo = `alumnos_${`${tabla?.escuela}_turno_${tabla?.turno}`||`tabla`}.xlsx`;
    XLSX.writeFile(workbook, nombreArchivo);
  };

  
  if (loading || !tabla || (user && rolUsuario === null && !esDueño)) {
    return <div className="text-center mt-5">Cargando permisos...</div>;
  }

  return (
    <>
      <NavBar
        nombreTablaActual={`${tabla?.escuela} (${tabla?.turno})`}
        tablasCreadas={tablasCreadas}
        tablasUnidas={tablasUnidas}
        onSeleccionarTabla={handleSeleccionarTabla}
        onCerrarSesion={handleLogout}
      />
  
      {esDueño && (
        <div className="container mt-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Administración de miembros</h5>
            <button
              className={`btn ${mostrarAdministracion ? "btn-outline-danger" : "btn-outline-primary"}`}
              onClick={() => setMostrarAdministracion(!mostrarAdministracion)}
            >
              {mostrarAdministracion ? "Ocultar" : "Mostrar"}
            </button>
          </div>
  
          {mostrarAdministracion && (
            <div className="card mt-3">
              <div className="card-body">
                <AdministrarMiembros tablaId={id} esDueño={esDueño} />
              </div>
            </div>
          )}
        </div>
      )}
  
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
              <th className="d-none d-md-table-cell">Edad</th>
              <th className="d-none d-md-table-cell" onClick={() => setOrdenAsc(!ordenAsc)} style={{ cursor: "pointer" }}>
                Escuela {ordenAsc ? "▲" : "▼"}
              </th>
              <th>
                <span className="d-none d-sm-inline">Asistencias</span>
                <span className="d-inline d-sm-none">Asist</span>
              </th>
              <th>
                <span className="d-none d-sm-inline">Inasistencias</span>
                <span className="d-inline d-sm-none">Inasist</span>
              </th>
              <th>
                <span className="d-none d-sm-inline">% Asistencia</span>
                <span className="d-inline d-sm-none">%</span>
              </th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {alumnosFiltrados.map((alumno) => (
              <>
                <tr key={alumno.id}>
                  <td>
                    <button
                      className="btn btn-link p-0"
                      onClick={() => setAlumnoExpandido(alumno.id === alumnoExpandido ? null : alumno.id)}
                    >
                      {alumno.nombre}
                    </button>
                  </td>
                  <td>{alumno.apellido}</td>
                  <td className="d-none d-md-table-cell">{alumno.edad}</td>
                  <td className="d-none d-md-table-cell">{alumno.escuela}</td>
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
                        <button
                          className="btn-close"
                          onClick={() => setAlumnoExpandido(null)}
                        ></button>
                        {[
                          "dni", "grupo_familiar", "tel_contacto",
                          "nombre_tutor", "dni_tutor", "profesionales",
                          "observaciones", "fechaNacimiento", "direccion"
                        ].map((campo) => (
                          <div key={campo} className="mb-2">
                            <strong>{campo.replaceAll("_", " ")}:</strong>
                            <input
                              className="form-control"
                              value={alumno[campo] || ""}
                              onChange={(e) =>
                                handleCampoExpandido(alumno.id, campo, e.target.value)
                              }
                              readOnly={!esEditor}
                            />
                          </div>
                        ))}
                        {esEditor && (
                          <button
                            className="btn btn-primary mt-2"
                            onClick={() => guardarCambiosAlumno(alumno)}
                          >
                            Guardar cambios
                          </button>
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
            <button
              className="btn btn-secondary my-3"
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
            >
              {mostrarFormulario ? "Ocultar formulario" : "Agregar nuevo alumno"}
            </button>
  
            <button
              className="btn btn-success my-3 mx-2"
              onClick={exportarAlumnosAExcel}
            >
              Descargar Excel
            </button>
  
            {mostrarFormulario && (
              <form onSubmit={handleAgregarAlumno}>
                <div className="row">
                  {/* Inputs del formulario */}
                  {[
                    { label: "Nombre*", name: "nombre", type: "text" },
                    { label: "Apellido*", name: "apellido", type: "text" },
                    { label: "Edad*", name: "edad", type: "number", min: "1" },
                    { label: "Turno*", name: "turno", type: "select", options: ["mañana", "tarde", "noche"] },
                    { label: "Escuela", name: "escuela", type: "text" },
                    { label: "Grado*", name: "grado", type: "number", min: "1" },
                    { label: "DNI*", name: "dni", type: "number" },
                    { label: "Fecha de nacimiento*", name: "fechaNacimiento", type: "date" },
                    { label: "Teléfono de contacto", name: "tel_contacto", type: "tel" },
                    { label: "Grupo Familiar", name: "grupo_familiar", type: "text" },
                    { label: "Nombre Tutor", name: "nombre_tutor", type: "text" },
                    { label: "DNI Tutor", name: "dni_tutor", type: "number" },
                    { label: "Profesionales", name: "profesionales", type: "text" },
                    { label: "Observaciones", name: "observaciones", type: "text" },
                    { label: "Dirección", name: "direccion", type: "text" },
                  ].map(({ label, name, type, min, options }) => (
                    <div
                      key={name}
                      className={`col-md-${type === "text" || type === "tel" ? "4" : "6"} mb-2`}
                    >
                      <label>{label}</label>
                      {type === "select" ? (
                        <select
                          className="form-control"
                          name={name}
                          value={nuevoAlumno[name]}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Seleccione un turno</option>
                          {options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={type}
                          min={min}
                          className="form-control"
                          name={name}
                          value={nuevoAlumno[name]}
                          onChange={handleChange}
                          required={label.includes("*")}
                        />
                      )}
                    </div>
                  ))}
                </div>
  
                <button type="submit" className="btn btn-primary mt-3">
                  Agregar alumno
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </>
  );
  
}

export default TablaDetalle;
