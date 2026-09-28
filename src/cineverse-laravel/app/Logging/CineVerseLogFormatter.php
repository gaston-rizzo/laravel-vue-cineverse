<?php

namespace App\Logging;

use Monolog\Formatter\LineFormatter;
use Illuminate\Log\Logger;

class CineVerseLogFormatter
{
    public function __invoke(Logger $logger): void
    {
        foreach ($logger->getLogger()->getHandlers() as $handler) {
            $handler->setFormatter(new LineFormatter(
                "[%datetime%] %level_name%: %message%\n",
                "Y-m-d H:i:s",
                true,
                true
            ));
        }
    }
}
