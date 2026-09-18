import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getImageUrl } from '../../api/axios';
import Loader from '../../components/common/Loader';
import { jsPDF } from 'jspdf';

const labels = {
    pending: 'Pendiente',
    paid: 'Pagado',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
};

const CustomerOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const imageToDataUrl = async (image) => {
        if (!image) return null;
        try {
            const response = await fetch(getImageUrl(image));
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

    const downloadReceipt = async (order) => {
        if (order.status !== 'pending') return;
        const pdf = new jsPDF();
        const productImages = await Promise.all(order.products.map((item) => imageToDataUrl(item.images?.[0])));
        const sellerLocations = [...new Set(order.products.map((item) => item.seller_location).filter(Boolean))];
        let y = 20;
        pdf.setFillColor(184, 88, 52);
        pdf.rect(0, 0, 210, 34, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(18);
        pdf.text('Comprobante de pedido', 20, y);
        y += 12;
        pdf.setTextColor(40, 35, 30);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text(`Pedido: #${order.id}`, 20, y);
        pdf.text(`Fecha: ${new Date(order.created_at).toLocaleDateString()}`, 120, y);
        y += 10;
        pdf.text(`Cliente: ${order.client_name || ''}`, 20, y);
        y += 8;
        pdf.text(`Correo: ${order.client_email || ''}`, 20, y);
        y += 12;
        pdf.setFillColor(255, 247, 237);
        pdf.roundedRect(15, y - 5, 180, 18, 3, 3, 'F');
        pdf.setTextColor(120, 53, 15);
        pdf.setFontSize(10);
        pdf.text('Punto de retiro en taller:', 20, y + 2);
        pdf.setTextColor(40, 35, 30);
        pdf.text((sellerLocations.join(' | ') || order.shipping_address || 'Consultar ubicación con el vendedor').slice(0, 100), 20, y + 9);
        const mapUrl = order.products.find((item) => item.seller_maps_url)?.seller_maps_url;
        if (mapUrl) {
            pdf.setTextColor(22, 101, 52);
            pdf.textWithLink('Abrir ubicación en Google Maps', 20, y + 16, { url: mapUrl });
        }
        y += 25;
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(15, y - 6, 180, 18 + order.products.length * 18, 3, 3, 'F');
        order.products.forEach((item, index) => {
            const subtotal = Number(item.price || 0) * Number(item.quantity || 0);
            if (productImages[index]) pdf.addImage(productImages[index], 20, y - 4, 14, 14);
            pdf.setTextColor(40, 35, 30);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${item.name || `Producto ${item.product_id}`}`.slice(0, 42), 38, y + 1);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9);
            pdf.text(`${item.seller_name || 'Taller artesanal'} | x${item.quantity} | $${subtotal.toFixed(2)}`, 38, y + 8);
            y += 18;
        });
        y += 4;
        pdf.setFontSize(13);
        pdf.setTextColor(184, 88, 52);
        pdf.text(`Total: $${Number(order.total || 0).toFixed(2)}`, 20, y);
        y += 12;
        pdf.setFontSize(10);
        pdf.setTextColor(70, 65, 60);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Pago y entrega directamente en el taller del vendedor.', 20, y);
        pdf.text('Presenta este comprobante para recoger tu pedido.', 20, y + 6);
        pdf.save(`comprobante-pedido-${order.id}.pdf`);
    };

    useEffect(() => {
        api.get('/orders?view=buyer')
            .then((response) => setOrders(response.data))
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));
    }, []);

    const renderStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <span className="badge-artisan-status status-pending"><i className="bi bi-hourglass-split"></i> Pendiente de pago</span>;
            case 'paid':
                return <span className="badge-artisan-status status-paid"><i className="bi bi-check2-all"></i> Pagado</span>;
            case 'shipped':
                return <span className="badge-artisan-status status-shipped"><i className="bi bi-truck"></i> En camino</span>;
            case 'delivered':
                return <span className="badge-artisan-status status-delivered"><i className="bi bi-box2-heart-fill"></i> Entregado</span>;
            case 'cancelled':
                return <span className="badge-artisan-status status-cancelled"><i className="bi bi-x-circle"></i> Cancelado</span>;
            default:
                return <span className="badge bg-secondary">{labels[status] || status}</span>;
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="container page-shell">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">
                        <i className="bi bi-clock-history"></i> Tus adquisiciones
                    </span>
                    <h1>Mis Pedidos de Taller</h1>
                    <p>Consulta el estado de tus compras y descarga tus comprobantes para retirar en la tienda EDAYO.</p>
                </div>
                <Link to="/" className="btn btn-outline-primary btn-sm">
                    <i className="bi bi-shop"></i> Explorar más piezas
                </Link>
            </div>

            {orders.length === 0 ? (
                <div className="card text-center p-5 shadow-sm">
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--artisan-sage-light)', color: 'var(--artisan-sage)', display: 'grid', placeItems: 'center', fontSize: '1.8rem', margin: '0 auto 1rem' }}>
                        <i className="bi bi-bag-x"></i>
                    </div>
                    <h4>Aún no has realizado pedidos</h4>
                    <p className="text-muted mb-4">Cuando adquieras piezas hechas por nuestros artesanos, las verás listadas aquí.</p>
                    <div>
                        <Link to="/" className="btn btn-primary">
                            <i className="bi bi-shop"></i> Ir a la Tienda
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="d-grid gap-4">
                    {orders.map((order) => {
                        const sellers = [...new Map(order.products.map((item) => [item.seller_id || item.seller_name, item])).values()];
                        return (
                            <article className="card shadow-sm border-0 overflow-hidden" key={order.id}>
                                <div className="p-3 d-flex flex-wrap justify-content-between align-items-center gap-3" style={{ background: 'linear-gradient(110deg, #fff7ed, #f0fdf4)' }}>
                                    <div>
                                        <span className="eyebrow mb-1">Pedido #{order.id}</span>
                                        <div className="small text-muted"><i className="bi bi-calendar3 me-1"></i>{new Date(order.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <div className="d-flex align-items-center gap-3"><strong className="fs-5 text-dark">${Number(order.total).toFixed(2)} MXN</strong>{renderStatusBadge(order.status)}</div>
                                </div>
                                <div className="card-body p-3">
                                    <div className="row g-3">
                                        <div className="col-lg-8">
                                            <h6 className="text-uppercase text-muted small fw-bold mb-3">Piezas artesanales</h6>
                                            <div className="d-grid gap-2">
                                                {order.products?.map((item, index) => (
                                                    <div className="d-flex align-items-center gap-3 border rounded p-2" key={`${order.id}-${item.product_id}-${index}`}>
                                                        <img src={getImageUrl(item.images?.[0]) || 'https://via.placeholder.com/64?text=Pieza'} alt={item.name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
                                                        <div className="flex-grow-1"><strong className="d-block">{item.name || `Producto ${item.product_id}`}</strong><span className="small text-muted">Cantidad: {item.quantity} · ${Number(item.price || 0).toFixed(2)} c/u</span></div>
                                                        <strong>${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</strong>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="col-lg-4">
                                            <h6 className="text-uppercase text-muted small fw-bold mb-3">Vendedor y retiro</h6>
                                            <div className="d-grid gap-2">
                                                {sellers.map((seller, index) => (
                                                    <div className="d-flex align-items-center gap-2 bg-light rounded p-2" key={`${seller.seller_id || seller.seller_name}-${index}`}>
                                                        <img src={getImageUrl(seller.seller_image) || 'https://via.placeholder.com/44?text=T'} alt={seller.seller_name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: '50%' }} />
                                                        <div className="small"><strong className="d-block">{seller.seller_name || 'Taller artesanal'}</strong><span className="text-muted d-block"><i className="bi bi-geo-alt-fill text-danger me-1"></i>{seller.seller_location || order.shipping_address || 'Ubicación pendiente'}</span>{seller.seller_maps_url && <a href={seller.seller_maps_url} target="_blank" rel="noreferrer"><i className="bi bi-map me-1"></i>Ver ubicación</a>}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="d-flex justify-content-end mt-3">
                                        {order.status === 'pending' ? <button className="btn btn-sm btn-outline-primary" onClick={() => downloadReceipt(order)}><i className="bi bi-download me-1"></i> Descargar comprobante</button> : <span className="small text-muted"><i className="bi bi-check2 text-success me-1"></i> Pago validado</span>}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CustomerOrders;
