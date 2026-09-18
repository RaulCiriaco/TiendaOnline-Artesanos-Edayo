import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Loader from '../../components/common/Loader';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [productCount, setProductCount] = useState(0);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [statsResponse, productsResponse] = await Promise.all([
                    api.get('/orders/stats'),
                    api.get('/products?mine=1')
                ]);
                setStats(statsResponse.data);
                setProductCount(productsResponse.data.length);
            } catch (error) {
                console.error('Error al cargar estadísticas:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <Loader />;

    return (
        <div className="container page-shell">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">
                        <i className="bi bi-speedometer2"></i> Taller Digital
                    </span>
                    <h1>Panel del Emprendedor</h1>
                    <p>Monitorea en tiempo real tus ventas artesanales, pedidos recibidos y la actividad de tus piezas.</p>
                </div>
                <div className="d-flex gap-2">
                    <a href="/emprendedor/products" className="btn btn-primary btn-sm">
                        <i className="bi bi-plus-circle"></i> Nueva Pieza
                    </a>
                    <a href="/emprendedor/orders" className="btn btn-outline-secondary btn-sm">
                        <i className="bi bi-clipboard-check"></i> Ver Pedidos
                    </a>
                </div>
            </div>

            {/* Tarjetas Principales de Métricas */}
            <div className="row g-4 mb-4">
                <div className="col-md-4">
                    <div className="stat-card-artisan stat-card-terracotta">
                        <div className="stat-title">Ganancias acumuladas</div>
                        <div className="stat-value">${Number(stats?.total_sales?.total_sales || 0).toFixed(2)}</div>
                        <small className="opacity-75">Ventas pagadas, enviadas o entregadas</small>
                        <i className="bi bi-wallet2 stat-icon"></i>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="stat-card-artisan stat-card-sage">
                        <div className="stat-title">Pedidos Totales</div>
                        <div className="stat-value">{stats?.total_sales?.total_orders || 0}</div>
                        <small className="opacity-75">Órdenes registradas por clientes</small>
                        <i className="bi bi-bag-check-fill stat-icon"></i>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="stat-card-artisan stat-card-amber">
                        <div className="stat-title">Catálogo Activo</div>
                        <div className="stat-value">{productCount}</div>
                        <small className="opacity-75">Piezas artesanales en exhibición</small>
                        <i className="bi bi-palette-fill stat-icon"></i>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="stat-card-artisan stat-card-amber">
                        <div className="stat-title">Producto más vendido</div>
                        <div className="stat-value fs-4 text-truncate">{stats?.best_sellers?.[0]?.name || 'Sin ventas'}</div>
                        <small className="opacity-75">{stats?.best_sellers?.[0]?.total_sold || 0} piezas vendidas</small>
                        <i className="bi bi-trophy-fill stat-icon"></i>
                    </div>
                </div>
            </div>

            {/* Desglose por Estado de Pedido */}
            <h4 className="mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-funnel text-primary"></i> Estado de los Pedidos de tu Taller
            </h4>
            <div className="row g-3">
                <div className="col-md-3 col-6">
                    <div className="card shadow-sm border-0 h-100" style={{ background: '#fffbeb', borderLeft: '4px solid #d97706 !important' }}>
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <span className="text-warning-emphasis fw-bold small text-uppercase">Pendientes</span>
                                <i className="bi bi-hourglass-split text-warning fs-5"></i>
                            </div>
                            <h2 className="mb-0 mt-2 fw-bold text-dark">{stats?.status_summary?.pending || 0}</h2>
                            <small className="text-muted">Por pagar en tienda</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 col-6">
                    <div className="card shadow-sm border-0 h-100" style={{ background: '#ecfdf5', borderLeft: '4px solid #059669 !important' }}>
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <span className="text-success fw-bold small text-uppercase">Pagados</span>
                                <i className="bi bi-check-circle text-success fs-5"></i>
                            </div>
                            <h2 className="mb-0 mt-2 fw-bold text-dark">{stats?.status_summary?.paid || 0}</h2>
                            <small className="text-muted">Listos para empaque</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 col-6">
                    <div className="card shadow-sm border-0 h-100" style={{ background: '#f0fdfa', borderLeft: '4px solid #0d9488 !important' }}>
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <span className="text-teal fw-bold small text-uppercase" style={{ color: '#0d9488' }}>Entregados</span>
                                <i className="bi bi-box2-heart text-teal fs-5" style={{ color: '#0d9488' }}></i>
                            </div>
                            <h2 className="mb-0 mt-2 fw-bold text-dark">{stats?.status_summary?.delivered || 0}</h2>
                            <small className="text-muted">Venta completada</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 col-6">
                    <div className="card shadow-sm border-0 h-100" style={{ background: '#fff1f2', borderLeft: '4px solid #e11d48 !important' }}>
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <span className="text-danger fw-bold small text-uppercase">Cancelados</span>
                                <i className="bi bi-x-circle text-danger fs-5"></i>
                            </div>
                            <h2 className="mb-0 mt-2 fw-bold text-dark">{stats?.status_summary?.cancelled || 0}</h2>
                            <small className="text-muted">Pedidos no concretados</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;