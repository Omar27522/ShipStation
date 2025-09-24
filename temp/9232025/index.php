<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Excel Manager - PHP & SQLite</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <div class="hero">
            <h1 class="title">Excel Manager</h1>
            <p class="subtitle">PHP + SQLite. Import your Excel file into a SQLite database and browse it in the viewer.</p>

            <div class="grid">
                <div class="card">
                    <h3>Database Stats</h3>
                    <div class="stat">0</div>
                    <div class="muted">Sheets stored</div>
                    <div class="stat" style="margin-top:10px; font-size:22px;">
                        0 Rows
                    </div>
                    <div class="muted">Last import: —</div>
                </div>

                <div class="card">
                    <h3>Import Excel</h3>
                    <div class="muted">Current file: <strong>9232025.xlsx</strong></div>
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
                    <div class="note">Place your Excel file at <code>9232025.xlsx</code></div>
                </div>

                <div class="card">
                    <h3>Maintenance</h3>
                    <div class="actions">
                        <form method="post" >
                            <input type="hidden" name="action" value="reset" />
                            <button class="btn btn-danger" type="submit">Reset Database</button>
                        </form>
                    </div>
                    <div class="note">Database file: <code>excel_data.db</code></div>
                </div>
            </div>
        </div>
        <section>
            <table>
                <thead>
                    <tr>
                        <th>Sheet Name</th>
                        <th>Rows</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                        <tr>
                            <td>Thing</td>
                            <td>10</td>
                            <td>
                                <a href="?sheet=Thing" class="btn btn-primary">View</a>
                                <a href="?download=Thing" class="btn btn-secondary">Download</a>
                            </td>
                        </tr>
                </tbody>
            </table>
        </section>

        <div class="footer">© <?php echo date('Y'); ?> Excel Manager • PHP + SQLite</div>
    </div>
</body>
</html>