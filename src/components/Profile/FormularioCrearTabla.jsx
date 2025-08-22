import React from 'react';

const FormularioCrearTabla = ({
    mostrarFormulario,
    setMostrarFormulario,
    formTabla,
    handleChangeTabla,
    handleCrearTabla
}) => {
    return (
        <>
        <div className="d-flex flex-wrap gap-2 my-3">
            <button
            className="btn btn-primary"
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            >
            {mostrarFormulario ? "Ocultar formulario" : "Crear nueva tabla"}
            </button>
        </div>

        <div className={`collapse ${mostrarFormulario ? "show" : ""}`}>
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
    );
};

export default FormularioCrearTabla;
