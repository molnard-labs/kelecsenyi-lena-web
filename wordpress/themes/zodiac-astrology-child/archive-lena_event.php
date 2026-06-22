<?php
get_header();
?>
<section class="archive-header">
    <div class="container">
        <p class="section-label">Közös alkalmak</p>
        <h1>Események</h1>
        <p>Csoportos asztrológiai és önismereti programok Lénával.</p>
    </div>
</section>
<section class="archive-events">
    <div class="container">
        <div class="row">
            <?php if (have_posts()) : while (have_posts()) : the_post(); get_template_part('template-parts/event', 'card'); endwhile; else : ?>
                <div class="col-12"><p class="empty-state">Jelenleg nincs közzétett esemény.</p></div>
            <?php endif; ?>
        </div>
        <?php the_posts_pagination(); ?>
    </div>
</section>
<?php get_footer(); ?>
