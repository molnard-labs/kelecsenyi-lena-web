<?php
/**
 * Administrator-only verification before exposing a packaged analysis release.
 * SPDX-License-Identifier: AGPL-3.0-only
 */

if (!defined('ABSPATH')) {
    exit;
}

function lena_astrology_activation_error(string $message): array
{
    return ['status' => 'error', 'message' => $message, 'checked_at_utc' => gmdate('c')];
}

/** Verify the complete fixed runtime tree, without following any symlink. */
function lena_astrology_activation_runtime_valid(string $directory, int &$file_count): bool
{
    $file_count = 0;
    $runtime = $directory . '/runtime';
    $manifest_path = $directory . '/runtime-manifest.json';
    if (is_link($runtime) || !is_dir($runtime) || is_link($manifest_path)
        || !is_file($manifest_path) || filesize($manifest_path) > 2 * 1024 * 1024) {
        return false;
    }
    $raw = @file_get_contents($manifest_path);
    $manifest = is_string($raw) ? json_decode($raw, true, 32) : null;
    if (!is_array($manifest) || count($manifest) < 8 || count($manifest) > 10000) {
        return false;
    }
    foreach (['engine_cli.py', 'astro_engine.py', '.htaccess', 'index.php', 'astro-data/places.sqlite',
        'astro-data/seas_18.se1', 'astro-data/semo_18.se1', 'astro-data/sepl_18.se1'] as $required) {
        if (!array_key_exists($required, $manifest)) {
            return false;
        }
    }
    $canonical_runtime = realpath($runtime);
    if (!is_string($canonical_runtime)) {
        return false;
    }
    foreach ($manifest as $relative => $expected) {
        if (!is_string($relative) || $relative === '' || strpos($relative, '\\') !== false
            || preg_match('/\A[A-Za-z0-9._+@\/-]+\z/D', $relative) !== 1
            || !is_string($expected) || preg_match('/\A[0-9a-f]{64}\z/D', $expected) !== 1) {
            return false;
        }
        $candidate = $runtime;
        foreach (explode('/', $relative) as $part) {
            if ($part === '' || $part === '.' || $part === '..') {
                return false;
            }
            $candidate .= '/' . $part;
            if (is_link($candidate)) {
                return false;
            }
        }
        $canonical_file = realpath($candidate);
        if (!is_string($canonical_file) || strpos($canonical_file, $canonical_runtime . DIRECTORY_SEPARATOR) !== 0
            || !is_file($candidate) || !is_readable($candidate)) {
            return false;
        }
        $actual = @hash_file('sha256', $candidate);
        if (!is_string($actual) || !hash_equals($expected, $actual)) {
            return false;
        }
    }
    try {
        $entries = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($runtime, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );
        foreach ($entries as $entry) {
            if ($entry->isLink()) {
                return false;
            }
            if ($entry->isDir()) {
                continue;
            }
            if (!$entry->isFile()) {
                return false;
            }
            $relative = str_replace(DIRECTORY_SEPARATOR, '/', substr($entry->getPathname(), strlen($runtime) + 1));
            if (!array_key_exists($relative, $manifest)) {
                return false;
            }
            $file_count++;
        }
    } catch (Throwable $error) {
        return false;
    }
    return $file_count === count($manifest);
}

function lena_astrology_activation_number($value): bool
{
    return (is_int($value) || is_float($value)) && is_finite((float) $value);
}

function lena_astrology_activation_angle_matches($actual, $expected, float $tolerance): bool
{
    if (!lena_astrology_activation_number($actual) || !lena_astrology_activation_number($expected)
        || $actual < 0 || $actual >= 360 || $expected < 0 || $expected >= 360) {
        return false;
    }
    return abs(fmod((float) $actual - (float) $expected + 540.0, 360.0) - 180.0) <= $tolerance;
}

/** Fixed reference shape and all thirteen calculated points must match. */
function lena_astrology_activation_chart_matches(array $chart, array $expected): bool
{
    $tolerance = $expected['tolerance_degrees'] ?? null;
    if (!lena_astrology_activation_number($tolerance) || $tolerance <= 0 || $tolerance > 0.000001
        || !isset($expected['longitudes'], $expected['houses'], $chart['planets'], $chart['houses'])
        || !is_array($expected['longitudes']) || count($expected['longitudes']) !== 13
        || !is_array($expected['houses']) || array_keys($expected['houses']) !== range(0, 11)
        || !is_array($chart['planets']) || count($chart['planets']) !== 13
        || !is_array($chart['houses']) || array_keys($chart['houses']) !== range(0, 11)
        || !isset($chart['angles']['ascendant']) || !is_array($chart['angles']) || !is_array($chart['angles']['ascendant'])
        || !lena_astrology_activation_number($chart['julian_day_ut'] ?? null)
        || !lena_astrology_activation_number($expected['julian_day_ut'] ?? null)
        || abs($chart['julian_day_ut'] - $expected['julian_day_ut']) > 0.0000001) {
        return false;
    }
    $seen = [];
    foreach ($chart['planets'] as $planet) {
        if (!is_array($planet) || !isset($planet['key']) || !is_string($planet['key'])
            || isset($seen[$planet['key']]) || !array_key_exists($planet['key'], $expected['longitudes'])
            || !lena_astrology_activation_angle_matches($planet['longitude'] ?? null, $expected['longitudes'][$planet['key']], $tolerance)) {
            return false;
        }
        $seen[$planet['key']] = true;
    }
    foreach ($chart['houses'] as $index => $house) {
        if (!is_array($house) || ($house['number'] ?? null) !== $index + 1
            || !lena_astrology_activation_angle_matches($house['longitude'] ?? null, $expected['houses'][$index], $tolerance)) {
            return false;
        }
    }
    return lena_astrology_activation_angle_matches(
        $chart['angles']['ascendant']['longitude'] ?? null,
        $expected['ascendant'] ?? null,
        $tolerance
    );
}

/** The helper has no user-controlled path, executable, URL, or fixture input. */
function lena_astrology_validate_release(): array
{
    $directory = dirname(__DIR__);
    $source_path = $directory . '/source.zip';
    if (is_link($source_path) || !is_file($source_path)) {
        return lena_astrology_activation_error('A kiadás forráscsomagja nem ellenőrizhető.');
    }
    $source_digest = @hash_file('sha256', $source_path);
    $file_count = 0;
    if (!is_string($source_digest) || !lena_astrology_activation_runtime_valid($directory, $file_count)) {
        return lena_astrology_activation_error('A futtatási csomag fájlellenőrzése sikertelen.');
    }
    $http_options = ['timeout' => 10, 'redirection' => 0, 'sslverify' => true,
        'limit_response_size' => 8192, 'headers' => ['Cache-Control' => 'no-cache']];
    $plugin = $directory . '/lena-astrology.php';
    $private_response = wp_remote_get(plugins_url('runtime/engine_cli.py', $plugin), $http_options);
    if (is_wp_error($private_response) || !in_array((int) wp_remote_retrieve_response_code($private_response), [403, 404], true)) {
        return lena_astrology_activation_error('A számítási könyvtár webes védelmét nem sikerült igazolni.');
    }
    $public_response = wp_remote_get(plugins_url('public/brand-assets/kl-monogram-32.png', $plugin), $http_options);
    if (is_wp_error($public_response) || (int) wp_remote_retrieve_response_code($public_response) !== 200) {
        return lena_astrology_activation_error('A nyilvános fájlok elérhetőségét nem sikerült igazolni.');
    }
    $fixture_path = $directory . '/reference-chart.json';
    if (is_link($fixture_path) || !is_file($fixture_path) || filesize($fixture_path) > 16384) {
        return lena_astrology_activation_error('A referencia-számítás adatai nem ellenőrizhetők.');
    }
    $fixture_raw = @file_get_contents($fixture_path);
    $fixture = is_string($fixture_raw) ? json_decode($fixture_raw, true, 32) : null;
    if (!is_array($fixture) || !isset($fixture['request'], $fixture['expected'])
        || !is_array($fixture['request']) || !is_array($fixture['expected'])
        || count($fixture['request']) !== 4) {
        return lena_astrology_activation_error('A referencia-számítás adatai nem ellenőrizhetők.');
    }
    foreach (['date', 'time', 'place_id', 'house_system'] as $key) {
        if (!isset($fixture['request'][$key]) || !is_string($fixture['request'][$key])) {
            return lena_astrology_activation_error('A referencia-számítás adatai nem ellenőrizhetők.');
        }
    }
    try {
        $state = lena_astrology_public_run_engine('status', []);
        if (($state['status'] ?? null) !== 200 || ($state['payload']['ready'] ?? null) !== true) {
            return lena_astrology_activation_error('A számolómotor még nem áll készen.');
        }
        $places = lena_astrology_public_run_engine('places', ['q' => 'Budapest']);
        if (($places['status'] ?? null) !== 200 || ($places['payload']['places'][0]['id'] ?? null) !== '3054643') {
            return lena_astrology_activation_error('A településkereső referencia-ellenőrzése sikertelen.');
        }
        $chart = lena_astrology_public_run_engine('chart', $fixture['request']);
        if (($chart['status'] ?? null) !== 200 || !isset($chart['payload']) || !is_array($chart['payload'])
            || !lena_astrology_activation_chart_matches($chart['payload'], $fixture['expected'])) {
            return lena_astrology_activation_error('A bolygópozíciók és házak referencia-ellenőrzése sikertelen.');
        }
    } catch (Throwable $error) {
        return lena_astrology_activation_error('A számolómotor ellenőrzése nem sikerült.');
    }
    $final_digest = @hash_file('sha256', $source_path);
    if (!is_string($final_digest) || !hash_equals($source_digest, $final_digest)) {
        return lena_astrology_activation_error('A kiadás ellenőrzés közben megváltozott. Futtasd újra az ellenőrzést.');
    }
    return ['status' => 'ready', 'message' => 'A kiadás ellenőrzése sikeres; a képletelemző bekapcsolható.',
        'source_sha256' => $source_digest, 'checked_at_utc' => gmdate('c'),
        'checks' => ['runtime_files' => $file_count, 'runtime_web_access' => 'blocked', 'public_asset' => 'available',
            'engine_ready' => true, 'budapest_lookup' => true, 'reference_chart' => true]];
}

function lena_astrology_validate_action(): void
{
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('Nincs jogosultságod az ellenőrzéshez.', 'lena-astrology'), '', ['response' => 403]);
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        wp_die(esc_html__('Az ellenőrzéshez POST kérés szükséges.', 'lena-astrology'), '', ['response' => 405]);
    }
    check_admin_referer('lena_astrology_validate');
    delete_option('lena_astrology_ready');
    try {
        $result = lena_astrology_validate_release();
    } catch (Throwable $error) {
        $result = lena_astrology_activation_error('A kiadás ellenőrzése nem sikerült.');
    }
    if (($result['status'] ?? null) === 'ready' && isset($result['source_sha256'])) {
        update_option('lena_astrology_ready', $result['source_sha256'], false);
        if (get_option('lena_astrology_ready', false) === $result['source_sha256']) {
            $result['message'] = 'Az ellenőrzés sikeres. Az éles képletelemző be van kapcsolva.';
        } else {
            delete_option('lena_astrology_ready');
            $result = lena_astrology_activation_error('A sikeres ellenőrzés eredményét nem sikerült menteni.');
        }
    } else {
        delete_option('lena_astrology_ready');
    }
    set_transient('lena_astrology_activation_' . get_current_user_id(), $result, 5 * MINUTE_IN_SECONDS);
    wp_safe_redirect(admin_url('tools.php?page=lena-astrology-state'));
    exit;
}
add_action('admin_post_lena_astrology_validate', 'lena_astrology_validate_action');
