<?php

function questtik_env_candidates() {
    $candidates = [dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env'];

    if (!empty($_SERVER['DOCUMENT_ROOT'])) {
        $candidates[] = rtrim($_SERVER['DOCUMENT_ROOT'], "/\\") . DIRECTORY_SEPARATOR . '.env';
    }

    $cwd = getcwd();
    if ($cwd) {
        $candidates[] = rtrim($cwd, "/\\") . DIRECTORY_SEPARATOR . '.env';
    }

    return array_values(array_unique($candidates));
}

function questtik_load_env($paths = null) {
    $status = [
        'loaded' => false,
        'path' => null,
        'checked' => [],
        'error' => null,
    ];

    foreach (($paths ?: questtik_env_candidates()) as $path) {
        if (!$path) {
            continue;
        }

        $status['checked'][] = $path;

        if (!is_file($path)) {
            continue;
        }

        if (!is_readable($path)) {
            $status['error'] = 'File .env ditemukan tapi tidak bisa dibaca: ' . $path;
            continue;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES);
        if ($lines === false) {
            $status['error'] = 'File .env gagal dibuka: ' . $path;
            continue;
        }

        foreach ($lines as $line) {
            $line = preg_replace('/^\xEF\xBB\xBF/', '', trim($line));
            if ($line === '' || substr($line, 0, 1) === '#' || strpos($line, '=') === false) {
                continue;
            }

            [$key, $value] = explode('=', $line, 2);
            $key = preg_replace('/^\xEF\xBB\xBF/', '', trim($key));
            $value = trim($value);

            if (strlen($value) >= 2) {
                $first = substr($value, 0, 1);
                $last = substr($value, -1);
                if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                    $value = substr($value, 1, -1);
                }
            }

            if ($key === '') {
                continue;
            }

            $current = getenv($key);
            if ($current === false || trim((string) $current) === '') {
                putenv($key . '=' . $value);
                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
            }
        }

        $status['loaded'] = true;
        $status['path'] = $path;
        return $status;
    }

    return $status;
}

function questtik_env($key) {
    $value = getenv($key);
    if ($value === false && isset($_ENV[$key])) {
        $value = $_ENV[$key];
    }
    if ($value === false && isset($_SERVER[$key])) {
        $value = $_SERVER[$key];
    }

    return $value === false ? '' : trim((string) $value);
}

function questtik_missing_gemini_key_message($env_status) {
    if (!empty($env_status['error'])) {
        return $env_status['error'] . '. Pastikan baris GEMINI_API_KEY sudah terisi.';
    }

    if (empty($env_status['loaded'])) {
        return 'File .env tidak ditemukan oleh PHP. Letakkan .env di root proyek yang sedang dibuka server. Lokasi yang dicari: '
            . implode(', ', $env_status['checked']);
    }

    return 'GEMINI_API_KEY belum terisi di file .env yang dibaca PHP: '
        . $env_status['path']
        . '. Pastikan formatnya GEMINI_API_KEY=isi_api_key_tanpa_spasi.';
}
