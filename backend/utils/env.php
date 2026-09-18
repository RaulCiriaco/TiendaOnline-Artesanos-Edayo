<?php
function loadEnv($path) {
    if (!file_exists($path)) {
        return;
    }
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);

        // Ignorar comentarios
        if ($line === '' || strpos($line, '#') === 0 || strpos($line, '=') === false) {
            continue;
        }
        
        // Dividir en clave y valor
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);

        if ($key === '') {
            continue;
        }

        if (getenv($key) !== false) {
            continue;
        }
        
        // Quitar comillas si las tiene
        if (strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) {
            $value = substr($value, 1, -1);
        }
        if (strpos($value, "'") === 0 && strrpos($value, "'") === strlen($value) - 1) {
            $value = substr($value, 1, -1);
        }
        
        putenv("$key=$value");
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }
}

// En desarrollo el .env se encuentra en la raiz del proyecto; se conserva
// el backend/.env como primera opcion para instalaciones independientes.
loadEnv(__DIR__ . '/../.env');
loadEnv(__DIR__ . '/../../.env');
?>