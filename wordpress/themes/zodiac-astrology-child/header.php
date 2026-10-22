<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="lena-skip-link" href="<?php echo is_front_page() ? '#hero' : '#content'; ?>"><?php esc_html_e('Ugrás a tartalomra', 'kelecsenyi-lena'); ?></a>
<header id="masthead">
    <div class="container d-flex align-items-center justify-content-between">
        <a class="site-title" href="<?php echo esc_url(home_url('/')); ?>">
            <img src="<?php echo esc_url(get_stylesheet_directory_uri() . '/assets/images/kl-monogram-192.png'); ?>" alt="" width="38" height="38">
            <span><?php bloginfo('name'); ?></span>
        </a>
        <nav id="primary-menu" aria-label="<?php esc_attr_e('Elsődleges navigáció', 'kelecsenyi-lena'); ?>">
            <?php
            wp_nav_menu([
                'theme_location' => 'primary',
                'container' => false,
                'fallback_cb' => false,
                'menu_class' => 'd-flex align-items-center',
            ]);
            ?>
        </nav>
        <details class="mobile-nav">
            <summary><?php esc_html_e('Menü', 'kelecsenyi-lena'); ?></summary>
            <?php
            wp_nav_menu([
                'theme_location' => 'primary',
                'container' => false,
                'fallback_cb' => false,
                'menu_class' => 'mobile-menu',
            ]);
            ?>
        </details>
    </div>
</header>
<main id="content">
