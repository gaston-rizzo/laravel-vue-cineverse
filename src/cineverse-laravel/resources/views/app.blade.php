<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}?v=cineverse">
        <link rel="shortcut icon" type="image/x-icon" href="{{ asset('favicon.ico') }}?v=cineverse">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <style>
            html, body {
                margin: 0;
                padding: 0;
                background: #0b0f19;
            }

            #app {
                min-height: 100vh;
                background: #0b0f19;
            }
        </style>

        <!-- Scripts -->
        @routes
        @vite(['resources/js/app.ts', "resources/js/Pages/{$page['component']}.vue"])
        @inertiaHead
    </head>
    <body>
        @inertia
    </body>
</html>
