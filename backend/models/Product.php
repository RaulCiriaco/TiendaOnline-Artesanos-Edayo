<?php
/**
 * Modelo de Producto
 * Representa la tabla 'products' de la base de datos
 */
class Product {
    private $pdo;
    private $table = 'products';

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getAll() {
        $stmt = $this->pdo->query("
            SELECT p.*, u.name as entrepreneur_name, u.bio as entrepreneur_bio, u.location as entrepreneur_location, u.maps_url as entrepreneur_maps_url, c.name as category_name
            FROM {$this->table} p
            LEFT JOIN users u ON p.entrepreneur_id = u.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.stock > 0
            ORDER BY p.created_at DESC
        ");
        $products = $stmt->fetchAll();
        foreach ($products as &$product) {
            $product['images'] = json_decode($product['images'], true) ?: [];
        }
        return $products;
    }

    public function getAllWithNoStock() {
        $stmt = $this->pdo->query("
            SELECT p.*, u.name as entrepreneur_name, u.location as entrepreneur_location, u.maps_url as entrepreneur_maps_url, c.name as category_name
            FROM {$this->table} p
            LEFT JOIN users u ON p.entrepreneur_id = u.id
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.created_at DESC
        ");
        $products = $stmt->fetchAll();
        foreach ($products as &$product) {
            $product['images'] = json_decode($product['images'], true) ?: [];
        }
        return $products;
    }

    public function getById($id) {
        $stmt = $this->pdo->prepare("
            SELECT p.*, u.name as entrepreneur_name, u.bio as entrepreneur_bio, u.location as entrepreneur_location, u.maps_url as entrepreneur_maps_url, c.name as category_name
            FROM {$this->table} p
            LEFT JOIN users u ON p.entrepreneur_id = u.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        ");
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        if ($product) {
            $product['images'] = json_decode($product['images'], true) ?: [];
        }
        return $product;
    }

    public function getByEntrepreneur($entrepreneurId) {
        $stmt = $this->pdo->prepare("
            SELECT p.*, c.name as category_name 
            FROM {$this->table} p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.entrepreneur_id = ?
            ORDER BY p.created_at DESC
        ");
        $stmt->execute([$entrepreneurId]);
        $products = $stmt->fetchAll();
        foreach ($products as &$product) {
            $product['images'] = json_decode($product['images'], true) ?: [];
        }
        return $products;
    }

    public function getByCategory($categoryId) {
        $stmt = $this->pdo->prepare("
            SELECT p.*, u.name as entrepreneur_name, u.location as entrepreneur_location, c.name as category_name 
            FROM {$this->table} p
            LEFT JOIN users u ON p.entrepreneur_id = u.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.category_id = ? AND p.stock > 0
            ORDER BY p.created_at DESC
        ");
        $stmt->execute([$categoryId]);
        $products = $stmt->fetchAll();
        foreach ($products as &$product) {
            $product['images'] = json_decode($product['images'], true) ?: [];
        }
        return $products;
    }

    public function create($data) {
        $stmt = $this->pdo->prepare("
            INSERT INTO {$this->table} (name, description, price, stock, category_id, images, entrepreneur_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        return $stmt->execute([
            $data['name'],
            $data['description'],
            $data['price'],
            $data['stock'],
            $data['category_id'] ?? null,
            json_encode($data['images'] ?? []),
            $data['entrepreneur_id']
        ]);
    }

    public function update($id, $data) {
        $fields = [];
        $values = [];
        foreach (['name', 'description', 'price', 'stock', 'category_id'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $values[] = $data[$field];
            }
        }
        if (isset($data['images'])) {
            $fields[] = "images = ?";
            $values[] = json_encode($data['images']);
        }
        if (empty($fields)) return false;
        $values[] = $id;
        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($values);
    }

    public function updateStock($id, $quantity) {
        $stmt = $this->pdo->prepare("UPDATE {$this->table} SET stock = stock - ? WHERE id = ? AND stock >= ?");
        return $stmt->execute([$quantity, $id, $quantity]);
    }

    public function checkStock($id, $quantity) {
        $stmt = $this->pdo->prepare("SELECT stock FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        return $product && $product['stock'] >= $quantity;
    }

    public function delete($id) {
        $stmt = $this->pdo->prepare("DELETE FROM {$this->table} WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function belongsToEntrepreneur($productId, $entrepreneurId) {
        $stmt = $this->pdo->prepare("SELECT id FROM {$this->table} WHERE id = ? AND entrepreneur_id = ?");
        $stmt->execute([$productId, $entrepreneurId]);
        return $stmt->fetch() !== false;
    }

    public function getBestSellers($limit = 10, $entrepreneurId = null) {
        $limit = max(1, min(50, (int) $limit));
        $sql = "
            SELECT 
                p.id, p.name, p.price, p.images,
                SUM(items.quantity) as total_sold
            FROM {$this->table} p
            JOIN orders o ON 1 = 1
            JOIN JSON_TABLE(o.products, '$[*]' COLUMNS (
                product_id INT PATH '$.product_id',
                quantity INT PATH '$.quantity'
            )) items ON items.product_id = p.id
            WHERE o.status IN ('paid', 'shipped', 'delivered')
            GROUP BY p.id
            ORDER BY total_sold DESC
            LIMIT {$limit}
        ";
        if ($entrepreneurId !== null) {
            $sql = str_replace("WHERE o.status IN ('paid', 'shipped', 'delivered')", "WHERE o.status IN ('paid', 'shipped', 'delivered') AND p.entrepreneur_id = ?", $sql);
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$entrepreneurId]);
        } else {
            $stmt->execute([]);
        }
        $products = $stmt->fetchAll();
        foreach ($products as &$product) {
            $product['images'] = json_decode($product['images'], true) ?: [];
        }
        return $products;
    }
}
?>