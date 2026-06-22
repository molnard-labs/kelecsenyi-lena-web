<?php
get_header();
the_post();

$start = get_post_meta(get_the_ID(), '_lena_event_start', true);
$end = get_post_meta(get_the_ID(), '_lena_event_end', true);
$location = get_post_meta(get_the_ID(), '_lena_event_location', true);
$ticket_url = get_post_meta(get_the_ID(), '_lena_event_ticket_url', true);
?>
<article class="event-single">
    <header class="event-hero">
        <div class="container">
            <a class="text-link" href="<?php echo esc_url(get_post_type_archive_link('lena_event')); ?>">← Események</a>
            <p class="section-label">Esemény</p>
            <h1><?php the_title(); ?></h1>
            <div class="event-meta">
                <?php if ($start) : ?><span><?php echo esc_html(wp_date('Y. F j. · H:i', kelecsenyi_lena_event_timestamp($start), wp_timezone())); ?><?php if ($end) : ?>–<?php echo esc_html(wp_date('H:i', kelecsenyi_lena_event_timestamp($end), wp_timezone())); ?><?php endif; ?></span><?php endif; ?>
                <?php if ($location) : ?><span><?php echo esc_html($location); ?></span><?php endif; ?>
            </div>
        </div>
    </header>
    <?php if (has_post_thumbnail()) : ?>
        <div class="container event-cover"><?php the_post_thumbnail('full'); ?></div>
    <?php else : ?>
        <div class="container event-cover">
            <img src="<?php echo esc_url(get_stylesheet_directory_uri() . '/assets/images/szeress-bele-a-kepletedbe-event-cover.png'); ?>" alt="<?php echo esc_attr(get_the_title()); ?>">
        </div>
    <?php endif; ?>
    <div class="container event-layout">
        <div class="entry-content"><?php the_content(); ?></div>
        <aside class="consultation-card">
            <h2>Részvétel</h2>
            <?php if ($ticket_url) : ?>
                <p>A jegyvásárlás a Cooltix biztonságos oldalán történik.</p>
                <a class="btn button-slider w-100" href="<?php echo esc_url($ticket_url); ?>" target="_blank" rel="noreferrer">Jegyvásárlás</a>
            <?php else : ?>
                <p>A jelentkezési lehetőség hamarosan elérhető.</p>
            <?php endif; ?>
        </aside>
    </div>
</article>
<?php get_footer(); ?>
