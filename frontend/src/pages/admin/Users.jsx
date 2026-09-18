import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import Loader from '../../components/common/Loader';
import Swal from 'sweetalert2';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'cliente'
    });

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                const data = { ...formData };
                if (!data.password) delete data.password;
                await api.put(`/users/${editing}`, data);
                Swal.fire('Actualizado', 'Usuario actualizado exitosamente', 'success');
            } else {
                await api.post('/users', formData);
                Swal.fire('Creado', 'Usuario creado exitosamente', 'success');
            }
            setShowForm(false);
            setEditing(null);
            setFormData({ name: '', email: '', password: '', role: 'cliente' });
            fetchUsers();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.error || 'Error al guardar', 'error');
        }
    };

    const handleDelete = async (id) => {
        const confirm = await Swal.fire({
            title: '¿Eliminar usuario?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true
        });
        if (confirm.isConfirmed) {
            try {
                await api.delete(`/users/${id}`);
                Swal.fire('Eliminado', 'Usuario eliminado exitosamente', 'success');
                fetchUsers();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.error || 'Error al eliminar', 'error');
            }
        }
    };

    const editUser = (user) => {
        setEditing(user.id);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role
        });
        setShowForm(true);
    };

    const getRoleBadge = (role) => {
        if (role === 'admin') {
            return <span className="badge-artisan-status status-cancelled"><i className="bi bi-shield-lock-fill"></i> Administrador</span>;
        }
        if (role === 'empleador') {
            return <span className="badge-artisan-status status-delivered"><i className="bi bi-flower1"></i> Emprendedor Artesano</span>;
        }
        return <span className="badge-artisan-status status-shipped"><i className="bi bi-person-fill"></i> Comprador</span>;
    };

    if (loading) return <Loader />;

    return (
        <div className="container page-shell">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">
                        <i className="bi bi-people"></i> Directorio de Comunidad
                    </span>
                    <h1>Gestión de Usuarios</h1>
                    <p>Administra las cuentas de clientes, emprendedores artesanos y equipo de administración de EDAYO.</p>
                </div>
                <button 
                    className="btn btn-primary btn-sm" 
                    onClick={() => { setShowForm(!showForm); setEditing(null); setFormData({ name: '', email: '', password: '', role: 'cliente' }); }}
                >
                    {showForm ? <><i className="bi bi-x-lg"></i> Cancelar</> : <><i className="bi bi-person-plus"></i> + Nuevo Usuario</>}
                </button>
            </div>

            {showForm && (
                <div className="card shadow-sm border mb-4">
                    <div className="card-body p-4">
                        <h4 className="mb-3 d-flex align-items-center gap-2">
                            <i className="bi bi-person-badge text-primary"></i>
                            {editing ? 'Editar Usuario' : 'Registrar Nuevo Miembro'}
                        </h4>
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label">Nombre completo o del taller</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={formData.name} 
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                                        required 
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Correo electrónico</label>
                                    <input 
                                        type="email" 
                                        className="form-control" 
                                        value={formData.email} 
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                                        required 
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Contraseña {editing && <span className="text-muted fw-normal">(dejar en blanco para conservar)</span>}</label>
                                    <input 
                                        type="password" 
                                        className="form-control" 
                                        value={formData.password} 
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                                        required={!editing} 
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Rol en la plataforma</label>
                                    <select 
                                        className="form-select" 
                                        value={formData.role} 
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="cliente">Comprador (Cliente)</option>
                                        <option value="empleador">Emprendedor Artesano</option>
                                        <option value="admin">Administrador General</option>
                                    </select>
                                </div>
                                <div className="col-12 d-flex gap-2 pt-2">
                                    <button type="submit" className="btn btn-primary">
                                        <i className="bi bi-check2"></i> {editing ? 'Actualizar Usuario' : 'Crear Usuario'}
                                    </button>
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowForm(false); setEditing(null); }}>
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="table-responsive shadow-sm">
                <table className="table table-hover">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre o Taller</th>
                            <th>Correo Electrónico</th>
                            <th>Rol</th>
                            <th>Ubicación</th>
                            <th>Fecha de Registro</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td><span className="text-muted small">#{user.id}</span></td>
                                <td><strong className="text-dark">{user.name}</strong></td>
                                <td><span className="text-muted small">{user.email}</span></td>
                                <td>{getRoleBadge(user.role)}</td>
                                <td>
                                    <span className="small text-muted">
                                        {user.location ? <><i className="bi bi-geo-alt text-warning me-1"></i>{user.location}</> : '-'}
                                    </span>
                                </td>
                                <td className="small text-muted">
                                    <i className="bi bi-calendar3 me-1"></i>
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td>
                                    <div className="d-flex gap-1">
                                        <button 
                                            className="btn btn-sm btn-outline-secondary" 
                                            onClick={() => editUser(user)}
                                            title="Editar usuario"
                                        >
                                            <i className="bi bi-pencil-square text-primary"></i>
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-outline-danger" 
                                            onClick={() => handleDelete(user.id)}
                                            disabled={user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1}
                                            title="Eliminar usuario"
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
        </div>
    );
};

export default Users;