<?php
get_header();

$about = kelecsenyi_lena_page('rolam');
$consultation = kelecsenyi_lena_page('konzultacio');
$process = kelecsenyi_lena_page('hogyan-dolgozunk');
$calendly = kelecsenyi_lena_option('calendly', 'https://calendly.com/kelecsenyi-lena/30min');
$events_url = get_post_type_archive_link('lena_event');
?>

<section id="intro" aria-label="<?php esc_attr_e('Kelecsényi Léna', 'kelecsenyi-lena'); ?>">
    <?php get_template_part('template-parts/celestial', 'intro'); ?>
</section>

<section id="hero">
    <div class="container">
        <div class="hero-panel">
            <p class="section-label"><?php echo esc_html(kelecsenyi_lena_option('eyebrow', 'Önismeret asztrológiai szemlélettel')); ?></p>
            <h2>Egyéni konzultáció, ahol a képleted a saját nyelveden szólal meg.</h2>
            <p class="hero-title"><?php echo esc_html(kelecsenyi_lena_option('tagline', 'Önismereti mentor és asztrológus')); ?></p>
            <p class="hero-copy"><?php echo esc_html(kelecsenyi_lena_option('hero_text', 'Személyes, figyelmes kísérés azoknak, akik szeretnék jobban érteni saját működésüket, döntéseiket és élethelyzeteik mélyebb mintázatait.')); ?></p>
            <div class="d-flex flex-wrap justify-content-center gap-3">
                <a class="btn button-slider" href="<?php echo esc_url($calendly); ?>" target="_blank" rel="noreferrer">Egyéni konzultáció</a>
                <a class="btn button-slider button-secondary" href="#rolam">Ismerj meg</a>
            </div>
            <?php if (kelecsenyi_lena_analysis_available()) : ?>
                <?php if (function_exists('lena_astrology_public_directory') && is_readable(lena_astrology_public_directory() . '/public/astro-start.js')) : ?>
                    <?php get_template_part('template-parts/birth', 'start'); ?>
                <?php else : ?>
                    <p class="quick-reading-cta"><a href="<?php echo esc_url(home_url('/gyors-elemzes/')); ?>">Kérek egy rövid képletelemzést <span aria-hidden="true">→</span></a></p>
                <?php endif; ?>
            <?php endif; ?>
        </div>
    </div>
</section>

<section id="rolam">
    <div class="container">
        <div class="row align-items-center">
            <div class="col-lg-5">
                <div class="portrait-frame">
                    <?php if (has_post_thumbnail($about)) : ?>
                        <?php echo get_the_post_thumbnail($about, 'large', ['alt' => get_the_title($about)]); ?>
                    <?php else : ?>
                        <img
                            src="<?php echo esc_url(get_stylesheet_directory_uri() . '/assets/images/lena-portrait.png'); ?>"
                            alt="<?php esc_attr_e('Kelecsényi Léna portréja', 'kelecsenyi-lena'); ?>"
                            width="1024"
                            height="1280"
                        >
                    <?php endif; ?>
                </div>
            </div>
            <div class="col-lg-7">
                <p class="section-label">Rólam</p>
                <h2><?php echo esc_html($about ? get_the_title($about) : 'Léna vagyok, asztrológus'); ?></h2>
                <div class="entry-content">
                    <?php echo $about ? apply_filters('the_content', $about->post_content) : ''; ?>
                </div>
                <a class="text-link" href="<?php echo esc_url($calendly); ?>" target="_blank" rel="noreferrer">Kapcsolódjunk egy beszélgetésben →</a>
            </div>
        </div>
    </div>
</section>

<section id="szemlelet">
    <div class="container">
        <div class="text-center mx-auto section-intro">
            <p class="section-label">Hogyan dolgozom</p>
            <h2>Az asztrológia nem jóslás, hanem egy térkép önmagadhoz.</h2>
        </div>
        <div class="row">
            <div class="col-lg-4 col-md-6">
                <article class="services-box">
                    <span class="service-index">01</span>
                    <h3>Kapcsolódó tér</h3>
                    <p>A konzultáció személyes párbeszéd, ahol a képleted az aktuális élethelyzeteddel találkozik.</p>
                </article>
            </div>
            <div class="col-lg-4 col-md-6">
                <article class="services-box">
                    <span class="service-index">02</span>
                    <h3>Érthető fordítás</h3>
                    <p>A bolygóállások mintákká, erőforrásokká és felismerhető belső témákká válnak.</p>
                </article>
            </div>
            <div class="col-lg-4 col-md-6">
                <article class="services-box">
                    <span class="service-index">03</span>
                    <h3>Integrált szemlélet</h3>
                    <p>Az asztrológia mellé más önismereti nézőpontok is kapcsolódhatnak, ha az segíti a megértést.</p>
                </article>
            </div>
        </div>
    </div>
</section>

<section id="konzultacio">
    <div class="container">
        <div class="row align-items-center">
            <div class="col-lg-7">
                <p class="section-label">Egyéni konzultáció</p>
                <h2><?php echo esc_html($consultation ? get_the_title($consultation) : 'A képleted a saját nyelveden'); ?></h2>
                <div class="entry-content">
                    <?php echo $consultation ? apply_filters('the_content', $consultation->post_content) : ''; ?>
                </div>
            </div>
            <div class="col-lg-5">
                <aside class="consultation-card">
                    <p class="section-label">Egyéni konzultáció</p>
                    <h3>Nézzünk rá együtt arra, ami most foglalkoztat.</h3>
                    <p>Foglalj személyes asztrológiai konzultációt; az aktuálisan elérhető időpontok közül a Calendlyben tudsz választani.</p>
                    <a class="btn button-slider w-100" href="<?php echo esc_url($calendly); ?>" target="_blank" rel="noreferrer">Konzultáció foglalása</a>
                </aside>
            </div>
        </div>
    </div>
</section>

<section id="folyamat">
    <div class="container">
        <div class="text-center mx-auto section-intro">
            <p class="section-label">Hogyan dolgozunk együtt</p>
            <h2><?php echo esc_html($process ? get_the_title($process) : 'Egyszerű, személyes folyamat'); ?></h2>
        </div>
        <div class="row process-list">
            <div class="col-lg-3 col-md-6"><article><strong>1</strong><h3>Foglalás</h3><p>Válassz időpontot a Calendlyben.</p></article></div>
            <div class="col-lg-3 col-md-6"><article><strong>2</strong><h3>Felkészülés</h3><p>Megadod a születési adataidat és azt, ami most foglalkoztat.</p></article></div>
            <div class="col-lg-3 col-md-6"><article><strong>3</strong><h3>Találkozás</h3><p>Párbeszédes konzultáció online vagy személyesen.</p></article></div>
            <div class="col-lg-3 col-md-6"><article><strong>4</strong><h3>Integrálás</h3><p>A felismerésekkel a saját ritmusodban dolgozhatsz tovább.</p></article></div>
        </div>
    </div>
</section>

<section id="esemenyek">
    <div class="container">
        <div class="d-flex justify-content-between align-items-end section-heading-row">
            <div>
                <p class="section-label">Közelgő alkalmak</p>
                <h2>Események</h2>
            </div>
            <?php if ($events_url) : ?><a class="text-link" href="<?php echo esc_url($events_url); ?>">Minden esemény →</a><?php endif; ?>
        </div>
        <div class="row">
            <?php
            $events = new WP_Query([
                'post_type' => 'lena_event',
                'posts_per_page' => 3,
                'meta_key' => '_lena_event_start',
                'orderby' => 'meta_value',
                'order' => 'ASC',
                'meta_query' => [[
                    'key' => '_lena_event_start',
                    'value' => current_time('mysql'),
                    'compare' => '>=',
                    'type' => 'DATETIME',
                ]],
            ]);
            if ($events->have_posts()) :
                while ($events->have_posts()) : $events->the_post();
                    get_template_part('template-parts/event', 'card');
                endwhile;
            else :
                ?>
                <div class="col-12"><p class="empty-state">Hamarosan új események érkeznek. Addig is találkozhatunk egyéni konzultáción.</p></div>
                <?php
            endif;
            wp_reset_postdata();
            ?>
        </div>
    </div>
</section>

<section id="tudnivalok">
    <div class="container">
        <div class="row align-items-center">
            <div class="col-lg-7">
                <p class="section-label">Jó tudni</p>
                <h2>A találkozás rólad és a kérdésedről szól.</h2>
                <div class="faq-list">
                    <details open><summary>Mi szükséges a konzultációhoz?</summary><p>Pontos születési dátum, idő és hely, valamint néhány mondat arról, ami most foglalkoztat.</p></details>
                    <details><summary>Online vagy személyesen?</summary><p>Az aktuálisan elérhető lehetőségeket és időpontokat a Calendlyben találod.</p></details>
                    <details><summary>Mi történik a találkozón?</summary><p>Nem előadás, hanem közös gondolkodás: kérdezhetsz, megállhatunk, és mélyebbre mehetünk a fontos témákban.</p></details>
                </div>
            </div>
            <div class="col-lg-5">
                <aside class="consultation-card">
                    <p class="section-label">Következő lépés</p>
                    <h3>Ha megszólított ez a tér, találkozzunk egyéni konzultáción.</h3>
                    <a class="btn button-slider w-100" href="<?php echo esc_url($calendly); ?>" target="_blank" rel="noreferrer">Konzultáció foglalása</a>
                </aside>
            </div>
        </div>
    </div>
</section>

<?php get_footer(); ?>
