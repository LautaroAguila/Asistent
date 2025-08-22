import React from 'react';

const TablasPublicas = ({ tablasPublicas, filtroPublicas, setFiltroPublicas, solicitarAcceso }) => {
    const tablasFiltradas = tablasPublicas.filter(tabla =>
        tabla.escuela.toLowerCase().includes(filtroPublicas.toLowerCase())
    );

    return (
        <>
        <h5>Tablas públicas disponibles</h5>
        <input
            type="text"
            className="form-control mb-3"
            placeholder="Buscar por nombre de escuela..."
            value={filtroPublicas}
            onChange={(e) => setFiltroPublicas(e.target.value)}
        />
        <ul className="list-group">
            {tablasFiltradas.length === 0 ? (
            <li className="list-group-item">No hay tablas públicas disponibles.</li>
            ) : (
            tablasFiltradas.map(tabla => (
                <li key={tabla.id} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <strong>{tabla.escuela}</strong> ({tabla.turno})
                </div>
                <button
                    className="btn btn-sm btn-success"
                    onClick={() => solicitarAcceso(tabla)}
                >
                    Solicitar acceso
                </button>
                </li>
            ))
            )}
        </ul>
        </>
    );
};

export default TablasPublicas;
