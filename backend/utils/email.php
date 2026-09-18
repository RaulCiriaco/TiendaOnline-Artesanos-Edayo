<?php
/**
 * Utilidad para envío de correos electrónicos
 * Configuración y funciones para PHPMailer
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Cargar PHPMailer si está instalado vía Composer
require_once dirname(__DIR__) . '/vendor/autoload.php';

/**
 * Configuración de correo desde variables de entorno
 */
function getEmailConfig() {
    return [
        'host' => getenv('EMAIL_HOST') ?: 'smtp.gmail.com',
        'port' => getenv('EMAIL_PORT') ?: 587,
        'username' => getenv('EMAIL_USER') ?: '',
        'password' => getenv('EMAIL_PASSWORD') ?: '',
        'from_email' => getenv('EMAIL_FROM') ?: getenv('EMAIL_USER') ?: '',
        'from_name' => getenv('EMAIL_FROM_NAME') ?: 'Tienda Emprendedores EDAYO'
    ];
}

/**
 * Envía un correo electrónico usando PHPMailer
 * 
 * @param string $to Correo del destinatario
 * @param string $subject Asunto del correo
 * @param string $body Contenido HTML del correo
 * @param string $altBody Contenido texto plano (opcional)
 * @return bool True si se envió correctamente
 */
function sendEmail($to, $subject, $body, $altBody = '') {
    $config = getEmailConfig();
    
    // Verificar que haya configuración de correo
    if (empty($config['username']) || empty($config['password'])) {
        error_log('Email no configurado: faltan credenciales');
        return false;
    }
    
    $mail = new PHPMailer(true);
    
    try {
        // Configuración del servidor SMTP
        $mail->isSMTP();
        $mail->Host = $config['host'];
        $mail->SMTPAuth = true;
        $mail->Username = $config['username'];
        $mail->Password = $config['password'];
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = $config['port'];
        
        // Remitente y destinatario
        $mail->setFrom($config['from_email'], $config['from_name']);
        $mail->addAddress($to);
        $mail->addReplyTo($config['from_email'], $config['from_name']);
        
        // Contenido
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $body;
        $mail->AltBody = $altBody ?: strip_tags($body);
        
        return $mail->send();
    } catch (Exception $e) {
        error_log("Error al enviar correo: {$mail->ErrorInfo}");
        return false;
    }
}

/**
 * Envía correo de confirmación de pedido
 * 
 * @param string $to Correo del cliente
 * @param string $clientName Nombre del cliente
 * @param int $orderId ID del pedido
 * @param float $total Total del pedido
 * @param array $products Lista de productos
 * @return bool
 */
function sendOrderConfirmation($to, $clientName, $orderId, $total, $products) {
    $subject = "Confirmación de pedido #$orderId - Tienda Emprendedores EDAYO";
    
    $productList = '';
    foreach ($products as $item) {
        $subtotal = $item['quantity'] * $item['price'];
        $productList .= "<tr>
            <td>{$item['name']}</td>
            <td>{$item['quantity']}</td>
            <td>\${$item['price']}</td>
            <td>\${$subtotal}</td>
        </tr>";
    }
    
    $body = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #198754; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
            th { background: #e9ecef; }
            .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>¡Pedido Confirmado!</h2>
            </div>
            <div class='content'>
                <p>Hola <strong>$clientName</strong>,</p>
                <p>Tu pedido ha sido confirmado. Aquí están los detalles:</p>
                <p><strong>Número de pedido:</strong> #$orderId</p>
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio unitario</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        $productList
                    </tbody>
                </table>
                <div class='total'>
                    Total: <span style='color: #198754;'>$$total</span>
                </div>
                <p>Gracias por tu compra. Te notificaremos cuando tu pedido sea enviado.</p>
            </div>
            <div class='footer'>
                <p>Tienda Emprendedores EDAYO Jilotepec</p>
                <p>Este es un correo automático, por favor no responder.</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    return sendEmail($to, $subject, $body);
}

function sendEmployerOrderNotification($to, $employerName, $orderId, $clientName, $total, $products) {
    $items = '';
    foreach ($products as $item) {
        $items .= '<li>' . htmlspecialchars($item['name']) . ' x ' . (int) $item['quantity'] . '</li>';
    }
    $body = '<p>Hola <strong>' . htmlspecialchars($employerName) . '</strong>,</p>'
        . '<p>Recibiste un nuevo pedido de <strong>' . htmlspecialchars($clientName) . '</strong>.</p>'
        . '<p><strong>Pedido:</strong> #' . (int) $orderId . '<br><strong>Total:</strong> $' . number_format($total, 2) . '</p>'
        . '<ul>' . $items . '</ul>';
    return sendEmail($to, "Nuevo pedido #$orderId", $body);
}

/**
 * Envía correo de actualización de estado de pedido
 * 
 * @param string $to Correo del cliente
 * @param string $clientName Nombre del cliente
 * @param int $orderId ID del pedido
 * @param string $status Nuevo estado del pedido
 * @return bool
 */
function sendOrderStatusUpdate($to, $clientName, $orderId, $status) {
    $statusLabels = [
        'pending' => 'Pendiente de pago',
        'paid' => 'Pagado',
        'shipped' => 'Enviado',
        'delivered' => 'Entregado',
        'cancelled' => 'Cancelado'
    ];
    
    $statusLabel = $statusLabels[$status] ?? $status;
    
    $subject = "Actualización de tu pedido #$orderId - Tienda Emprendedores EDAYO";
    
    $body = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #198754; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .status { font-size: 24px; font-weight: bold; color: #198754; text-align: center; padding: 20px; }
            .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>¡Estado de tu pedido actualizado!</h2>
            </div>
            <div class='content'>
                <p>Hola <strong>$clientName</strong>,</p>
                <p>El estado de tu pedido <strong>#$orderId</strong> ha cambiado a:</p>
                <div class='status'>$statusLabel</div>
                <p>Puedes ver el detalle de tu pedido iniciando sesión en nuestra tienda.</p>
                <p>Gracias por confiar en nosotros.</p>
            </div>
            <div class='footer'>
                <p>Tienda Emprendedores EDAYO Jilotepec</p>
                <p>Este es un correo automático, por favor no responder.</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    return sendEmail($to, $subject, $body);
}

/**
 * Envía correo de bienvenida al registrarse
 * 
 * @param string $to Correo del usuario
 * @param string $name Nombre del usuario
 * @return bool
 */
function sendWelcomeEmail($to, $name) {
    $subject = "Bienvenido a la Tienda Emprendedores EDAYO";
    
    $body = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #198754; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>¡Bienvenido a la tienda!</h2>
            </div>
            <div class='content'>
                <p>Hola <strong>$name</strong>,</p>
                <p>Tu cuenta ha sido creada exitosamente en la Tienda Emprendedores EDAYO.</p>
                <p>Ya puedes empezar a comprar productos artesanales y apoyar a los emprendedores de nuestra comunidad.</p>
                <p>¡Te esperamos!</p>
            </div>
            <div class='footer'>
                <p>Tienda Emprendedores EDAYO Jilotepec</p>
                <p>Este es un correo automático, por favor no responder.</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    return sendEmail($to, $subject, $body);
}
?>