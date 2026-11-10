<?php

use App\Models\ActivityLog;
use App\Models\User;
use App\Services\Monitoring\MonitoringService;
use App\Services\Monitoring\ServiceManager;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * ServiceManager dengan proses sungguhan dimatikan: launch() hanya merekam perintah.
 */
function fakeServiceManager(?string $php = 'php'): object
{
    $manager = new class(app(MonitoringService::class)) extends ServiceManager
    {
        public array $launched = [];

        public ?string $fakePhp = 'php';

        public function phpCli(): ?string
        {
            return $this->fakePhp;
        }

        protected function launch(array $artisanArgs, string $logFile): bool
        {
            $this->launched[] = [$artisanArgs, $logFile];

            return true;
        }

        protected function log(string $line): void {}
    };
    $manager->fakePhp = $php;
    app()->instance(ServiceManager::class, $manager);

    return $manager;
}

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
    // Reverb dianggap mati dan worker mati kecuali diubah per test.
    config(['test.reverb_status' => 500]);
    Http::fake(fn () => Http::response('', config('test.reverb_status')));
});

test('php cli location can be set from config and is auto-detected otherwise', function () {
    config(['monitoring.php_cli' => PHP_BINARY]);
    $manager = new ServiceManager(app(MonitoringService::class));

    expect($manager->phpCli())->toBe(realpath(PHP_BINARY));
});

test('a stopped service is started with the right command and ports come from config', function () {
    config(['reverb.servers.reverb.host' => '0.0.0.0', 'reverb.servers.reverb.port' => 9091]);
    $manager = fakeServiceManager();

    expect($manager->start('queue')['ok'])->toBeTrue()
        ->and($manager->start('reverb')['ok'])->toBeTrue()
        ->and($manager->launched[0][0])->toBe(['queue:work', '--tries=3', '--timeout=90'])
        ->and($manager->launched[1][0])->toBe(['reverb:start', '--host=0.0.0.0', '--port=9091']);
});

test('a running service is never started a second time', function () {
    Cache::put(MonitoringService::WORKER_HEARTBEAT_KEY, now()->getTimestamp(), 180);
    $manager = fakeServiceManager();

    $result = $manager->start('queue');

    expect($result['ok'])->toBeFalse()->and($result['message'])->toContain('sudah berjalan')
        ->and($manager->launched)->toBe([]);
});

test('restart signals the old process and launches the relaunch helper', function () {
    Cache::put(MonitoringService::WORKER_HEARTBEAT_KEY, now()->getTimestamp(), 180);
    $manager = fakeServiceManager();

    $result = $manager->restart('queue');

    expect($result['ok'])->toBeTrue()
        ->and(Cache::has('illuminate:queue:restart'))->toBeTrue()
        ->and($manager->launched[0][0])->toBe(['services:relaunch', 'queue']);
});

test('restarting reverb writes the same signal key the reverb command uses, without needing that command', function () {
    config(['test.reverb_status' => 200]); // Reverb sedang berjalan
    $manager = fakeServiceManager();

    $result = $manager->restart('reverb');

    expect($result['ok'])->toBeTrue()
        ->and(Cache::get('laravel:reverb:restart'))->toBeInt()
        ->and($manager->launched[0][0])->toBe(['services:relaunch', 'reverb']);
});

test('restart of a stopped service simply starts it', function () {
    $manager = fakeServiceManager();

    $manager->restart('reverb');

    expect($manager->launched[0][0][0])->toBe('reverb:start');
});

test('double clicks are ignored while a request is being processed', function () {
    $manager = fakeServiceManager();

    $manager->start('queue');
    $second = $manager->start('queue');

    expect($second['ok'])->toBeFalse()->and($manager->launched)->toHaveCount(1);
});

test('nothing is launched and a clear message is shown when php cannot be found', function () {
    $manager = fakeServiceManager(null);

    $result = $manager->start('queue');

    expect($result['ok'])->toBeFalse()->and($result['message'])->toContain('PHP_CLI_PATH')
        ->and($manager->launched)->toBe([]);
});

test('relaunch of reverb waits for the old process to stop and then starts a new one', function () {
    $manager = fakeServiceManager();

    expect($manager->relaunch('reverb'))->toBeTrue()
        ->and($manager->launched[0][0][0])->toBe('reverb:start');
});

test('relaunch of reverb is cancelled when the old process will not stop', function () {
    config(['test.reverb_status' => 200]); // Reverb lama masih menjawab /up

    $manager = new class(app(MonitoringService::class)) extends ServiceManager
    {
        public array $launched = [];

        protected int $reverbStopTimeout = 1;

        public function phpCli(): ?string
        {
            return 'php';
        }

        protected function launch(array $artisanArgs, string $logFile): bool
        {
            $this->launched[] = $artisanArgs;

            return true;
        }

        protected function log(string $line): void {}
    };

    expect($manager->relaunch('reverb'))->toBeFalse()->and($manager->launched)->toBe([]);
});

test('only admins can control services and each action is logged', function () {
    $manager = fakeServiceManager();
    $operator = User::factory()->create(['role' => 'operator']);

    $this->actingAs($operator)->post(route('admin.services.start', 'queue'))->assertForbidden();

    $this->actingAs($this->admin)->post(route('admin.services.start', 'queue'))->assertRedirect();

    expect($manager->launched)->toHaveCount(1)
        ->and(ActivityLog::where('event', 'system.service_start')->where('user_id', $this->admin->id)->count())->toBe(1);
});

test('unknown services are rejected', function () {
    fakeServiceManager();

    $this->actingAs($this->admin)->post('/admin/services/apache/restart')->assertNotFound();
});

test('monitoring page reports the detected php location', function () {
    fakeServiceManager('C:\\laragon\\bin\\php\\php.exe');

    $this->actingAs($this->admin)->get(route('admin.monitoring'))->assertInertia(fn ($page) => $page
        ->where('controls.php_cli', 'C:\\laragon\\bin\\php\\php.exe'));
});
