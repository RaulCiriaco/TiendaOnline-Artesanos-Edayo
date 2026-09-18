<?php
/**
 * Middleware de Autenticación y Autorización
 */

require_once dirname(__DIR__) . '/utils/jwt.php';
require_once dirname(__DIR__) . '/utils/response.php';

function authenticate() {
    $token = getTokenFromHeader();
    if (!$token) {
        sendError('Token no proporcionado', 401);
    }
    $userData = validateJWT($token);
    if (!$userData) {
        sendError('Token inválido o expirado', 401);
    }
    return $userData;
}

function authorize($allowedRoles = []) {
    $userData = authenticate();
    if (!empty($allowedRoles) && !in_array($userData['role'], $allowedRoles)) {
        sendError('No tienes permisos para realizar esta acción', 403);
    }
    return $userData;
}

function requireAdmin() {
    return authorize(['admin']);
}

function requireAdminOrEntrepreneur() {
    return authorize(['admin', 'empleador']);
}

function requireAnyRole() {
    return authorize(['admin', 'empleador', 'cliente']);
}
?>