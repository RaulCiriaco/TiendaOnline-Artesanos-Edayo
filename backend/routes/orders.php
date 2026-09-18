<?php
require_once dirname(__DIR__) . '/controllers/OrderController.php';

$userData = authorize(['admin', 'empleador', 'cliente', 'usuario']);

switch ($method) {
    case 'GET':
        if ($id === 'stats') {
            if (!in_array($userData['role'], ['admin', 'empleador', 'cliente', 'usuario'], true)) sendError('No tienes permisos para consultar estadísticas', 403);
            OrderController::getStats($_GET['year'] ?? null, $userData['id'], $userData['role']);
        } elseif ($id) {
            OrderController::getOrder($id, $userData['id'], $userData['role']);
        } else {
            OrderController::getOrders($userData['id'], $userData['role'], $_GET['view'] ?? 'buyer');
        }
        break;
    case 'POST':
        if ($id === 'create') {
            if (!in_array($userData['role'], ['cliente', 'empleador', 'usuario'], true)) sendError('Solo los usuarios de la comunidad pueden crear pedidos', 403);
            OrderController::createOrder($input, $userData['id']);
        } elseif ($id && isset($_FILES['receipt'])) {
            OrderController::uploadPaymentReceipt($id, $userData['id'], $userData['role'], $_FILES['receipt']);
        } else {
            sendError('Ruta no encontrada', 404);
        }
        break;
    case 'PUT':
        if (!$id) sendError('ID requerido');
        if (empty($input['status'])) sendError('Estado requerido');
        OrderController::updateOrderStatus($id, $input['status'], $userData['id'], $userData['role']);
        break;
    default:
        sendError('Método no permitido', 405);
        break;
}
?>