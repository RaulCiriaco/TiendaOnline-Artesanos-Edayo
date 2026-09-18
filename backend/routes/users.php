<?php
require_once dirname(__DIR__) . '/controllers/UserController.php';

$userData = authorize(['admin']);

switch ($method) {
    case 'GET':
        if ($id) {
            UserController::getUser($id);
        } else {
            UserController::getUsers();
        }
        break;
    case 'POST':
        UserController::createUser($input);
        break;
    case 'PUT':
        if (!$id) sendError('ID requerido');
        UserController::updateUser($id, $input);
        break;
    case 'DELETE':
        if (!$id) sendError('ID requerido');
        UserController::deleteUser($id);
        break;
    default:
        sendError('Método no permitido', 405);
        break;
}
?>