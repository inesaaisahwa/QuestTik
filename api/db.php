<?php
function db_path() {
    $dir = __DIR__ . '/../data';
    if (!is_dir($dir)) {
        if (!mkdir($dir, 0777, true) && !is_dir($dir)) {
            json_response(['error' => 'Folder database tidak bisa dibuat. Pastikan folder data dapat ditulis oleh Apache/XAMPP.'], 500);
        }
    }
    ensure_data_dir_writable($dir);
    return $dir . DIRECTORY_SEPARATOR . 'quest.sqlite';
}

function ensure_data_dir_writable($dir) {
    $probe = rtrim($dir, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . '.write-test-' . uniqid('', true);
    if (@file_put_contents($probe, 'ok') !== false) {
        @unlink($probe);
        return;
    }
    @chmod($dir, 0777);
    if (@file_put_contents($probe, 'ok') !== false) {
        @unlink($probe);
        return;
    }
    json_response(['error' => 'Folder data belum bisa ditulis oleh PHP/XAMPP. Pastikan folder QuestTik/data tidak read-only dan proyek tidak sedang terkunci OneDrive.'], 500);
}

function db() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    if (!extension_loaded('pdo_sqlite')) {
        json_response(['error' => 'Ekstensi pdo_sqlite belum aktif di PHP/XAMPP. Aktifkan extension=pdo_sqlite dan extension=sqlite3 di php.ini, lalu restart Apache.'], 500);
    }

    try {
        $pdo = new PDO('sqlite:' . db_path());
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('PRAGMA busy_timeout = 5000');
        migrate($pdo);
        seed_default_content($pdo);
        return $pdo;
    } catch (Throwable $e) {
        json_response(['error' => 'Database SQLite gagal terhubung: ' . $e->getMessage()], 500);
    }
}

function migrate($pdo) {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            avatar_id TEXT DEFAULT 'cat',
            profile_photo TEXT,
            xp INTEGER DEFAULT 0,
            unlocked_level INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS levels (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            focus TEXT NOT NULL,
            badge TEXT NOT NULL,
            theme TEXT NOT NULL,
            world_name TEXT NOT NULL,
            material_title TEXT NOT NULL,
            material_points TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            level_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            prompt TEXT NOT NULL,
            keywords TEXT NOT NULL,
            ideal TEXT NOT NULL,
            options TEXT NOT NULL,
            correct_index INTEGER DEFAULT 0,
            FOREIGN KEY(level_id) REFERENCES levels(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            player_name TEXT NOT NULL,
            level_id INTEGER NOT NULL,
            level_title TEXT NOT NULL,
            material_title TEXT NOT NULL,
            question_prompt TEXT NOT NULL,
            selected_answer TEXT NOT NULL,
            correct_answer TEXT NOT NULL,
            score INTEGER NOT NULL,
            correct INTEGER NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    ");

    $columns = $pdo->query("PRAGMA table_info(users)")->fetchAll();
    $hasUsername = false;
    $hasProfilePhoto = false;
    foreach ($columns as $column) {
        if (($column['name'] ?? '') === 'username') {
            $hasUsername = true;
        }
        if (($column['name'] ?? '') === 'profile_photo') {
            $hasProfilePhoto = true;
        }
    }
    if (!$hasUsername) {
        $pdo->exec("ALTER TABLE users ADD COLUMN username TEXT");
        $pdo->exec("UPDATE users SET username = lower(COALESCE(NULLIF(substr(email, 1, instr(email || '@', '@') - 1), ''), 'player') || id)");
        $pdo->exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)");
    } else {
        $pdo->exec("UPDATE users SET username = lower(COALESCE(NULLIF(substr(email, 1, instr(email || '@', '@') - 1), ''), 'player') || id) WHERE username IS NULL OR username = ''");
    }
    if (!$hasProfilePhoto) {
        $pdo->exec("ALTER TABLE users ADD COLUMN profile_photo TEXT");
    }
}

function seed_default_content($pdo) {
    $count = (int) $pdo->query("SELECT COUNT(*) FROM levels")->fetchColumn();
    if ($count >= 15) {
        return;
    }
    if ($count > 0) {
        $pdo->exec("DELETE FROM questions");
        $pdo->exec("DELETE FROM levels");
    }

    $levels = build_default_levels();

    $insertLevel = $pdo->prepare("INSERT INTO levels (id,title,focus,badge,theme,world_name,material_title,material_points) VALUES (?,?,?,?,?,?,?,?)");
    foreach ($levels as $level) {
        $insertLevel->execute([
            $level['id'],
            $level['title'],
            $level['focus'],
            $level['badge'],
            $level['theme'],
            $level['world_name'],
            $level['material_title'],
            json_encode($level['material_points'], JSON_UNESCAPED_UNICODE)
        ]);
    }

    $insertQuestion = $pdo->prepare("INSERT INTO questions (level_id,type,prompt,keywords,ideal,options,correct_index) VALUES (?,?,?,?,?,?,0)");
    foreach ($levels as $level) {
        foreach ($level['questions'] as $question) {
            $insertQuestion->execute([
                $level['id'],
                $question['type'],
                $question['prompt'],
                json_encode($question['keywords'], JSON_UNESCAPED_UNICODE),
                $question['ideal'],
                json_encode(array_merge([$question['ideal']], $question['distractors']), JSON_UNESCAPED_UNICODE)
            ]);
        }
    }
}

function build_default_levels() {
    $worlds = [
        [
            'world' => 1,
            'theme' => 'jungle',
            'theme_label' => 'Jungle',
            'world_name' => 'Jungle Logic',
            'badges' => ['World 1 Jungle: Leaf Logic Scout', 'World 1 Jungle: Pattern Ranger', 'World 1 Jungle: Algorithm Trailblazer'],
            'stages' => [
                ['title' => 'Dekomposisi Masalah', 'concept' => 'dekomposisi masalah', 'focus' => 'Memecah masalah besar menjadi bagian kecil', 'scenario' => 'proyek aplikasi absensi kelas', 'action' => 'membagi kebutuhan menjadi data siswa, jadwal, kehadiran, dan laporan', 'avoid' => 'langsung membuat tampilan tanpa memahami kebutuhan', 'check' => 'setiap bagian punya input, proses, dan output yang jelas', 'keywords' => ['dekomposisi', 'masalah', 'bagian', 'input', 'output']],
                ['title' => 'Pola & Abstraksi', 'concept' => 'pola dan abstraksi', 'focus' => 'Menemukan kesamaan dan memilih informasi penting', 'scenario' => 'data transaksi kantin sekolah', 'action' => 'mencari transaksi yang berulang lalu menyimpan detail yang paling penting', 'avoid' => 'mencatat semua detail tanpa memilah mana yang dipakai', 'check' => 'aturan yang dibuat tetap sesuai banyak contoh kasus', 'keywords' => ['pola', 'abstraksi', 'data', 'detail', 'aturan']],
                ['title' => 'Algoritma Solusi', 'concept' => 'algoritma', 'focus' => 'Menyusun langkah solusi yang runtut dan bisa diuji', 'scenario' => 'alur peminjaman alat praktik', 'action' => 'menulis urutan mulai dari cek stok, catat peminjam, sampai status pengembalian', 'avoid' => 'menukar urutan langkah sehingga hasil tidak konsisten', 'check' => 'algoritma bisa diuji dengan beberapa contoh peminjaman', 'keywords' => ['algoritma', 'urutan', 'solusi', 'uji', 'langkah']]
            ]
        ],
        [
            'world' => 2,
            'theme' => 'sky',
            'theme_label' => 'Sky',
            'world_name' => 'Cloud Codeway',
            'badges' => ['World 2 Sky: Variable Glider', 'World 2 Sky: Loop Jumper', 'World 2 Sky: Debug Pilot'],
            'stages' => [
                ['title' => 'Variabel & Tipe Data', 'concept' => 'variabel dan tipe data', 'focus' => 'Menyimpan nilai program secara tepat', 'scenario' => 'program kasir mini', 'action' => 'memakai variabel harga, jumlah, diskon, dan total bayar sesuai tipe datanya', 'avoid' => 'menyimpan semua nilai sebagai teks sehingga perhitungan gagal', 'check' => 'nilai yang dipakai rumus bisa berubah tanpa mengubah logika utama', 'keywords' => ['variabel', 'tipe data', 'nilai', 'kasir', 'total']],
                ['title' => 'Percabangan & Perulangan', 'concept' => 'percabangan dan perulangan', 'focus' => 'Membuat program mengambil keputusan dan mengulang proses', 'scenario' => 'pengolahan nilai siswa', 'action' => 'menggunakan if/else untuk status lulus dan loop untuk banyak siswa', 'avoid' => 'menulis kondisi berulang secara manual satu per satu', 'check' => 'program memberi hasil benar untuk nilai rendah, sedang, dan tinggi', 'keywords' => ['if', 'else', 'loop', 'kondisi', 'nilai']],
                ['title' => 'Debugging Program', 'concept' => 'debugging', 'focus' => 'Menemukan penyebab error dengan langkah sistematis', 'scenario' => 'program total bayar yang hasilnya salah', 'action' => 'mengecek input, rumus, nilai variabel, dan output secara bertahap', 'avoid' => 'mengganti banyak bagian kode sekaligus tanpa tahu penyebabnya', 'check' => 'bug yang sama tidak muncul saat diuji dengan data berbeda', 'keywords' => ['debugging', 'error', 'input', 'rumus', 'output']]
            ]
        ],
        [
            'world' => 3,
            'theme' => 'ice',
            'theme_label' => 'Ice',
            'world_name' => 'Ice Data Cave',
            'badges' => ['World 3 Ice: Table Crystal Keeper', 'World 3 Ice: Relation Frost Mapper', 'World 3 Ice: Query Glacier Seeker'],
            'stages' => [
                ['title' => 'Struktur Tabel', 'concept' => 'struktur tabel', 'focus' => 'Menyusun data dalam baris, kolom, dan kunci', 'scenario' => 'database inventaris lab', 'action' => 'menentukan kolom kode barang, nama, kategori, jumlah, dan kondisi', 'avoid' => 'mencampur banyak jenis data dalam satu kolom catatan bebas', 'check' => 'setiap baris mewakili satu barang yang jelas', 'keywords' => ['tabel', 'kolom', 'baris', 'kunci', 'inventaris']],
                ['title' => 'Relasi Data', 'concept' => 'relasi data', 'focus' => 'Menghubungkan tabel agar data tidak berulang', 'scenario' => 'peminjaman buku perpustakaan', 'action' => 'menghubungkan tabel anggota, buku, dan transaksi pinjam', 'avoid' => 'menulis nama anggota dan judul buku berulang di banyak tempat', 'check' => 'perubahan data anggota tidak perlu diedit di semua transaksi', 'keywords' => ['relasi', 'tabel', 'anggota', 'transaksi', 'duplikasi']],
                ['title' => 'Query & Validasi', 'concept' => 'query dan validasi', 'focus' => 'Mengambil data dan menjaga isi tetap benar', 'scenario' => 'laporan stok produk toko sekolah', 'action' => 'menyaring stok rendah dan menolak input kosong atau format salah', 'avoid' => 'membiarkan data duplikat masuk karena laporan tetap terlihat terisi', 'check' => 'hasil query sesuai filter dan data yang masuk valid', 'keywords' => ['query', 'validasi', 'filter', 'stok', 'format']]
            ]
        ],
        [
            'world' => 4,
            'theme' => 'lava',
            'theme_label' => 'Lava',
            'world_name' => 'Lava Firewall',
            'badges' => ['World 4 Lava: Network Ember Guard', 'World 4 Lava: Account Shield Knight', 'World 4 Lava: Troubleshoot Flame Tamer'],
            'stages' => [
                ['title' => 'Dasar Jaringan', 'concept' => 'dasar jaringan komputer', 'focus' => 'Memahami alamat IP dan perangkat jaringan', 'scenario' => 'komputer lab yang saling terhubung', 'action' => 'memeriksa IP address, gateway, switch, router, dan access point', 'avoid' => 'menganggap semua masalah jaringan pasti berasal dari browser', 'check' => 'perangkat bisa saling ping dan akses internet sesuai aturan', 'keywords' => ['ip', 'gateway', 'switch', 'router', 'jaringan']],
                ['title' => 'Keamanan Akun', 'concept' => 'keamanan akun', 'focus' => 'Melindungi akun praktik dan data pribadi', 'scenario' => 'akun siswa di komputer bersama', 'action' => 'memakai password kuat, logout, dan tidak membagikan kredensial', 'avoid' => 'menyimpan password di komputer lab agar login lebih cepat', 'check' => 'akun tetap aman walau komputer dipakai bergantian', 'keywords' => ['password', 'logout', 'akun', 'privasi', 'phishing']],
                ['title' => 'Troubleshooting Jaringan', 'concept' => 'troubleshooting jaringan', 'focus' => 'Mendiagnosis koneksi secara berurutan', 'scenario' => 'Wi-Fi kelas tersambung tetapi internet tidak jalan', 'action' => 'mengecek sinyal, IP, gateway, DNS, dan perangkat lain', 'avoid' => 'langsung mengganti aplikasi tanpa memeriksa koneksi dasar', 'check' => 'penyebab masalah ditemukan dari bukti, bukan tebak-tebakan', 'keywords' => ['troubleshooting', 'wifi', 'dns', 'koneksi', 'bukti']]
            ]
        ],
        [
            'world' => 5,
            'theme' => 'castle',
            'theme_label' => 'Castle',
            'world_name' => 'Castle AI Core',
            'badges' => ['World 5 Castle: Mentor Core Adept', 'World 5 Castle: Prompt Spell Crafter', 'World 5 Castle: Digital Ethics Guardian'],
            'stages' => [
                ['title' => 'AI sebagai Mentor', 'concept' => 'AI sebagai mentor belajar', 'focus' => 'Memakai AI untuk memahami konsep, bukan menyalin jawaban', 'scenario' => 'belajar pemrograman dengan bantuan AI', 'action' => 'meminta penjelasan, contoh, dan petunjuk sambil tetap mencoba sendiri', 'avoid' => 'menyalin jawaban AI tanpa membaca atau menguji ulang', 'check' => 'siswa bisa menjelaskan kembali hasil bantuan AI', 'keywords' => ['ai', 'mentor', 'penjelasan', 'latihan', 'mandiri']],
                ['title' => 'Prompt Efektif', 'concept' => 'prompt efektif', 'focus' => 'Menulis instruksi AI yang jelas dan berisi konteks', 'scenario' => 'memperbaiki error Python', 'action' => 'menyertakan tujuan, potongan kode, pesan error, dan format jawaban', 'avoid' => 'hanya menulis program error tanpa konteks tambahan', 'check' => 'jawaban AI lebih spesifik dan mudah diverifikasi', 'keywords' => ['prompt', 'konteks', 'kode', 'error', 'format']],
                ['title' => 'Etika Digital', 'concept' => 'etika digital', 'focus' => 'Menggunakan teknologi dengan jujur dan bertanggung jawab', 'scenario' => 'mengerjakan proyek digital kelompok', 'action' => 'memverifikasi output AI, mencantumkan kontribusi, dan menjaga privasi data', 'avoid' => 'mengunggah data pribadi atau klaim hasil AI sebagai karya penuh sendiri', 'check' => 'hasil proyek akurat, aman, dan bisa dipertanggungjawabkan', 'keywords' => ['etika', 'privasi', 'verifikasi', 'tanggung jawab', 'proyek']]
            ]
        ]
    ];

    $levels = [];
    foreach ($worlds as $world) {
        foreach ($world['stages'] as $index => $stage) {
            $stageLevel = $index + 1;
            $levels[] = [
                'id' => (($world['world'] - 1) * 3) + $stageLevel,
                'title' => $stage['title'],
                'focus' => $stage['focus'],
                'badge' => $world['badges'][$index],
                'theme' => $world['theme'],
                'world_name' => 'World ' . $world['world'] . ' ' . $world['theme_label'] . ' - Level ' . $stageLevel,
                'material_title' => $stage['title'] . ' - ' . $world['world_name'],
                'material_points' => [
                    $stage['concept'] . ' membantu pemain menyelesaikan ' . $stage['scenario'] . ' dengan langkah yang jelas.',
                    'Strategi utama level ini adalah ' . $stage['action'] . '.',
                    'Hindari kebiasaan ' . $stage['avoid'] . '; cek hasil dengan cara ' . $stage['check'] . '.'
                ],
                'questions' => make_stage_questions($stage)
            ];
        }
    }
    return $levels;
}

function make_stage_questions($stage) {
    return [
        make_question_row('Konsep', 'Apa tujuan utama memahami ' . $stage['concept'] . ' pada ' . $stage['scenario'] . '?', $stage['keywords'], 'Tujuannya adalah ' . $stage['action'] . ' sehingga solusi lebih rapi, terukur, dan mudah diuji.', ['Agar tampilan aplikasi terlihat ramai sebelum kebutuhan dipahami.', 'Agar semua pekerjaan bisa langsung disalin tanpa latihan mandiri.', 'Agar proses dibuat secepat mungkin tanpa memeriksa hasil.']),
        make_question_row('Analisis', 'Langkah paling tepat saat menghadapi ' . $stage['scenario'] . ' adalah...', $stage['keywords'], 'Mulai dengan ' . $stage['action'] . ', lalu bandingkan hasilnya dengan kebutuhan nyata.', ['Mengerjakan bagian yang paling mudah dulu tanpa melihat hubungan antarbagian.', 'Menghapus semua data lama agar masalah terlihat sederhana.', 'Menunda pengecekan sampai seluruh pekerjaan dianggap selesai.']),
        make_question_row('Kesalahan', 'Kesalahan yang harus dihindari pada materi ' . $stage['concept'] . ' adalah...', $stage['keywords'], 'Menghindari kebiasaan ' . $stage['avoid'] . ' karena bisa membuat hasil tidak akurat.', ['Mencatat asumsi sebelum membuat keputusan teknis.', 'Menguji solusi dengan lebih dari satu contoh kasus.', 'Meminta umpan balik saat konsep belum benar-benar jelas.']),
        make_question_row('Penerapan', 'Bagaimana cara mengecek bahwa solusi untuk ' . $stage['scenario'] . ' sudah tepat?', $stage['keywords'], 'Pastikan ' . $stage['check'] . ' dan hasilnya konsisten saat diuji ulang.', ['Cukup melihat warna tombol karena tampilan selalu menentukan kualitas solusi.', 'Gunakan satu contoh saja supaya proses pengecekan lebih singkat.', 'Abaikan hasil berbeda karena variasi data tidak memengaruhi solusi.']),
        make_question_row('Refleksi', 'Jika hasil quest ' . $stage['concept'] . ' belum benar, tindakan terbaik adalah...', $stage['keywords'], 'Baca ulang kata kunci, perbaiki langkah yang keliru, lalu uji lagi dengan contoh berbeda.', ['Langsung pindah level agar progress terlihat lebih cepat.', 'Mengganti semua jawaban tanpa melihat alasan kesalahan.', 'Menyalin pilihan teman karena hasilnya kemungkinan sama.'])
    ];
}

function make_question_row($type, $prompt, $keywords, $ideal, $distractors) {
    return [
        'type' => $type,
        'prompt' => $prompt,
        'keywords' => $keywords,
        'ideal' => $ideal,
        'distractors' => $distractors
    ];
}

function json_response($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function read_json_body() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function normalize_level($level) {
    $level['materialPoints'] = json_decode($level['material_points'] ?? '[]', true) ?: [];
    unset($level['material_points']);
    return $level;
}

function normalize_question($question) {
    $question['keywords'] = json_decode($question['keywords'] ?? '[]', true) ?: [];
    $question['options'] = json_decode($question['options'] ?? '[]', true) ?: [];
    $question['correctIndex'] = (int) ($question['correct_index'] ?? 0);
    unset($question['correct_index']);
    return $question;
}
?>
