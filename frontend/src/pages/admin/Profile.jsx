import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Loader from '../../components/common/Loader';
import Swal from 'sweetalert2';

const Profile = () => {
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({ name: '', bio: '', location: '', maps_url: '', profile_image: null });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get(`/entrepreneurs/${savedUser.id}`)
            .then(({ data }) => {
                setProfile(data);
                setFormData({ name: data.name || '', bio: data.bio || '', location: data.location || '', maps_url: data.maps_url || '', profile_image: null });
            })
            .catch(() => setProfile({ name: savedUser.name || '', bio: '', location: '', products: [] }))
            .finally(() => setLoading(false));
    }, [savedUser.id, savedUser.name]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        const payload = new FormData();
        payload.append('name', formData.name);
        payload.append('bio', formData.bio);
        payload.append('location', formData.location);
        payload.append('maps_url', formData.maps_url);
        if (formData.profile_image) payload.append('profile_image', formData.profile_image);
        try {
            const { data } = await api.post('/profile', payload);
            const updatedUser = { ...savedUser, name: data.user.name };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setProfile({ ...profile, ...data.user });
            Swal.fire('Perfil actualizado', 'Tu perfil público ya está actualizado.', 'success');
        } catch (error) {
            Swal.fire('Error', error.response?.data?.error || 'No se pudo guardar el perfil.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="container page-shell">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">
                        <i className="bi bi-person-badge"></i> Identidad Artesanal
                    </span>
                        <h1>Mi Perfil y Ubicación del Taller</h1>
                        <p>Actualiza tus datos personales y la ubicación donde tus compradores podrán recoger sus pedidos.</p>
                </div>
                <Link className="btn btn-outline-primary btn-sm" to={`/entrepreneur/${savedUser.id}`}>
                    <i className="bi bi-box-arrow-up-right"></i> Ver mi escaparate público
                </Link>
            </div>

            <div className="row g-4">
                <div className="col-lg-7">
                    <div className="card shadow-sm p-4">
                        <h4 className="mb-3 d-flex align-items-center gap-2">
                            <i className="bi bi-pencil-square text-primary"></i> Información de tu Taller
                        </h4>
                        <p className="text-muted small mb-4">
                            Los datos guardados aquí aparecerán en tu página pública de artesano ante los compradores.
                        </p>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">
                                    <i className="bi bi-shop me-1 text-primary"></i> Nombre del Emprendimiento o Taller
                                </label>
                                <input
                                    className="form-control"
                                    placeholder="Ej. Taller Textil Manos Mágicas"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label"><i className="bi bi-map me-1 text-success"></i> Enlace de Google Maps</label>
                                <input
                                    className="form-control"
                                    type="url"
                                    placeholder="https://maps.google.com/..."
                                    value={formData.maps_url}
                                    onChange={(e) => setFormData({ ...formData, maps_url: e.target.value })}
                                />
                                <small className="text-muted">En Google Maps elige tu taller, pulsa Compartir y pega aquí el enlace.</small>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">
                                    <i className="bi bi-geo-alt me-1 text-danger"></i> Ubicación / Municipio
                                </label>
                                <input
                                    className="form-control"
                                    placeholder="Ej. Jilotepec, Estado de México"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">
                                    <i className="bi bi-chat-heart me-1 text-warning"></i> Historia, Técnicas y Biografía
                                </label>
                                <textarea
                                    className="form-control"
                                    rows="5"
                                    placeholder="Comparte cómo nació tu pasión por este oficio, qué materiales empleas y qué hace únicas a tus piezas..."
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="form-label">
                                    <i className="bi bi-camera me-1 text-info"></i> Fotografía del Artesano o Logotipo del Taller
                                </label>
                                <input
                                    className="form-control"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={(e) => setFormData({ ...formData, profile_image: e.target.files[0] })}
                                />
                                <small className="text-muted">Recomendado: Imagen cuadrada de buena iluminación.</small>
                            </div>

                            <button className="btn btn-primary" disabled={saving}>
                                <i className="bi bi-save2-fill"></i>
                                {saving ? 'Guardando cambios...' : 'Guardar y Publicar Perfil'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="col-lg-5">
                    <div className="card shadow-sm p-4 sticky-top" style={{ top: '2rem' }}>
                        <span className="eyebrow mb-3 align-self-start">
                            <i className="bi bi-eye"></i> Vista Previa en Vivo
                        </span>
                        <div className="profile-preview">
                            <img
                                src={profile?.profile_image || 'https://via.placeholder.com/120?text=Taller'}
                                alt="Vista previa del perfil"
                            />
                            <h3 className="mb-1 text-dark">{formData.name || 'Nombre de tu Taller'}</h3>
                            <p className="text-muted small mb-3">
                                <i className="bi bi-geo-alt-fill text-warning me-1"></i>
                                {formData.location || 'Jilotepec, Estado de México'}
                            </p>
                            {formData.maps_url && <a className="btn btn-sm btn-outline-success mb-3" href={formData.maps_url} target="_blank" rel="noreferrer"><i className="bi bi-map me-1"></i> Ver ubicación en Google Maps</a>}
                            <div className="profile-bio fst-italic p-3 rounded bg-light border mb-3 small text-muted">
                                "{formData.bio || 'Aquí aparecerá la historia de tu taller y tu pasión por la artesanía.'}"
                            </div>
                            <div className="stat-line d-flex align-items-center justify-content-center gap-2">
                                <span className="badge-artisan-status status-delivered fs-6">
                                    <i className="bi bi-palette-fill"></i> {profile?.products?.length || 0} piezas en catálogo
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
