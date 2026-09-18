import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [adminMenuOpen, setAdminMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
        setMobileMenuOpen(false);
    };

    const closeMobileMenu = () => setMobileMenuOpen(false);

    return (
        <nav className="navbar navbar-expand-lg navbar-dark shadow-sm">
            <div className="container">
                <Link className="navbar-brand" to="/">
                    <span className="brand-badge">
                        <i className="bi bi-flower1"></i>
                    </span>
                    <span>Taller de Emprendedores</span>
                    <span className="badge text-uppercase ms-1" style={{ fontSize: '0.65rem', background: '#d97706', color: '#1f1b18' }}>EDAYO</span>
                </Link>
                <button
                    className="navbar-toggler"
                    type="button"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-controls="navbarNav"
                    aria-expanded={mobileMenuOpen}
                    aria-label="Abrir navegacion"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className={`navbar-collapse${mobileMenuOpen ? ' is-open' : ''}`} id="navbarNav">
                    <ul className="navbar-nav ms-auto align-items-center gap-1">
                        <li className="nav-item">
                            <Link className="nav-link" to="/" onClick={closeMobileMenu}>
                                <i className="bi bi-shop"></i> Inicio
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/cart" onClick={closeMobileMenu}>
                                <i className="bi bi-cart3"></i> Carrito
                            </Link>
                        </li>
                        {user && user.role !== 'admin' && (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/clientes/orders" onClick={closeMobileMenu}>
                                        <i className="bi bi-box2-heart"></i> Mis compras
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/mis-productos" onClick={closeMobileMenu}>
                                        <i className="bi bi-palette"></i> Mis productos
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/mis-ventas" onClick={closeMobileMenu}>
                                        <i className="bi bi-clipboard-check"></i> Mis ventas
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/mi-perfil" onClick={closeMobileMenu}>
                                        <i className="bi bi-person-circle"></i> Mi perfil
                                    </Link>
                                </li>
                            </>
                        )}
                        {user ? (
                            <>
                                {(user.role === 'admin' || user.role === 'empleador') && (
                                    <li className={`nav-item dropdown${adminMenuOpen ? ' show' : ''}`}>
                                        <button 
                                            className="nav-link dropdown-toggle btn btn-link" 
                                            type="button" 
                                            onClick={() => setAdminMenuOpen(!adminMenuOpen)} 
                                            aria-expanded={adminMenuOpen}
                                        >
                                            <i className="bi bi-briefcase"></i> {user.role === 'empleador' ? 'Mi Taller' : 'Administración'}
                                        </button>
                                        <ul className={`dropdown-menu dropdown-menu-end${adminMenuOpen ? ' show' : ''}`}>
                                            <li>
                                                <Link onClick={() => setAdminMenuOpen(false)} className="dropdown-item" to={user.role === 'empleador' ? '/emprendedor/dashboard' : '/admin/dashboard'}>
                                                    <i className="bi bi-speedometer2 text-primary"></i> Panel Principal
                                                </Link>
                                            </li>
                                            <li>
                                                <Link onClick={() => setAdminMenuOpen(false)} className="dropdown-item" to={user.role === 'empleador' ? '/emprendedor/products' : '/admin/products'}>
                                                    <i className="bi bi-palette text-success"></i> Catálogo de Productos
                                                </Link>
                                            </li>
                                            <li>
                                                <Link onClick={() => setAdminMenuOpen(false)} className="dropdown-item" to={user.role === 'empleador' ? '/emprendedor/orders' : '/admin/orders'}>
                                                    <i className="bi bi-clipboard-check text-warning"></i> Pedidos Recibidos
                                                </Link>
                                            </li>
                                            {user.role === 'empleador' && (
                                                <li>
                                                    <Link onClick={() => setAdminMenuOpen(false)} className="dropdown-item" to="/admin/profile">
                                                        <i className="bi bi-person-badge text-info"></i> Mi Perfil Artesanal
                                                    </Link>
                                                </li>
                                            )}
                                            {user.role === 'admin' && (
                                                <>
                                                    <li><hr className="dropdown-divider my-1" /></li>
                                                    <li>
                                                        <Link onClick={() => setAdminMenuOpen(false)} className="dropdown-item" to="/admin/users">
                                                            <i className="bi bi-people"></i> Gestión de Usuarios
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link onClick={() => setAdminMenuOpen(false)} className="dropdown-item" to="/admin/reports">
                                                            <i className="bi bi-graph-up"></i> Reportes Generales
                                                        </Link>
                                                    </li>
                                                </>
                                            )}
                                            {user.role === 'empleador' && (
                                                <li>
                                                    <Link onClick={() => setAdminMenuOpen(false)} className="dropdown-item" to="/emprendedor/reports">
                                                        <i className="bi bi-graph-up text-secondary"></i> Estadísticas y Reportes
                                                    </Link>
                                                </li>
                                            )}
                                        </ul>
                                    </li>
                                )}
                                <li className="nav-item ms-lg-2">
                                    <span className="user-chip">
                                        <i className="bi bi-person-circle"></i> {user.name}
                                    </span>
                                </li>
                                <li className="nav-item">
                                    <button className="btn btn-outline-light btn-sm ms-lg-1" onClick={handleLogout} title="Cerrar Sesión">
                                        <i className="bi bi-box-arrow-right"></i> Salir
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item ms-lg-2">
                                    <Link className="nav-link" to="/login" onClick={closeMobileMenu}>
                                        <i className="bi bi-box-arrow-in-right"></i> Iniciar Sesión
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="btn btn-sm btn-primary ms-lg-2" to="/register" onClick={closeMobileMenu} style={{ borderRadius: 'var(--radius-pill)', padding: '0.45rem 1rem' }}>
                                        <i className="bi bi-person-plus"></i> Registrarse
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
