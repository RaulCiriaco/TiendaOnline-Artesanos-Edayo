<?php
require_once dirname(__DIR__) . '/controllers/UserController.php';

if ($method !== 'GET' || !$id) {
    sendError('Ruta no encontrada', 404);
}

UserController::getPublicProfile($id);
?>
