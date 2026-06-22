<?php
/**
 * Plugin Name: Léna Core
 * Description: Eseménykezelés és globális oldalbeállítások Kelecsényi Léna weboldalához.
 * Version: 0.2.1
 */

if (!defined('ABSPATH')) {
    exit;
}

function lena_core_register_event(): void
{
    register_post_type('lena_event', [
        'labels' => [
            'name' => 'Események',
            'singular_name' => 'Esemény',
            'add_new_item' => 'Új esemény létrehozása',
            'edit_item' => 'Esemény szerkesztése',
            'new_item' => 'Új esemény',
            'view_item' => 'Esemény megtekintése',
            'search_items' => 'Események keresése',
            'not_found' => 'Nincs esemény',
        ],
        'public' => true,
        'show_in_rest' => true,
        'menu_icon' => 'dashicons-calendar-alt',
        'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'revisions'],
        'has_archive' => 'esemenyek',
        'rewrite' => ['slug' => 'esemeny', 'with_front' => false],
        'menu_position' => 5,
    ]);
    add_rewrite_rule('^contact\.vcf$', 'index.php?lena_vcard=1', 'top');
}
add_action('init', 'lena_core_register_event');

function lena_core_query_vars(array $vars): array
{
    $vars[] = 'lena_vcard';
    return $vars;
}
add_filter('query_vars', 'lena_core_query_vars');

function lena_core_public_routes(): void
{
    if (is_page('cardurl')) {
        wp_safe_redirect(home_url('/addcontact/'), 302);
        exit;
    }

    if ((int) get_query_var('lena_vcard') !== 1) {
        return;
    }

    $name = get_bloginfo('name');
    $email = (string) get_option('lena_email');
    $phone = preg_replace('/\s+/', '', (string) get_option('lena_phone'));
    $url = home_url('/');
    $instagram = (string) get_option('lena_instagram');

    nocache_headers();
    header('Content-Type: text/vcard; charset=utf-8');
    header('Content-Disposition: attachment; filename="kelecsenyi-lena.vcf"');
    echo "BEGIN:VCARD\r\n";
    echo "VERSION:3.0\r\n";
    echo "N:Kelecsényi;Léna;;;\r\n";
    echo 'FN:' . $name . "\r\n";
    echo "TITLE:Önismereti mentor és asztrológus\r\n";
    echo 'TEL;TYPE=CELL:' . $phone . "\r\n";
    echo 'EMAIL;TYPE=INTERNET:' . $email . "\r\n";
    echo 'URL:' . $url . "\r\n";
    echo "ADR;TYPE=WORK:;;;Budapest;;;Hungary\r\n";
    echo 'NOTE:Instagram: ' . $instagram . "\r\n";
    echo "END:VCARD\r\n";
    exit;
}
add_action('template_redirect', 'lena_core_public_routes');

function lena_core_local_menu_urls(array $attributes): array
{
    if (
        wp_get_environment_type() !== 'local'
        || empty($attributes['href'])
        || empty($_SERVER['HTTP_HOST'])
    ) {
        return $attributes;
    }

    $local_base = 'http://' . sanitize_text_field(wp_unslash($_SERVER['HTTP_HOST']));
    if (preg_match('#^https?://(?:localhost|127\.0\.0\.1)(?::\d+)?(/.*)?$#', $attributes['href'], $matches)) {
        $attributes['href'] = $local_base . ($matches[1] ?? '/');
    }

    return $attributes;
}
add_filter('nav_menu_link_attributes', 'lena_core_local_menu_urls');

function lena_core_event_boxes(): void
{
    add_meta_box('lena-event-details', 'Esemény részletei', 'lena_core_event_box', 'lena_event', 'normal', 'high');
}
add_action('add_meta_boxes', 'lena_core_event_boxes');

function lena_core_event_box(WP_Post $post): void
{
    wp_nonce_field('lena_event_save', 'lena_event_nonce');
    $fields = [
        '_lena_event_start' => ['Kezdés', 'datetime-local'],
        '_lena_event_end' => ['Befejezés', 'datetime-local'],
        '_lena_event_location' => ['Helyszín', 'text'],
        '_lena_event_ticket_url' => ['Cooltix jegyvásárlási link', 'url'],
    ];
    echo '<p class="description">A cím, borítókép és leírás a megszokott WordPress mezőkben szerkeszthető. Csak az alábbi adatokat kell még megadni.</p>';
    foreach ($fields as $key => [$label, $type]) {
        $value = (string) get_post_meta($post->ID, $key, true);
        if ($type === 'datetime-local' && $value) {
            $date = DateTimeImmutable::createFromFormat('!Y-m-d H:i:s', $value, wp_timezone());
            $value = $date instanceof DateTimeImmutable ? $date->format('Y-m-d\TH:i') : '';
        }
        printf(
            '<p><label for="%1$s"><strong>%2$s</strong></label><br><input class="widefat" type="%3$s" id="%1$s" name="%1$s" value="%4$s"></p>',
            esc_attr($key),
            esc_html($label),
            esc_attr($type),
            esc_attr($value)
        );
    }
}

function lena_core_save_event(int $post_id): void
{
    if (
        !isset($_POST['lena_event_nonce'])
        || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['lena_event_nonce'])), 'lena_event_save')
        || (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE)
        || !current_user_can('edit_post', $post_id)
    ) {
        return;
    }

    foreach (['_lena_event_start', '_lena_event_end', '_lena_event_location', '_lena_event_ticket_url'] as $key) {
        if (!isset($_POST[$key])) {
            continue;
        }
        $raw = wp_unslash($_POST[$key]);
        $value = $key === '_lena_event_ticket_url' ? esc_url_raw($raw) : sanitize_text_field($raw);
        if (str_contains($key, '_start') || str_contains($key, '_end')) {
            $date = DateTimeImmutable::createFromFormat('!Y-m-d\TH:i', $value, wp_timezone());
            $value = $date instanceof DateTimeImmutable ? $date->format('Y-m-d H:i:s') : '';
        }
        update_post_meta($post_id, $key, $value);
    }
}
add_action('save_post_lena_event', 'lena_core_save_event');

function lena_core_event_columns(array $columns): array
{
    return [
        'cb' => $columns['cb'],
        'title' => 'Esemény',
        'event_start' => 'Kezdés',
        'event_location' => 'Helyszín',
        'date' => 'Publikálva',
    ];
}
add_filter('manage_lena_event_posts_columns', 'lena_core_event_columns');

function lena_core_event_column(string $column, int $post_id): void
{
    if ($column === 'event_start') {
        $start = (string) get_post_meta($post_id, '_lena_event_start', true);
        $date = DateTimeImmutable::createFromFormat('!Y-m-d H:i:s', $start, wp_timezone());
        echo $date instanceof DateTimeImmutable ? esc_html($date->format('Y. m. d. H:i')) : '—';
    }
    if ($column === 'event_location') {
        echo esc_html((string) get_post_meta($post_id, '_lena_event_location', true)) ?: '—';
    }
}
add_action('manage_lena_event_posts_custom_column', 'lena_core_event_column', 10, 2);

function lena_core_event_archive_query(WP_Query $query): void
{
    if (!is_admin() && $query->is_main_query() && is_post_type_archive('lena_event')) {
        $query->set('meta_key', '_lena_event_start');
        $query->set('orderby', 'meta_value');
        $query->set('order', 'ASC');
        $query->set('posts_per_page', 12);
    }
}
add_action('pre_get_posts', 'lena_core_event_archive_query');

function lena_core_settings_menu(): void
{
    add_menu_page('Léna oldal adatai', 'Oldal adatai', 'manage_options', 'lena-settings', 'lena_core_settings_page', 'dashicons-admin-site-alt3', 4);
}
add_action('admin_menu', 'lena_core_settings_menu');

function lena_core_settings(): void
{
    $fields = [
        'lena_tagline', 'lena_eyebrow', 'lena_hero_text', 'lena_calendly',
        'lena_email', 'lena_phone', 'lena_instagram',
    ];
    foreach ($fields as $field) {
        register_setting('lena_settings', $field, ['sanitize_callback' => str_contains($field, 'calendly') || str_contains($field, 'instagram') ? 'esc_url_raw' : 'sanitize_text_field']);
    }
}
add_action('admin_init', 'lena_core_settings');

function lena_core_settings_page(): void
{
    $fields = [
        'lena_tagline' => ['Pozicionálás', 'text'],
        'lena_eyebrow' => ['Hero kis címe', 'text'],
        'lena_hero_text' => ['Hero bemutatkozó szöveg', 'textarea'],
        'lena_calendly' => ['Calendly link', 'url'],
        'lena_email' => ['Email', 'email'],
        'lena_phone' => ['Telefon', 'text'],
        'lena_instagram' => ['Instagram link', 'url'],
    ];
    ?>
    <div class="wrap">
        <h1>Léna oldalának alapadatai</h1>
        <p>Ezek az adatok több helyen automatikusan megjelennek, ezért csak egyszer kell őket karbantartani.</p>
        <form method="post" action="options.php">
            <?php settings_fields('lena_settings'); ?>
            <table class="form-table">
                <?php foreach ($fields as $key => [$label, $type]) : ?>
                    <tr>
                        <th><label for="<?php echo esc_attr($key); ?>"><?php echo esc_html($label); ?></label></th>
                        <td>
                            <?php if ($type === 'textarea') : ?>
                                <textarea class="large-text" rows="4" id="<?php echo esc_attr($key); ?>" name="<?php echo esc_attr($key); ?>"><?php echo esc_textarea((string) get_option($key)); ?></textarea>
                            <?php else : ?>
                                <input class="regular-text" type="<?php echo esc_attr($type); ?>" id="<?php echo esc_attr($key); ?>" name="<?php echo esc_attr($key); ?>" value="<?php echo esc_attr((string) get_option($key)); ?>">
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </table>
            <?php submit_button('Mentés'); ?>
        </form>
    </div>
    <?php
}

function lena_core_editor_cleanup(): void
{
    if (!current_user_can('administrator')) {
        remove_menu_page('edit-comments.php');
        remove_menu_page('themes.php');
        remove_menu_page('plugins.php');
        remove_menu_page('tools.php');
    }
}
add_action('admin_menu', 'lena_core_editor_cleanup', 99);

function lena_core_run_content_setup(): void
{
    if (!is_admin() || !current_user_can('manage_options')) {
        return;
    }

    $setup_version = '0.2.0';
    if (get_option('lena_core_setup_version') === $setup_version) {
        return;
    }

    require __DIR__ . '/setup-content.php';
    update_option('lena_core_setup_version', $setup_version);
}
add_action('admin_init', 'lena_core_run_content_setup');

register_activation_hook(__FILE__, function (): void {
    lena_core_register_event();
    flush_rewrite_rules();
});
register_deactivation_hook(__FILE__, 'flush_rewrite_rules');
