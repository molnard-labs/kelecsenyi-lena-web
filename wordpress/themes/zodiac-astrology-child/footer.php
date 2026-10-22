<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
</main>
<footer id="colophon">
    <div class="container row mx-auto align-items-start">
        <div class="col-lg-5">
            <p class="footer-title"><?php bloginfo('name'); ?></p>
            <p><?php echo esc_html(kelecsenyi_lena_option('tagline', 'Önismereti mentor és asztrológus')); ?></p>
        </div>
        <div class="col-lg-4">
            <p class="footer-heading"><?php esc_html_e('Kapcsolat', 'kelecsenyi-lena'); ?></p>
            <p><a href="mailto:<?php echo esc_attr(kelecsenyi_lena_option('email')); ?>"><?php echo esc_html(kelecsenyi_lena_option('email')); ?></a></p>
            <p><?php kelecsenyi_lena_phone_reveal(); ?></p>
        </div>
        <div class="col-lg-3">
            <p class="footer-heading"><?php esc_html_e('Kövess', 'kelecsenyi-lena'); ?></p>
            <p><a href="<?php echo esc_url(kelecsenyi_lena_option('instagram')); ?>" target="_blank" rel="noreferrer">Instagram</a></p>
        </div>
    </div>
    <div class="container footer-bottom">
        <span>© <?php echo esc_html(wp_date('Y')); ?> <?php bloginfo('name'); ?></span>
        <a href="<?php echo esc_url(home_url('/adatkezelesi-tajekoztato/')); ?>">Adatkezelés</a>
    </div>
    <?php if (function_exists('lena_astrology_public_directory') && is_file(lena_astrology_public_directory() . '/source.zip')) : ?>
        <p class="container lena-source-offer"><a href="<?php echo esc_url(home_url('/licenses.html')); ?>">Szoftverlicencek</a></p>
    <?php endif; ?>
</footer>
<?php wp_footer(); ?>
</body>
</html>
