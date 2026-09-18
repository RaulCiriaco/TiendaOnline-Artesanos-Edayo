import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { getImageUrl } from '../../api/axios';
import Loader from '../../components/common/Loader';
import Swal from 'sweetalert2';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock: '',
        category_id: '',
        images: []
    });

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products?mine=1');
            setProducts(response.data);
        } catch (error) {
            console.error('Error al cargar productos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        api.get('/categories').then(({ data }) => setCategories(data)).catch(() => setCategories([]));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (key !== 'images') payload.append(key, value);
            });
            formData.images.forEach((image) => payload.append('images[]', image));
            if (editing) {
                await api.put(`/products/${editing}`, payload);
                Swal.fire('Actualizado', 'Producto actualizado exitosamente', 'success');
            } else {
                await api.post('/products', payload);
                Swal.fire('Creado', 'Producto creado exitosamente', 'success');
            }
            setShowForm(false);
            setEditing(null);
            setFormData({ name: '', description: '', price: '', stock: '', category_id: '', images: [] });
            fetchProducts();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.error || 'Error al guardar', 'error');
        }
    };

    const handleDelete = async (id) => {
        const confirm = await Swal.fire({
            title: '¿Eliminar producto?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true
        });
        if (confirm.isConfirmed) {
            try {
                await api.delete(`/products/${id}`);
                Swal.fire('Eliminado', 'Producto eliminado exitosamente', 'success');
                fetchProducts();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.error || 'Error al eliminar', 'error');
            }
        }
    };

    const editProduct = (product) => {
        setEditing(product.id);
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            category_id: product.category_id || '',
            images: []
        });
        setShowForm(true);
    };

    if (loading) return <Loader />;

    return (
        <div className="container page-shell">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">
                        <i className="bi bi-box-seam"></i> Inventario de Taller
                    </span>
                    <h1>Catálogo de Piezas Artesanales</h1>
                    <p>Administra las creaciones de tu taller, actualiza existencias, precios y fotografías para los compradores.</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setShowForm(!showForm);
                        setEditing(null);
                        setFormData({ name: '', description: '', price: '', stock: '', category_id: '', images: [] });
                    }}
                >
                    {showForm ? (
                        <><i className="bi bi-x-lg"></i> Cerrar Formulario</>
                    ) : (
                        <><i className="bi bi-plus-lg"></i> + Registrar Nueva Pieza</>
                    )}
                </button>
            </div>

            {showForm && (
                <div className="card shadow-sm border mb-4">
                    <div className="card-body p-4">
                        <h4 className="mb-3 d-flex align-items-center gap-2">
                            <i className="bi bi-palette text-primary"></i>
                            {editing ? 'Editar Pieza Artesanal' : 'Registrar Nueva Pieza Artesanal'}
                        </h4>
                        <p className="text-muted small mb-4">
                            Proporciona información detallada sobre tu creación para que los compradores conozcan su valor y técnica.
                        </p>

                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label">Nombre de la pieza <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Ej. Rebozo de telar / Camisa bordada a mano"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">Precio (MXN) <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-light text-muted">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            placeholder="0.00"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">Stock disponible <span className="text-danger">*</span></label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Cantidad"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Categoría artesanal</label>
                                    <select
                                        className="form-select"
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    >
                                        <option value="">Selecciona una categoría...</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>{category.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Imágenes de la pieza</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        multiple
                                        onChange={(e) => setFormData({ ...formData, images: Array.from(e.target.files) })}
                                    />
                                    <small className="text-muted">Formatos: JPG, PNG, WEBP. Puedes seleccionar varias.</small>
                                </div>
                                <div className="col-12">
                                    <label className="form-label">Descripción o historia de confección</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        placeholder="Describe materiales, técnicas (bordado, tejido, tallado), tiempo de elaboración..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="col-12 d-flex gap-2 pt-2">
                                    <button type="submit" className="btn btn-primary">
                                        <i className="bi bi-check2-circle"></i> {editing ? 'Actualizar Creación' : 'Guardar y Publicar'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => { setShowForm(false); setEditing(null); }}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {products.length === 0 ? (
                <div className="card text-center p-5 shadow-sm">
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--artisan-terracotta-light)', color: 'var(--artisan-terracotta)', display: 'grid', placeItems: 'center', fontSize: '1.8rem', margin: '0 auto 1rem' }}>
                        <i className="bi bi-palette"></i>
                    </div>
                    <h4>No tienes piezas registradas aún</h4>
                    <p className="text-muted mb-3">Comienza a publicar tus creaciones para que los compradores puedan verlas en el catálogo.</p>
                    <div>
                        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                            <i className="bi bi-plus-lg"></i> Publicar primera pieza
                        </button>
                    </div>
                </div>
            ) : (
                <div className="table-responsive shadow-sm">
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Imagen</th>
                                <th>Nombre de la Pieza</th>
                                <th>Precio</th>
                                <th>Disponibilidad</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id}>
                                    <td><span className="text-muted small">#{product.id}</span></td>
                                    <td>
                                        <img
                                            src={getImageUrl(product.images?.[0]) || 'https://via.placeholder.com/60x60?text=Sin+Imagen'}
                                            alt={product.name}
                                            width="54"
                                            height="54"
                                            style={{ objectFit: 'cover', borderRadius: '8px' }}
                                            className="border shadow-xs"
                                        />
                                    </td>
                                    <td>
                                        <strong className="text-dark d-block">{product.name}</strong>
                                        <small className="text-muted text-truncate d-inline-block" style={{ maxWidth: '280px' }}>
                                            {product.description || 'Sin descripción'}
                                        </small>
                                    </td>
                                    <td><strong className="text-dark">${Number(product.price).toFixed(2)} MXN</strong></td>
                                    <td>
                                        {Number(product.stock) > 5 ? (
                                            <span className="badge-artisan-status status-delivered">
                                                <i className="bi bi-check-circle"></i> {product.stock} unids.
                                            </span>
                                        ) : Number(product.stock) > 0 ? (
                                            <span className="badge-artisan-status status-pending">
                                                <i className="bi bi-exclamation-triangle"></i> Quedan {product.stock}
                                            </span>
                                        ) : (
                                            <span className="badge-artisan-status status-cancelled">
                                                <i className="bi bi-dash-circle"></i> Agotado
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="d-flex gap-1">
                                            <button
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => editProduct(product)}
                                                title="Editar producto"
                                            >
                                                <i className="bi bi-pencil-square text-primary"></i> Editar
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleDelete(product.id)}
                                                title="Eliminar producto"
                                            >
                                                <i className="bi bi-trash3"></i>
                                            </button>
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

export default Products;