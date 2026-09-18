import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async ({ credential }) => {
                const result = await loginWithGoogle(credential);
                if (result.success) navigate('/');
            }
        });
        window.google.accounts.id.renderButton(document.getElementById('google-login'), {
            theme: 'outline', size: 'large', width: 360, text: 'continue_with'
        });
    }, [loginWithGoogle, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await login(email, password);
        setLoading(false);
        if (result.success) {
            navigate('/');
        }
    };

    return (
        <div className="container auth-page">
            <div className="card auth-card shadow-lg">
                <div style={{ width: 50, height: 50, borderRadius: '12px', background: 'linear-gradient(135deg, var(--artisan-terracotta), var(--artisan-amber))', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '1.5rem', marginBottom: '1rem' }}>
                    <i className="bi bi-flower1"></i>
                </div>
                <span className="eyebrow">
                    <i className="bi bi-door-open"></i> Portal de Acceso
                </span>
                <h1 className="mb-2">Bienvenido de vuelta</h1>
                <p className="lead">Ingresa a tu cuenta para administrar tu taller o continuar adquiriendo piezas de nuestros artesanos.</p>
                
                <form onSubmit={handleSubmit}>
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
                    <div className="mb-4">
                        <label className="form-label">Contraseña</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0 text-muted">
                                <i className="bi bi-lock"></i>
                            </span>
                            <input
                                type="password"
                                className="form-control border-start-0 ps-0"
                                placeholder="Tu contraseña secreta"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary w-100 py-2 fs-6" disabled={loading}>
                        <i className="bi bi-box-arrow-in-right"></i>
                        {loading ? 'Accediendo al taller...' : 'Iniciar Sesión'}
                    </button>
                </form>

                {import.meta.env.VITE_GOOGLE_CLIENT_ID && <>
                    <div className="text-center text-muted small my-3">o continúa con</div>
                    <div id="google-login" className="d-flex justify-content-center"></div>
                </>}
                
                <p className="text-center mt-4 text-muted mb-0 small">
                    ¿Nuevo en la comunidad? <Link to="/register" className="fw-bold text-decoration-none" style={{ color: 'var(--artisan-terracotta)' }}>Abre tu cuenta aquí</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;