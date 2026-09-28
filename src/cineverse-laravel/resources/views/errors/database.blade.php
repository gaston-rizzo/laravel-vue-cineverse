<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>CineVerse - Base de datos no disponible</title>
    <style>
        :root {
            color-scheme: dark;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: #0b0f19;
            color: #f8fafc;
        }

        body {
            min-height: 100vh;
            margin: 0;
            display: grid;
            place-items: center;
            overflow: hidden;
            background:
                radial-gradient(circle at 20% 20%, rgba(229, 9, 20, .15), transparent 40%),
                radial-gradient(circle at 80% 30%, rgba(124, 58, 237, .18), transparent 45%),
                radial-gradient(circle at 50% 80%, rgba(30, 64, 175, .18), transparent 50%),
                linear-gradient(180deg, #0b0f19 0%, #0f172a 40%, #0b0f19 100%);
        }

        main {
            width: min(520px, calc(100vw - 40px));
            padding: 34px;
            border: 1px solid rgba(248, 113, 113, .28);
            border-radius: 18px;
            background: rgba(15, 23, 42, .72);
            box-shadow: 0 24px 80px rgba(0, 0, 0, .45);
            text-align: center;
            backdrop-filter: blur(18px);
        }

        h1 {
            margin: 0 0 12px;
            font-size: clamp(26px, 5vw, 38px);
            line-height: 1.1;
        }

        p {
            margin: 0;
            color: rgba(226, 232, 240, .82);
            line-height: 1.6;
            font-size: 16px;
        }

        .code {
            display: inline-flex;
            margin-bottom: 18px;
            padding: 7px 12px;
            border-radius: 999px;
            color: #fecaca;
            background: rgba(239, 68, 68, .12);
            border: 1px solid rgba(239, 68, 68, .25);
            font-size: 13px;
            font-weight: 800;
            letter-spacing: .08em;
        }
    </style>
</head>
<body>
    <main>
        <div class="code">DATABASE 503</div>
        <h1>Base de datos no disponible</h1>
        <p>MySQL no esta levantado o no acepta conexiones. Inicia MySQL en XAMPP y recarga la pagina.</p>
    </main>
</body>
</html>
