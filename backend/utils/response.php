<?php
/**
 * Utilidad para respuestas JSON estandarizadas
 * Centraliza el formato de respuestas de la API
 */

/**
 * Envía una respuesta JSON exitosa
 * 
 * @param mixed $data Datos a enviar
 * @param int $statusCode Código HTTP (default: 200)
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Envía una respuesta JSON de error
 * 
 * @param string $message Mensaje de error
 * @param int $statusCode Código HTTP (default: 400)
 */
function sendError($message, $statusCode = 400) {
    sendResponse([
        'success' => false,
        'error' => $message
    ], $statusCode);
}

/**
 * Envía una respuesta de éxito con mensaje
 * 
 * @param string $message Mensaje de éxito
 * @param mixed $data Datos adicionales (opcional)
 * @param int $statusCode Código HTTP (default: 200)
 */
function sendSuccess($message, $data = null, $statusCode = 200) {
    $response = [
        'success' => true,
        'message' => $message
    ];
    if ($data !== null) {
        $response['data'] = $data;
    }
    sendResponse($response, $statusCode);
}

/**
 * Envía una respuesta de validación de formulario
 * 
 * @param array $errors Errores de validación por campo
 * @param int $statusCode Código HTTP (default: 422)
 */
function sendValidationError($errors, $statusCode = 422) {
    sendResponse([
        'success' => false,
        'errors' => $errors
    ], $statusCode);
}

/**
 * Envía una respuesta paginada
 * 
 * @param array $data Datos de la página
 * @param int $total Total de registros
 * @param int $page Página actual
 * @param int $limit Límite por página
 * @param int $statusCode Código HTTP (default: 200)
 */
function sendPaginatedResponse($data, $total, $page, $limit, $statusCode = 200) {
    sendResponse([
        'success' => true,
        'data' => $data,
        'pagination' => [
            'total' => (int) $total,
            'page' => (int) $page,
            'limit' => (int) $limit,
            'pages' => (int) ceil($total / $limit)
        ]
    ], $statusCode);
}
?>