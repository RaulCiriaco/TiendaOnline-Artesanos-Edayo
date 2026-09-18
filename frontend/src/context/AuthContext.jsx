import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';
import Swal from 'sweetalert2';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            setUser(JSON.parse(userData));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            Swal.fire('¡Bienvenido!', `Hola ${user.name}`, 'success');
            return { success: true };
        } catch (error) {
            Swal.fire('Error', error.response?.data?.error || 'Credenciales incorrectas', 'error');
            return { success: false };
        }
    };

    const loginWithGoogle = async (credential) => {
        try {
            const response = await api.post('/auth/google', { credential });
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            return { success: true };
        } catch (error) {
            Swal.fire('Error', error.response?.data?.error || 'No se pudo iniciar sesión con Google', 'error');
            return { success: false };
        }
    };

    const register = async (name, email, password, role = 'cliente') => {
        try {
            await api.post('/auth/register', { name, email, password, role });
            Swal.fire('Registro exitoso', 'Ahora puedes iniciar sesión', 'success');
            return { success: true };
        } catch (error) {
            Swal.fire('Error', error.response?.data?.error || 'Error en el registro', 'error');
            return { success: false };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        Swal.fire('Sesión cerrada', 'Hasta luego', 'info');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);