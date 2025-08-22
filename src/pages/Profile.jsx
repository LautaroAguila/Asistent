import { useEffect, useState } from "react";
import { auth, db } from "../FireBase/firebaseConfig";
import { signOut, onAuthStateChanged} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {doc,getDoc,addDoc,collection,query,where,getDocs,updateDoc,deleteDoc } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import FotoPerfil from '../components/Profile/FotoPerfil';
import FormularioCrearTabla from "../components/Profile/FormularioCrearTabla";
import ListaTablas from "../components/Profile/ListaTablas";
import BuscadorTablaPrivada from "../components/Profile/BuscadorTablaPrivada";
import TablasPublicas from "../components/Profile/TablasPublicas";

function Profile() {
  const [userData, setUserData] = useState(null);
  const [tablasCreadas, setTablasCreadas] = useState([]);
  const [tablasUnidas, setTablasUnidas] = useState([]);
  const [tablasPublicas, setTablasPublicas] = useState([]);
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
  const { user } = useAuth();


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

  const handleEliminarTabla = async (tablaId) => {
    const confirmacion = window.confirm("¿Estás seguro de que querés eliminar esta tabla? Esta acción no se puede deshacer.");
    if (!confirmacion) return;
  
    try {
      // 1. Eliminar las referencias en la colección de miembros_tabla
      const q = query(collection(db, "miembros_tabla"), where("tablaId", "==", tablaId));
      const snap = await getDocs(q);
  
      // Eliminar cada documento relacionado en miembros_tabla
      for (const docu of snap.docs) {
        await deleteDoc(doc(db, "miembros_tabla", docu.id));
      }
  
      // 2. Eliminar la tabla en la colección principal
      await deleteDoc(doc(db, "tablas_asistencia", tablaId));
      
      // 3. Actualizar la lista local de tablas creadas
      setTablasCreadas(prev => prev.filter(tabla => tabla.id !== tablaId));
  
      alert("Tabla eliminada correctamente.");
    } catch (error) {
      console.error("Error al eliminar la tabla:", error);
      alert("Ocurrió un error al intentar eliminar la tabla.");
    }
  };
  
  const handleDesvincularTabla = async (tablaId) => {
    if (!user) return;
  
    const miembroSubRef = doc(db, "tablas", tablaId, "miembros", user.uid);
  
    try {
      // 1. Buscar el documento en miembros_tabla
      const q = query(
        collection(db, "miembros_tabla"),
        where("tablaId", "==", tablaId),
        where("usuarioId", "==", user.uid)
      );
      const snap = await getDocs(q);
  
      // 2. Eliminar documentos encontrados
      for (const docu of snap.docs) {
        await deleteDoc(doc(db, "miembros_tabla", docu.id));
      }
  
      // 3. Eliminar también de la subcolección (por si acaso)
      await deleteDoc(miembroSubRef);
  
      alert("Te desvinculaste correctamente de la tabla.");
      setTablasUnidas(prev => prev.filter(t => t.id !== tablaId));
    } catch (error) {
      console.error("Error al desvincularse:", error);
      alert("Ocurrió un error al desvincularse.");
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
    <div className="container py-5">
      <h2 className="mb-5 text-center">Perfil</h2>
      <div className="row">
        <div className="col-md-3">
          <FotoPerfil userData={userData} handleImagenCambio={handleImagenCambio} subiendoImagen={subiendoImagen} />
        </div>
        <div className="col-md-6 mb-4">
          {userData ? (
            <>
              <p><strong>Nombre:</strong> {userData.nombre}</p>
              <p><strong>Apellido:</strong> {userData.apellido}</p>
              <p><strong>CUIL:</strong> {userData.cuil}</p>
              <p><strong>Email:</strong> {userData.email}</p>
              <div className="d-flex flex-wrap gap-2 my-4">
                <button className="btn btn-danger" onClick={handleLogout}>Cerrar Sesión</button>
              </div>
              <FormularioCrearTabla
                mostrarFormulario={mostrarFormulario}
                setMostrarFormulario={setMostrarFormulario}
                formTabla={formTabla}
                handleChangeTabla={handleChangeTabla}
                handleCrearTabla={handleCrearTabla}
              />
            </>
          ) : (
            <p>Cargando datos...</p>
          )}
        </div>
        <div className="col-md-3">
          <ListaTablas tablas={tablasCreadas} tipo="creadas" verTabla href eliminarTabla={handleEliminarTabla} />
          <ListaTablas tablas={tablasUnidas} tipo="unidas" verTabla href eliminarTabla={handleDesvincularTabla} />
        </div>
      </div>
      <hr className="my-5" />
      <div className="row">
        <div className="col-md-6">
          <BuscadorTablaPrivada
            claveBusqueda={claveBusqueda}
            setClaveBusqueda={setClaveBusqueda}
            buscarTablaPrivada={buscarTablaPrivada}
            tablaPrivadaEncontrada={tablaPrivadaEncontrada}
            solicitarAcceso={solicitarAcceso}
          />
        </div>
        <div className="col-md-6">
          <TablasPublicas
            tablasPublicas={tablasPublicas}
            filtroPublicas={filtroPublicas}
            setFiltroPublicas={setFiltroPublicas}
            solicitarAcceso={solicitarAcceso}
          />
        </div>
      </div>
    </div>
  );
}

export default Profile;
