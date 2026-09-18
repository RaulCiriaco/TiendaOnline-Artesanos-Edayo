<?php
require_once dirname(__DIR__) . '/controllers/UserController.php';

$userData = authorize(['admin', 'empleador', 'cliente', 'usuario']);
if ($method !== 'POST') sendError('Método no permitido', 405);
UserController::updateProfile($userData['id'], $input, $_FILES['profile_image'] ?? null);
?>