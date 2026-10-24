<?php
if (!defined('ABSPATH') || !kelecsenyi_lena_analysis_available() || !function_exists('lena_astrology_public_directory')) {
    return;
}

$birth_start_directory = lena_astrology_public_directory();
$birth_start_script = $birth_start_directory . '/public/astro-start.js';
if (!is_readable($birth_start_script)) {
    return;
}
$birth_start_url = plugins_url('public/astro-start.js', $birth_start_directory . '/lena-astrology.php');
$birth_start_version = substr(hash_file('sha256', $birth_start_script), 0, 12);
?>
<div class="birth-start" aria-labelledby="birth-start-title">
    <h2 id="birth-start-title">Mit mesél rólad a születési képleted?</h2>
    <p class="birth-start-copy">Írd be a születési dátumodat, és fedezd fel a képleted első motívumait.</p>
    <form id="birth-start-form" method="post" action="<?php echo esc_url(home_url('/gyors-elemzes/')); ?>" data-api-base="<?php echo esc_url(untrailingslashit(rest_url('lena/v1'))); ?>" novalidate autocomplete="off">
        <div class="birth-start-fields">
            <div class="birth-start-field">
                <label for="start-date">Születési dátum</label>
                <input id="start-date" name="date" type="text" inputmode="numeric" placeholder="ÉÉÉÉ. HH. NN." maxlength="14" spellcheck="false" required aria-describedby="start-date-help start-date-error">
                <span class="birth-start-hint" id="start-date-help">Csak a számokat írd: 19900521.</span>
                <span class="birth-start-error" id="start-date-error"></span>
            </div>
            <div class="birth-start-field birth-start-place place-field">
                <label for="start-place">Születési hely</label>
                <div class="birth-start-place-control">
                    <input id="start-place" type="text" value="Budapest, Magyarország" placeholder="Kezdd el beírni a települést…" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="start-place-options" aria-describedby="start-place-help start-place-error" maxlength="120" spellcheck="false" required>
                    <ul id="start-place-options" class="birth-start-options" role="listbox" aria-label="Településjavaslatok" hidden></ul>
                </div>
                <span class="birth-start-hint" id="start-place-help">Más város? Írd át, és válassz a találatokból.</span>
                <span class="birth-start-error" id="start-place-error"></span>
                <span id="start-place-status" class="birth-start-sr-only" role="status" aria-live="polite"></span>
            </div>
        </div>
        <input type="hidden" name="place_id" value="3054643">
        <input type="hidden" name="place_label" value="Budapest, Magyarország">
        <input type="hidden" name="place_timezone" value="Europe/Budapest">
        <div id="start-form-error" class="birth-start-error birth-start-form-error" role="alert" hidden></div>
        <button id="start-button" class="birth-start-button" type="submit" disabled>Tovább a képletemhez <span aria-hidden="true">→</span></button>
        <p class="birth-start-next">A következő lépésben a születési órát és percet kérjük. Nincs regisztráció.</p>
        <noscript><p class="birth-start-fallback">Az adatok átvételéhez JavaScript szükséges. <a href="<?php echo esc_url(home_url('/gyors-elemzes/')); ?>">Az elemzőoldal megnyitása →</a></p></noscript>
    </form>
</div>
<script type="module" src="<?php echo esc_url($birth_start_url . '?v=' . $birth_start_version); ?>"></script>
