<?php
require_once dirname(__DIR__) . '/controllers/AuthController.php';

switch ($method) {
    case 'POST':
        if ($id === 'login') {
            AuthController::login($input['email'] ?? '', $input['password'] ?? '');
        } elseif ($id === 'google') {
            AuthController::loginWithGoogle($input['credential'] ?? '');
        } elseif ($id === 'register') {
            AuthController::register(
                $input['name'] ?? '',
                $input['email'] ?? '',
                $input['password'] ?? '',
                $input['role'] ?? 'cliente'
            );
        } else {
            sendError('Ruta no encontrada', 404);
        }
        break;
    default:
        sendError('Método no permitido', 405);
        break;
}
?>