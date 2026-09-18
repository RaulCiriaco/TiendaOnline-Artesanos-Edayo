import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { getImageUrl } from '../../api/axios';
import Loader from '../../components/common/Loader';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await api.get('/products');
                setProducts(response.data);
            } catch (error) {
                console.error('Error al cargar productos:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    if (loading) return <Loader />;

    return (
        <>
            <section className="hero-shop">
                <div className="container">
                    <span className="eyebrow">
                        <i className="bi bi-patch-check-fill text-warning"></i> Hecho a mano • EDAYO Jilotepec
                    </span>
                    <h1>Historias tejidas con alma y dedicación.</h1>
                    <p>
                        Explora creaciones textiles y productos únicos elaborados por manos emprendedoras de nuestra comunidad. Cada pieza guarda una historia de esfuerzo y talento local.
                    </p>
                    <div className="hero-badges">
                        <span className="hero-badge-pill">
                            <i className="bi bi-flower1 text-warning"></i> 100% Confección Artesanal
                        </span>
                        <span className="hero-badge-pill">
                            <i className="bi bi-cash-coin text-warning"></i> Apoyo Directo al Productor
                        </span>
                        <span className="hero-badge-pill">
                            <i className="bi bi-shield-check text-warning"></i> Compra Comunitaria Segura
                        </span>
                    </div>
                </div>
            </section>

            <div className="container page-shell pt-0">
                <div className="catalog-intro d-flex flex-wrap justify-content-between align-items-end mb-4 gap-2">
                    <div>
                        <span className="eyebrow mb-1">Catálogo Exclusivo</span>
                        <h2 className="mb-0">Piezas Disponibles</h2>
                    </div>
                    <span className="badge bg-light text-secondary border px-3 py-2" style={{ borderRadius: 'var(--radius-pill)', fontWeight: 600 }}>
                        <i className="bi bi-grid-3x3-gap me-1 text-primary"></i> {products.length} productos en exhibición
                    </span>
                </div>

                <div className="row g-4">
                    {products.length === 0 ? (
                        <div className="col-12">
                            <div className="card text-center py-5">
                                <div className="card-body">
                                    <i className="bi bi-box2 display-3 text-muted mb-3 d-block"></i>
                                    <h4>No hay creaciones publicadas aún</h4>
                                    <p className="text-muted mb-3">Los artesanos están preparando nuevas piezas en sus talleres. Vuelve pronto.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        products.map((product) => (
                            <div className="col-lg-3 col-md-4 col-sm-6" key={product.id}>
                                <div className="card h-100 product-card shadow-sm">
                                    <div className="img-wrapper">
                                        <img
                                            src={getImageUrl(product.images?.[0]) || 'https://via.placeholder.com/300x200?text=Sin+Imagen'}
                                            className="card-img-top"
                                            alt={product.name}
                                        />
                                        <span className="badge-artisan">
                                            <i className="bi bi-stars me-1 text-warning"></i> Hecho a Mano
                                        </span>
                                    </div>
                                    <div className="card-body">
                                        <h5 className="card-title text-truncate" title={product.name}>{product.name}</h5>
                                        <p className="card-text text-truncate">{product.description || 'Pieza de diseño artesanal único.'}</p>
                                        
                                        <div className="mt-auto">
                                            <div className="price mb-1">${Number(product.price).toFixed(2)} <span style={{ fontSize: '0.75rem', color: 'var(--artisan-ink-muted)', fontWeight: 500 }}>MXN</span></div>
                                            
                                            <div className="seller-tag">
                                                <i className="bi bi-person-fill"></i>
                                                <span className="text-truncate">
                                                    Por {product.entrepreneur_name || 'Taller Artesanal'}
                                                </span>
                                            </div>

                                            <div className="d-flex flex-column gap-2">
                                                {product.entrepreneur_id && (
                                                    <Link to={`/entrepreneur/${product.entrepreneur_id}`} className="text-decoration-none small text-muted d-flex align-items-center gap-1">
                                                        <i className="bi bi-shop-window text-primary"></i> Conocer taller del artesano
                                                    </Link>
                                                )}
                                                <Link to={`/product/${product.id}`} className="btn btn-primary w-100 btn-sm">
                                                    <i className="bi bi-eye"></i> Ver Detalle
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default Home;