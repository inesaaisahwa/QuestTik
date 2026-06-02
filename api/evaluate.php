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
        return 'Kuota AI sedang habis atau terlalu banyak request. Evaluasi lokal akan tetap dipakai, lalu coba AI lagi beberapa saat nanti.';
    }

    if ($status === 401 || $status === 403 || stripos($message, 'api key') !== false) {
        return 'API key Gemini ditolak. Periksa kembali GEMINI_API_KEY di file .env.';
    }

    return 'Gemini API sedang tidak bisa memproses request saat ini. Coba lagi nanti.';
}

function normalize_list($value) {
    if ($value === null) {
        return [];
    }
    if (!is_array($value)) {
        return [(string) $value];
    }
    return array_map('strval', $value);
}

function option_at($question, $index) {
    $options = $question['options'] ?? [];
    return isset($options[(int) $index]) ? $options[(int) $index] : null;
}

function system_prompt() {
    return 'Anda adalah AI mentor untuk edugame Informatika berbahasa Indonesia bagi siswa SMK. '
        . 'Nilai jawaban pilihan ganda secara adil dan pedagogis. '
        . 'Berikan penjelasan yang cukup lengkap, tidak hanya benar/salah. '
        . 'Hubungkan alasan dengan materi, contoh praktik kerja SMK, miskonsepsi yang mungkin terjadi, dan langkah belajar berikutnya. '
        . 'Balas hanya JSON valid tanpa markdown.';
}

function build_user_payload($answer, $selected_index, $question, $level) {
    return [
        'instruksi' => 'Evaluasi pilihan siswa. Skor 0-100. correct true jika selectedIndex sama dengan correctIndex.',
        'mode' => 'pilihan_ganda',
        'format_json' => [
            'score' => 'integer 0-100',
            'correct' => 'boolean',
            'feedback' => 'string singkat untuk siswa',
            'suggestions' => ['4 sampai 6 poin penjelasan, hint, atau apresiasi yang cukup detail'],
            'matched' => ['konsep/kata kunci yang sudah muncul'],
            'missing' => ['konsep penting yang belum muncul'],
        ],
        'level' => [
            'id' => $level['id'] ?? null,
            'title' => $level['title'] ?? null,
            'focus' => $level['focus'] ?? null,
        ],
        'pertanyaan' => [
            'type' => $question['type'] ?? null,
            'prompt' => $question['prompt'] ?? null,
            'keywords' => $question['keywords'] ?? [],
            'ideal' => $question['ideal'] ?? null,
            'options' => $question['options'] ?? [],
            'correctIndex' => $question['correctIndex'] ?? null,
            'correctAnswer' => option_at($question, $question['correctIndex'] ?? null),
        ],
        'pilihan_siswa' => [
            'selectedIndex' => $selected_index,
            'selectedAnswer' => $answer,
        ],
    ];
}

function parse_ai_json($text) {
    $data = json_decode($text, true);
    if (is_array($data)) {
        return $data;
    }
    if (preg_match('/\{.*\}/s', $text, $matches)) {
        $data = json_decode($matches[0], true);
        if (is_array($data)) {
            return $data;
        }
    }
    fail_json('AI tidak mengembalikan JSON valid.');
}

function sanitize_evaluation($data, $selected_index, $correct_index) {
    $score = max(0, min(100, (int) ($data['score'] ?? 0)));
    $correct = (bool) ($data['correct'] ?? ($score >= 70));

    if ($selected_index !== null && $correct_index !== null) {
        $correct = ((int) $selected_index === (int) $correct_index);
        $score = $correct ? max($score, 90) : min($score, 55);
    }

    return [
        'score' => $score,
        'correct' => $correct,
        'feedback' => (string) ($data['feedback'] ?? 'Evaluasi selesai.'),
        'suggestions' => array_slice(normalize_list($data['suggestions'] ?? []), 0, 6),
        'matched' => array_slice(normalize_list($data['matched'] ?? []), 0, 8),
        'missing' => array_slice(normalize_list($data['missing'] ?? []), 0, 8),
        'source' => 'gemini-xampp',
    ];
}

$env_status = questtik_load_env();

$raw = file_get_contents('php://input');
$payload = json_decode($raw, true);
if (!is_array($payload)) {
    fail_json('JSON request tidak valid.', 400);
}

$api_key = questtik_env('GEMINI_API_KEY') ?: questtik_env('GOOGLE_API_KEY') ?: questtik_env('EXTERNAL_AI_API_KEY');
if (!$api_key) {
    fail_json(questtik_missing_gemini_key_message($env_status));
}

$answer = trim((string) ($payload['answer'] ?? ''));
$selected_index = $payload['selectedIndex'] ?? null;
$question = $payload['question'] ?? [];
$level = $payload['level'] ?? [];

if ($answer === '') {
    fail_json('Jawaban siswa kosong.', 400);
}
if (!isset($question['prompt'])) {
    fail_json('Data pertanyaan tidak lengkap.', 400);
}

$base_url = rtrim(questtik_env('EXTERNAL_AI_BASE_URL') ?: 'https://generativelanguage.googleapis.com/v1beta', '/');
$model = questtik_env('EXTERNAL_AI_MODEL') ?: 'gemini-2.5-flash';
$url = $base_url . '/models/' . rawurlencode($model) . ':generateContent';

$body = [
    'systemInstruction' => [
        'parts' => [['text' => system_prompt()]],
    ],
    'contents' => [[
        'role' => 'user',
        'parts' => [[
            'text' => json_encode(build_user_payload($answer, $selected_index, $question, $level), JSON_UNESCAPED_UNICODE),
        ]],
    ]],
    'generationConfig' => [
        'temperature' => 0.2,
        'responseMimeType' => 'application/json',
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
$parts = $provider_data['candidates'][0]['content']['parts'] ?? null;
if (!is_array($parts)) {
    fail_json('Format respons Gemini tidak dikenali.');
}

$text = '';
foreach ($parts as $part) {
    $text .= $part['text'] ?? '';
}

$result = sanitize_evaluation(parse_ai_json($text), $selected_index, $question['correctIndex'] ?? null);
echo json_encode($result, JSON_UNESCAPED_UNICODE);
