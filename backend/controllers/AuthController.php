<?php
require_once dirname(__DIR__) . '/models/User.php';
require_once dirname(__DIR__) . '/utils/jwt.php';
require_once dirname(__DIR__) . '/utils/response.php';

class AuthController {
    private static function issueToken($user) {
        $token = generateJWT([
            'id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'name' => $user['name']
        ]);
        unset($user['password']);
        sendResponse(['message' => 'Login exitoso', 'token' => $token, 'user' => $user]);
    }

    public static function login($email, $password) {
        global $pdo;
        if (empty($email) || empty($password)) {
            sendError('Email y contraseña son requeridos');
        }
        $userModel = new User($pdo);
        $user = $userModel->getByEmail($email);
        if (!$user || !password_verify($password, $user['password'])) {
            sendError('Credenciales incorrectas', 401);
        }
        self::issueToken($user);
    }

    public static function loginWithGoogle($credential) {
        global $pdo;
        $clientId = getenv('GOOGLE_CLIENT_ID');
        if (!$clientId) sendError('El inicio de sesión con Google no está configurado', 503);
        if (empty($credential)) sendError('Credencial de Google requerida');

        $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . rawurlencode($credential);
        $context = stream_context_create(['http' => ['ignore_errors' => true, 'timeout' => 5]]);
        $googleResponse = @file_get_contents($url, false, $context);
        $googleUser = $googleResponse ? json_decode($googleResponse, true) : null;
        if (!$googleUser || ($googleUser['aud'] ?? '') !== $clientId || ($googleUser['iss'] ?? '') !== 'https://accounts.google.com' || ($googleUser['email_verified'] ?? '') !== 'true') {
            sendError('La credencial de Google no es válida', 401);
        }

        $userModel = new User($pdo);
        $user = $userModel->getByGoogleSub($googleUser['sub']);
        if (!$user) $user = $userModel->getByEmail($googleUser['email']);
        if ($user) {
            if (empty($user['google_sub'])) $userModel->linkGoogleAccount($user['id'], $googleUser['sub']);
            $user['google_sub'] = $googleUser['sub'];
        } else {
            $userModel->create([
                'name' => $googleUser['name'] ?? $googleUser['email'],
                'email' => $googleUser['email'],
                'password' => null,
                'role' => 'cliente'
            ]);
            $user = $userModel->getByEmail($googleUser['email']);
            $userModel->linkGoogleAccount($user['id'], $googleUser['sub']);
            $user['google_sub'] = $googleUser['sub'];
        }
        self::issueToken($user);
    }

    public static function register($name, $email, $password, $role = 'cliente') {
        global $pdo;
        $role = in_array($role, ['cliente', 'empleador'], true) ? $role : 'cliente';
        if (empty($name) || empty($email) || empty($password)) {
            sendError('Todos los campos son requeridos');
        }
        $userModel = new User($pdo);
        if ($userModel->emailExists($email)) {
            sendError('El email ya está registrado');
        }
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $data = [
            'name' => $name,
            'email' => $email,
            'password' => $hashedPassword,
            'role' => $role
        ];
        if ($userModel->create($data)) {
            sendResponse(['message' => 'Usuario registrado exitosamente']);
        }
        sendError('Error al registrar el usuario', 500);
    }
}
?>