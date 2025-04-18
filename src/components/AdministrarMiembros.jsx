// src/components/AdministrarMiembros.jsx
import { useEffect, useState } from "react";
import { db } from "../FireBase/firebaseConfig";
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";

const AdministrarMiembros = ({ tablaId, esDueño }) => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [miembrosAceptados, setMiembrosAceptados] = useState([]);

    const obtenerSolicitudes = async () => {
        const q = query(
        collection(db, "miembros_tabla"),
        where("tablaId", "==", tablaId),
        where("estado", "==", "pendiente")
        );
        const snap = await getDocs(q);
        setSolicitudes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const manejarRespuesta = async (idMiembro, accion) => {
        const ref = doc(db, "miembros_tabla", idMiembro);
        if (accion === "aceptar") {
            await updateDoc(ref, { estado: "aceptado", rol: "lector" });
        } else if (accion === "rechazar") {
        await deleteDoc(ref);
        }
        obtenerSolicitudes();
    };

    const obtenerMiembrosAceptados = async () => {
        const q = query(
            collection(db, "miembros_tabla"),
            where("tablaId", "==", tablaId),
            where("estado", "==", "aceptado")
        );
        const snap = await getDocs(q);
        setMiembrosAceptados(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    
    const cambiarRol = async (idMiembro, nuevoRol) => {
        const ref = doc(db, "miembros_tabla", idMiembro);
        await updateDoc(ref, { rol: nuevoRol });
        obtenerMiembrosAceptados();
    };
    
    useEffect(() => {
        if (esDueño) {
            obtenerSolicitudes();
            obtenerMiembrosAceptados();
        }
    }, [tablaId, esDueño]);

    if (!esDueño) return null;

    return (
        <div className="mt-4">
        <h5>Solicitudes de ingreso</h5>
        {solicitudes.length === 0 ? (
            <p>No hay solicitudes pendientes.</p>
        ) : (
            <ul className="list-group">
            {solicitudes.map((miembro) => (
                <li key={miembro.id} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    {miembro.nombreUsuario} - CUIL: {miembro.cuil}
                </div>
                <div>
                    <button
                    className="btn btn-sm btn-success me-2"
                    onClick={() => manejarRespuesta(miembro.id, "aceptar")}
                    >
                    Aceptar
                    </button>
                    <button
                    className="btn btn-sm btn-danger"
                    onClick={() => manejarRespuesta(miembro.id, "rechazar")}
                    >
                    Rechazar
                    </button>
                </div>
                </li>
            ))}
            </ul>
        )}
        <div className="mt-4">
            <h5>Miembros aceptados</h5>
            {miembrosAceptados.length === 0 ? (
                <p>No hay miembros aceptados aún.</p>
            ) : (
                <ul className="list-group">
                {miembrosAceptados.map((miembro) => (
                    <li key={miembro.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            {miembro.nombreUsuario} - CUIL: {miembro.cuil}
                        </div>
                        <div>
                            <select
                                className="form-select form-select-sm"
                                value={miembro.rol || "lector"}
                                onChange={(e) => cambiarRol(miembro.id, e.target.value)}
                            >
                                <option value="lector">Lector</option>
                                <option value="editor">Editor</option>
                            </select>
                        </div>
                    </li>
                ))}
                </ul>
            )}
        </div>

        </div>
    );
};

export default AdministrarMiembros;
