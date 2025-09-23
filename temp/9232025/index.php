<?php
 require_once __DIR__ . '/../config.php';
 require_once __DIR__ . '/../database.php';

 $db = new Database();
 $pdo = $db->getPDO();
 $message = '';
 $error = '';

 // Allow messages via query string (from upload_import.php redirects)
 if (isset($_GET['msg']) && $_GET['msg'] !== '') {
     $message = $_GET['msg'];
 }
 if (isset($_GET['err']) && $_GET['err'] !== '') {
     $error = $_GET['err'];
 }

 // Handle actions
 if ($_SERVER['REQUEST_METHOD'] === 'POST') {
     $action = $_POST['action'] ?? '';
     try {
         if ($action === 'import') {
             require_once __DIR__ . '/../excel_reader.php';
             $reader = new ExcelReader(EXCEL_FILE_PATH);
             $reader->readExcelFile();
             $message = 'Excel file imported into SQLite successfully.';
         } elseif ($action === 'reset') {
             $db->clearData();
             $message = 'Database cleared successfully.';
         }
     } catch (Exception $e) {
         $error = 'Action failed: ' . htmlspecialchars($e->getMessage());
     }
 }

 // Handle DB download
 if (isset($_GET['download']) && $_GET['download'] === 'db') {
     if (file_exists(DB_PATH)) {
         header('Content-Description: File Transfer');
         header('Content-Type: application/octet-stream');
         header('Content-Disposition: attachment; filename="' . basename(DB_PATH) . '"');
         header('Content-Length: ' . filesize(DB_PATH));
         readfile(DB_PATH);
         exit;
     }
 }

 // Compute stats
 $sheetsCount = 0;
 $totalRows = 0;
 $lastImport = null;

 try {
     $sheetsCount = (int)$pdo->query('SELECT COUNT(*) FROM sheets')->fetchColumn();
     $totalRows = (int)$pdo->query('SELECT COALESCE(SUM(row_count),0) FROM sheets')->fetchColumn();
     $lastImport = $pdo->query('SELECT MAX(created_at) FROM sheets')->fetchColumn();
 } catch (Exception $e) {
     // Ignore stats errors on first run
 }
 ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Excel Manager - PHP & SQLite</title>
    <style>
        :root {
            --bg: #0f172a;
            --card: #111827;
            --muted: #94a3b8;
            --text: #e5e7eb;
            --primary: #6366f1;
            --primary-600: #5458ee;
            --success: #22c55e;
            --danger: #ef4444;
            --border: #1f2937;
            --accent: #06b6d4;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji';
            color: var(--text);
            background: radial-gradient(1200px 800px at 100% -10%, rgba(99,102,241,0.15), transparent 50%),
                    radial-gradient(1000px 600px at -10% 0%, rgba(6,182,212,0.18), transparent 40%),
                    var(--bg);
            min-height: 100vh;
        }
        .container { max-width: 1100px; margin: 0 auto; padding: 32px 20px 60px; }
        .hero {
            background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(6,182,212,0.12));
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 28px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.25);
            backdrop-filter: blur(6px);
        }
        .title { font-size: 28px; margin: 0 0 8px; letter-spacing: 0.3px; }
        .subtitle { color: var(--muted); margin: 0; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 18px; margin-top: 22px; }
        .card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 18px; overflow: hidden; }
        .card h3 { margin: 0 0 10px; font-size: 16px; color: #cbd5e1; }
        .stat { font-size: 28px; font-weight: 700; color: #fff; }
        .muted { color: var(--muted); font-size: 13px; }
        .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; align-items: center; }
        .btn { appearance: none; border: 1px solid var(--border); color: #fff; background: #1f2937; padding: 10px 14px; border-radius: 10px; cursor: pointer; font-weight: 600; transition: transform .05s ease, background .2s ease, border-color .2s ease; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
        .btn:hover { transform: translateY(-1px); border-color: #334155; }
        .btn-primary { background: linear-gradient(180deg, var(--primary), var(--primary-600)); border-color: transparent; }
        .btn-danger { background: linear-gradient(180deg, #ef4444, #dc2626); border-color: transparent; }
        .btn-secondary { background: #0b1220; }
        input[type="file"] { max-width: 100%; color: var(--text); background: #0b1220; border: 1px solid var(--border); padding: 8px; border-radius: 8px; }
        @media (max-width: 800px) {
          .grid { grid-template-columns: 1fr; }
        }
        .note { margin-top: 8px; font-size: 12px; color: var(--muted); }
        .alert { margin: 14px 0; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border); }
        .alert.success { background: rgba(34,197,94,0.12); border-color: rgba(34,197,94,0.35); }
        .alert.error { background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.35); }
        .footer { margin-top: 26px; color: var(--muted); font-size: 12px; text-align: center; }
        form { display: inline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="hero">
            <h1 class="title">Excel Manager</h1>
            <p class="subtitle">PHP + SQLite. Import your Excel file into a SQLite database and browse it in the viewer.</p>

            <?php if ($message): ?>
                <div class="alert success"><?php echo htmlspecialchars($message); ?></div>
            <?php endif; ?>
            <?php if ($error): ?>
                <div class="alert error"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>

            <div class="grid">
                <div class="card">
                    <h3>Database Stats</h3>
                    <div class="stat"><?php echo number_format($sheetsCount); ?></div>
                    <div class="muted">Sheets stored</div>
                    <div class="stat" style="margin-top:10px; font-size:22px;">
                        <?php echo number_format($totalRows); ?> Rows
                    </div>
                    <div class="muted">Last import: <?php echo $lastImport ? htmlspecialchars($lastImport) : '—'; ?></div>
                </div>

                <div class="card">
                    <h3>Import Excel</h3>
                    <div class="muted">Current file: <strong><?php echo htmlspecialchars(basename(EXCEL_FILE_PATH)); ?></strong></div>
                    <div class="actions" style="margin-top:12px;">
                        <form method="post">
                            <input type="hidden" name="action" value="import" />
                            <button class="btn btn-primary" type="submit">Import to SQLite</button>
                        </form>
                        <form method="post" action="../upload_import.php" enctype="multipart/form-data" style="display:flex; gap:8px; align-items:center;">
                            <input type="file" name="excel" accept=".xlsx,.xls" required style="color:#e5e7eb;">
                            <button class="btn" type="submit">Upload & Import</button>
                        </form>
                        <a class="btn btn-secondary" href="../index.php">Open Data Viewer</a>
                        <a class="btn" href="?download=db">Download Database</a>
                    </div>
                    <div class="note">Place your Excel file at <code><?php echo htmlspecialchars(EXCEL_FILE_PATH); ?></code></div>
                </div>

                <div class="card">
                    <h3>Maintenance</h3>
                    <div class="actions">
                        <form method="post" onsubmit="return confirm('This will delete all data. Continue?');">
                            <input type="hidden" name="action" value="reset" />
                            <button class="btn btn-danger" type="submit">Reset Database</button>
                        </form>
                    </div>
                    <div class="note">Database file: <code><?php echo htmlspecialchars(DB_PATH); ?></code></div>
                </div>
            </div>
        </div>

        <div class="footer">© <?php echo date('Y'); ?> Excel Manager • PHP + SQLite</div>
    </div>
</body>
</html>