<?php

if (!defined('ABSPATH')) {
    exit;
}

function kelecsenyi_lena_assets(): void
{
    $theme = wp_get_theme();
    $site_css_path = get_stylesheet_directory() . '/assets/css/site.css';
    $site_js_path = get_stylesheet_directory() . '/assets/js/site.js';

    wp_dequeue_style('cinzel-decorative-headings');
    wp_dequeue_style('poppins-body');

    wp_enqueue_style(
        'kelecsenyi-lena-fonts',
        get_stylesheet_directory_uri() . '/assets/fonts/fonts.css',
        [],
        substr(hash_file('sha256', get_stylesheet_directory() . '/assets/fonts/fonts.css'), 0, 12)
    );
    wp_enqueue_style(
        'kelecsenyi-lena-site',
        get_stylesheet_directory_uri() . '/assets/css/site.css',
        ['zodiac-astrology-style'],
        file_exists($site_css_path) ? substr(hash_file('sha256', $site_css_path), 0, 12) : $theme->get('Version')
    );
    wp_enqueue_script(
        'kelecsenyi-lena-site',
        get_stylesheet_directory_uri() . '/assets/js/site.js',
        [],
        file_exists($site_js_path) ? substr(hash_file('sha256', $site_js_path), 0, 12) : $theme->get('Version'),
        true
    );
    $enhancements_path = get_stylesheet_directory() . '/assets/css/enhancements.css';
    wp_enqueue_style(
        'kelecsenyi-lena-enhancements',
        get_stylesheet_directory_uri() . '/assets/css/enhancements.css',
        ['kelecsenyi-lena-site'],
        substr(hash_file('sha256', $enhancements_path), 0, 12)
    );
    if (is_front_page()) {
        foreach (['css' => 'style', 'js' => 'script'] as $extension => $type) {
            $relative = '/assets/' . $extension . '/celestial.' . $extension;
            $version = substr(hash_file('sha256', get_stylesheet_directory() . $relative), 0, 12);
            if ($type === 'style') {
                wp_enqueue_style('kelecsenyi-lena-celestial', get_stylesheet_directory_uri() . $relative, ['kelecsenyi-lena-enhancements'], $version);
            } else {
                wp_enqueue_script('kelecsenyi-lena-celestial', get_stylesheet_directory_uri() . $relative, [], $version, true);
            }
        }
    }
}
add_action('wp_enqueue_scripts', 'kelecsenyi_lena_assets', 30);

function kelecsenyi_lena_favicons(): void
{
    $assets = get_stylesheet_directory_uri() . '/assets/images/';
    echo '<link rel="icon" type="image/png" sizes="32x32" href="' . esc_url($assets . 'kl-monogram-32.png') . '">' . "\n";
    echo '<link rel="icon" type="image/png" sizes="192x192" href="' . esc_url($assets . 'kl-monogram-192.png') . '">' . "\n";
    echo '<link rel="apple-touch-icon" sizes="180x180" href="' . esc_url($assets . 'kl-monogram-180.png') . '">' . "\n";
}
add_action('wp_head', 'kelecsenyi_lena_favicons', 2);

function kelecsenyi_lena_setup(): void
{
    add_theme_support('post-thumbnails');
    add_image_size('lena-event-card', 720, 460, true);
}
add_action('after_setup_theme', 'kelecsenyi_lena_setup');

function kelecsenyi_lena_analysis_available(): bool
{
    // The production adapter enables this only after its backend is configured.
    return (bool) apply_filters('lena_analysis_available', false);
}

function kelecsenyi_lena_option(string $key, string $fallback = ''): string
{
    $value = get_option('lena_' . $key, $fallback);
    return is_string($value) ? $value : $fallback;
}

function kelecsenyi_lena_phone_reveal(): void
{
    $phone = trim(preg_replace('/[^0-9+().\/ -]/', '', kelecsenyi_lena_option('phone')));
    $dial = preg_replace('/[^0-9+]/', '', $phone);
    if (!preg_match('/^\+?[0-9]{5,18}$/', $dial)) {
        return;
    }

    // Discourage basic HTML address harvesting; this is not access control.
    $payload = '';
    foreach (str_split($phone) as $byte) {
        $payload .= sprintf('%02x', ord($byte) ^ 83);
    }
    ?>
    <span class="phone-reveal" aria-live="polite" aria-atomic="true"><button class="phone-reveal-button" type="button" data-phone-reveal="<?php echo esc_attr($payload); ?>" hidden><?php esc_html_e('Telefonszám megjelenítése', 'kelecsenyi-lena'); ?></button><noscript><span class="phone-reveal-fallback"><?php esc_html_e('Telefonos elérhetőségért írj e-mailt.', 'kelecsenyi-lena'); ?></span></noscript></span>
    <?php
}

function kelecsenyi_lena_page(string $slug): ?WP_Post
{
    $page = get_page_by_path($slug);
    return $page instanceof WP_Post ? $page : null;
}

function kelecsenyi_lena_event_timestamp(string $value): int
{
    if ($value === '') {
        return 0;
    }
    $date = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $value, wp_timezone());
    return $date instanceof DateTimeImmutable ? $date->getTimestamp() : 0;
}
