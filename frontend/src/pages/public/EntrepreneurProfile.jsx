import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/axios';
import Loader from '../../components/common/Loader';

const EntrepreneurProfile = () => {
    const { id } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/entrepreneurs/${id}`)
            .then((response) => setProfile(response.data))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <Loader />;
    if (!profile) return <div className="container mt-5"><h2>Empleador no encontrado</h2></div>;

    return (
        <div className="container page-shell">
            <Link to="/" className="text-decoration-none text-muted d-inline-flex align-items-center gap-2 mb-4 fw-semibold">
                <i className="bi bi-arrow-left"></i> Volver a la tienda general
            </Link>

            <div className="profile-banner">
                <div className="d-flex flex-column flex-md-row align-items-center gap-4 text-center text-md-start">
                    <img
                        src={profile.profile_image || 'https://via.placeholder.com/130?text=Taller'}
                        alt={profile.name}
                        className="profile-avatar-lg"
                    />
                    <div className="flex-grow-1">
                        <span className="eyebrow bg-dark text-warning border-warning border-opacity-25 mb-2">
                            <i className="bi bi-patch-check-fill"></i> Taller Artesanal Afiliado
                        </span>
                        <h1 className="text-white mb-2">{profile.name}</h1>
                        <p className="mb-2 text-white-50 d-flex align-items-center justify-content-center justify-content-md-start gap-2">
                            <i className="bi bi-geo-alt-fill text-warning"></i>
                            <span>{profile.location || 'Jilotepec, Estado de México'}</span>
                        </p>
                        {profile.maps_url && <a className="btn btn-sm btn-light mb-3" href={profile.maps_url} target="_blank" rel="noreferrer"><i className="bi bi-map me-1"></i> Ver ubicación en Google Maps</a>}
                        <p className="mb-3 lead fs-6 text-light opacity-90" style={{ maxWidth: '650px' }}>
                            "{profile.bio || 'Artesano comprometido con la preservación de técnicas tradicionales y la confección con identidad propia en el taller de EDAYO.'}"
                        </p>
                        <div>
                            <span className="badge bg-white bg-opacity-10 text-white border border-white border-opacity-25 px-3 py-2" style={{ borderRadius: 'var(--radius-pill)' }}>
                                <i className="bi bi-palette-fill text-warning me-1"></i> {profile.products?.length || 0} creaciones artesanales
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="d-flex justify-content-between align-items-end mb-4">
                <div>
                    <span className="eyebrow mb-1">Colección del Taller</span>
                    <h2 className="mb-0">Piezas Hechas por {profile.name}</h2>
                </div>
            </div>

            <div className="row g-4">
                {!profile.products || profile.products.length === 0 ? (
                    <div className="col-12">
                        <div className="card text-center p-5 shadow-sm">
                            <i className="bi bi-box2 display-4 text-muted mb-3 d-block"></i>
                            <h4>Este taller aún no cuenta con productos activos</h4>
                            <p className="text-muted">Pronto habrá nuevas piezas artesanales disponibles.</p>
                        </div>
                    </div>
                ) : (
                    profile.products.map((product) => (
                        <div className="col-lg-4 col-md-6" key={product.id}>
                            <div className="card h-100 product-card shadow-sm">
                                <div className="img-wrapper">
                                    <img
                                        src={product.images?.[0] || 'https://via.placeholder.com/300x200?text=Pieza+Artesanal'}
                                        className="card-img-top"
                                        alt={product.name}
                                    />
                                    <span className="badge-artisan">
                                        <i className="bi bi-stars text-warning me-1"></i> Creación Original
                                    </span>
                                </div>
                                <div className="card-body">
                                    <h5 className="card-title text-truncate">{product.name}</h5>
                                    <div className="mt-auto pt-2">
                                        <div className="price mb-3">${Number(product.price).toFixed(2)} <span style={{ fontSize: '0.75rem', color: 'var(--artisan-ink-muted)' }}>MXN</span></div>
                                        <Link to={`/product/${product.id}`} className="btn btn-primary w-100 btn-sm">
                                            <i className="bi bi-eye"></i> Ver Pieza
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default EntrepreneurProfile;
