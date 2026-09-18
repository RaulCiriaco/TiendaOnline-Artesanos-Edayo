<?php
require_once dirname(__DIR__) . '/models/Order.php';
require_once dirname(__DIR__) . '/models/Product.php';
require_once dirname(__DIR__) . '/models/User.php';
require_once dirname(__DIR__) . '/utils/response.php';
require_once dirname(__DIR__) . '/utils/email.php';
require_once dirname(__DIR__) . '/utils/upload.php';

class OrderController {
    public static function getStats($year = null, $userId = null, $role = 'admin') {
        global $pdo;
        $orderModel = new Order($pdo);
        $scopeId = $role === 'admin' ? null : $userId;
        sendResponse([
            'total_sales' => $orderModel->getTotalSales($year, $scopeId),
            'monthly_sales' => $orderModel->getSalesByMonth($year, $scopeId),
            'status_summary' => $orderModel->getStatusSummary($scopeId),
            'entrepreneur_sales' => $scopeId
                ? $orderModel->getSalesByEmployer($year, $scopeId)
                : $orderModel->getSalesByEntrepreneur($year),
            'best_sellers' => (new Product($pdo))->getBestSellers(10, $scopeId)
        ]);
    }
    public static function getOrders($userId, $role, $view = 'buyer') {
        global $pdo;
        $orderModel = new Order($pdo);
        if ($role === 'admin') {
            $orders = $orderModel->getAll();
        } elseif ($view === 'seller') {
            $orders = $orderModel->getByEntrepreneur($userId);
        } else {
            $orders = $orderModel->getByClient($userId);
        }
        sendResponse($orders);
    }

    public static function getOrder($id, $userId, $role) {
        global $pdo;
        $orderModel = new Order($pdo);
        $order = $orderModel->getById($id);
        if (!$order) sendError('Pedido no encontrado', 404);
        if ($role !== 'admin') {
            if ($role === 'empleador') {
                if (!$orderModel->hasEntrepreneurProducts($id, $userId)) {
                    sendError('No tienes permiso para ver este pedido', 403);
                }
                $order = $orderModel->scopeOrderToEntrepreneur($order, $userId);
            }
            if ($role === 'cliente' && $order['user_id'] != $userId) {
                sendError('No tienes permiso para ver este pedido', 403);
            }
            if ($role === 'cliente') unset($order['payment_receipt']);
        }
        sendResponse($order);
    }

    public static function createOrder($data, $userId) {
        global $pdo;
        if (empty($data['products'])) sendError("El campo 'products' es requerido");
        if (!is_array($data['products']) || empty($data['products'])) {
            sendError('El carrito está vacío');
        }
        $productModel = new Product($pdo);
        $orderModel = new Order($pdo);
        $calculatedTotal = 0;
        try {
            $pdo->beginTransaction();
            foreach ($data['products'] as &$item) {
                if (!isset($item['product_id']) || !filter_var($item['quantity'] ?? null, FILTER_VALIDATE_INT) || $item['quantity'] < 1) {
                    throw new InvalidArgumentException('Datos de producto inválidos');
                }
                $stmt = $pdo->prepare('SELECT p.id, p.name, p.price, p.images, p.entrepreneur_id, u.name as seller_name, u.location as entrepreneur_location, u.maps_url as seller_maps_url, u.profile_image as seller_image FROM products p LEFT JOIN users u ON u.id = p.entrepreneur_id WHERE p.id = ?');
                $stmt->execute([$item['product_id']]);
                $product = $stmt->fetch();
                if (!$product) {
                    throw new InvalidArgumentException("Producto no encontrado: {$item['product_id']}");
                }
                $item['name'] = $product['name'];
                $item['entrepreneur_id'] = $product['entrepreneur_id'];
                $item['price'] = (float) $product['price'];
                $item['seller_location'] = $product['entrepreneur_location'] ?: 'Ubicación pendiente de confirmar con el taller';
                $item['seller_maps_url'] = $product['seller_maps_url'];
                $item['images'] = json_decode($product['images'], true) ?: [];
                $item['seller_name'] = $product['seller_name'] ?: 'Taller artesanal';
                $item['seller_image'] = $product['seller_image'];
                $calculatedTotal += $item['price'] * $item['quantity'];
            }
            $locations = array_values(array_unique(array_map(
                static fn($item) => $item['seller_location'],
                $data['products']
            )));
            $orderData = [
                'user_id' => $userId,
                'products' => $data['products'],
                'total' => $calculatedTotal,
                'shipping_address' => implode(' | ', $locations),
                'payment_method' => 'Pago en tienda'
            ];
            if (!$orderModel->create($orderData)) throw new RuntimeException('Error al crear el pedido');
            $orderId = $pdo->lastInsertId();
            $pdo->commit();
        } catch (Throwable $error) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            sendError($error->getMessage(), $error instanceof InvalidArgumentException ? 400 : 500);
        }
        if ($orderId) {
            $client = (new User($pdo))->getById($userId);
            if ($client) {
                sendOrderConfirmation($client['email'], $client['name'], $orderId, $calculatedTotal, $data['products']);
                $employers = [];
                foreach ($data['products'] as $item) {
                    if (!empty($item['entrepreneur_id'])) $employers[$item['entrepreneur_id']] = true;
                }
                foreach (array_keys($employers) as $employerId) {
                    $employer = (new User($pdo))->getById($employerId);
                    if ($employer) sendEmployerOrderNotification($employer['email'], $employer['name'], $orderId, $client['name'], $calculatedTotal, $data['products']);
                }
            }
            sendResponse(['message' => 'Pedido creado', 'order_id' => $orderId]);
        }
        sendError('Error al crear el pedido', 500);
    }

    public static function updateOrderStatus($id, $status, $userId, $role) {
        global $pdo;
        $allowed = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
        if (!in_array($status, $allowed)) sendError('Estado no válido');
        $orderModel = new Order($pdo);
        $order = $orderModel->getById($id);
        if (!$order) sendError('Pedido no encontrado', 404);
        $transitions = [
            'pending' => ['paid', 'cancelled'],
            'paid' => ['delivered', 'cancelled'],
            'shipped' => [],
            'delivered' => [],
            'cancelled' => []
        ];
        if (!in_array($status, $transitions[$order['status']] ?? [], true)) {
            sendError('Transición de estado no permitida', 400);
        }
        if ($role !== 'admin') {
            if (!$orderModel->hasEntrepreneurProducts($id, $userId)) {
                sendError('No tienes permiso para modificar este pedido', 403);
            }
        }
        try {
            $updated = $status === 'paid'
                ? $orderModel->commitStockAndUpdateStatus($order, $status)
                : $orderModel->updateStatus($id, $status);
        } catch (Throwable $error) {
            sendError($error->getMessage(), $error instanceof InvalidArgumentException ? 400 : 500);
        }
        if ($updated) {
            if ($order['client_email']) {
                sendOrderStatusUpdate($order['client_email'], $order['client_name'], $id, $status);
            }
            sendResponse(['message' => 'Estado del pedido actualizado']);
        }
        sendError('Error al actualizar el estado', 500);
    }

    public static function uploadPaymentReceipt($id, $userId, $role, $file) {
        global $pdo;
        $orderModel = new Order($pdo);
        $order = $orderModel->getById($id);
        if (!$order) sendError('Pedido no encontrado', 404);
        if ($role !== 'admin' && !$orderModel->hasEntrepreneurProducts($id, $userId)) {
            sendError('No tienes permiso para adjuntar este comprobante', 403);
        }
        if (!$file) sendError('Debes seleccionar una imagen');
        $images = processUploadedImages($file, 'receipts');
        if (empty($images)) sendError('La imagen del comprobante no es válida');
        if ($orderModel->updatePaymentReceipt($id, $images[0])) {
            sendResponse(['message' => 'Comprobante guardado', 'payment_receipt' => $images[0]]);
        }
        sendError('No se pudo guardar el comprobante', 500);
    }
}
?>