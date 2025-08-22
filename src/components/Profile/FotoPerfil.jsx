import React from 'react';

const FotoPerfil = ({ userData, handleImagenCambio, subiendoImagen }) => {
    return (
        <div className="text-center">
        {userData?.fotoPerfil && (
            <img
            src={userData.fotoPerfil}
            alt="Foto de perfil"
            className="img-fluid rounded-circle mb-3"
            style={{ width: "120px", height: "120px", objectFit: "cover" }}
            />
        )}
        <div className="mb-3">
            <label htmlFor="imagenPerfil" className="form-label">Cambiar foto</label>
            <input
            type="file"
            accept="image/*"
            className="form-control"
            id="imagenPerfil"
            onChange={handleImagenCambio}
            disabled={subiendoImagen}
            />
            {subiendoImagen && <small>Subiendo imagen...</small>}
        </div>
        </div>
    );
};

export default FotoPerfil;
