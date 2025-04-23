import React from "react";
import { Navbar, Nav, NavDropdown, Container, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const NavBar = ({ nombreTablaActual, tablasCreadas, tablasUnidas, onSeleccionarTabla, onCerrarSesion }) => {
    const navigate = useNavigate();

    return (
        <Navbar bg="light" expand="lg" className="mb-4 shadow-sm">
        <Container fluid>
            {/* Título centrado */}
            <Navbar.Brand className="mx-auto order-1 order-lg-2 text-center">
            {nombreTablaActual || "Sistema de Asistencias"}
            </Navbar.Brand>

            {/* Toggle para dispositivos móviles */}
            <Navbar.Toggle aria-controls="navbar-nav" className="order-2 order-lg-1" />

            <Navbar.Collapse id="navbar-nav" className="order-3 order-lg-3 ms-4">
            <Nav className="me-auto">
                <NavDropdown title="Mis Tablas" id="dropdown-tablas">
                <NavDropdown.Header>Tablas Creadas</NavDropdown.Header>
                {tablasCreadas.length > 0 ? (
                    tablasCreadas.map((tabla) => (
                    <NavDropdown.Item key={tabla.id} onClick={() => onSeleccionarTabla(tabla.id)}>
                        {tabla.escuela} ({tabla.turno})
                    </NavDropdown.Item>
                    ))
                ) : (
                    <NavDropdown.Item disabled>No hay creadas</NavDropdown.Item>
                )}

                <NavDropdown.Divider />
                <NavDropdown.Header>Tablas Unidas</NavDropdown.Header>
                {tablasUnidas.length > 0 ? (
                    tablasUnidas.map((tabla) => (
                    <NavDropdown.Item key={tabla.id} onClick={() => onSeleccionarTabla(tabla.id)}>
                        {tabla.escuela} ({tabla.turno})
                    </NavDropdown.Item>
                    ))
                ) : (
                    <NavDropdown.Item disabled>No hay unidas</NavDropdown.Item>
                )}
                </NavDropdown>
            </Nav>

            <Nav className="ms-auto">
                <Button variant="outline-primary" className="me-2" onClick={() => navigate("/profile")}>
                Ir al Perfil
                </Button>
                <Button variant="outline-danger" onClick={onCerrarSesion}>
                Cerrar Sesión
                </Button>
            </Nav>
            </Navbar.Collapse>
        </Container>
        </Navbar>
    );
};

export default NavBar;
