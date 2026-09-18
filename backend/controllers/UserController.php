<?php
require_once dirname(__DIR__) . '/models/User.php';
require_once dirname(__DIR__) . '/utils/response.php';
require_once dirname(__DIR__) . '/utils/upload.php';

class UserController {
    public static function getUsers() {
        global $pdo;
        $userModel = new User($pdo);
        sendResponse($userModel->getAll());
    }

    public static function getUser($id) {
        global $pdo;
        $userModel = new User($pdo);
        $user = $userModel->getById($id);
        if (!$user) sendError('Usuario no encontrado', 404);
        sendResponse($user);
    }

    public static function createUser($data) {
        global $pdo;
        foreach (['name', 'email', 'password', 'role'] as $f) {
            if (empty($data[$f])) sendError("El campo '$f' es requerido");
        }
        if (!in_array($data['role'], ['admin', 'empleador', 'cliente'])) {
            sendError('Rol no válido');
        }
        $userModel = new User($pdo);
        if ($userModel->emailExists($data['email'])) {
            sendError('El email ya está registrado');
        }
        $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        if ($userModel->create($data)) {
            sendResponse(['message' => 'Usuario creado', 'id' => $pdo->lastInsertId()]);
        }
        sendError('Error al crear el usuario', 500);
    }

    public static function updateUser($id, $data) {
        global $pdo;
        $userModel = new User($pdo);
        $user = $userModel->getById($id);
        if (!$user) sendError('Usuario no encontrado', 404);
        if (isset($data['email']) && $data['email'] !== $user['email']) {
            $existingUser = $userModel->getByEmail($data['email']);
            if ($existingUser && $existingUser['id'] != $id) {
                sendError('El email ya está registrado por otro usuario');
            }
        }
        if (isset($data['password'])) {
            $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        }
        if ($userModel->update($id, $data)) {
            sendResponse(['message' => 'Usuario actualizado']);
        }
        sendError('Error al actualizar el usuario', 500);
    }

    public static function deleteUser($id) {
        global $pdo;
        $userModel = new User($pdo);
        $user = $userModel->getById($id);
        if (!$user) sendError('Usuario no encontrado', 404);
        if ($user['role'] === 'admin') {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
            $result = $stmt->fetch();
            if ($result['count'] <= 1) {
                sendError('No se puede eliminar al único administrador', 400);
            }
        }
        if ($userModel->delete($id)) {
            sendResponse(['message' => 'Usuario eliminado']);
        }
        sendError('Error al eliminar el usuario', 500);
    }

    public static function getEntrepreneurs() {
        global $pdo;
        $userModel = new User($pdo);
        sendResponse($userModel->getEntrepreneurs());
    }

    public static function getPublicProfile($id) {
        global $pdo;
        $userModel = new User($pdo);
        $user = $userModel->getById($id);
        if (!$user || $user['role'] === 'admin') sendError('Perfil no encontrado', 404);

        require_once dirname(__DIR__) . '/models/Product.php';
        $productModel = new Product($pdo);
        $user['products'] = $productModel->getByEntrepreneur($id);
        unset($user['email'], $user['role']);
        sendResponse($user);
    }

    public static function updateProfile($userId, $data, $file = null) {
        global $pdo;
        $userModel = new User($pdo);
        $mapsUrl = trim($data['maps_url'] ?? '');
        if ($mapsUrl !== '' && !filter_var($mapsUrl, FILTER_VALIDATE_URL)) sendError('El enlace de Google Maps no es válido');
        $profile = ['name' => trim($data['name'] ?? ''), 'bio' => trim($data['bio'] ?? ''), 'location' => trim($data['location'] ?? ''), 'maps_url' => $mapsUrl ?: null];
        if ($profile['name'] === '') sendError('El nombre es requerido');
        if ($file) {
            $images = processUploadedImages($file, 'profiles');
            if (empty($images)) sendError('La imagen de perfil no es válida');
            $profile['profile_image'] = $images[0];
        }
        if (!$userModel->update($userId, $profile)) sendError('No se pudo actualizar el perfil', 500);
        sendResponse(['message' => 'Perfil actualizado', 'user' => $userModel->getById($userId)]);
    }
}
?>