 # Tienda Online de Ropa

Aplicacion de comercio electronico con frontend React/Vite, API REST en PHP y MySQL.

## Requisitos

- Docker Desktop, o Node.js 20+, PHP 8+ y MySQL 8+ para ejecutar los servicios por separado.

## Ejecucion con Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:5174
- API: http://localhost:8082
- MySQL: localhost:3310

La base de datos se inicializa automaticamente con `sql/tienda.sql` en el primer arranque.

## Ejecucion local del frontend

```bash
npm install
npm run dev
```

Para usar otra URL de API, define `VITE_API_URL` antes de iniciar Vite.

## Usuarios de prueba

- Administrador: `admin@edayo.edu.mx`
- Emprendedor: `maria@artesana.com`
- Cliente: `cliente@prueba.com`

La contrasena configurada para los usuarios de prueba es `admin123`.
La contrasena configurada para los usuarios de prueba es `password`.

## Cuenta de la comunidad

Una misma cuenta puede comprar, publicar productos y consultar sus compras y ventas. El registro ya no solicita elegir entre comprador y emprendedor.

1. Registra una cuenta o inicia sesion con correo y contrasena.
2. Abre `Mis productos` para publicar y administrar tus piezas.
3. Abre `Mis compras` para consultar tus pedidos realizados.
4. Abre `Mis ventas` para gestionar pedidos que contienen tus productos.

## Inicio de sesion con Google

1. Crea un OAuth Client ID de tipo Web en Google Cloud Console.
2. Agrega `http://localhost:5174` como origen autorizado.
3. Define `GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com` en el entorno antes de ejecutar Docker.
4. Reconstruye los servicios con `docker compose up --build`.

El backend valida el `credential` de Google y vincula la cuenta por su email verificado o por su identificador de Google.

Los reportes permiten descargar CSV y PDF desde `Admin > Reportes`. El comprador descarga su comprobante PDF automaticamente al finalizar una compra.
