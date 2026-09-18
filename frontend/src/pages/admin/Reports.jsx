import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Loader from '../../components/common/Loader';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';

// Registrar componentes de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const Reports = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/orders/stats?year=${year}`);
            setStats(response.data);
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [year]);

    if (loading) return <Loader />;

    // Datos para gráfica de ventas mensuales con paleta artesanal
    const monthlyData = {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        datasets: [
            {
                label: 'Ventas del Taller ($ MXN)',
                data: Array.from({ length: 12 }, (_, i) => {
                    const monthData = stats?.monthly_sales?.find(m => Number(m.month) === i + 1);
                    return Number(monthData?.total_sales || 0);
                }),
                backgroundColor: 'rgba(184, 88, 52, 0.75)',
                borderColor: 'rgba(184, 88, 52, 1)',
                borderWidth: 2,
                borderRadius: 8,
            },
        ],
    };

    // Datos para gráfica de productos más vendidos
    const bestSellersData = {
        labels: stats?.best_sellers?.map(p => p.name) || ['Sin datos'],
        datasets: [
            {
                label: 'Unidades vendidas',
                data: stats?.best_sellers?.map(p => p.total_sold || 0) || [0],
                backgroundColor: [
                    'rgba(184, 88, 52, 0.85)',
                    'rgba(54, 94, 78, 0.85)',
                    'rgba(217, 119, 6, 0.85)',
                    'rgba(71, 85, 105, 0.85)',
                    'rgba(142, 67, 45, 0.85)',
                ],
                borderColor: '#ffffff',
                borderWidth: 2,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: { family: "'Plus Jakarta Sans', sans-serif", weight: '600' }
                }
            },
        },
    };

    const exportCsv = () => {
        const rows = [['Empleador / Artesano', 'Pedidos', 'Ventas Totales'], ...(stats?.entrepreneur_sales || []).map((item) => [item.entrepreneur_name, item.total_orders, item.total_sales])];
        const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte-ventas-artesanal-${year}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const exportPdf = () => {
        const pdf = new jsPDF();
        pdf.setFontSize(18);
        pdf.text(`Reporte de ventas de taller ${year}`, 20, 20);
        pdf.setFontSize(11);
        pdf.text(`Ventas totales: $${Number(stats?.total_sales?.total_sales || 0).toFixed(2)} MXN`, 20, 32);
        pdf.text(`Pedidos registrados: ${stats?.total_sales?.total_orders || 0}`, 20, 40);
        (stats?.entrepreneur_sales || []).forEach((item, index) => pdf.text(`${item.entrepreneur_name}: $${Number(item.total_sales || 0).toFixed(2)} MXN`, 20, 54 + (index * 7)));
        pdf.save(`reporte-ventas-artesanal-${year}.pdf`);
    };

    return (
        <div className="container page-shell">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">
                        <i className="bi bi-graph-up"></i> Métricas Financieras
                    </span>
                    <h1>Reportes y Estadísticas de Ventas</h1>
                    <p>Analiza el rendimiento comercial del año, los productos favoritos de los clientes y el impacto del taller.</p>
                </div>
                <div className="d-flex flex-wrap align-items-center gap-2">
                    <div className="d-flex align-items-center gap-2">
                        <label className="text-muted small fw-bold">Año:</label>
                        <select 
                            className="form-select form-select-sm w-auto" 
                            value={year} 
                            onChange={(e) => setYear(parseInt(e.target.value))}
                        >
                            {[2024, 2025, 2026, 2027].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={fetchStats}>
                        <i className="bi bi-arrow-repeat"></i> Actualizar
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={exportCsv}>
                        <i className="bi bi-filetype-csv"></i> CSV
                    </button>
                    <button className="btn btn-outline-danger btn-sm" onClick={exportPdf}>
                        <i className="bi bi-file-earmark-pdf"></i> PDF
                    </button>
                </div>
            </div>

            {/* Tarjetas de Resumen Financiero */}
            <div className="row g-4 mb-4">
                <div className="col-lg-3 col-sm-6">
                    <div className="stat-card-artisan stat-card-terracotta">
                        <div className="stat-title">Ventas del Año</div>
                        <div className="stat-value">${Number(stats?.total_sales?.total_sales || 0).toFixed(2)}</div>
                        <small className="opacity-75">MXN facturados</small>
                        <i className="bi bi-wallet2 stat-icon"></i>
                    </div>
                </div>
                <div className="col-lg-3 col-sm-6">
                    <div className="stat-card-artisan stat-card-sage">
                        <div className="stat-title">Total Pedidos</div>
                        <div className="stat-value">{stats?.total_sales?.total_orders || 0}</div>
                        <small className="opacity-75">Órdenes generadas</small>
                        <i className="bi bi-bag-check-fill stat-icon"></i>
                    </div>
                </div>
                <div className="col-lg-3 col-sm-6">
                    <div className="stat-card-artisan stat-card-amber">
                        <div className="stat-title">Pedidos Pagados</div>
                        <div className="stat-value">{stats?.total_sales?.paid_orders || 0}</div>
                        <small className="opacity-75">Cobrados en tienda</small>
                        <i className="bi bi-check2-circle stat-icon"></i>
                    </div>
                </div>
                <div className="col-lg-3 col-sm-6">
                    <div className="stat-card-artisan stat-card-slate">
                        <div className="stat-title">Por Cobrar</div>
                        <div className="stat-value">{stats?.status_summary?.pending || 0}</div>
                        <small className="opacity-75">Pendientes de retiro</small>
                        <i className="bi bi-hourglass-split stat-icon"></i>
                    </div>
                </div>
            </div>

            {/* Gráficas Visuales */}
            <div className="row g-4 mb-4">
                <div className="col-lg-8">
                    <div className="card shadow-sm h-100">
                        <div className="card-body p-4">
                            <h5 className="card-title mb-3 d-flex align-items-center gap-2">
                                <i className="bi bi-bar-chart-line-fill text-primary"></i> Ventas Mensuales ({year})
                            </h5>
                            <div style={{ height: '320px' }}>
                                <Bar data={monthlyData} options={chartOptions} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-body p-4">
                            <h5 className="card-title mb-3 d-flex align-items-center gap-2">
                                <i className="bi bi-pie-chart-fill text-warning"></i> Piezas Más Vendidas
                            </h5>
                            <div style={{ height: '320px' }}>
                                <Pie data={bestSellersData} options={chartOptions} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla de Rendimiento por Emprendedor */}
            <div className="card shadow-sm">
                <div className="card-body p-4">
                    <h5 className="card-title mb-3 d-flex align-items-center gap-2">
                        <i className="bi bi-trophy-fill text-warning"></i> Rendimiento de Ventas por Taller
                    </h5>
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Taller / Emprendedor</th>
                                    <th>Pedidos Concretados</th>
                                    <th>Ventas Totales</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.entrepreneur_sales?.length > 0 ? (
                                    stats.entrepreneur_sales.map((item, index) => (
                                        <tr key={item.entrepreneur_id || index}>
                                            <td>
                                                {index === 0 ? (
                                                    <span className="badge bg-warning text-dark"><i className="bi bi-trophy-fill"></i> 1</span>
                                                ) : index === 1 ? (
                                                    <span className="badge bg-secondary text-white">2</span>
                                                ) : index === 2 ? (
                                                    <span className="badge bg-light text-dark border">3</span>
                                                ) : (
                                                    <span className="text-muted small">{index + 1}</span>
                                                )}
                                            </td>
                                            <td>
                                                <strong className="text-dark">{item.entrepreneur_name || 'Taller Artesanal'}</strong>
                                            </td>
                                            <td>
                                                <span className="badge-artisan-status status-delivered">
                                                    {item.total_orders || 0} pedidos
                                                </span>
                                            </td>
                                            <td><strong className="text-dark">${Number(item.total_sales || 0).toFixed(2)} MXN</strong></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-4 text-muted">
                                            No hay registros de ventas para el año {year}.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;