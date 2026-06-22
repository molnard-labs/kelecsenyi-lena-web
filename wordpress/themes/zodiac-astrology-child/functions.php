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
        'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Manrope:wght@300;400;500;600&display=swap',
        [],
        null
    );
    wp_enqueue_style(
        'kelecsenyi-lena-site',
        get_stylesheet_directory_uri() . '/assets/css/site.css',
        ['zodiac-astrology-style'],
        file_exists($site_css_path) ? (string) filemtime($site_css_path) : $theme->get('Version')
    );
    wp_enqueue_script(
        'kelecsenyi-lena-site',
        get_stylesheet_directory_uri() . '/assets/js/site.js',
        [],
        file_exists($site_js_path) ? (string) filemtime($site_js_path) : $theme->get('Version'),
        true
    );
}
add_action('wp_enqueue_scripts', 'kelecsenyi_lena_assets', 30);

function kelecsenyi_lena_favicons(): void
{
    $assets = get_stylesheet_directory_uri() . '/assets/images/';
    echo '<link rel="icon" type="image/png" sizes="32x32" href="' . esc_url($assets . 'lena-favicon-32.png') . '">' . "\n";
    echo '<link rel="icon" type="image/png" sizes="192x192" href="' . esc_url($assets . 'lena-celestial-icon-192.png') . '">' . "\n";
    echo '<link rel="apple-touch-icon" href="' . esc_url($assets . 'lena-celestial-icon-192.png') . '">' . "\n";
}
add_action('wp_head', 'kelecsenyi_lena_favicons', 2);

function kelecsenyi_lena_setup(): void
{
    add_theme_support('post-thumbnails');
    add_image_size('lena-event-card', 720, 460, true);
}
add_action('after_setup_theme', 'kelecsenyi_lena_setup');

function kelecsenyi_lena_option(string $key, string $fallback = ''): string
{
    $value = get_option('lena_' . $key, $fallback);
    return is_string($value) ? $value : $fallback;
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
