<?php

namespace App\Console\Commands;

use App\Services\Monitoring\ServiceManager;
use Illuminate\Console\Command;

class RelaunchService extends Command
{
    protected $signature = 'services:relaunch {service : queue atau reverb}';

    protected $description = 'Tunggu layanan lama berhenti, lalu jalankan yang baru (dipakai tombol Restart di halaman monitoring)';

    public function handle(ServiceManager $manager): int
    {
        $service = (string) $this->argument('service');

        if (! in_array($service, ServiceManager::SERVICES, true)) {
            $this->error('Layanan tidak dikenal: '.$service);

            return self::INVALID;
        }

        return $manager->relaunch($service) ? self::SUCCESS : self::FAILURE;
    }
}
