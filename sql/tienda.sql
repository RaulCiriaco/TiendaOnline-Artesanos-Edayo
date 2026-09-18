
-- =============================================================
-- TIENDA ONLINE DE ROPA
-- Instalacion limpia para MySQL 8.0+
--
-- Este archivo borra y recrea las tablas de la aplicacion.
-- Usarlo solo al instalar o reiniciar la base de desarrollo.
-- =============================================================

CREATE DATABASE IF NOT EXISTS tienda_emprendedores
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE tienda_emprendedores;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================
-- USUARIOS
-- Roles de la aplicacion: admin, empleador y cliente.
-- =============================================================
CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NULL,
    role ENUM('admin', 'empleador', 'cliente') NOT NULL DEFAULT 'cliente',
    google_sub VARCHAR(255) NULL UNIQUE,
    maps_url VARCHAR(500) NULL,
    bio TEXT NULL,
    location VARCHAR(100) NULL,
    profile_image VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- =============================================================
-- CATEGORIAS
-- =============================================================
CREATE TABLE categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =============================================================
-- PRODUCTOS
-- entrepreneur_id se conserva porque es el nombre usado por la API.
-- =============================================================
CREATE TABLE products (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INT UNSIGNED NOT NULL DEFAULT 0,
    category_id INT UNSIGNED NULL,
    images JSON NOT NULL,
    entrepreneur_id INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_products_price CHECK (price > 0),
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_products_employer
        FOREIGN KEY (entrepreneur_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_products_stock (stock),
    INDEX idx_products_category (category_id),
    INDEX idx_products_employer (entrepreneur_id)
) ENGINE=InnoDB;

-- =============================================================
-- PEDIDOS
-- products guarda el detalle historico como JSON.
-- Cada item incluye product_id, name, quantity, price y entrepreneur_id.
-- =============================================================
CREATE TABLE orders (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    products JSON NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled')
        NOT NULL DEFAULT 'pending',
    shipping_address TEXT NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Pago en tienda',
    payment_receipt VARCHAR(500) NULL,
        stock_committed TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_orders_total CHECK (total >= 0),
    CONSTRAINT fk_orders_client
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_orders_client (user_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_created (created_at)
) ENGINE=InnoDB;

-- =============================================================
-- RESENAS
-- =============================================================
CREATE TABLE reviews (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    rating TINYINT UNSIGNED NOT NULL,
    comment TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT fk_reviews_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_reviews_product (product_id),
    INDEX idx_reviews_user (user_id)
) ENGINE=InnoDB;

-- =============================================================
-- DATOS DE PRUEBA
-- Las contrasenas corresponden a los comentarios de cada usuario.
-- =============================================================
INSERT INTO categories (name, description) VALUES
    ('Artesanias', 'Productos hechos a mano con tecnicas tradicionales'),
    ('Textiles', 'Ropa, bordados y tejidos artesanales'),
    ('Ceramica', 'Piezas de barro y ceramica'),
    ('Joyeria', 'Accesorios y joyas artesanales'),
    ('Alimentos', 'Productos alimenticios artesanales');

-- admin@edayo.edu.mx / admin123
INSERT INTO users (name, email, password, role) VALUES
    ('Administrador', 'admin@edayo.edu.mx',
     '$2y$10$k4zXnJmhJapu.zqp3u1QS.ca/9DGDnkReqMNGpIbtBCz0jh/p7PF.', 'admin');

-- maria@artesana.com / empleador123
INSERT INTO users (name, email, password, role, bio, location) VALUES
    ('Maria Artesana', 'maria@artesana.com',
     '$2y$10$Hj7ucYVNff5e65.eUiHkhe/yAYoSfquuOsvtPFXkQcN/MxU/oom8m',
     'empleador',
     'Artesana especialista en bordados y textiles tradicionales',
     'Jilotepec, Mexico');

-- cliente@prueba.com / cliente123
INSERT INTO users (name, email, password, role) VALUES
    ('Cliente Prueba', 'cliente@prueba.com',
    '$2y$10$WIMexYKKlmIrQHMWthIoC.Eq2AbpZsXaLD71hfVqcXvJdDa.QE1Mi', 'cliente');

INSERT INTO products
    (name, description, price, stock, category_id, images, entrepreneur_id)
VALUES
    ('Rebozo Tradicional', 'Rebozo artesanal bordado a mano.', 450.00, 10, 2,
     JSON_ARRAY('https://via.placeholder.com/300x300?text=Rebozo'), 2),
    ('Juego de Tazas de Barro', 'Set de 6 tazas de barro cocido a mano.', 350.00, 15, 3,
     JSON_ARRAY('https://via.placeholder.com/300x300?text=Tazas+Barro'), 2),
    ('Pulsera de Chaquira', 'Pulsera tejida con chaquira y disenos tradicionales.', 120.00, 20, 4,
     JSON_ARRAY('https://via.placeholder.com/300x300?text=Pulsera'), 2),
    ('Blusa Bordada', 'Blusa de manta con bordado tradicional a mano.', 580.00, 8, 2,
     JSON_ARRAY('https://via.placeholder.com/300x300?text=Blusa+Bordada'), 2),
    ('Collar de Filigrana', 'Collar artesanal con filigrana de plata.', 680.00, 5, 4,
     JSON_ARRAY('https://via.placeholder.com/300x300?text=Collar'), 2);

INSERT INTO reviews (product_id, user_id, rating, comment) VALUES
    (1, 3, 5, 'Excelente calidad, el bordado es hermoso.'),
    (2, 3, 4, 'Las tazas son muy bonitas y resistentes.'),
    (3, 3, 5, 'La pulsera es preciosa.');
USE tienda_emprendedores;

-- ============================================
-- TABLA: users (Usuarios)
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'empleador', 'cliente') DEFAULT 'cliente',
    bio TEXT,
    location VARCHAR(100),
    profile_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migración para instalaciones existentes: renombrar emprendedor a empleador.
-- Se incluyen ambos valores temporalmente para poder convertir los registros antiguos.
ALTER TABLE users MODIFY role ENUM('admin', 'emprendedor', 'empleador', 'cliente') DEFAULT 'cliente';
UPDATE users SET role = 'empleador' WHERE role = 'emprendedor';
ALTER TABLE users MODIFY role ENUM('admin', 'empleador', 'cliente') DEFAULT 'cliente';

-- ============================================
-- TABLA: categories (Categorías)
-- ============================================
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: products (Productos)
-- ============================================
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    category_id INT,
    images JSON,
    entrepreneur_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (entrepreneur_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- TABLA: orders (Pedidos)
-- ============================================
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    products JSON NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    shipping_address TEXT NOT NULL,
    payment_method VARCHAR(50),
    payment_receipt VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- TABLA: reviews (Reseñas)
-- ============================================
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- DATOS INICIALES (Pruebas)
-- ============================================

-- 1. Insertar categorías
INSERT INTO categories (name, description) VALUES
('Artesanías', 'Productos hechos a mano con técnicas tradicionales'),
('Textiles', 'Ropa, bordados y tejidos artesanales'),
('Cerámica', 'Piezas de barro y cerámica'),
('Joyería', 'Accesorios y joyas artesanales'),
('Alimentos', 'Productos alimenticios artesanales');

INSERT INTO users (name, email, password, role) VALUES
('Administrador', 'admin@edayo.edu.mx', '$2y$10$k4zXnJmhJapu.zqp3u1QS.ca/9DGDnkReqMNGpIbtBCz0jh/p7PF.', 'admin');

INSERT INTO users (name, email, password, role, bio, location) VALUES
('María Artesana', 'maria@artesana.com', '$2y$10$Hj7ucYVNff5e65.eUiHkhe/yAYoSfquuOsvtPFXkQcN/MxU/oom8m', 'empleador', 'Artesana desde hace 20 años, especialista en bordados y textiles tradicionales', 'Jilotepec, México');

INSERT INTO users (name, email, password, role) VALUES
('Cliente Prueba', 'cliente@prueba.com', '$2y$10$WIMexYKKlmIrQHMWthIoC.Eq2AbpZsXaLD71hfVqcXvJdDa.QE1Mi', 'cliente');

-- 5. Insertar productos de ejemplo
INSERT INTO products (name, description, price, stock, category_id, images, entrepreneur_id) VALUES
('Rebozo Tradicional', 'Rebozo artesanal bordado a mano con hilos de colores. Ideal para cualquier ocasión.', 450.00, 10, 2, '["https://via.placeholder.com/300x300?text=Rebozo"]', 2),
('Juego de Tazas de Barro', 'Set de 6 tazas de barro cocido a mano con diseños únicos.', 350.00, 15, 3, '["https://via.placeholder.com/300x300?text=Tazas+Barro"]', 2),
('Pulsera de Chaquira', 'Pulsera tejida con chaquira y diseños tradicionales de la comunidad.', 120.00, 20, 4, '["https://via.placeholder.com/300x300?text=Pulsera"]', 2),
('Blusa Bordada', 'Blusa de manta con bordado tradicional a mano. Talla única.', 580.00, 8, 2, '["https://via.placeholder.com/300x300?text=Blusa+Bordada"]', 2),
('Collar de Filiigrana', 'Collar artesanal con filigrana de plata y piedras semipreciosas.', 680.00, 5, 4, '["https://via.placeholder.com/300x300?text=Collar"]', 2);

-- 6. Insertar algunas reseñas de ejemplo
INSERT INTO reviews (product_id, user_id, rating, comment) VALUES
(1, 3, 5, 'Excelente calidad, el bordado es hermoso. Muy recomendado.'),
(2, 3, 4, 'Las tazas son muy bonitas y resistentes. El diseño es único.'),
(3, 3, 5, 'La pulsera es preciosa, me encanta. Llegó en perfecto estado.');