# ============================================
# DOCKERFILE PARA DESPLIEGUE EN RENDER
# ============================================

# Usar imagen oficial de PHP con Apache
FROM php:8.0-apache

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# ============================================
# INSTALAR EXTENSIONES DE PHP
# ============================================
RUN docker-php-ext-install pdo_mysql mysqli

# Habilitar mod_rewrite para URLs amigables
RUN a2enmod rewrite

# ============================================
# CONFIGURAR APACHE
# ============================================
# Configurar ServerName para evitar warning
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

# Configurar el archivo de configuración de Apache para permitir .htaccess
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# ============================================
# COPIAR ARCHIVOS DEL PROYECTO
# ============================================
COPY . /var/www/html/

RUN composer install --no-dev --optimize-autoloader --no-interaction

# ============================================
# CONFIGURAR PERMISOS
# ============================================
RUN chown -R www-data:www-data /var/www/html
RUN chmod -R 755 /var/www/html

# ============================================
# PUERTO DE EXPOSICIÓN
# ============================================
EXPOSE 80

# ============================================
# COMANDO DE INICIO
# ============================================
CMD ["apache2-foreground"]