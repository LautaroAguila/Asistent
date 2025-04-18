import { useParams, useNavigate} from "react-router-dom";
import { db } from "../FireBase/firebaseConfig";
import { getDoc, doc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";


const AlumnoDetalle = () => {
    const { id } = useParams();
    const [alumno, setAlumno] = useState(null);
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            navigate("/");
        }
    }, [user, loading, navigate]);

    useEffect(() => {
        const fetchAlumno = async () => {
        const alumnoRef = doc(db, "alumnos", id);
        const alumnoSnap = await getDoc(alumnoRef);
        if (alumnoSnap.exists()) {
            setAlumno({ id: alumnoSnap.id, ...alumnoSnap.data() });
        }
        };
        fetchAlumno();
    }, [id]);

    const handleChange = (e) => {
        setAlumno({ ...alumno, [e.target.name]: e.target.value });
    };

    const handleGuardar = async () => {
        const alumnoRef = doc(db, "alumnos", id);
        await updateDoc(alumnoRef, {
        ...alumno,
        edad: Number(alumno.edad),
        asistencias: Number(alumno.asistencias),
        inasistencias: Number(alumno.inasistencias),
        porcentaje_asistencia: calcularPorcentaje(alumno.asistencias, alumno.inasistencias),
        });
        alert("Datos actualizados");
    };

    const calcularPorcentaje = (asis, inas) => {
        const total = Number(asis) + Number(inas);
        return total === 0 ? 0 : Math.round((asis / total) * 100);
    };

    if (!alumno) return <p>Cargando...</p>;

    return (
        <div className="container mt-4">
        <h3>Editar alumno: {alumno.nombre} {alumno.apellido}</h3>
        <div className="row">
            {Object.entries(alumno).map(([key, value]) => {
            if (key === "id" || key === "tablaId") return null;
            return (
                <div className="col-md-4 mb-2" key={key}>
                <label className="form-label text-capitalize">{key.replaceAll("_", " ")}</label>
                <input className="form-control" name={key} value={value} onChange={handleChange} />
                </div>
            );
            })}
        </div>
        <button className="btn btn-primary mt-3" onClick={handleGuardar}>Guardar</button>
        </div>
    );
};

export default AlumnoDetalle;
