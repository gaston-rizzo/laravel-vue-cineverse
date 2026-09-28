<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class UserSeeder extends Seeder
{
    private const EXPECTED_COUNT = 5000;
    private const BATCH_SIZE = 500;

    public function run(): void
    {
        if (DB::table('users')->count() !== 0) {
            throw new RuntimeException(
                'UserSeeder requiere users vacía. Use: php artisan migrate:fresh --seed'
            );
        }

        $path = database_path('seeders/data/users.ndjson');
        $handle = fopen($path, 'rb');

        if ($handle === false) {
            throw new RuntimeException("No se pudo abrir {$path}");
        }

        $batch = [];
        $count = 0;

        try {
            while (($line = fgets($handle)) !== false) {
                if (trim($line) === '') {
                    continue;
                }

                $row = json_decode($line, true, 512, JSON_THROW_ON_ERROR);
                $batch[] = $row;
                $count++;

                if (count($batch) >= self::BATCH_SIZE) {
                    DB::table('users')->insert($batch);
                    $batch = [];
                }
            }

            if ($batch !== []) {
                DB::table('users')->insert($batch);
            }
        } finally {
            fclose($handle);
        }

        if ($count !== self::EXPECTED_COUNT) {
            throw new RuntimeException(
                "Dataset de usuarios incompleto: {$count}/".self::EXPECTED_COUNT
            );
        }
    }
}
