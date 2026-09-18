<?php
require_once dirname(__DIR__) . '/models/Category.php';
require_once dirname(__DIR__) . '/utils/response.php';

class CategoryController {
    public static function getCategories() {
        global $pdo;
        $categoryModel = new Category($pdo);
        sendResponse($categoryModel->getAll());
    }

    public static function getCategory($id) {
        global $pdo;
        $categoryModel = new Category($pdo);
        $category = $categoryModel->getById($id);
        if (!$category) sendError('Categoría no encontrada', 404);
        sendResponse($category);
    }

    public static function createCategory($data) {
        global $pdo;
        if (empty($data['name'])) sendError('El nombre es requerido');
        $categoryModel = new Category($pdo);
        if ($categoryModel->create($data)) {
            sendResponse(['message' => 'Categoría creada', 'id' => $pdo->lastInsertId()]);
        }
        sendError('Error al crear la categoría', 500);
    }

    public static function updateCategory($id, $data) {
        global $pdo;
        $categoryModel = new Category($pdo);
        $category = $categoryModel->getById($id);
        if (!$category) sendError('Categoría no encontrada', 404);
        if ($categoryModel->update($id, $data)) {
            sendResponse(['message' => 'Categoría actualizada']);
        }
        sendError('Error al actualizar la categoría', 500);
    }

    public static function deleteCategory($id) {
        global $pdo;
        $categoryModel = new Category($pdo);
        $category = $categoryModel->getById($id);
        if (!$category) sendError('Categoría no encontrada', 404);
        if ($categoryModel->hasProducts($id)) {
            sendError('No se puede eliminar la categoría porque tiene productos asociados', 400);
        }
        if ($categoryModel->delete($id)) {
            sendResponse(['message' => 'Categoría eliminada']);
        }
        sendError('Error al eliminar la categoría', 500);
    }
}
?>