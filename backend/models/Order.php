<?php
/**
 * Modelo de Pedido
 * Representa la tabla 'orders' de la base de datos
 */
class Order {
    private $pdo;
    private $table = 'orders';

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    private function enrichProducts($products) {
        $productIds = array_values(array_unique(array_filter(array_map(
            static fn($product) => (int) ($product['product_id'] ?? 0),
            $products
        ))));
        if (!$productIds) return $products;
        $placeholders = implode(',', array_fill(0, count($productIds), '?'));
        $stmt = $this->pdo->prepare("SELECT p.id, p.images, u.id AS seller_id, u.name AS seller_name, u.location AS seller_location, u.maps_url AS seller_maps_url, u.profile_image AS seller_image FROM products p LEFT JOIN users u ON u.id = p.entrepreneur_id WHERE p.id IN ($placeholders)");
        $stmt->execute($productIds);
        $details = [];
        foreach ($stmt->fetchAll() as $detail) {
            $detail['images'] = json_decode($detail['images'], true) ?: [];
            $details[(int) $detail['id']] = $detail;
        }
        foreach ($products as &$product) {
            $detail = $details[(int) ($product['product_id'] ?? 0)] ?? [];
            $product['images'] = $product['images'] ?? ($detail['images'] ?? []);
            $product['seller_id'] = $product['seller_id'] ?? ($detail['seller_id'] ?? null);
            $product['seller_name'] = $product['seller_name'] ?? ($detail['seller_name'] ?? 'Taller artesanal');
            $product['seller_location'] = $product['seller_location'] ?? ($detail['seller_location'] ?? 'Ubicación pendiente');
            $product['seller_maps_url'] = $product['seller_maps_url'] ?? ($detail['seller_maps_url'] ?? null);
            $product['seller_image'] = $product['seller_image'] ?? ($detail['seller_image'] ?? null);
        }
        return $products;
    }

    public function getAll() {
        $stmt = $this->pdo->query("
            SELECT o.*, u.name as client_name, u.email as client_email 
            FROM {$this->table} o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        ");
        $orders = $stmt->fetchAll();
        foreach ($orders as &$order) {
            $order['products'] = $this->enrichProducts(json_decode($order['products'], true) ?: []);
        }
        return $orders;
    }

    public function getByEntrepreneur($entrepreneurId) {
        $stmt = $this->pdo->prepare("
            SELECT o.*, u.name as client_name, u.email as client_email 
            FROM {$this->table} o
            JOIN users u ON o.user_id = u.id
                WHERE EXISTS (
                    SELECT 1
                    FROM JSON_TABLE(o.products, '$[*]' COLUMNS (entrepreneur_id INT PATH '$.entrepreneur_id')) items
                    WHERE items.entrepreneur_id = ?
                )
            ORDER BY o.created_at DESC
        ");
        $stmt->execute([$entrepreneurId]);
        $orders = $stmt->fetchAll();
        foreach ($orders as &$order) {
            $order['products'] = $this->enrichProducts(json_decode($order['products'], true) ?: []);
            $order = $this->scopeOrderToEntrepreneur($order, $entrepreneurId);
        }
        return $orders;
    }

    public function getByClient($clientId) {
        $stmt = $this->pdo->prepare("
            SELECT o.*, u.name as client_name, u.email as client_email 
            FROM {$this->table} o
            JOIN users u ON o.user_id = u.id
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
        ");
        $stmt->execute([$clientId]);
        $orders = $stmt->fetchAll();
        foreach ($orders as &$order) {
            $order['products'] = $this->enrichProducts(json_decode($order['products'], true) ?: []);
            unset($order['payment_receipt']);
        }
        return $orders;
    }

    public function getById($id) {
        $stmt = $this->pdo->prepare("
            SELECT o.*, u.name as client_name, u.email as client_email 
            FROM {$this->table} o
            JOIN users u ON o.user_id = u.id
            WHERE o.id = ?
        ");
        $stmt->execute([$id]);
        $order = $stmt->fetch();
        if ($order) {
            $order['products'] = $this->enrichProducts(json_decode($order['products'], true) ?: []);
        }
        return $order;
    }

    public function scopeOrderToEntrepreneur($order, $entrepreneurId) {
        $order['products'] = array_values(array_filter(
            $order['products'],
            static fn($product) => (int) ($product['entrepreneur_id'] ?? 0) === (int) $entrepreneurId
        ));
        $order['employer_total'] = array_reduce(
            $order['products'],
            static fn($total, $product) => $total + ((float) ($product['price'] ?? 0) * (int) ($product['quantity'] ?? 0)),
            0
        );
        return $order;
    }

    public function hasEntrepreneurProducts($orderId, $entrepreneurId) {
        $stmt = $this->pdo->prepare("
            SELECT o.id FROM {$this->table} o
            WHERE o.id = ? AND EXISTS (
                SELECT 1
                FROM JSON_TABLE(o.products, '$[*]' COLUMNS (entrepreneur_id INT PATH '$.entrepreneur_id')) items
                WHERE items.entrepreneur_id = ?
            )
        ");
        $stmt->execute([$orderId, $entrepreneurId]);
        return $stmt->fetch() !== false;
    }

    public function create($data) {
        $stmt = $this->pdo->prepare("
            INSERT INTO {$this->table} (user_id, products, total, shipping_address, payment_method, status) 
            VALUES (?, ?, ?, ?, ?, 'pending')
        ");
        return $stmt->execute([
            $data['user_id'],
            json_encode($data['products']),
            $data['total'],
            $data['shipping_address'],
            $data['payment_method'] ?? 'Efectivo contra entrega'
        ]);
    }

    public function updateStatus($id, $status) {
        $stmt = $this->pdo->prepare("UPDATE {$this->table} SET status = ? WHERE id = ?");
        return $stmt->execute([$status, $id]);
    }

    public function commitStockAndUpdateStatus($order, $status) {
        $this->pdo->beginTransaction();
        try {
            if (!(int) $order['stock_committed']) {
                foreach ($order['products'] as $item) {
                    $stmt = $this->pdo->prepare('SELECT stock FROM products WHERE id = ? FOR UPDATE');
                    $stmt->execute([$item['product_id']]);
                    $stock = $stmt->fetchColumn();
                    if ($stock === false || (int) $stock < (int) $item['quantity']) {
                        throw new InvalidArgumentException("Stock insuficiente para {$item['name']} al confirmar el pago");
                    }
                    $update = $this->pdo->prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
                    $update->execute([(int) $item['quantity'], $item['product_id']]);
                }
            }
            $stmt = $this->pdo->prepare("UPDATE {$this->table} SET status = ?, stock_committed = 1 WHERE id = ?");
            $stmt->execute([$status, $order['id']]);
            $this->pdo->commit();
            return true;
        } catch (Throwable $error) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $error;
        }
    }

    public function updatePaymentReceipt($id, $receipt) {
        $stmt = $this->pdo->prepare("UPDATE {$this->table} SET payment_receipt = ? WHERE id = ?");
        return $stmt->execute([$receipt, $id]);
    }

    public function getSalesByMonth($year = null, $entrepreneurId = null) {
        $year = $year ?? date('Y');
        $sql = "
            SELECT 
                MONTH(o.created_at) as month,
                COUNT(*) as total_orders,
                SUM(o.total) as total_sales
            FROM {$this->table} o
            WHERE YEAR(o.created_at) = ? AND o.status IN ('paid', 'shipped', 'delivered')";
        if ($entrepreneurId !== null) {
            $sql .= " AND EXISTS (
                SELECT 1
                FROM JSON_TABLE(o.products, '$[*]' COLUMNS (entrepreneur_id INT PATH '$.entrepreneur_id')) items
                WHERE items.entrepreneur_id = ?
            )";
        }
        $sql .= "
            GROUP BY MONTH(o.created_at)
            ORDER BY month
        ";
        $stmt = $this->pdo->prepare($sql);
        $params = [$year];
        if ($entrepreneurId !== null) $params[] = $entrepreneurId;
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function getSalesByEntrepreneur($year = null) {
        $year = $year ?? date('Y');
        $stmt = $this->pdo->prepare("
            SELECT 
                u.id as entrepreneur_id,
                u.name as entrepreneur_name,
                COUNT(DISTINCT o.id) as total_orders,
                SUM(o.total) as total_sales
            FROM {$this->table} o
            JOIN JSON_TABLE(o.products, '$[*]' COLUMNS (entrepreneur_id INT PATH '$.entrepreneur_id')) items
            JOIN users u ON items.entrepreneur_id = u.id
            WHERE o.status IN ('paid', 'shipped', 'delivered') AND YEAR(o.created_at) = ?
            GROUP BY u.id
            ORDER BY total_sales DESC
        ");
        $stmt->execute([$year]);
        return $stmt->fetchAll();
    }

    public function getTotalSales($year = null, $entrepreneurId = null) {
        $year = $year ?? date('Y');
        if ($entrepreneurId !== null) {
            $stmt = $this->pdo->prepare("
                SELECT
                    COALESCE(SUM(CASE WHEN o.status IN ('paid', 'shipped', 'delivered') THEN items.price * items.quantity ELSE 0 END), 0) AS total_sales,
                    COUNT(DISTINCT o.id) AS total_orders,
                    COUNT(DISTINCT CASE WHEN o.status IN ('paid', 'shipped', 'delivered') THEN o.id END) AS paid_orders
                FROM {$this->table} o
                JOIN JSON_TABLE(o.products, '$[*]' COLUMNS (
                    entrepreneur_id INT PATH '$.entrepreneur_id',
                    price DECIMAL(10,2) PATH '$.price',
                    quantity INT PATH '$.quantity'
                )) items ON items.entrepreneur_id = ?
                WHERE YEAR(o.created_at) = ?
            ");
            $stmt->execute([$entrepreneurId, $year]);
            return $stmt->fetch();
        }
        $sql = "
            SELECT
                COALESCE(SUM(CASE WHEN status IN ('paid', 'shipped', 'delivered') THEN total ELSE 0 END), 0) AS total_sales,
                COUNT(*) AS total_orders,
                SUM(status IN ('paid', 'shipped', 'delivered')) AS paid_orders
            FROM {$this->table}
                WHERE YEAR(created_at) = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$year]);
        return $stmt->fetch();
    }

    public function getSalesByEmployer($year, $entrepreneurId) {
        $stmt = $this->pdo->prepare("\n            SELECT\n                ? AS entrepreneur_id,\n                u.name AS entrepreneur_name,\n                COUNT(DISTINCT o.id) AS total_orders,\n                COALESCE(SUM(CASE WHEN o.status IN ('paid', 'shipped', 'delivered')\n                    THEN items.price * items.quantity ELSE 0 END), 0) AS total_sales\n            FROM orders o\n            JOIN users u ON u.id = ?\n            JOIN JSON_TABLE(o.products, '$[*]' COLUMNS (\n                entrepreneur_id INT PATH '$.entrepreneur_id',\n                price DECIMAL(10,2) PATH '$.price',\n                quantity INT PATH '$.quantity'\n            )) items ON items.entrepreneur_id = ?\n            WHERE YEAR(o.created_at) = ?\n        ");
        $stmt->execute([$entrepreneurId, $entrepreneurId, $entrepreneurId, $year]);
        return $stmt->fetchAll();
    }

    public function getStatusSummary($entrepreneurId = null) {
        $sql = "SELECT o.status, COUNT(*) AS total FROM {$this->table} o";
        $params = [];
        if ($entrepreneurId !== null) {
            $sql .= " WHERE EXISTS (
                SELECT 1
                FROM JSON_TABLE(o.products, '$[*]' COLUMNS (entrepreneur_id INT PATH '$.entrepreneur_id')) items
                WHERE items.entrepreneur_id = ?
            )";
            $params[] = $entrepreneurId;
        }
        $sql .= ' GROUP BY o.status';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        $summary = [];
        foreach ($stmt->fetchAll() as $row) $summary[$row['status']] = (int) $row['total'];
        return $summary;
    }
}
?>