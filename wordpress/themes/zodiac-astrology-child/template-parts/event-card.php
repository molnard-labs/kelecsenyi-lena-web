<?php
$start = get_post_meta(get_the_ID(), '_lena_event_start', true);
$location = get_post_meta(get_the_ID(), '_lena_event_location', true);
?>
<div class="col-lg-4 col-md-6">
    <article class="blog-box">
        <a class="event-image" href="<?php the_permalink(); ?>">
            <?php if (has_post_thumbnail()) : ?>
                <?php the_post_thumbnail('lena-event-card'); ?>
            <?php else : ?>
                <img src="<?php echo esc_url(get_stylesheet_directory_uri() . '/assets/images/szeress-bele-a-kepletedbe-event-cover.png'); ?>" alt="<?php echo esc_attr(get_the_title()); ?>">
            <?php endif; ?>
        </a>
        <div class="blog-content">
            <?php if ($start) : ?><p class="event-date"><?php echo esc_html(wp_date('Y. F j. · H:i', kelecsenyi_lena_event_timestamp($start), wp_timezone())); ?></p><?php endif; ?>
            <h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
            <?php if ($location) : ?><p class="event-location"><?php echo esc_html($location); ?></p><?php endif; ?>
            <p><?php echo esc_html(wp_trim_words(get_the_excerpt(), 22)); ?></p>
            <a class="text-link" href="<?php the_permalink(); ?>">Részletek →</a>
        </div>
    </article>
</div>
