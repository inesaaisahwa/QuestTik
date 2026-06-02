<?php
require_once __DIR__ . '/db.php';

$pdo = db();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $levels = array_map('normalize_level', $pdo->query("SELECT * FROM levels ORDER BY id")->fetchAll());
    foreach ($levels as &$level) {
        $stmt = $pdo->prepare("SELECT * FROM questions WHERE level_id = ? ORDER BY id");
        $stmt->execute([$level['id']]);
        $level['questions'] = array_map('normalize_question', $stmt->fetchAll());
    }
    json_response([
        'avatars' => [
            ['id' => 'bear', 'name' => 'Bear Byte', 'initial' => 'BB', 'color' => '#ffd9bb', 'role' => 'Tank logika'],
            ['id' => 'rabbit', 'name' => 'Rabbit Runner', 'initial' => 'RR', 'color' => '#ffe9c9', 'role' => 'Cepat menaklukkan kuis'],
            ['id' => 'koala', 'name' => 'Koala Kernel', 'initial' => 'KK', 'color' => '#d7e2f0', 'role' => 'Tenang saat debugging'],
            ['id' => 'cat', 'name' => 'Cat Compiler', 'initial' => 'CC', 'color' => '#ffe0a0', 'role' => 'Teliti membaca instruksi'],
            ['id' => 'dog', 'name' => 'Dog Debugger', 'initial' => 'DD', 'color' => '#f0c090', 'role' => 'Setia mengecek error']
        ],
        'levels' => $levels
    ]);
}

if ($method === 'POST') {
    $data = read_json_body();
    $levels = $data['levels'] ?? [];
    if (!is_array($levels)) {
        json_response(['error' => 'Format levels tidak valid.'], 400);
    }
    $pdo->beginTransaction();
    $pdo->exec("DELETE FROM questions");
    $pdo->exec("DELETE FROM levels");
    $insertLevel = $pdo->prepare("INSERT INTO levels (id,title,focus,badge,theme,world_name,material_title,material_points) VALUES (?,?,?,?,?,?,?,?)");
    $insertQuestion = $pdo->prepare("INSERT INTO questions (level_id,type,prompt,keywords,ideal,options,correct_index) VALUES (?,?,?,?,?,?,?)");
    foreach ($levels as $level) {
        $insertLevel->execute([
            (int) $level['id'],
            $level['title'] ?? '',
            $level['focus'] ?? '',
            $level['badge'] ?? '',
            $level['theme'] ?? 'jungle',
            $level['world_name'] ?? ($level['title'] ?? ''),
            $level['materialTitle'] ?? ($level['material_title'] ?? ''),
            json_encode($level['materialPoints'] ?? [], JSON_UNESCAPED_UNICODE)
        ]);
        foreach (($level['questions'] ?? []) as $question) {
            $insertQuestion->execute([
                (int) $level['id'],
                $question['type'] ?? 'Konsep',
                $question['prompt'] ?? '',
                json_encode($question['keywords'] ?? [], JSON_UNESCAPED_UNICODE),
                $question['ideal'] ?? '',
                json_encode($question['options'] ?? [], JSON_UNESCAPED_UNICODE),
                (int) ($question['correctIndex'] ?? 0)
            ]);
        }
    }
    $pdo->commit();
    json_response(['ok' => true]);
}

json_response(['error' => 'Method tidak valid.'], 405);
?>
