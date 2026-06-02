<?php
session_start();
require_once __DIR__ . '/db.php';

$pdo = db();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $scope = $_GET['scope'] ?? 'mine';
    if ($scope === 'all') {
        $attempts = $pdo->query("SELECT * FROM attempts ORDER BY created_at DESC")->fetchAll();
        json_response(['attempts' => $attempts]);
    }

    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId) {
        json_response(['attempts' => []]);
    }

    $stmt = $pdo->prepare("SELECT * FROM attempts WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->execute([(int) $userId]);
    $attempts = $stmt->fetchAll();
    json_response(['attempts' => $attempts]);
}

if ($method === 'DELETE') {
    $scope = $_GET['scope'] ?? 'mine';
    if ($scope === 'all') {
        $pdo->exec("DELETE FROM attempts");
        $pdo->exec("UPDATE users SET xp = 0, unlocked_level = 1");
        json_response(['ok' => true]);
    }
    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId) {
        json_response(['ok' => true, 'user' => null]);
    }
    $pdo->prepare("DELETE FROM attempts WHERE user_id = ?")->execute([(int) $userId]);
    $pdo->prepare("UPDATE users SET xp = 0, unlocked_level = 1 WHERE id = ?")->execute([(int) $userId]);
    $stmt = $pdo->prepare("SELECT id,name,username,email,avatar_id,profile_photo,xp,unlocked_level FROM users WHERE id = ?");
    $stmt->execute([(int) $userId]);
    json_response(['ok' => true, 'user' => $stmt->fetch()]);
}

if ($method === 'POST') {
    $data = read_json_body();
    $userId = $_SESSION['user_id'] ?? null;
    $stmt = $pdo->prepare("INSERT INTO attempts (user_id,player_name,level_id,level_title,material_title,question_prompt,selected_answer,correct_answer,score,correct) VALUES (?,?,?,?,?,?,?,?,?,?)");
    $stmt->execute([
        $userId,
        $data['playerName'] ?? 'Pemain',
        (int) ($data['levelId'] ?? 0),
        $data['levelTitle'] ?? '',
        $data['materialTitle'] ?? '',
        $data['questionPrompt'] ?? '',
        $data['answer'] ?? '',
        $data['correctAnswer'] ?? '',
        (int) ($data['score'] ?? 0),
        !empty($data['correct']) ? 1 : 0
    ]);
    if ($userId && !empty($data['correct'])) {
        $xp = 50 + round(((int) ($data['score'] ?? 0)) / 5);
        $pdo->prepare("UPDATE users SET xp = xp + ? WHERE id = ?")->execute([$xp, $userId]);
    }
    $user = null;
    if ($userId) {
        $levelId = (int) ($data['levelId'] ?? 0);
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM questions WHERE level_id = ?");
        $stmt->execute([$levelId]);
        $questionCount = (int) $stmt->fetchColumn();
        $stmt = $pdo->prepare("SELECT COUNT(DISTINCT question_prompt) FROM attempts WHERE user_id = ? AND level_id = ?");
        $stmt->execute([$userId, $levelId]);
        $answeredCount = (int) $stmt->fetchColumn();
        if ($questionCount > 0 && $answeredCount >= $questionCount) {
            $maxLevel = (int) $pdo->query("SELECT COALESCE(MAX(id), 1) FROM levels")->fetchColumn();
            $nextLevel = min($maxLevel, $levelId + 1);
            $pdo->prepare("UPDATE users SET unlocked_level = MAX(unlocked_level, ?) WHERE id = ?")->execute([$nextLevel, $userId]);
        }
        $stmt = $pdo->prepare("SELECT id,name,username,email,avatar_id,profile_photo,xp,unlocked_level FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
    }
    json_response(['ok' => true, 'user' => $user]);
}

json_response(['error' => 'Method tidak valid.'], 405);
?>
