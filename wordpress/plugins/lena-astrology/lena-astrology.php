<?php
/**
 * Plugin Name: Léna Képletelemző
 * Description: Magyar születési képletelemzés, interaktív képletábra és helyben futó Swiss Ephemeris számolómotor.
 * Version: 0.2.5
 * License: AGPL-3.0-only
 * SPDX-License-Identifier: AGPL-3.0-only
 * Text Domain: lena-astrology
 */

if (!defined('ABSPATH')) {
    exit;
}

function lena_astrology_admin_menu(): void
{
    add_management_page(
        'Képletelemző állapota',
        'Képletelemző állapota',
        'manage_options',
        'lena-astrology-state',
        'lena_astrology_admin_page'
    );
}
add_action('admin_menu', 'lena_astrology_admin_menu');

function lena_astrology_admin_page(): void
{
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('Nincs jogosultságod az ellenőrzéshez.', 'lena-astrology'), '', ['response' => 403]);
    }
    $result = get_transient('lena_astrology_runtime_' . get_current_user_id());
    $activation = get_transient('lena_astrology_activation_' . get_current_user_id());
    ?>
    <div class="wrap">
        <h1><?php esc_html_e('Képletelemző állapota', 'lena-astrology'); ?></h1>
        <p><a href="<?php echo esc_url(plugins_url('source.zip', __FILE__)); ?>"><?php esc_html_e('A futó bővítmény forráskódja (AGPLv3)', 'lena-astrology'); ?></a></p>
        <p><?php esc_html_e('Az ellenőrzés a rögzített /usr/bin/python3 program elérhetőségét és alapvető képességeit vizsgálja, legfeljebb három másodpercig. Nem telepít, nem indít szolgáltatást, és nem teszi elérhetővé az elemzőt.', 'lena-astrology'); ?></p>
        <p><?php esc_html_e('Az eredmény nem tartalmaz környezeti változókat vagy hozzáférési adatokat. Csak számodra jelenik meg, és öt perc után törlődik.', 'lena-astrology'); ?></p>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
            <input type="hidden" name="action" value="lena_astrology_runtime_check">
            <?php wp_nonce_field('lena_astrology_runtime_check'); ?>
            <?php submit_button(__('Futtatási környezet ellenőrzése', 'lena-astrology')); ?>
        </form>
        <?php if (function_exists('lena_astrology_validate_release')) : ?>
            <h2><?php esc_html_e('Éles működés ellenőrzése', 'lena-astrology'); ?></h2>
            <p><?php esc_html_e('Ellenőrzi a fájlokat, a számolómotor könyvtárának webes tiltását és egy szintetikus referenciaképletet. A nyilvános elemző csak sikeres ellenőrzés után kapcsol be.', 'lena-astrology'); ?></p>
            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                <input type="hidden" name="action" value="lena_astrology_validate">
                <?php wp_nonce_field('lena_astrology_validate'); ?>
                <?php submit_button(__('Ellenőrzés és éles bekapcsolás', 'lena-astrology')); ?>
            </form>
            <?php if (is_array($activation)) : ?>
                <pre style="white-space:pre-wrap;overflow-wrap:anywhere;"><?php echo esc_html((string) wp_json_encode($activation, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)); ?></pre>
            <?php endif; ?>
        <?php endif; ?>
        <?php if (is_array($result)) : ?>
            <h2><?php esc_html_e('Legutóbbi eredmény', 'lena-astrology'); ?></h2>
            <pre style="max-width:960px;white-space:pre-wrap;overflow-wrap:anywhere;background:#fff;padding:20px;border:1px solid #c3c4c7;"><?php echo esc_html((string) wp_json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)); ?></pre>
        <?php endif; ?>
    </div>
    <?php
}

function lena_astrology_runtime_result(): array
{
    $result = [
        'checked_at_utc' => gmdate('c'),
        'proc_open_available' => function_exists('proc_open'),
    ];
    if (!$result['proc_open_available']) {
        return $result + ['status' => 'proc_open_unavailable'];
    }
    foreach (['proc_get_status', 'proc_terminate', 'proc_close', 'stream_set_blocking', 'stream_get_contents'] as $function) {
        if (!function_exists($function)) {
            return $result + ['status' => 'process_controls_unavailable'];
        }
    }

    // The executable and program are fixed. No request input reaches the process.
    $parent = wp_json_encode(dirname(ABSPATH));
    if (!is_string($parent)) {
        return $result + ['status' => 'path_encoding_failed'];
    }
    $code = "import importlib.util,json,os,shutil,sys\n"
        . "parent=" . $parent . "\n"
        . "result={'python_version':sys.version.split()[0],'executable':sys.executable,"
        . "'modules':{name:importlib.util.find_spec(name) is not None for name in ('swisseph','venv','sqlite3')},"
        . "'candidate_parent_writable':os.access(parent,os.W_OK),"
        . "'compiler':{name:shutil.which(name) is not None for name in ('cc','gcc')}}\n"
        . "print(json.dumps(result,ensure_ascii=True))\n";
    $pipes = [];
    try {
        $process = @proc_open(
            ['/usr/bin/python3', '-c', $code],
            [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
            $pipes,
            null,
            null,
            ['bypass_shell' => true]
        );
    } catch (Throwable $error) {
        return $result + ['status' => 'process_start_failed'];
    }
    if (!is_resource($process)) {
        return $result + ['status' => 'process_start_failed'];
    }

    fclose($pipes[0]);
    stream_set_blocking($pipes[1], false);
    stream_set_blocking($pipes[2], false);
    $stdout = '';
    $stderr = '';
    $bytes = 0;
    $limit = 65536;
    $deadline = microtime(true) + 3.0;
    $failure = null;
    $exit_code = null;

    while (true) {
        foreach ([1, 2] as $index) {
            $chunk = stream_get_contents($pipes[$index], max(1, $limit - $bytes + 1));
            if ($chunk === false) {
                $failure = 'process_read_failed';
                break;
            }
            $bytes += strlen($chunk);
            if ($bytes > $limit) {
                $failure = 'output_limit_exceeded';
                break;
            }
            if ($index === 1) {
                $stdout .= $chunk;
            } else {
                $stderr .= $chunk;
            }
        }
        if ($failure !== null) {
            break;
        }
        $state = proc_get_status($process);
        if (!is_array($state)) {
            $failure = 'process_status_failed';
            break;
        }
        if (!$state['running']) {
            $exit_code = $state['exitcode'];
            // Read any final bytes still buffered after the process exits.
            foreach ([1, 2] as $index) {
                $chunk = stream_get_contents($pipes[$index], max(1, $limit - $bytes + 1));
                if ($chunk === false) {
                    $failure = 'process_read_failed';
                    break;
                }
                $bytes += strlen($chunk);
                if ($bytes > $limit) {
                    $failure = 'output_limit_exceeded';
                    break;
                }
                if ($index === 1) {
                    $stdout .= $chunk;
                } else {
                    $stderr .= $chunk;
                }
            }
            break;
        }
        if (microtime(true) >= $deadline) {
            $failure = 'process_timeout';
            break;
        }
        usleep(10000);
    }

    if ($failure !== null) {
        // Fixed Linux executable: kill immediately so proc_close cannot wait on it.
        proc_terminate($process, 9);
    }
    fclose($pipes[1]);
    fclose($pipes[2]);
    $close_code = proc_close($process);
    if ($failure !== null) {
        return $result + ['status' => $failure];
    }
    if ($exit_code === null || $exit_code < 0) {
        $exit_code = $close_code;
    }
    if ($exit_code !== 0) {
        return $result + ['status' => 'python_check_failed', 'exit_code' => $exit_code];
    }
    $diagnostic = json_decode($stdout, true, 16);
    if (!is_array($diagnostic) || !isset($diagnostic['python_version'], $diagnostic['modules'])) {
        return $result + ['status' => 'invalid_python_response'];
    }
    // Never retain stderr: wrappers or system failures can contain unrelated data.
    return $result + ['status' => 'check_completed', 'runtime' => $diagnostic, 'stderr_present' => $stderr !== ''];
}

function lena_astrology_runtime_check_action(): void
{
    if (!current_user_can('manage_options')) {
        wp_die(esc_html__('Nincs jogosultságod az ellenőrzéshez.', 'lena-astrology'), '', ['response' => 403]);
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        wp_die(esc_html__('Az ellenőrzéshez POST kérés szükséges.', 'lena-astrology'), '', ['response' => 405]);
    }
    check_admin_referer('lena_astrology_runtime_check');
    set_transient('lena_astrology_runtime_' . get_current_user_id(), lena_astrology_runtime_result(), 5 * MINUTE_IN_SECONDS);
    wp_safe_redirect(admin_url('tools.php?page=lena-astrology-state'));
    exit;
}
add_action('admin_post_lena_astrology_runtime_check', 'lena_astrology_runtime_check_action');

if (is_file(__DIR__ . '/includes/public.php')) {
    require_once __DIR__ . '/includes/public.php';
}
if (is_file(__DIR__ . '/includes/activation.php')) {
    require_once __DIR__ . '/includes/activation.php';
}
