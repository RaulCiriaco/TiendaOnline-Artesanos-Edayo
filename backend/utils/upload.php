<?php
/**
 * Utilidad para manejo de archivos (imágenes)
 * Subida, validación y almacenamiento en Cloudinary o local
 */

/**
 * Configuración de Cloudinary desde variables de entorno
 */
function getCloudinaryConfig() {
    return [
        'cloud_name' => getenv('CLOUDINARY_CLOUD_NAME') ?: '',
        'api_key' => getenv('CLOUDINARY_API_KEY') ?: '',
        'api_secret' => getenv('CLOUDINARY_API_SECRET') ?: ''
    ];
}

/**
 * Sube una imagen a Cloudinary
 * 
 * @param string $filePath Ruta temporal del archivo
 * @param string $folder Carpeta en Cloudinary (default: 'products')
 * @return string|false URL de la imagen o false en caso de error
 */
function uploadToCloudinary($filePath, $folder = 'products') {
    $config = getCloudinaryConfig();
    
    // Si no hay configuración de Cloudinary, guardar localmente
    if (empty($config['cloud_name']) || empty($config['api_key']) || empty($config['api_secret'])) {
        return uploadLocal($filePath, $folder);
    }
    
    $url = "https://api.cloudinary.com/v1_1/{$config['cloud_name']}/image/upload";
    
    $timestamp = time();
    $signature = sha1("folder={$folder}&timestamp={$timestamp}{$config['api_secret']}");
    $data = [
        'file' => new CURLFile($filePath),
        'api_key' => $config['api_key'],
        'timestamp' => $timestamp,
        'signature' => $signature,
        'folder' => $folder
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $result = json_decode($response, true);
        return $result['secure_url'] ?? false;
    }
    
    error_log("Error en Cloudinary: $response");
    return uploadLocal($filePath, $folder);
}

/**
 * Sube una imagen de forma local (fallback)
 * 
 * @param string $filePath Ruta temporal del archivo
 * @param string $folder Carpeta destino
 * @return string|false URL de la imagen o false
 */
function uploadLocal($filePath, $folder = 'products') {
    $uploadDir = dirname(__DIR__) . "/uploads/$folder/";
    
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    if ($extension === '') {
        $extensions = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif'
        ];
        $extension = $extensions[mime_content_type($filePath)] ?? 'jpg';
    }
    $filename = uniqid() . '.' . $extension;
    $destination = $uploadDir . $filename;
    
    if (move_uploaded_file($filePath, $destination)) {
        // Retornar URL relativa
        return "/uploads/$folder/$filename";
    }
    
    return false;
}

/**
 * Valida una imagen subida
 * 
 * @param array $file Archivo $_FILES
 * @param int $maxSize Tamaño máximo en bytes (default: 5MB)
 * @param array $allowedTypes Tipos permitidos
 * @return array ['valid' => bool, 'error' => string]
 */
function validateUploadedFile($file, $maxSize = 5242880, $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']) {
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errors = [
            UPLOAD_ERR_INI_SIZE => 'El archivo excede el tamaño máximo permitido',
            UPLOAD_ERR_FORM_SIZE => 'El archivo excede el tamaño máximo permitido',
            UPLOAD_ERR_PARTIAL => 'El archivo se subió parcialmente',
            UPLOAD_ERR_NO_FILE => 'No se seleccionó ningún archivo',
            UPLOAD_ERR_NO_TMP_DIR => 'Falta la carpeta temporal',
            UPLOAD_ERR_CANT_WRITE => 'Error al escribir el archivo',
            UPLOAD_ERR_EXTENSION => 'Extensión no permitida'
        ];
        return ['valid' => false, 'error' => $errors[$file['error']] ?? 'Error desconocido'];
    }
    
    if ($file['size'] > $maxSize) {
        return ['valid' => false, 'error' => 'El archivo excede el tamaño máximo de ' . ($maxSize / 1024 / 1024) . ' MB'];
    }
    
    $mimeType = mime_content_type($file['tmp_name']);
    if (!in_array($mimeType, $allowedTypes)) {
        return ['valid' => false, 'error' => 'Tipo de archivo no permitido. Formatos: JPEG, PNG, WEBP, GIF'];
    }
    
    return ['valid' => true, 'error' => ''];
}

/**
 * Procesa múltiples imágenes
 * 
 * @param array $files Archivos $_FILES
 * @param string $folder Carpeta destino
 * @return array Lista de URLs subidas
 */
function processUploadedImages($files, $folder = 'products') {
    $uploaded = [];
    
    // Si es un solo archivo, convertirlo a array
    if (!isset($files['name']) || !is_array($files['name'])) {
        $files = [
            'name' => [$files['name'] ?? ''],
            'tmp_name' => [$files['tmp_name'] ?? ''],
            'error' => [$files['error'] ?? UPLOAD_ERR_NO_FILE],
            'size' => [$files['size'] ?? 0],
            'type' => [$files['type'] ?? '']
        ];
    }
    
    foreach ($files['tmp_name'] as $index => $tmpPath) {
        if ($files['error'][$index] !== UPLOAD_ERR_OK) {
            continue;
        }
        
        $file = [
            'tmp_name' => $tmpPath,
            'name' => $files['name'][$index] ?? '',
            'size' => $files['size'][$index] ?? 0,
            'type' => $files['type'][$index] ?? '',
            'error' => $files['error'][$index] ?? UPLOAD_ERR_OK
        ];
        
        $validation = validateUploadedFile($file);
        if ($validation['valid']) {
            $url = uploadToCloudinary($tmpPath, $folder);
            if ($url) {
                $uploaded[] = $url;
            }
        }
    }
    
    return $uploaded;
}

/**
 * Elimina una imagen de Cloudinary o local
 * 
 * @param string $url URL de la imagen
 * @return bool
 */
function deleteUploadedImage($url) {
    // Si es una URL de Cloudinary
    if (strpos($url, 'cloudinary.com') !== false) {
        // Extraer public_id de la URL
        $parts = explode('/', $url);
        $publicId = explode('.', end($parts))[0];
        
        $config = getCloudinaryConfig();
        if (!empty($config['cloud_name']) && !empty($config['api_key']) && !empty($config['api_secret'])) {
            $url = "https://api.cloudinary.com/v1_1/{$config['cloud_name']}/image/destroy";
            $data = [
                'public_id' => $publicId,
                'api_key' => $config['api_key'],
                'timestamp' => time(),
                'signature' => ''
            ];
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $response = curl_exec($ch);
            curl_close($ch);
            
            $result = json_decode($response, true);
            return isset($result['result']) && $result['result'] === 'ok';
        }
    }
    
    // Si es local, eliminar el archivo
    $localPath = parse_url($url, PHP_URL_PATH);
    if ($localPath && file_exists($_SERVER['DOCUMENT_ROOT'] . $localPath)) {
        return unlink($_SERVER['DOCUMENT_ROOT'] . $localPath);
    }
    
    return false;
}
?>