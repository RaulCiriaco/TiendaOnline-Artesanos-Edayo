import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl } from '../../api/axios';
import Swal from 'sweetalert2';

const Cart = () => {
    const [cart, setCart] = useState([]);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }
    }, []);

    const updateCart = (newCart) => {
        setCart(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
    };

    const removeItem = (productId) => {
        const newCart = cart.filter(item => item.id !== productId);
        updateCart(newCart);
        Swal.fire('Eliminado', 'Producto eliminado del carrito', 'info');
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity < 1) return;
        const newCart = cart.map(item =>
            item.id === productId ? { ...item, quantity } : item
        );
        updateCart(newCart);
    };

    const getTotal = () => {
        return cart.reduce((total, item) => total + (Number(item.price) * Number(item.quantity)), 0);
    };

    const handleCheckout = () => {
        if (!user) {
            Swal.fire('Inicia sesión', 'Debes iniciar sesión para continuar', 'warning');
            navigate('/login');
            return;
        }
        navigate('/checkout');
    };

    if (cart.length === 0) {
        return (
            <div className="container page-shell text-center py-5">
                <div className="card mx-auto p-5 shadow-sm" style={{ maxWidth: '520px' }}>
                    <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'var(--artisan-terracotta-light)', color: 'var(--artisan-terracotta)', display: 'grid', placeItems: 'center', fontSize: '2rem', margin: '0 auto 1.5rem' }}>
                        <i className="bi bi-bag-heart"></i>
                    </div>
                    <h2 className="mb-2">Tu bolsa está vacía</h2>
                    <p className="text-muted mb-4">
                        Aún no has agregado ninguna pieza de nuestros artesanos. Explora el catálogo y apoya el talento local.
                    </p>
                    <Link to="/" className="btn btn-primary">
                        <i className="bi bi-shop"></i> Explorar Creaciones
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container page-shell">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">
                        <i className="bi bi-bag-check"></i> Tu Selección
                    </span>
                    <h1>Bolsa de Compras</h1>
                    <p>Revisa las piezas artesanales seleccionadas antes de generar tu orden de compra.</p>
                </div>
                <Link to="/" className="btn btn-outline-secondary btn-sm">
                    <i className="bi bi-arrow-left"></i> Seguir explorando
                </Link>
            </div>

            <div className="row g-4">
                <div className="col-lg-8">
                    <div className="d-flex flex-column gap-3">
                        {cart.map((item) => (
                            <div className="card shadow-sm border" key={item.id}>
                                <div className="card-body d-flex align-items-center flex-wrap gap-3">
                                    <img
                                        src={getImageUrl(item.image) || 'https://via.placeholder.com/80x80?text=Producto'}
                                        alt={item.name}
                                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '12px' }}
                                        className="border"
                                    />
                                    <div className="flex-grow-1" style={{ minWidth: '180px' }}>
                                        <h5 className="mb-1">{item.name}</h5>
                                        <span className="text-muted small">${Number(item.price).toFixed(2)} MXN c/u</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="d-flex align-items-center border rounded p-1 bg-light">
                                            <button
                                                className="btn btn-sm btn-link text-dark text-decoration-none px-2 py-0"
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                            >
                                                -
                                            </button>
                                            <span className="px-2 fw-bold" style={{ minWidth: '24px', textAlign: 'center' }}>
                                                {item.quantity}
                                            </span>
                                            <button
                                                className="btn btn-sm btn-link text-dark text-decoration-none px-2 py-0"
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <div className="fw-bold fs-6 text-end" style={{ minWidth: '90px', color: 'var(--artisan-terracotta)' }}>
                                            ${(Number(item.price) * Number(item.quantity)).toFixed(2)}
                                        </div>
                                        <button
                                            className="btn btn-outline-danger btn-sm p-1 px-2 ms-2"
                                            onClick={() => removeItem(item.id)}
                                            title="Quitar pieza"
                                        >
                                            <i className="bi bi-trash3"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="card shadow-sm sticky-top" style={{ top: '2rem' }}>
                        <div className="card-body">
                            <h4 className="mb-3">Resumen de Compra</h4>
                            <hr className="my-2" />
                            <div className="d-flex justify-content-between py-2 text-muted">
                                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} piezas):</span>
                                <span className="fw-semibold text-dark">${getTotal().toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between py-2 text-muted">
                                <span>Retiro en Tienda EDAYO:</span>
                                <span className="badge bg-success-subtle text-success border border-success-subtle">Gratis</span>
                            </div>
                            <hr className="my-2" />
                            <div className="d-flex justify-content-between align-items-baseline py-2">
                                <span className="fw-bold fs-5">Total:</span>
                                <div>
                                    <span className="price fs-3">${getTotal().toFixed(2)}</span>
                                    <small className="text-muted ms-1">MXN</small>
                                </div>
                            </div>

                            <div className="alert alert-light border my-3 p-2 small text-muted">
                                <i className="bi bi-info-circle-fill text-primary me-1"></i>
                                Podrás descargar tu comprobante de pedido y pagar físicamente en el taller artesanal.
                            </div>

                            <button className="btn btn-primary w-100 py-2 fs-6" onClick={handleCheckout}>
                                <i className="bi bi-shield-check"></i> Proceder al Pago
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;