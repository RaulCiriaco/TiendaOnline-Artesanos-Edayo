import React from 'react';

const Footer = () => {
    return (
        <footer>
            <div className="container text-center">
                <div className="footer-crest d-flex align-items-center justify-content-center gap-2">
                    <i className="bi bi-flower1" style={{ color: 'var(--artisan-amber)' }}></i>
                    <span>Taller de Emprendedores y Artesanos EDAYO</span>
                </div>
                <p className="mb-3">
                    Plataforma comunitaria de comercio justo impulsando el talento, la confección textil y la artesanía de Jilotepec, Estado de México.
                </p>
                <div className="d-flex justify-content-center flex-wrap gap-2 mb-4">
                    <span className="footer-badge">
                        <i className="bi bi-shield-check text-success"></i> Pago Seguro en Tienda
                    </span>
                    <span className="footer-badge">
                        <i className="bi bi-heart-fill text-danger"></i> 100% Manos Locales
                    </span>
                    <span className="footer-badge">
                        <i className="bi bi-geo-alt text-warning"></i> Jilotepec, Edo. Méx.
                    </span>
                </div>
                <div className="pt-3 border-top border-secondary border-opacity-25" style={{ fontSize: '0.82rem', color: '#90867d' }}>
                    &copy; {new Date().getFullYear()} Escuela de Artes y Oficios (EDAYO). Todos los derechos reservados a sus artesanos.
                </div>
            </div>
        </footer>
    );
};

export default Footer;