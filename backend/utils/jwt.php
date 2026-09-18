<?php
/**
 * Utilidad para manejo de JWT (JSON Web Tokens)
 * Generación, validación y extracción de tokens
 */

// Clave secreta para JWT (en producción usar variable de entorno)
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'tu_clave_secreta_super_segura_cambia_esto_en_produccion_123');

/**
 * Genera un token JWT con los datos del usuario
 * 
 * @param array $userData Datos del usuario (id, email, role, name)
 * @return string Token JWT
 */
function generateJWT($userData) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    
    $payload = json_encode([
        'id' => $userData['id'],
        'email' => $userData['email'],
        'role' => $userData['role'],
        'name' => $userData['name'],
        'iat' => time(),
        'exp' => time() + (60 * 60 * 24 * 30) // 30 días de validez
    ]);
    
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    $signature = hash_hmac('sha256', $base64UrlHeader . '.' . $base64UrlPayload, JWT_SECRET, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return $base64UrlHeader . '.' . $base64UrlPayload . '.' . $base64UrlSignature;
}

/**
 * Valida un token JWT y retorna los datos del payload
 * 
 * @param string $token Token JWT a validar
 * @return array|false Datos del usuario o false si es inválido
 */
function validateJWT($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return false;
    }
    
    list($header, $payload, $signature) = $parts;
    
    // Verificar firma
    $validSignature = hash_hmac('sha256', $header . '.' . $payload, JWT_SECRET, true);
    $validSignatureBase64 = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($validSignature));
    
    if ($signature !== $validSignatureBase64) {
        return false;
    }
    
    // Decodificar payload
    $payloadData = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload)), true);
    
    // Verificar expiración
    if (!$payloadData || (isset($payloadData['exp']) && $payloadData['exp'] < time())) {
        return false;
    }
    
    return $payloadData;
}

/**
 * Extrae el token JWT del header Authorization
 * 
 * @return string|null Token o null si no existe
 */
function getTokenFromHeader() {
    $headers = function_exists('apache_request_headers') ? apache_request_headers() : $_SERVER;
    
    // Buscar en diferentes formatos del header Authorization
    if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        if (preg_match('/Bearer\s(\S+)/', $_SERVER['HTTP_AUTHORIZATION'], $matches)) {
            return $matches[1];
        }
    }
    
    // Buscar en $_SERVER con prefijo REDIRECT_
    if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        if (preg_match('/Bearer\s(\S+)/', $_SERVER['REDIRECT_HTTP_AUTHORIZATION'], $matches)) {
            return $matches[1];
        }
    }
    
    return null;
}

/**
 * Obtiene los datos del usuario desde el token JWT
 * 
 * @return array|false Datos del usuario o false si no está autenticado
 */
function getCurrentUser() {
    $token = getTokenFromHeader();
    if (!$token) {
        return false;
    }
    return validateJWT($token);
}

/**
 * Refresca un token JWT (extiende su validez)
 * 
 * @param string $token Token actual
 * @return string|false Nuevo token o false si es inválido
 */
function refreshJWT($token) {
    $userData = validateJWT($token);
    if (!$userData) {
        return false;
    }
    // Eliminar datos de expiración para generar uno nuevo
    unset($userData['iat']);
    unset($userData['exp']);
    return generateJWT($userData);
}
?>