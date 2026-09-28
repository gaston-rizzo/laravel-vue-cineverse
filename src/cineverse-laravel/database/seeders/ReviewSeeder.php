<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ReviewSeeder extends Seeder
{
    private const EXPECTED_COUNT = 24322;
    private const BATCH_SIZE = 250;

    public function run(): void
    {
        if (DB::table('reviews')->count() !== 0) {
            throw new RuntimeException(
                'ReviewSeeder requiere reviews vacía. Use: php artisan migrate:fresh --seed'
            );
        }

        if (DB::table('users')->count() !== 5000) {
            throw new RuntimeException('ReviewSeeder requiere primero los 5.000 usuarios de CineVerse.');
        }

        $path = database_path('seeders/data/reviews.ndjson');
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
                    DB::table('reviews')->insert($batch);
                    $batch = [];
                }
            }

            if ($batch !== []) {
                DB::table('reviews')->insert($batch);
            }
        } finally {
            fclose($handle);
        }

        if ($count !== self::EXPECTED_COUNT) {
            throw new RuntimeException(
                "Dataset de reseñas incompleto: {$count}/".self::EXPECTED_COUNT
            );
        }
    }
}
