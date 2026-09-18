<?php
require_once dirname(__DIR__) . '/controllers/CategoryController.php';

try { $userData = authenticate(); } catch (Exception $e) { $userData = null; }

switch ($method) {
    case 'GET':
        if ($id) {
            CategoryController::getCategory($id);
        } else {
            CategoryController::getCategories();
        }
        break;
    case 'POST':
        $userData = authorize(['admin']);
        CategoryController::createCategory($input);
        break;
    case 'PUT':
        $userData = authorize(['admin']);
        if (!$id) sendError('ID requerido');
        CategoryController::updateCategory($id, $input);
        break;
    case 'DELETE':
        $userData = authorize(['admin']);
        if (!$id) sendError('ID requerido');
        CategoryController::deleteCategory($id);
        break;
    default:
        sendError('Método no permitido', 405);
        break;
}
?>