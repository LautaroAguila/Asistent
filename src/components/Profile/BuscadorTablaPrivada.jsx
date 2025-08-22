import React from 'react';

const BuscadorTablaPrivada = ({
    claveBusqueda,
    setClaveBusqueda,
    buscarTablaPrivada,
    tablaPrivadaEncontrada,
    solicitarAcceso
}) => {
    return (
        <>
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
        </>
    );
};

export default BuscadorTablaPrivada;
