<?php
/**
 * Modelo de Usuario
 * Representa la tabla 'users' de la base de datos
 */
class User {
    private $pdo;
    private $table = 'users';

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getAll() {
        $stmt = $this->pdo->query("SELECT id, name, email, role, bio, location, maps_url, profile_image, created_at FROM {$this->table} ORDER BY created_at DESC");
        return $stmt->fetchAll();
    }

    public function getById($id) {
        $stmt = $this->pdo->prepare("SELECT id, name, email, role, bio, location, maps_url, profile_image, created_at FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function getByEmail($email) {
        $stmt = $this->pdo->prepare("SELECT * FROM {$this->table} WHERE email = ?");
        $stmt->execute([$email]);
        return $stmt->fetch();
    }

    public function getByGoogleSub($googleSub) {
        $stmt = $this->pdo->prepare("SELECT * FROM {$this->table} WHERE google_sub = ?");
        $stmt->execute([$googleSub]);
        return $stmt->fetch();
    }

    public function create($data) {
        $stmt = $this->pdo->prepare("INSERT INTO {$this->table} (name, email, password, role, bio, location, profile_image) VALUES (?, ?, ?, ?, ?, ?, ?)");
        return $stmt->execute([
            $data['name'],
            $data['email'],
            $data['password'] ?? null,
            $data['role'] ?? 'cliente',
            $data['bio'] ?? null,
            $data['location'] ?? null,
            $data['profile_image'] ?? null
        ]);
    }

    public function linkGoogleAccount($id, $googleSub) {
        $stmt = $this->pdo->prepare("UPDATE {$this->table} SET google_sub = ? WHERE id = ?");
        return $stmt->execute([$googleSub, $id]);
    }

    public function update($id, $data) {
        $fields = [];
        $values = [];
        foreach (['name', 'email', 'role', 'bio', 'location', 'maps_url', 'profile_image'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $values[] = $data[$field];
            }
        }
        if (isset($data['password'])) {
            $fields[] = "password = ?";
            $values[] = $data['password'];
        }
        if (empty($fields)) return false;
        $values[] = $id;
        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($values);
    }

    public function delete($id) {
        $stmt = $this->pdo->prepare("DELETE FROM {$this->table} WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function emailExists($email) {
        $stmt = $this->pdo->prepare("SELECT id FROM {$this->table} WHERE email = ?");
        $stmt->execute([$email]);
        return $stmt->fetch() !== false;
    }

    public function getEntrepreneurs() {
        $stmt = $this->pdo->query("SELECT id, name, email, bio, location, profile_image, created_at FROM {$this->table} WHERE role = 'empleador' ORDER BY name");
        return $stmt->fetchAll();
    }
}
?>