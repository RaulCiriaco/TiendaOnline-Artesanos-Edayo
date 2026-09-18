import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';

const Checkout = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [cart, setCart] = useState([]);
    const [cartLoaded, setCartLoaded] = useState(false);
    const [sellerLocations, setSellerLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        address: '',
        phone: '',
        payment_method: 'Efectivo contra entrega'
    });

    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            const savedItems = JSON.parse(savedCart);
            Promise.all(savedItems.map(async (item) => {
                if (item.entrepreneur_location) return item;
                try {
                    const { data } = await api.get(`/products/${item.id}`);
                    return { ...item, entrepreneur_id: data.entrepreneur_id, entrepreneur_name: data.entrepreneur_name, entrepreneur_location: data.entrepreneur_location, entrepreneur_maps_url: data.entrepreneur_maps_url };
                } catch {
                    return item;
                }
            })).then((items) => {
                setCart(items);
                const locations = [...new Set(items.map((item) => item.entrepreneur_location).filter(Boolean))];
                setSellerLocations(locations);
                setFormData((current) => ({ ...current, address: locations.join(' | ') }));
                setCartLoaded(true);
            });
        } else {
            setCartLoaded(true);
            navigate('/cart');
        }
    }, [navigate]);

    const getTotal = () => {
        return cart.reduce((total, item) => total + (Number(item.price) * Number(item.quantity)), 0);
    };

    const imageToDataUrl = async (image) => {
        if (!image) return null;
        try {
            const response = await fetch(image);
            const blob = await response.blob();
            return await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            });
        } catch {
            return null;
        }
    };

    const downloadReceipt = async (orderId) => {
        const pdf = new jsPDF();
        const productImages = await Promise.all(cart.map((item) => imageToDataUrl(item.image)));
        let y = 20;
        pdf.setFillColor(184, 88, 52);
        pdf.rect(0, 0, 210, 34, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(20);
        pdf.text('Comprobante de pedido', 20, y);
        y += 12;
        pdf.setTextColor(40, 35, 30);
        pdf.setFontSize(11);
        pdf.text(`Pedido: #${orderId}`, 20, y);
        pdf.text(`Fecha: ${new Date().toLocaleDateString()}`, 120, y);
        y += 10;
        pdf.text(`Cliente: ${user?.name || ''}`, 20, y);
        y += 8;
        pdf.text(`Correo: ${user?.email || ''}`, 20, y);
        y += 12;
        pdf.setFillColor(255, 247, 237);
        pdf.roundedRect(15, y - 5, 180, 18, 3, 3, 'F');
        pdf.setTextColor(120, 53, 15);
        pdf.setFontSize(10);
        pdf.text('Punto de retiro en taller:', 20, y + 2);
        pdf.setTextColor(40, 35, 30);
        pdf.text((sellerLocations.join(' | ') || 'Consultar ubicación con el vendedor').slice(0, 100), 20, y + 9);
        const mapUrl = cart.find((item) => item.entrepreneur_maps_url)?.entrepreneur_maps_url;
        if (mapUrl) {
            pdf.setTextColor(22, 101, 52);
            pdf.textWithLink('Abrir ubicación en Google Maps', 20, y + 16, { url: mapUrl });
        }
        y += 25;
        pdf.setTextColor(40, 35, 30);
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(15, y - 6, 180, 8 + cart.length * 7, 3, 3, 'F');
        cart.forEach((item, index) => {
            const subtotal = Number(item.price) * item.quantity;
            if (productImages[index]) pdf.addImage(productImages[index], 20, y - 4, 14, 14);
            pdf.setFont('helvetica', 'bold');
            pdf.text(item.name.slice(0, 40), 38, y + 1);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9);
            pdf.text(`${item.entrepreneur_name || 'Taller artesanal'} | x${item.quantity} | $${subtotal.toFixed(2)}`, 38, y + 8);
            y += 18;
        });
        y += 4;
        pdf.setFontSize(13);
        pdf.setTextColor(184, 88, 52);
        pdf.text(`Total: $${getTotal().toFixed(2)}`, 20, y);
        y += 12;
        pdf.setFontSize(10);
        pdf.setTextColor(70, 65, 60);
        pdf.text('Pago y entrega directamente en el taller del vendedor.', 20, y);
        pdf.text('Presenta este comprobante para recoger tu pedido.', 20, y + 6);
        pdf.save(`comprobante-pedido-${orderId}.pdf`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!sellerLocations.length) {
            Swal.fire('Perfil incompleto', 'El vendedor debe registrar la ubicación de su taller antes de recibir pedidos.', 'error');
            return;
        }

        setLoading(true);
        try {
            const orderData = {
                products: cart.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    price: item.price
                })),
                total: getTotal(),
                shipping_address: sellerLocations.join(' | '),
                payment_method: 'Pago en tienda'
            };

            const response = await api.post('/orders/create', orderData);
            downloadReceipt(response.data.order_id);
            localStorage.removeItem('cart');
            Swal.fire('¡Pedido exitoso!', `Tu pedido #${response.data.order_id} ha sido creado`, 'success');
            navigate('/clientes/orders');
        } catch (error) {
            Swal.fire('Error', error.response?.data?.error || 'Error al crear el pedido', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!cartLoaded) return <div className="container page-shell text-center"><p className="text-muted">Preparando tu comprobante...</p></div>;
    if (cart.length === 0) {
        return (
            <div className="container mt-5 text-center">
                <h2>Carrito vacío</h2>
                <Link to="/" className="btn btn-primary">Volver a la tienda</Link>
            </div>
        );
    }

    return (
        <div className="container page-shell">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">
                        <i className="bi bi-shield-check"></i> Proceso Seguro
                    </span>
                    <h1>Finalizar Pedido Artesanal</h1>
                    <p>Completa tus datos de contacto para formalizar tu orden y descargar tu comprobante de compra.</p>
                </div>
                <Link to="/cart" className="btn btn-outline-secondary btn-sm">
                    <i className="bi bi-arrow-left"></i> Volver a la bolsa
                </Link>
            </div>

            <div className="row g-4">
                <div className="col-lg-7">
                    <div className="card shadow-sm">
                        <div className="card-body p-4">
                            <h4 className="mb-3 d-flex align-items-center gap-2">
                                <i className="bi bi-person-lines-fill text-primary"></i> Datos del Comprador
                            </h4>
                            <p className="text-muted small mb-4">
                                Estos datos se imprimirán en tu comprobante oficial para la entrega de tus piezas en tienda.
                            </p>

                            <form onSubmit={handleSubmit}>
                                <div className="row g-3 mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Nombre completo</label>
                                        <input type="text" className="form-control bg-light" value={user?.name || ''} disabled />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Correo electrónico</label>
                                        <input type="email" className="form-control bg-light" value={user?.email || ''} disabled />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label"><i className="bi bi-geo-alt-fill text-danger me-1"></i> Ubicación para recoger tu pedido</label>
                                    <div className="form-control bg-light" style={{ minHeight: '76px' }}>
                                        {sellerLocations.length ? sellerLocations.join(' | ') : 'El vendedor aún no ha registrado la ubicación de su taller.'}
                                    </div>
                                    <small className="text-muted">La compra se paga y se recoge directamente en el taller de cada vendedor.</small>
                                    {[...new Set(cart.map((item) => item.entrepreneur_maps_url).filter(Boolean))].map((mapsUrl) => (
                                        <a key={mapsUrl} className="btn btn-sm btn-outline-success mt-2 me-2" href={mapsUrl} target="_blank" rel="noreferrer"><i className="bi bi-map me-1"></i> Abrir ubicación en Google Maps</a>
                                    ))}
                                </div>

                                <div className="p-3 mb-4 rounded border bg-light">
                                    <div className="d-flex align-items-start gap-3">
                                        <div style={{ width: 40, height: 40, borderRadius: '8px', background: 'var(--artisan-sage)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                                            <i className="bi bi-shop"></i>
                                        </div>
                                        <div>
                                            <strong className="d-block text-dark">Modalidad de Pago: En Tienda / Taller EDAYO</strong>
                                            <p className="small text-muted mb-0">
                                                Al confirmar este pedido se descargará automáticamente tu <strong>Comprobante PDF</strong>. Preséntalo impreso o en tu celular al recoger y pagar tus piezas en las instalaciones de EDAYO Jilotepec.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary w-100 py-3 fs-6" disabled={loading}>
                                    <i className="bi bi-file-earmark-pdf-fill"></i>
                                    {loading ? 'Generando tu pedido...' : 'Confirmar Pedido y Descargar Comprobante'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-lg-5">
                    <div className="card shadow-sm sticky-top" style={{ top: '2rem' }}>
                        <div className="card-body p-4">
                            <h4 className="mb-3 d-flex align-items-center gap-2">
                                <i className="bi bi-receipt text-warning"></i> Resumen de Piezas
                            </h4>
                            <hr className="my-2" />
                            <div className="d-flex flex-column gap-2 my-3" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                                {cart.map((item) => (
                                    <div key={item.id} className="d-flex justify-content-between align-items-center py-1">
                                        <div>
                                            <div className="fw-semibold text-dark">{item.name}</div>
                                            <small className="text-muted">{item.quantity} x ${Number(item.price).toFixed(2)}</small>
                                        </div>
                                        <span className="fw-bold text-dark">${(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <hr className="my-2" />
                            <div className="d-flex justify-content-between py-1 text-muted">
                                <span>Costo de envío:</span>
                                <span className="text-success fw-bold">Gratis (Retiro en taller)</span>
                            </div>
                            <hr className="my-2" />
                            <div className="d-flex justify-content-between align-items-baseline py-2">
                                <span className="fw-bold fs-5">Total a pagar:</span>
                                <div>
                                    <span className="price fs-3">${getTotal().toFixed(2)}</span>
                                    <small className="text-muted ms-1">MXN</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;