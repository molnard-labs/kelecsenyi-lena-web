<?php

if (!defined('ABSPATH')) {
    exit;
}

function lena_core_setup_page(string $slug, string $title, string $content): int
{
    $existing = get_page_by_path($slug);
    if ($existing instanceof WP_Post) {
        return $existing->ID;
    }

    return (int) wp_insert_post([
        'post_type' => 'page',
        'post_status' => 'publish',
        'post_name' => $slug,
        'post_title' => $title,
        'post_content' => $content,
    ]);
}

$home_id = lena_core_setup_page('fooldal', 'Főoldal', '');
update_option('blogname', 'Kelecsényi Léna');
update_option('blogdescription', 'Önismereti mentor és asztrológus');

lena_core_setup_page(
    'rolam',
    'Léna vagyok, önismereti mentor és asztrológus',
    '<p>Az asztrológia számomra nem a sors meghatározása, hanem a belső térkép megismerése. A születési képlet olyan nézőpontokat nyithat meg, amelyek közelebb visznek a saját működésedhez, erőforrásaidhoz és jelenlegi élethelyzetedhez.</p><p>A konzultációkon nem általános jóslatokat adok. Együtt nézzük meg, hogyan kapcsolódnak a képleted mintái ahhoz, ami most valóban foglalkoztat.</p>'
);
lena_core_setup_page(
    'konzultacio',
    'Személyes beszélgetés a képleted mentén',
    '<p>Egy konzultáció akkor igazán értékes, ha nem pusztán információt ad, hanem segít felismerni valamit, amit a saját életedben is használni tudsz.</p><p>A találkozás párbeszédes. Kérdezhetsz, megállíthatsz, és mélyebbre mehetünk ott, ahol arra most a legnagyobb szükséged van.</p>'
);
lena_core_setup_page('hogyan-dolgozunk', 'Egyszerű, személyes folyamat', '');
lena_core_setup_page(
    'adatkezelesi-tajekoztato',
    'Adatkezelési tájékoztató',
    '<p>A végleges adatkezelési tájékoztató az élesítés előtt kerül ide.</p>'
);
lena_core_setup_page('addcontact', 'Léna névjegye', '');
lena_core_setup_page('cardurl', 'Névjegy átirányítás', '');

update_option('show_on_front', 'page');
update_option('page_on_front', $home_id);
update_option('blog_public', 0);
update_option('timezone_string', 'Europe/Budapest');
update_option('date_format', 'Y. F j.');
update_option('time_format', 'H:i');
update_option('default_comment_status', 'closed');
update_option('permalink_structure', '/%postname%/');

$options = [
    'lena_tagline' => 'Önismereti mentor és asztrológus',
    'lena_eyebrow' => 'Önismeret asztrológiai szemlélettel',
    'lena_hero_text' => 'Személyes, figyelmes kísérés azoknak, akik szeretnék jobban érteni saját működésüket, döntéseiket és élethelyzeteik mélyebb mintázatait.',
    'lena_calendly' => 'https://calendly.com/kelecsenyi-lena/30min',
    'lena_email' => 'kelecsenyi.lena@gmail.com',
    'lena_phone' => '+36 70 425 6216',
    'lena_instagram' => 'https://www.instagram.com/lena.kelecsenyi/',
];

foreach ($options as $key => $value) {
    if (get_option($key, null) === null) {
        add_option($key, $value);
    }
}

$menu = wp_get_nav_menu_object('Elsődleges menü');
$menu_id = $menu ? (int) $menu->term_id : wp_create_nav_menu('Elsődleges menü');

if (!is_wp_error($menu_id) && !wp_get_nav_menu_items($menu_id)) {
    foreach ([
        ['Rólam', home_url('/#rolam')],
        ['Konzultáció', home_url('/#konzultacio')],
        ['Események', get_post_type_archive_link('lena_event')],
        ['Kapcsolat', home_url('/#tudnivalok')],
    ] as [$label, $url]) {
        wp_update_nav_menu_item($menu_id, 0, [
            'menu-item-title' => $label,
            'menu-item-url' => $url,
            'menu-item-status' => 'publish',
        ]);
    }
}

if (!is_wp_error($menu_id)) {
    $locations = get_theme_mod('nav_menu_locations', []);
    $locations['primary'] = $menu_id;
    set_theme_mod('nav_menu_locations', $locations);
}

function lena_core_setup_event_cover(int $event_id): void
{
    if (has_post_thumbnail($event_id)) {
        return;
    }

    $source = get_stylesheet_directory() . '/assets/images/szeress-bele-a-kepletedbe-event-cover.png';
    if (!is_readable($source)) {
        return;
    }

    $upload = wp_upload_bits('szeress-bele-a-kepletedbe-event-cover.png', null, file_get_contents($source));
    if (!empty($upload['error'])) {
        return;
    }

    $attachment_id = wp_insert_attachment([
        'post_mime_type' => 'image/png',
        'post_title' => 'Szeress bele a képletedbe esemény borító',
        'post_content' => '',
        'post_status' => 'inherit',
    ], $upload['file'], $event_id);

    if (is_wp_error($attachment_id)) {
        return;
    }

    require_once ABSPATH . 'wp-admin/includes/image.php';
    wp_update_attachment_metadata(
        $attachment_id,
        wp_generate_attachment_metadata($attachment_id, $upload['file'])
    );
    set_post_thumbnail($event_id, $attachment_id);
}

$events = get_posts([
    'post_type' => 'lena_event',
    'posts_per_page' => 1,
    'post_status' => 'any',
]);

if (!$events) {
    $event_id = wp_insert_post([
        'post_type' => 'lena_event',
        'post_status' => 'publish',
        'post_title' => 'Szeress bele a képletedbe! Csoportos asztrológia elemzés',
        'post_excerpt' => 'Különleges, piknik hangulatú délután csoportos asztrológiai elemzéssel.',
        'post_content' => '<p>Kíváncsi vagy, mit mond rólad a születési képleted? És arra, hogy mi az, amire igazán születtél, és mi az, ami csak felvett szerep?</p><p>Az asztrológia nem jóslás, hanem egy térkép, ami megmutatja, merre érdemes menni, és miért érzed magad néha mégis elveszettnek.</p><p>Ezen a különleges, piknik hangulatú délutánon minden résztvevővel egyenként foglalkozom, és röviden kielemzem a születési képletét.</p><p><strong>Létszám:</strong> maximum 12 fő. A részvételi és jegyinformációkat a Cooltix oldalon találod.</p>',
    ]);

    if (!is_wp_error($event_id)) {
        update_post_meta($event_id, '_lena_event_start', '2026-07-02 17:30:00');
        update_post_meta($event_id, '_lena_event_end', '2026-07-02 20:30:00');
        update_post_meta($event_id, '_lena_event_location', 'Budapest, Margit-sziget');
        update_post_meta($event_id, '_lena_event_ticket_url', 'https://cooltix.hu/event/6a2c117ccd2767e293235b00');
        lena_core_setup_event_cover((int) $event_id);
    }
} else {
    lena_core_setup_event_cover((int) $events[0]->ID);
}

flush_rewrite_rules();
