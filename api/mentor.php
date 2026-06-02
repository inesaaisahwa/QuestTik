<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/env.php';

function fail_json($message, $status = 500) {
    http_response_code($status);
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function provider_error_message($response, $status) {
    $data = json_decode((string) $response, true);
    $message = '';
    $provider_status = '';

    if (is_array($data)) {
        $message = (string) ($data['error']['message'] ?? '');
        $provider_status = (string) ($data['error']['status'] ?? '');
    }

    if ($status === 429 || $provider_status === 'RESOURCE_EXHAUSTED' || stripos($message, 'quota') !== false) {
        return 'Kuota Mentor AI sedang habis atau terlalu banyak request. Coba lagi beberapa saat nanti, atau gunakan API key/project Gemini yang kuotanya masih tersedia.';
    }

    if ($status === 401 || $status === 403 || stripos($message, 'api key') !== false) {
        return 'API key Gemini ditolak. Periksa kembali GEMINI_API_KEY di file .env.';
    }

    return 'Gemini API sedang tidak bisa memproses request saat ini. Coba lagi nanti.';
}

function mentor_system_prompt() {
    return 'Anda adalah Mentor AI QuestTik untuk siswa SMK yang belajar Informatika. '
        . 'Jawab dalam bahasa Indonesia yang ramah, jelas, dan pedagogis. '
        . 'Tidak perlu membuka dengan sapaan; langsung masuk ke jawaban. '
        . 'Langsung jawab inti pertanyaan dalam 3 sampai 5 kalimat pendek. '
        . 'Pastikan jawaban selesai, tidak menggantung, dan akhiri dengan satu langkah belajar yang jelas. '
        . 'Gunakan paragraf pendek atau maksimal 3 poin jika perlu. '
        . 'Gunakan baris baru antar poin agar mudah dibaca. '
        . 'Boleh pakai **tebal** hanya untuk istilah penting, jangan memakai markdown berlebihan. '
        . 'Jika siswa meminta jawaban kuis, jelaskan konsep dan arah berpikirnya tanpa sekadar memberi contekan.';
}

function build_mentor_prompt($payload) {
    $message = trim((string) ($payload['message'] ?? ''));
    $level = $payload['activeLevel'] ?? null;
    $user = $payload['user'] ?? null;

    $context = [
        'nama_game' => 'QuestTik',
        'target' => 'Siswa SMK bidang Informatika',
        'siswa' => [
            'name' => $user['name'] ?? 'Siswa',
            'username' => $user['username'] ?? null,
        ],
        'world_aktif' => $level ? [
            'id' => $level['id'] ?? null,
            'title' => $level['title'] ?? null,
            'world_name' => $level['world_name'] ?? null,
            'focus' => $level['focus'] ?? null,
            'materi' => $level['materialPoints'] ?? [],
        ] : null,
        'pertanyaan_siswa' => $message,
        'instruksi_jawaban' => [
            'Gunakan bahasa sederhana untuk siswa SMK.',
            'Berikan penjelasan konsep, contoh, dan langkah belajar.',
            'Jika relevan, hubungkan dengan world atau materi yang sedang dipelajari.',
        ],
    ];

    return json_encode($context, JSON_UNESCAPED_UNICODE);
}

$env_status = questtik_load_env();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail_json('Method tidak valid.', 405);
}

$payload = json_decode(file_get_contents('php://input'), true);
if (!is_array($payload)) {
    fail_json('JSON request tidak valid.', 400);
}

$message = trim((string) ($payload['message'] ?? ''));
if ($message === '') {
    fail_json('Pertanyaan mentor tidak boleh kosong.', 400);
}

$api_key = questtik_env('GEMINI_API_KEY') ?: questtik_env('GOOGLE_API_KEY') ?: questtik_env('EXTERNAL_AI_API_KEY');
if (!$api_key) {
    fail_json(questtik_missing_gemini_key_message($env_status));
}

$base_url = rtrim(questtik_env('EXTERNAL_AI_BASE_URL') ?: 'https://generativelanguage.googleapis.com/v1beta', '/');
$model = questtik_env('EXTERNAL_AI_MODEL') ?: 'gemini-2.5-flash';
$url = $base_url . '/models/' . rawurlencode($model) . ':generateContent';

$body = [
    'systemInstruction' => [
        'parts' => [['text' => mentor_system_prompt()]],
    ],
    'contents' => [[
        'role' => 'user',
        'parts' => [['text' => build_mentor_prompt($payload)]],
    ]],
    'generationConfig' => [
        'temperature' => 0.35,
        'maxOutputTokens' => 1024,
    ],
];

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'x-goog-api-key: ' . $api_key,
    ],
    CURLOPT_TIMEOUT => 35,
]);

$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($response === false || $error) {
    fail_json('Gagal menghubungi Gemini API: ' . $error);
}
if ($status < 200 || $status >= 300) {
    fail_json(provider_error_message($response, $status), $status === 429 ? 429 : 502);
}

$provider_data = json_decode($response, true);
$finish_reason = $provider_data['candidates'][0]['finishReason'] ?? '';
$parts = $provider_data['candidates'][0]['content']['parts'] ?? null;
if (!is_array($parts)) {
    fail_json('Format respons Gemini tidak dikenali.');
}

$reply = '';
foreach ($parts as $part) {
    $reply .= $part['text'] ?? '';
}

$reply = trim($reply);
if ($reply === '') {
    fail_json('Mentor AI mengembalikan jawaban kosong.');
}
if ($finish_reason === 'MAX_TOKENS') {
    fail_json('Jawaban Mentor AI terpotong sebelum selesai. Coba kirim pertanyaan yang lebih spesifik atau ulangi sekali lagi.', 502);
}

echo json_encode([
    'ok' => true,
    'reply' => $reply,
    'source' => 'gemini-env',
], JSON_UNESCAPED_UNICODE);
?>
