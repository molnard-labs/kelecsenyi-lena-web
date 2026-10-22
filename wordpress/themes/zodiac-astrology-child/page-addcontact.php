<?php
get_header();

$email = kelecsenyi_lena_option('email');
?>
<section class="contact-card-page">
    <div class="container">
        <div class="contact-card">
            <p class="section-label">Kapcsolat</p>
            <h1><?php bloginfo('name'); ?></h1>
            <p class="hero-title"><?php echo esc_html(kelecsenyi_lena_option('tagline')); ?></p>
            <div class="contact-card-primary-action">
                <p>Mentsd el Léna elérhetőségeit közvetlenül a telefonod névjegyei közé.</p>
                <a class="contact-card-save" href="<?php echo esc_url(home_url('/contact.vcf')); ?>">
                    Névjegy hozzáadása
                </a>
            </div>
            <p class="contact-card-alternative">Vagy lépj kapcsolatba közvetlenül:</p>
            <div class="contact-card-links">
                <a href="mailto:<?php echo esc_attr($email); ?>"><?php echo esc_html($email); ?></a>
                <?php kelecsenyi_lena_phone_reveal(); ?>
                <a href="<?php echo esc_url(kelecsenyi_lena_option('instagram')); ?>" target="_blank" rel="noreferrer">Instagram</a>
            </div>
        </div>
    </div>
</section>
<?php get_footer(); ?>
