import React from 'react';

const Loader = () => {
    return (
        <div className="d-flex flex-column justify-content-center align-items-center py-5" style={{ minHeight: '260px' }}>
            <div className="spinner-border" style={{ width: '3rem', height: '3rem', color: 'var(--artisan-terracotta)' }} role="status">
                <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-3 text-muted" style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                <i className="bi bi-stars me-1 text-warning"></i> Preparando creaciones del taller...
            </p>
        </div>
    );
};

export default Loader;