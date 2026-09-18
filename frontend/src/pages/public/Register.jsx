import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await register(name, email, password);
        setLoading(false);
        if (result.success) {
            navigate('/login');
        }
    };

    return (
        <div className="container auth-page">
            <div className="card auth-card shadow-lg">
                <div style={{ width: 50, height: 50, borderRadius: '12px', background: 'linear-gradient(135deg, var(--artisan-sage), var(--artisan-amber))', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '1.5rem', marginBottom: '1rem' }}>
                    <i className="bi bi-people-fill"></i>
                </div>
                <span className="eyebrow">
                    <i className="bi bi-stars"></i> Comunidad Artesanal
                </span>
                <h1 className="mb-2">Crea tu Cuenta</h1>
                <p className="lead">Únete a la comunidad para comprar piezas y publicar tus propias creaciones desde una misma cuenta.</p>
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Nombre completo o de tu Taller</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0 text-muted">
                                <i className="bi bi-person"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0 ps-0"
                                placeholder="Ej. Taller María / Juan Pérez"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Correo electrónico</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0 text-muted">
                                <i className="bi bi-envelope"></i>
                            </span>
                            <input
                                type="email"
                                className="form-control border-start-0 ps-0"
                                placeholder="tu_correo@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Contraseña</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0 text-muted">
                                <i className="bi bi-lock"></i>
                            </span>
                            <input
                                type="password"
                                className="form-control border-start-0 ps-0"
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary w-100 py-2 fs-6" disabled={loading}>
                        <i className="bi bi-person-check-fill"></i>
                        {loading ? 'Creando cuenta...' : 'Registrarme en la Comunidad'}
                    </button>
                </form>
                
                <p className="text-center mt-4 text-muted mb-0 small">
                    ¿Ya eres parte de nuestra comunidad? <Link to="/login" className="fw-bold text-decoration-none" style={{ color: 'var(--artisan-terracotta)' }}>Inicia sesión aquí</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;