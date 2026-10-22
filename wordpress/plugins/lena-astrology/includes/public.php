<?php
/**
 * Fixed public routes and bounded Python adapter for the natal-chart application.
 * SPDX-License-Identifier: AGPL-3.0-only
 */

if (!defined('ABSPATH')) {
    exit;
}

function lena_astrology_public_directory(): string
{
    return dirname(__DIR__);
}

function lena_astrology_public_available(): bool
{
    $directory = lena_astrology_public_directory();
    $ready_release = get_option('lena_astrology_ready', false);
    if (!is_string($ready_release) || preg_match('/\A[0-9a-f]{64}\z/D', $ready_release) !== 1
        || !is_file($directory . '/runtime/engine_cli.py')
        || !is_file($directory . '/public/analysis.html')
        || !is_file($directory . '/source.zip')) {
        return false;
    }
    // A new release remains unavailable until its own checks have passed.
    static $source_digest = null;
    if ($source_digest === null) {
        $source_digest = @hash_file('sha256', $directory . '/source.zip');
    }
    return is_string($source_digest) && hash_equals($ready_release, $source_digest);
}

function lena_astrology_public_theme_available($available): bool
{
    return lena_astrology_public_available();
}
add_filter('lena_analysis_available', 'lena_astrology_public_theme_available');

function lena_astrology_public_response(array $payload, int $status = 200): WP_REST_Response
{
    return new WP_REST_Response($payload, $status, [
        'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma' => 'no-cache',
        'X-Content-Type-Options' => 'nosniff',
        'Referrer-Policy' => 'no-referrer',
    ]);
}

function lena_astrology_public_error(string $code, string $message, int $status): WP_REST_Response
{
    return lena_astrology_public_response(['error' => ['code' => $code, 'message' => $message]], $status);
}

/**
 * Only a salted digest and a short-lived counter are stored, never birth input.
 * This deliberately uses the server peer, not user-controlled forwarding headers.
 */
function lena_astrology_public_rate_limited(): bool
{
    $peer = isset($_SERVER['REMOTE_ADDR']) && is_string($_SERVER['REMOTE_ADDR'])
        ? $_SERVER['REMOTE_ADDR'] : 'unknown';
    $key = 'lena_astro_rate_' . substr(hash_hmac('sha256', $peer, wp_salt('nonce')), 0, 40);
    $now = time();
    $bucket = get_transient($key);
    if (!is_array($bucket) || !isset($bucket['until'], $bucket['count']) || (int) $bucket['until'] <= $now) {
        $bucket = ['until' => $now + 60, 'count' => 0];
    }
    if ((int) $bucket['count'] >= 60) {
        return true;
    }
    $bucket['count'] = (int) $bucket['count'] + 1;
    set_transient($key, $bucket, 5 * MINUTE_IN_SECONDS);
    return false;
}

function lena_astrology_public_origin(): string
{
    $parts = wp_parse_url(home_url('/'));
    if (!is_array($parts) || !isset($parts['scheme'], $parts['host'])
        || !in_array(strtolower($parts['scheme']), ['http', 'https'], true)) {
        return '';
    }
    return strtolower($parts['scheme']) . '://' . strtolower($parts['host'])
        . (isset($parts['port']) ? ':' . (int) $parts['port'] : '');
}

/**
 * The executable, script and working directory are fixed. No shell is invoked.
 * Input is JSON on stdin; stdout and stderr share a 512 KiB budget. Stderr is
 * discarded rather than stored or returned, including when the child fails.
 *
 * @return array{status:int,payload:array}
 */
function lena_astrology_public_run_engine(string $action, array $payload = []): array
{
    $unavailable = [
        'status' => 503,
        'payload' => ['error' => ['code' => 'engine_unavailable', 'message' => 'Az elemző átmenetileg nem érhető el. Kérlek, próbáld újra később.']],
    ];
    if (!in_array($action, ['status', 'places', 'chart'], true)) {
        return $unavailable;
    }
    foreach (['proc_open', 'proc_get_status', 'proc_terminate', 'proc_close', 'stream_set_blocking', 'stream_get_contents'] as $function) {
        if (!function_exists($function)) {
            return $unavailable;
        }
    }
    $directory = lena_astrology_public_directory() . '/runtime';
    $script = $directory . '/engine_cli.py';
    if (!is_file($script)) {
        return $unavailable;
    }
    // Cast the payload to an object so even the empty status input is JSON {}.
    $input = wp_json_encode(['action' => $action, 'payload' => (object) $payload], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (!is_string($input) || strlen($input) > 4096) {
        return [
            'status' => 413,
            'payload' => ['error' => ['code' => 'request_too_large', 'message' => 'A kérés mérete nem megfelelő.']],
        ];
    }
    $pipes = [];
    try {
        $process = @proc_open(
            ['/usr/bin/python3', '-I', '-B', $script],
            [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
            $pipes,
            $directory,
            null,
            ['bypass_shell' => true]
        );
    } catch (Throwable $error) {
        return $unavailable;
    }
    if (!is_resource($process)) {
        return $unavailable;
    }
    foreach ($pipes as $pipe) {
        if (!stream_set_blocking($pipe, false)) {
            proc_terminate($process, 9);
            foreach ($pipes as $open_pipe) {
                fclose($open_pipe);
            }
            proc_close($process);
            return $unavailable;
        }
    }
    $deadline = microtime(true) + 5.0;
    $input_offset = 0;
    $input_open = true;
    $stdout = '';
    $bytes = 0;
    $output_limit = 512 * 1024;
    $failed = false;
    $exit_code = null;
    while (true) {
        if ($input_open) {
            $written = @fwrite($pipes[0], substr($input, $input_offset));
            if ($written === false) {
                $failed = true;
                break;
            }
            $input_offset += $written;
            if ($input_offset === strlen($input)) {
                fclose($pipes[0]);
                $input_open = false;
            }
        }
        foreach ([1, 2] as $index) {
            $chunk = stream_get_contents($pipes[$index], max(1, $output_limit - $bytes + 1));
            if ($chunk === false) {
                $failed = true;
                break;
            }
            $bytes += strlen($chunk);
            if ($bytes > $output_limit) {
                $failed = true;
                break;
            }
            if ($index === 1) {
                $stdout .= $chunk;
            }
        }
        if ($failed) {
            break;
        }
        $state = proc_get_status($process);
        if (!is_array($state)) {
            $failed = true;
            break;
        }
        if (!$state['running']) {
            $exit_code = $state['exitcode'];
            // A terminated child may leave a final JSON fragment in the pipe.
            foreach ([1, 2] as $index) {
                $chunk = stream_get_contents($pipes[$index], max(1, $output_limit - $bytes + 1));
                if ($chunk === false) {
                    $failed = true;
                    break;
                }
                $bytes += strlen($chunk);
                if ($bytes > $output_limit) {
                    $failed = true;
                    break;
                }
                if ($index === 1) {
                    $stdout .= $chunk;
                }
            }
            break;
        }
        if (microtime(true) >= $deadline) {
            $failed = true;
            break;
        }
        usleep(10000);
    }
    if ($failed) {
        // The fixed Linux Python process does not spawn children.
        proc_terminate($process, 9);
    }
    if ($input_open) {
        fclose($pipes[0]);
    }
    fclose($pipes[1]);
    fclose($pipes[2]);
    $close_code = proc_close($process);
    if ($failed) {
        return $unavailable;
    }
    if ($exit_code === null || $exit_code < 0) {
        $exit_code = $close_code;
    }
    if ($exit_code !== 0) {
        return $unavailable;
    }
    $decoded = json_decode($stdout, true, 64);
    if (!is_array($decoded) || !isset($decoded['status'], $decoded['payload'])
        || !is_int($decoded['status']) || !in_array($decoded['status'], [200, 400, 413, 422, 500, 503], true)
        || !is_array($decoded['payload'])) {
        return $unavailable;
    }
    return ['status' => $decoded['status'], 'payload' => $decoded['payload']];
}

function lena_astrology_public_api(WP_REST_Request $request): WP_REST_Response
{
    if (!lena_astrology_public_available()) {
        return lena_astrology_public_error('setup_required', 'Az elemző átmenetileg nem érhető el. Kérlek, próbáld újra később.', 503);
    }
    if (lena_astrology_public_rate_limited()) {
        $response = lena_astrology_public_error('rate_limited', 'Túl sok kérés érkezett. Kérlek, várj egy percet.', 429);
        $response->header('Retry-After', '60');
        return $response;
    }
    $route = $request->get_route();
    if ($route === '/lena/v1/status') {
        $action = 'status';
        $payload = [];
    } elseif ($route === '/lena/v1/places') {
        $query = $request->get_param('q');
        if ($query === null) {
            $query = '';
        }
        if (!is_string($query) || strlen($query) > 480
            || preg_match('/\A.{0,120}\z/us', $query) !== 1
            || preg_match('/[\x00-\x1F\x7F]/', $query)) {
            return lena_astrology_public_error('invalid_query', 'A településnév legfeljebb 120 karakter lehet.', 400);
        }
        $action = 'places';
        $payload = ['q' => $query];
    } elseif ($route === '/lena/v1/chart') {
        $expected_origin = lena_astrology_public_origin();
        if ($expected_origin === '' || $request->get_header('origin') !== $expected_origin) {
            return lena_astrology_public_error('invalid_origin', 'A kérésnek erről az oldalról kell érkeznie.', 403);
        }
        $content_type = strtolower(trim(explode(';', $request->get_header('content-type'), 2)[0]));
        if ($content_type !== 'application/json') {
            return lena_astrology_public_error('invalid_content_type', 'JSON kérés szükséges.', 415);
        }
        $body = $request->get_body();
        if (strlen($body) < 1 || strlen($body) > 4096) {
            return lena_astrology_public_error('request_too_large', 'A kérés mérete nem megfelelő.', 413);
        }
        if (!(json_decode($body, false, 32) instanceof stdClass)) {
            return lena_astrology_public_error('invalid_json', 'Érvénytelen JSON kérés.', 400);
        }
        $payload = json_decode($body, true, 32);
        if (!is_array($payload) || json_last_error() !== JSON_ERROR_NONE) {
            return lena_astrology_public_error('invalid_json', 'Érvénytelen JSON kérés.', 400);
        }
        $action = 'chart';
    } else {
        return lena_astrology_public_error('not_found', 'Nincs ilyen végpont.', 404);
    }
    $result = lena_astrology_public_run_engine($action, $payload);
    return lena_astrology_public_response($result['payload'], $result['status']);
}

function lena_astrology_public_register_routes(): void
{
    foreach (['status' => 'GET', 'places' => 'GET', 'chart' => 'POST'] as $route => $method) {
        register_rest_route('lena/v1', '/' . $route, [
            'methods' => $method,
            'callback' => 'lena_astrology_public_api',
            'permission_callback' => '__return_true',
        ]);
    }
}
add_action('rest_api_init', 'lena_astrology_public_register_routes');

/** Remove WordPress's reflected CORS headers only for this same-origin API. */
function lena_astrology_public_remove_cors($served, $result, $request, $server)
{
    if ($request instanceof WP_REST_Request && strpos($request->get_route(), '/lena/v1/') === 0) {
        foreach (['Access-Control-Allow-Origin', 'Access-Control-Allow-Credentials', 'Access-Control-Allow-Methods', 'Access-Control-Allow-Headers', 'Access-Control-Expose-Headers'] as $header) {
            header_remove($header);
        }
    }
    return $served;
}
add_filter('rest_pre_serve_request', 'lena_astrology_public_remove_cors', 20, 4);

/** Serve only exact reviewed files, bypassing the WordPress theme stylesheet. */
function lena_astrology_public_page(): void
{
    $request_uri = isset($_SERVER['REQUEST_URI']) && is_string($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
    $path = wp_parse_url($request_uri, PHP_URL_PATH);
    $base_path = wp_parse_url(home_url('/'), PHP_URL_PATH);
    if (!is_string($path) || !is_string($base_path)) {
        return;
    }
    $base_path = rtrim($base_path, '/');
    $routes = [
        '/gyors-elemzes/' => ['public/analysis.html', 'text/html; charset=utf-8', true],
        '/gyors-elemzes' => ['public/analysis.html', 'text/html; charset=utf-8', true],
        '/licenses.html' => ['public/licenses.html', 'text/html; charset=utf-8', false],
        '/source.zip' => ['source.zip', 'application/zip', false],
        '/license.txt' => ['LICENSE', 'text/plain; charset=utf-8', false],
        '/third-party-notices.txt' => ['THIRD_PARTY_NOTICES.md', 'text/plain; charset=utf-8', false],
    ];
    foreach ($routes as $route => $configuration) {
        if ($path !== $base_path . $route) {
            continue;
        }
        [$relative, $mime, $needs_ready] = $configuration;
        if ($needs_ready && !lena_astrology_public_available()) {
            global $wp_query;
            if ($wp_query instanceof WP_Query) {
                $wp_query->set_404();
            }
            status_header(404);
            nocache_headers();
            return;
        }
        $file = lena_astrology_public_directory() . '/' . $relative;
        if (!is_file($file) || !is_readable($file)) {
            return;
        }
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        if (!in_array($method, ['GET', 'HEAD'], true)) {
            status_header(405);
            header('Allow: GET, HEAD');
            nocache_headers();
            header('X-Content-Type-Options: nosniff');
            exit;
        }
        $html = null;
        if (strpos($mime, 'text/html') === 0) {
            $html = file_get_contents($file);
            if (!is_string($html)) {
                return;
            }
            $plugin = lena_astrology_public_directory() . '/lena-astrology.php';
            $html = str_replace(
                ['@@LENA_ASSET_BASE@@', '@@LENA_API_BASE@@'],
                [esc_attr(untrailingslashit(plugins_url('public', $plugin))), esc_attr(untrailingslashit(rest_url('lena/v1')))],
                $html
            );
        }
        status_header(200);
        nocache_headers();
        header('Content-Type: ' . $mime);
        header('X-Content-Type-Options: nosniff');
        header('Referrer-Policy: no-referrer');
        if ($relative === 'source.zip') {
            header('Content-Disposition: attachment; filename="kelecsenyi-lena-agpl-source.zip"');
        }
        $length = $html !== null ? strlen($html) : filesize($file);
        if ($length !== false) {
            header('Content-Length: ' . (string) $length);
        }
        if ($method !== 'HEAD') {
            if ($html !== null) {
                echo $html; // Fixed reviewed HTML; only escaped URL tokens are substituted.
            } else {
                readfile($file);
            }
        }
        exit;
    }
}
add_action('template_redirect', 'lena_astrology_public_page', 0);
