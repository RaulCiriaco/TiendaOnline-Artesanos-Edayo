<?php
$host = getenv('DB_HOST') ?: 'localhost';
$port = getenv('DB_PORT') ?: '3309';  // <--- PUERTO 3309
$dbname = getenv('DB_NAME') ?: 'tienda_emprendedores';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') ?: '';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $columnCheck = $pdo->query("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'payment_receipt'");
    if ((int) $columnCheck->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN payment_receipt VARCHAR(500) NULL");
    }
    $googleSubCheck = $pdo->query("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'google_sub'");
    if ((int) $googleSubCheck->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE users MODIFY password VARCHAR(255) NULL, ADD COLUMN google_sub VARCHAR(255) NULL UNIQUE");
    }
        $stockCommittedCheck = $pdo->query("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'stock_committed'");
        if ((int) $stockCommittedCheck->fetchColumn() === 0) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN stock_committed TINYINT(1) NOT NULL DEFAULT 0");
        }
        $mapsUrlCheck = $pdo->query("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'maps_url'");
        if ((int) $mapsUrlCheck->fetchColumn() === 0) {
            $pdo->exec("ALTER TABLE users ADD COLUMN maps_url VARCHAR(500) NULL");
        }
} catch(PDOException $e) {
    die(json_encode(['error' => 'Error de conexión: ' . $e->getMessage()]));
}
?>