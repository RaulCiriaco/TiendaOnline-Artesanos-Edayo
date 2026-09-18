<?php
/**
 * Punto de entrada de la API REST
 * Maneja el enrutamiento de todas las peticiones
 */

// ============================================
// 1. CARGAR VARIABLES DE ENTORNO (.env)
// ============================================
require_once __DIR__ . '/utils/env.php';

// ============================================
// 2. CONFIGURACIÓN DE HEADERS
// ============================================
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Manejar preflight (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ============================================
// 3. CARGAR DEPENDENCIAS Y CONFIGURACIÓN
// ============================================
require_once 'config/database.php';
require_once 'middleware/auth.php';
require_once 'utils/response.php';

// ============================================
// 4. OBTENER RUTA SOLICITADA (CORREGIDO)
// ============================================
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Eliminar cualquier prefijo de la URL (como /TiendaOnlineRopa/backend/)
$path = ltrim($path, '/');
$segments = explode('/', $path);

// Buscar el recurso después de /backend/
$backendIndex = array_search('backend', $segments);
if ($backendIndex !== false && isset($segments[$backendIndex + 1])) {
    // Si hay algo después de backend/, usarlo como recurso
    $resource = $segments[$backendIndex + 1];
    $id = isset($segments[$backendIndex + 2]) ? $segments[$backendIndex + 2] : null;
} else {
    // Si no hay /backend/, usar el primer segmento
    $resource = $segments[0] ?? '';
    $id = $segments[1] ?? null;
}

// Si la URL termina con /backend/index.php o /backend/, mostrar la raíz
if (empty($resource) || $resource === 'index.php') {
    $resource = '';
}

// ============================================
// 5. OBTENER MÉTODO HTTP Y DATOS
// ============================================
$method = $_SERVER['REQUEST_METHOD'];
$input = stripos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') === 0
    ? $_POST
    : (json_decode(file_get_contents('php://input'), true) ?: []);

// ============================================
// 6. REGISTRO DE PETICIONES (DEBUG)
// ============================================
if (getenv('APP_DEBUG') === 'true') {
    error_log("Request: $method /$resource" . ($id ? "/$id" : ""));
    error_log("URI: $request_uri");
    error_log("Resource: $resource, ID: $id");
}

// ============================================
// 7. ENRUTAMIENTO
// ============================================
switch ($resource) {
    case 'auth':
        require_once 'routes/auth.php';
        break;
        
    case 'products':
        require_once 'routes/products.php';
        break;
        
    case 'orders':
        require_once 'routes/orders.php';
        break;
        
    case 'users':
        require_once 'routes/users.php';
        break;
        
    case 'categories':
        require_once 'routes/categories.php';
        break;

    case 'entrepreneurs':
        require_once 'routes/entrepreneurs.php';
        break;

    case 'profile':
        require_once 'routes/profile.php';
        break;
        
    case '':
    case 'index.php':
        // Ruta raíz - mostrar información de la API
        sendResponse([
            'name' => 'Tienda Emprendedores API',
            'version' => '1.0.0',
            'status' => 'running',
            'endpoints' => [
                'auth' => '/auth/login, /auth/register',
                'products' => '/products, /products/{id}',
                'orders' => '/orders, /orders/{id}, /orders/create',
                'users' => '/users (admin only)',
                'categories' => '/categories'
            ]
        ]);
        break;
        
    default:
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Recurso no encontrado',
            'resource' => $resource
        ]);
        break;
}
?>