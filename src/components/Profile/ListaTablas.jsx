import React from 'react';
import { Link } from "react-router-dom";

const ListaTablas = ({ tablas, tipo, verTabla, eliminarTabla }) => {
    return (
        <>
        <h5>{tipo === 'creadas' ? 'Tablas creadas' : 'Tablas unidas'}</h5>
        <ul className="list-group mb-4">
            {tablas.length === 0 ? (
            <li className="list-group-item">No tienes tablas {tipo === 'creadas' ? 'creadas' : 'unidas'}.</li>
            ) : (
            tablas.map(tabla => (
                <li key={tabla.id} className="list-group-item d-flex justify-content-between align-items-center">
                <span>{tabla.escuela} ({tabla.turno})</span>
                <div className="d-flex gap-2">
                    <Link 
                        to={`/tabla/${tabla.id}`} 
                        className="btn btn-sm btn-outline-primary" 
                        title="Ver tabla"
                        >
                        <i className="bi bi-eye"></i>
                        </Link>
                    <button
                    className="btn btn-sm btn-outline-danger"
                    title={tipo === 'creadas' ? "Eliminar tabla" : "Desvincular tabla"}
                    onClick={() => {
                        if (window.confirm('¿Estás seguro?')) eliminarTabla(tabla.id);
                    }}
                    >
                    <i className="bi bi-trash"></i>
                    </button>
                </div>
                </li>
            ))
            )}
        </ul>
        </>
    );
};

export default ListaTablas;
