import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../../api/axios';
import Loader from '../../components/common/Loader';
import Swal from 'sweetalert2';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');

    const fetchOrders = async () => {
        try {
            const response = await api.get('/orders?view=seller');
            setOrders(response.data);
        } catch (error) {
            console.error('Error al cargar pedidos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const updateStatus = async (orderId, newStatus) => {
        const statusNames = { paid: 'pagado', delivered: 'entregado', cancelled: 'cancelado' };
        const confirmation = await Swal.fire({
            title: '¿Confirmar cambio?',
            text: `El pedido quedará marcado como ${statusNames[newStatus] || newStatus}.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Confirmar',
            cancelButtonText: 'Cancelar'
        });
        if (!confirmation.isConfirmed) return;
        try {
            await api.put(`/orders/${orderId}`, { status: newStatus });
            Swal.fire('Actualizado', 'Estado del pedido actualizado', 'success');
            fetchOrders();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.error || 'Error al actualizar', 'error');
        }
    };

    const uploadReceipt = async (orderId, file) => {
        const data = new FormData();
        data.append('receipt', file);
        try {
            await api.post(`/orders/${orderId}/receipt`, data);
            Swal.fire('Guardado', 'Comprobante de pago guardado', 'success');
            fetchOrders();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.error || 'Error al guardar comprobante', 'error');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <span className="badge-artisan-status status-pending"><i className="bi bi-hourglass-split"></i> Pendiente</span>;
            case 'paid':
                return <span className="badge-artisan-status status-paid"><i className="bi bi-check2-all"></i> Pagado</span>;
            case 'shipped':
                return <span className="badge-artisan-status status-shipped"><i className="bi bi-truck"></i> Enviado</span>;
            case 'delivered':
                return <span className="badge-artisan-status status-delivered"><i className="bi bi-box2-heart-fill"></i> Entregado</span>;
            case 'cancelled':
                return <span className="badge-artisan-status status-cancelled"><i className="bi bi-x-circle"></i> Cancelado</span>;
            default:
                return <span className="badge bg-secondary">{status}</span>;
        }
    };

    const getStatusOptions = (currentStatus) => {
        const transitions = {
            pending: ['paid', 'cancelled'],
            paid: ['delivered', 'cancelled'],
            shipped: [],
            delivered: [],
            cancelled: []
        };
        return transitions[currentStatus] || [];
    };

    const filteredOrders = statusFilter === 'all' 
        ? orders 
        : orders.filter(order => order.status === statusFilter);

    if (loading) return <Loader />;

    return (
        <div className="container page-shell">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">
                        <i className="bi bi-clipboard-check"></i> Registro de Ventas
                    </span>
                    <h1>Control de Pedidos del Taller</h1>
                    <p>Monitorea las órdenes de compra de tus clientes, valida comprobantes y actualiza el avance de entrega.</p>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <label className="text-muted small fw-bold text-nowrap"><i className="bi bi-funnel"></i> Estado:</label>
                    <select 
                        className="form-select form-select-sm" 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ minWidth: '150px' }}
                    >
                        <option value="all">Todos los pedidos</option>
                        <option value="pending">⏳ Pendientes</option>
                        <option value="paid">✓ Pagados</option>
                        <option value="delivered">♥ Entregados</option>
                        <option value="cancelled">✕ Cancelados</option>
                    </select>
                </div>
            </div>

            {filteredOrders.length === 0 ? (
                <div className="card text-center p-5 shadow-sm">
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--artisan-amber-light)', color: 'var(--artisan-amber-dark)', display: 'grid', placeItems: 'center', fontSize: '1.8rem', margin: '0 auto 1rem' }}>
                        <i className="bi bi-inbox"></i>
                    </div>
                    <h4>No hay pedidos bajo este filtro</h4>
                    <p className="text-muted">Prueba seleccionando otro estado en el menú superior.</p>
                </div>
            ) : (
                <div className="table-responsive shadow-sm">
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th># Pedido</th>
                                <th>Cliente</th>
                                <th>Piezas Solicitadas</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                                <th>Dirección / Ref.</th>
                                <th>Gestión</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => (
                                <tr key={order.id}>
                                    <td><strong className="text-primary">#{order.id}</strong></td>
                                    <td>
                                        <strong className="text-dark d-block">{order.client_name || 'Cliente de la tienda'}</strong>
                                        <small className="text-muted d-flex align-items-center gap-1">
                                            <i className="bi bi-envelope"></i> {order.client_email}
                                        </small>
                                    </td>
                                    <td>
                                        <div className="small text-dark" style={{ maxWidth: '240px' }}>
                                            {order.products && Array.isArray(order.products) 
                                                ? order.products.map(p => `${p.name || `Producto ${p.product_id}`} (x${p.quantity})`).join(', ')
                                                : 'Sin productos'
                                            }
                                        </div>
                                    </td>
                                    <td>
                                        <strong className="text-dark">${Number(order.employer_total ?? order.total ?? 0).toFixed(2)} MXN</strong>
                                    </td>
                                    <td>{getStatusBadge(order.status)}</td>
                                    <td className="small text-muted text-nowrap">
                                        <i className="bi bi-calendar3 me-1"></i>
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <span className="small text-muted text-truncate d-inline-block" style={{ maxWidth: '160px' }} title={order.shipping_address}>
                                            {order.shipping_address || 'Sin dirección'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="d-flex flex-wrap gap-1 align-items-center">
                                            {order.status === 'pending' && (
                                                <button className="btn btn-sm btn-success" onClick={() => updateStatus(order.id, 'paid')} title="Confirmar pago en tienda">
                                                    <i className="bi bi-check2"></i> Cobrado
                                                </button>
                                            )}
                                            {getStatusOptions(order.status).length > 0 && (
                                                <select 
                                                    className="form-select form-select-sm" 
                                                    style={{ width: '130px', fontSize: '0.8rem' }}
                                                    onChange={(e) => e.target.value && updateStatus(order.id, e.target.value)}
                                                    value=""
                                                >
                                                    <option value="">Cambiar a...</option>
                                                    {getStatusOptions(order.status).map(status => (
                                                        <option key={status} value={status}>
                                                            {status === 'pending' ? 'Pendiente' :
                                                             status === 'paid' ? 'Pagado' :
                                                             status === 'shipped' ? 'Enviado' :
                                                             status === 'delivered' ? 'Entregado' :
                                                             status === 'cancelled' ? 'Cancelado' : status}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                            <label className="btn btn-outline-secondary btn-sm" title="Subir foto de comprobante">
                                                <i className="bi bi-upload"></i>
                                                <input type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => e.target.files[0] && uploadReceipt(order.id, e.target.files[0])} />
                                            </label>
                                            {order.payment_receipt && (
                                                <a className="btn btn-sm btn-outline-info" href={getImageUrl(order.payment_receipt)} target="_blank" rel="noreferrer" title="Ver comprobante guardado">
                                                    <i className="bi bi-image"></i>
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Orders;