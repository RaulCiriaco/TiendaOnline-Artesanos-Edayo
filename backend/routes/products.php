<?php
require_once dirname(__DIR__) . '/controllers/ProductController.php';

switch ($method) {
    case 'GET':
        if (isset($_GET['mine']) && $_GET['mine'] === '1') {
            $userData = authorize(['admin', 'empleador', 'cliente', 'usuario']);
            global $pdo;
            if ($userData['role'] !== 'admin') {
                ProductController::getProductsByEntrepreneur($userData['id']);
            }
            sendResponse((new Product($pdo))->getAllWithNoStock());
        }
        if ($id) {
            ProductController::getProduct($id);
        } else {
            ProductController::getProducts();
        }
        break;
    case 'POST':
        $userData = authorize(['admin', 'empleador', 'cliente', 'usuario']);
        ProductController::createProduct($input, $userData['id'], $_FILES['images'] ?? null);
        break;
    case 'PUT':
        $userData = authorize(['admin', 'empleador', 'cliente', 'usuario']);
        if (!$id) sendError('ID requerido');
        ProductController::updateProduct($id, $input, $userData['id'], $userData['role'], $_FILES['images'] ?? null);
        break;
    case 'DELETE':
        $userData = authorize(['admin', 'empleador', 'cliente', 'usuario']);
        if (!$id) sendError('ID requerido');
        ProductController::deleteProduct($id, $userData['id'], $userData['role']);
        break;
    default:
        sendError('Método no permitido', 405);
        break;
}
?>