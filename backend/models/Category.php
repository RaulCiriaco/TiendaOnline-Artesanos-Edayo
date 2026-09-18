<?php
/**
 * Modelo de Categoría
 * Representa la tabla 'categories' de la base de datos
 */
class Category {
    private $pdo;
    private $table = 'categories';

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getAll() {
        $stmt = $this->pdo->query("SELECT * FROM {$this->table} ORDER BY name");
        return $stmt->fetchAll();
    }

    public function getById($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function create($data) {
        $stmt = $this->pdo->prepare("INSERT INTO {$this->table} (name, description) VALUES (?, ?)");
        return $stmt->execute([
            $data['name'],
            $data['description'] ?? null
        ]);
    }

    public function update($id, $data) {
        $stmt = $this->pdo->prepare("UPDATE {$this->table} SET name = ?, description = ? WHERE id = ?");
        return $stmt->execute([
            $data['name'] ?? '',
            $data['description'] ?? null,
            $id
        ]);
    }

    public function delete($id) {
        $stmt = $this->pdo->prepare("DELETE FROM {$this->table} WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function hasProducts($id) {
        $stmt = $this->pdo->prepare("SELECT COUNT(*) as count FROM products WHERE category_id = ?");
        $stmt->execute([$id]);
        $result = $stmt->fetch();
        return $result['count'] > 0;
    }

    public function getWithProductCount() {
        $stmt = $this->pdo->query("
            SELECT c.*, COUNT(p.id) as product_count
            FROM {$this->table} c
            LEFT JOIN products p ON c.id = p.category_id
            GROUP BY c.id
            ORDER BY c.name
        ");
        return $stmt->fetchAll();
    }
}
?>