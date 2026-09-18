import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Componentes comunes
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Páginas públicas
import Home from './pages/public/Home';
import ProductDetail from './pages/public/ProductDetail';
import Cart from './pages/public/Cart';
import Checkout from './pages/public/Checkout';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import CustomerOrders from './pages/public/CustomerOrders';
import EntrepreneurProfile from './pages/public/EntrepreneurProfile';

// Páginas admin
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Orders from './pages/admin/Orders';
import Users from './pages/admin/Users';
import Reports from './pages/admin/Reports';
import Profile from './pages/admin/Profile';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="text-center mt-5">Cargando...</div>;
    if (!user) return <Navigate to="/login" />;
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" />;
    }
    return children;
};

function AppRoutes() {
    return (
        <Router>
            <Navbar />
            <main style={{ minHeight: 'calc(100vh - 160px)' }}>
                <Routes>
                    {/* Rutas públicas */}
                    <Route path="/" element={<Home />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/orders" element={<PrivateRoute allowedRoles={['cliente', 'empleador', 'usuario']}><CustomerOrders /></PrivateRoute>} />
                    <Route path="/cliente/orders" element={<PrivateRoute allowedRoles={['cliente', 'empleador', 'usuario']}><CustomerOrders /></PrivateRoute>} />
                    <Route path="/clientes/orders" element={<PrivateRoute allowedRoles={['cliente', 'empleador', 'usuario']}><CustomerOrders /></PrivateRoute>} />
                    <Route path="/entrepreneur/:id" element={<EntrepreneurProfile />} />
                    
                    {/* Rutas protegidas */}
                    <Route path="/checkout" element={
                        <PrivateRoute allowedRoles={['cliente', 'empleador', 'usuario']}>
                            <Checkout />
                        </PrivateRoute>
                    } />
                    
                    {/* Rutas administrativas */}
                    <Route path="/admin" element={
                        <PrivateRoute allowedRoles={['admin', 'empleador']}>
                            <Navigate to="/admin/dashboard" replace />
                        </PrivateRoute>
                    } />
                    <Route path="/emprendedor/dashboard" element={<PrivateRoute allowedRoles={['empleador', 'cliente', 'usuario']}><Dashboard /></PrivateRoute>} />
                    <Route path="/emprendedor/products" element={<PrivateRoute allowedRoles={['empleador', 'cliente', 'usuario']}><Products /></PrivateRoute>} />
                    <Route path="/emprendedor/orders" element={<PrivateRoute allowedRoles={['empleador', 'cliente', 'usuario']}><Orders /></PrivateRoute>} />
                    <Route path="/mis-productos" element={<PrivateRoute allowedRoles={['empleador', 'cliente', 'usuario']}><Products /></PrivateRoute>} />
                    <Route path="/mis-ventas" element={<PrivateRoute allowedRoles={['empleador', 'cliente', 'usuario']}><Dashboard /></PrivateRoute>} />
                    <Route path="/emprendedor/reports" element={<PrivateRoute allowedRoles={['empleador']}><Reports /></PrivateRoute>} />
                    <Route path="/admin/dashboard" element={
                        <PrivateRoute allowedRoles={['admin', 'empleador']}>
                            <Dashboard />
                        </PrivateRoute>
                    } />
                    <Route path="/admin/products" element={
                        <PrivateRoute allowedRoles={['admin', 'empleador']}>
                            <Products />
                        </PrivateRoute>
                    } />
                    <Route path="/admin/orders" element={
                        <PrivateRoute allowedRoles={['admin', 'empleador']}>
                            <Orders />
                        </PrivateRoute>
                    } />
                    <Route path="/admin/users" element={
                        <PrivateRoute allowedRoles={['admin']}>
                            <Users />
                        </PrivateRoute>
                    } />
                    <Route path="/admin/reports" element={
                        <PrivateRoute allowedRoles={['admin', 'empleador']}>
                            <Reports />
                        </PrivateRoute>
                    } />
                    <Route path="/admin/profile" element={<PrivateRoute allowedRoles={['empleador', 'cliente', 'usuario']}><Profile /></PrivateRoute>} />
                    <Route path="/mi-perfil" element={<PrivateRoute allowedRoles={['empleador', 'cliente', 'usuario']}><Profile /></PrivateRoute>} />
                </Routes>
            </main>
            <Footer />
        </Router>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

export default App;