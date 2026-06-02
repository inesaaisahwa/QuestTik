<?php
session_start();
require_once __DIR__ . '/db.php';

$pdo = db();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET' && $action === 'me') {
    if (empty($_SESSION['user_id'])) {
        json_response(['user' => null]);
    }
    $stmt = $pdo->prepare("SELECT id,name,username,email,avatar_id,profile_photo,xp,unlocked_level FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    json_response(['user' => $stmt->fetch() ?: null]);
}

if ($method === 'POST' && $action === 'logout') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
    json_response(['ok' => true]);
}

$data = read_json_body();

if ($method === 'POST' && $action === 'register') {
    $username = strtolower(trim($data['username'] ?? ''));
    $name = trim($data['name'] ?? $username);
    $email = strtolower(trim($data['email'] ?? ''));
    $password = (string) ($data['password'] ?? '');
    $avatar = $data['avatarId'] ?? 'cat';
    $allowedAvatars = ['bear', 'rabbit', 'koala', 'cat', 'dog'];
    if (!in_array($avatar, $allowedAvatars, true)) {
        $avatar = 'cat';
    }
    $error = validate_profile_input($name, $username, $email, $password, true);
    if ($error) {
        json_response(['error' => $error], 400);
    }
    try {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE lower(username) = ? OR lower(email) = ? LIMIT 1");
        $stmt->execute([$username, $email]);
        if ($stmt->fetch()) {
            json_response(['error' => 'Username atau email sudah terdaftar.'], 409);
        }
        $stmt = $pdo->prepare("INSERT INTO users (name,username,email,password_hash,avatar_id) VALUES (?,?,?,?,?)");
        $stmt->execute([$name, $username, $email, password_hash($password, PASSWORD_DEFAULT), $avatar]);
        session_regenerate_id(true);
        $_SESSION['user_id'] = (int) $pdo->lastInsertId();
        $stmt = $pdo->prepare("SELECT id,name,username,email,avatar_id,profile_photo,xp,unlocked_level FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        json_response(['ok' => true, 'user' => $stmt->fetch()]);
    } catch (PDOException $e) {
        $message = strpos($e->getMessage(), 'UNIQUE') !== false ? 'Username sudah terdaftar.' : 'Register gagal: ' . $e->getMessage();
        json_response(['error' => $message], strpos($e->getMessage(), 'UNIQUE') !== false ? 409 : 500);
    }
}

if ($method === 'POST' && $action === 'updateProfile') {
    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId) {
        json_response(['error' => 'Login dulu untuk mengedit profil.'], 401);
    }
    $name = trim($data['name'] ?? '');
    $username = strtolower(trim($data['username'] ?? ''));
    $email = strtolower(trim($data['email'] ?? ''));
    $error = validate_profile_input($name, $username, $email, '', false);
    if ($error) {
        json_response(['error' => $error], 400);
    }
    $stmt = $pdo->prepare("SELECT id FROM users WHERE (lower(username) = ? OR lower(email) = ?) AND id <> ? LIMIT 1");
    $stmt->execute([$username, $email, (int) $userId]);
    if ($stmt->fetch()) {
        json_response(['error' => 'Username atau email sudah dipakai pengguna lain.'], 409);
    }
    $pdo->prepare("UPDATE users SET name = ?, username = ?, email = ? WHERE id = ?")->execute([$name, $username, $email, (int) $userId]);
    $stmt = $pdo->prepare("SELECT id,name,username,email,avatar_id,profile_photo,xp,unlocked_level FROM users WHERE id = ?");
    $stmt->execute([(int) $userId]);
    json_response(['ok' => true, 'user' => $stmt->fetch()]);
}

if ($method === 'POST' && $action === 'updateProfilePhoto') {
    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId) {
        json_response(['error' => 'Login dulu untuk menyimpan foto profil.'], 401);
    }
    $profilePhoto = trim((string) ($data['profilePhoto'] ?? ''));
    $error = validate_profile_photo($profilePhoto);
    if ($error) {
        json_response(['error' => $error], 400);
    }
    $pdo->prepare("UPDATE users SET profile_photo = ? WHERE id = ?")->execute([$profilePhoto ?: null, (int) $userId]);
    $stmt = $pdo->prepare("SELECT id,name,username,email,avatar_id,profile_photo,xp,unlocked_level FROM users WHERE id = ?");
    $stmt->execute([(int) $userId]);
    json_response(['ok' => true, 'user' => $stmt->fetch()]);
}

if ($method === 'POST' && $action === 'login') {
    $username = strtolower(trim($data['username'] ?? ''));
    $password = (string) ($data['password'] ?? '');
    if (strlen($username) < 3 || $password === '') {
        json_response(['error' => 'Username dan password wajib diisi dengan benar.'], 400);
    }
    $stmt = $pdo->prepare("
        SELECT * FROM users
        WHERE lower(COALESCE(username, '')) = ?
        LIMIT 1
    ");
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    if (!$user || !password_verify($password, $user['password_hash'])) {
        json_response(['error' => 'Username atau password salah.'], 401);
    }
    if (empty($user['username'])) {
        $pdo->prepare("UPDATE users SET username = ? WHERE id = ?")->execute([$username, $user['id']]);
        $user['username'] = $username;
    }
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    json_response([
        'ok' => true,
        'user' => [
            'id' => (int) $user['id'],
            'name' => $user['name'],
            'username' => $user['username'],
            'email' => $user['email'],
            'avatar_id' => $user['avatar_id'],
            'profile_photo' => $user['profile_photo'] ?? null,
            'xp' => (int) $user['xp'],
            'unlocked_level' => (int) $user['unlocked_level']
        ]
    ]);
}

function validate_profile_input($name, $username, $email, $password = '', $requirePassword = false) {
    if (strlen($name) < 3 || strlen($name) > 60) {
        return 'Nama wajib 3-60 karakter.';
    }
    if (!preg_match('/^[a-z0-9_.-]{3,24}$/', $username)) {
        return 'Username 3-24 karakter, hanya huruf kecil, angka, titik, underscore, atau strip.';
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return 'Format email tidak valid.';
    }
    if ($requirePassword && strlen((string) $password) < 6) {
        return 'Password minimal 6 karakter.';
    }
    return '';
}

function validate_profile_photo($profilePhoto) {
    if ($profilePhoto === '') {
        return '';
    }
    if (strlen($profilePhoto) > 2200000) {
        return 'Ukuran foto terlalu besar. Gunakan file maksimal 1.5 MB.';
    }
    if (!preg_match('/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+\/=]+$/', $profilePhoto)) {
        return 'Format foto profil tidak valid.';
    }
    return '';
}

json_response(['error' => 'Endpoint auth tidak valid.'], 404);
?>
