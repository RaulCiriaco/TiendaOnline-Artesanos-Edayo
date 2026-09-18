import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { getImageUrl } from '../../api/axios';
import Loader from '../../components/common/Loader';
import Swal from 'sweetalert2';

const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await api.get(`/products/${id}`);
                setProduct(response.data);
            } catch (error) {
                console.error('Error al cargar producto:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const addToCart = () => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity = Math.min(existingItem.quantity + quantity, Number(product.stock));
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.images?.[0] || 'https://via.placeholder.com/60x60?text=Producto',
                quantity: Math.min(quantity, Number(product.stock)),
                entrepreneur_id: product.entrepreneur_id,
                entrepreneur_name: product.entrepreneur_name,
                entrepreneur_location: product.entrepreneur_location,
                entrepreneur_maps_url: product.entrepreneur_maps_url
            });
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        Swal.fire('¡Agregado!', `${product.name} agregado al carrito`, 'success');
    };

    if (loading) return <Loader />;
    if (!product) return <div className="container mt-5"><h2>Producto no encontrado</h2></div>;

    return (
        <div className="container page-shell">
            <Link to="/" className="text-decoration-none text-muted d-inline-flex align-items-center gap-2 mb-4 fw-semibold">
                <i className="bi bi-arrow-left"></i> Volver al catálogo de piezas
            </Link>

            <div className="product-detail-card">
                <div className="row g-5 align-items-center">
                    <div className="col-lg-6">
                        <div className="position-relative">
                            <img
                                src={getImageUrl(product.images?.[0]) || 'https://via.placeholder.com/500x500?text=Sin+Imagen'}
                                alt={product.name}
                                className="product-detail-img img-fluid"
                            />
                            <span className="badge-artisan" style={{ top: 16, left: 16 }}>
                                <i className="bi bi-stars text-warning me-1"></i> Creación Artesanal
                            </span>
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <span className="eyebrow mb-2">
                            <i className="bi bi-tag-fill"></i> {product.category_name || 'Diseño de Autor'}
                        </span>
                        <h1 className="mb-2">{product.name}</h1>
                        {product.entrepreneur_location && <div className="small text-muted mb-3"><i className="bi bi-geo-alt-fill text-danger me-1"></i>{product.entrepreneur_location}{product.entrepreneur_maps_url && <a className="ms-2" href={product.entrepreneur_maps_url} target="_blank" rel="noreferrer"><i className="bi bi-map me-1"></i>Ver mapa</a>}</div>}

                        <div className="d-flex align-items-baseline gap-2 mb-3">
                            <span className="price fs-2">${Number(product.price).toFixed(2)}</span>
                            <span className="text-muted fw-bold">MXN</span>
                        </div>

                        <div className="mb-3">
                            {Number(product.stock) > 0 ? (
                                <span className="badge-artisan-status status-delivered">
                                    <i className="bi bi-check-circle-fill text-success"></i> Disponible en taller ({product.stock} unidades)
                                </span>
                            ) : (
                                <span className="badge-artisan-status status-cancelled">
                                    <i className="bi bi-dash-circle-fill text-danger"></i> Agotado temporalmente
                                </span>
                            )}
                        </div>

                        <div className="artisan-box d-flex align-items-center justify-content-between flex-wrap gap-2">
                            <div className="d-flex align-items-center gap-3">
                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--artisan-sage)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '1.2rem' }}>
                                    <i className="bi bi-person-heart"></i>
                                </div>
                                <div>
                                    <small className="text-muted d-block">Taller Artesano</small>
                                    <strong className="text-dark">{product.entrepreneur_name || 'Artesano de la comunidad'}</strong>
                                </div>
                            </div>
                            {product.entrepreneur_id && (
                                <Link to={`/entrepreneur/${product.entrepreneur_id}`} className="btn btn-outline-primary btn-sm">
                                    <i className="bi bi-shop"></i> Ver Taller
                                </Link>
                            )}
                        </div>

                        <div className="mb-4">
                            <h6 className="fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.05em', fontSize: '0.8rem' }}>Historia y Detalles</h6>
                            <p className="lead fs-6 text-muted" style={{ lineHeight: 1.7 }}>
                                {product.description || 'Cada una de nuestras piezas es fabricada con dedicación, cuidando cada puntada y detalle característico del trabajo artesanal.'}
                            </p>
                        </div>

                        <div className="d-flex align-items-center gap-3 pt-3 border-top mb-4">
                            <div className="d-flex align-items-center border rounded p-1 bg-light">
                                <button
                                    className="btn btn-sm btn-link text-dark text-decoration-none px-2 py-0 fs-5"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    disabled={quantity <= 1 || Number(product.stock) === 0}
                                >
                                    -
                                </button>
                                <span className="px-3 fw-bold">{quantity}</span>
                                <button
                                    className="btn btn-sm btn-link text-dark text-decoration-none px-2 py-0 fs-5"
                                    onClick={() => setQuantity(Math.min(Number(product.stock), quantity + 1))}
                                    disabled={quantity >= Number(product.stock) || Number(product.stock) === 0}
                                >
                                    +
                                </button>
                            </div>
                            <button
                                className="btn btn-primary flex-grow-1 py-2"
                                onClick={addToCart}
                                disabled={Number(product.stock) === 0}
                            >
                                <i className="bi bi-cart-plus-fill fs-5"></i>
                                {Number(product.stock) === 0 ? 'Sin existencias' : 'Agregar al carrito'}
                            </button>
                        </div>

                        <div className="d-flex flex-column gap-2 border-top pt-3">
                            <div className="trust-badge-item">
                                <i className="bi bi-flower1"></i>
                                <span>Elaborado a mano con técnicas artesanales</span>
                            </div>
                            <div className="trust-badge-item">
                                <i className="bi bi-shop"></i>
                                <span>Retiro y pago físico seguro en la tienda oficial EDAYO</span>
                            </div>
                            <div className="trust-badge-item">
                                <i className="bi bi-heart-fill"></i>
                                <span>Tu compra apoya de forma íntegra a familias artesanas</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;