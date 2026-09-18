<?php
require_once dirname(__DIR__) . '/models/Product.php';
require_once dirname(__DIR__) . '/utils/response.php';
require_once dirname(__DIR__) . '/utils/upload.php';

class ProductController {
    public static function getProducts() {
        global $pdo;
        $productModel = new Product($pdo);
        sendResponse($productModel->getAll());
    }

    public static function getProduct($id) {
        global $pdo;
        $productModel = new Product($pdo);
        $product = $productModel->getById($id);
        if (!$product) sendError('Producto no encontrado', 404);
        sendResponse($product);
    }

    public static function getProductsByEntrepreneur($entrepreneurId) {
        global $pdo;
        $productModel = new Product($pdo);
        sendResponse($productModel->getByEntrepreneur($entrepreneurId));
    }

    public static function createProduct($data, $entrepreneurId, $files = null) {
        global $pdo;
        foreach (['name', 'description', 'price', 'stock'] as $f) {
            if (!isset($data[$f]) || ($f !== 'stock' && trim((string) $data[$f]) === '') || ($f === 'stock' && $data[$f] === '')) sendError("El campo '$f' es requerido");
        }
        if (!is_numeric($data['price']) || $data['price'] <= 0) {
            sendError('El precio debe ser mayor a 0');
        }
        if (!is_numeric($data['stock']) || $data['stock'] < 0) {
            sendError('El stock debe ser mayor o igual a 0');
        }
        $productModel = new Product($pdo);
        $images = $files ? processUploadedImages($files) : ($data['images'] ?? []);
        $productData = [
            'name' => $data['name'],
            'description' => $data['description'],
            'price' => $data['price'],
            'stock' => $data['stock'],
            'category_id' => ($data['category_id'] ?? '') === '' ? null : $data['category_id'],
            'images' => $images,
            'entrepreneur_id' => $entrepreneurId
        ];
        if ($productModel->create($productData)) {
            sendResponse(['message' => 'Producto creado', 'id' => $pdo->lastInsertId()]);
        }
        sendError('Error al crear el producto', 500);
    }

    public static function updateProduct($id, $data, $userId, $role, $files = null) {
        global $pdo;
        if (array_key_exists('category_id', $data) && $data['category_id'] === '') {
            $data['category_id'] = null;
        }
        if (isset($data['price']) && (!is_numeric($data['price']) || $data['price'] <= 0)) {
            sendError('El precio debe ser mayor a 0');
        }
        if (isset($data['stock']) && (!filter_var($data['stock'], FILTER_VALIDATE_INT) && $data['stock'] !== '0' || $data['stock'] < 0)) {
            sendError('El stock debe ser un entero mayor o igual a 0');
        }
        $productModel = new Product($pdo);
        $product = $productModel->getById($id);
        if (!$product) sendError('Producto no encontrado', 404);
        if ($role !== 'admin' && $product['entrepreneur_id'] != $userId) {
            sendError('No tienes permiso para editar este producto', 403);
        }
        if ($files) {
            $data['images'] = processUploadedImages($files);
        }
        if ($productModel->update($id, $data)) {
            sendResponse(['message' => 'Producto actualizado']);
        }
        sendError('Error al actualizar el producto', 500);
    }

    public static function deleteProduct($id, $userId, $role) {
        global $pdo;
        $productModel = new Product($pdo);
        $product = $productModel->getById($id);
        if (!$product) sendError('Producto no encontrado', 404);
        if ($role !== 'admin' && $product['entrepreneur_id'] != $userId) {
            sendError('No tienes permiso para eliminar este producto', 403);
        }
        if ($productModel->delete($id)) {
            sendResponse(['message' => 'Producto eliminado']);
        }
        sendError('Error al eliminar el producto', 500);
    }
}
?>