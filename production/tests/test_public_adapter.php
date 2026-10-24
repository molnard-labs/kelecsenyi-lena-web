<?php
// SPDX-License-Identifier: AGPL-3.0-only
define('ABSPATH', __DIR__);
define('MINUTE_IN_SECONDS', 60);
$options = [];
$transients = [];
function add_filter(...$arguments) {}
function add_action(...$arguments) {}
function get_option($key, $default = false) { global $options; return $options[$key] ?? $default; }
function get_transient($key) { global $transients; return $transients[$key] ?? false; }
function set_transient($key, $value, $ttl) { global $transients; $transients[$key] = $value; }
function wp_salt($scheme) { return 'test-only-salt'; }
function wp_json_encode($value, $flags = 0) { return json_encode($value, $flags); }
function home_url($path = '/') { return 'https://lena.example:8443/site' . $path; }
function wp_parse_url($url, $component = -1) { return parse_url($url, $component); }
class WP_REST_Response {
    public array $data;
    public int $status;
    public array $headers;
    function __construct($data, $status, $headers) { $this->data=$data; $this->status=$status; $this->headers=$headers; }
    function header($key, $value) { $this->headers[$key]=$value; }
}
class WP_REST_Request {
    public string $route;
    public array $headers;
    public array $params;
    public string $body;
    function __construct($route, $headers=[], $params=[], $body='') { $this->route=$route; $this->headers=$headers; $this->params=$params; $this->body=$body; }
    function get_route() { return $this->route; }
    function get_header($name) { return $this->headers[$name] ?? ''; }
    function get_param($name) { return $this->params[$name] ?? null; }
    function get_body() { return $this->body; }
}
$fixture = dirname(__DIR__, 2) . '/.local/production-qa/public-adapter-fixture-' . bin2hex(random_bytes(6));
@mkdir($fixture . '/includes', 0777, true);
@mkdir($fixture . '/runtime', 0777, true);
@mkdir($fixture . '/public', 0777, true);
copy(dirname(__DIR__, 2) . '/wordpress/plugins/lena-astrology/includes/public.php', $fixture . '/includes/public.php');
file_put_contents($fixture . '/runtime/engine_cli.py', '# Test fixture, never a real calculator');
file_put_contents($fixture . '/public/analysis.html', '<!doctype html>');
file_put_contents($fixture . '/source.zip', 'fixture-source');
require $fixture . '/includes/public.php';
$checks = 0;
function check($condition, $label) { global $checks; if (!$condition) { throw new RuntimeException($label); } $checks++; }
check(lena_astrology_public_available() === false, 'disabled initially');
$options['lena_astrology_ready'] = true;
check(lena_astrology_public_available() === false, 'legacy true cannot enable a release');
$options['lena_astrology_ready'] = str_repeat('a', 64);
check(lena_astrology_public_available() === false, 'mismatched release unavailable');
$options['lena_astrology_ready'] = hash_file('sha256', $fixture . '/source.zip');
check(lena_astrology_public_available() === true, 'matching release available');
check(lena_astrology_public_origin() === 'https://lena.example:8443', 'origin excludes home subdirectory');
$_SERVER['REMOTE_ADDR'] = '192.0.2.1';
function chart($headers=[], $body='{}') { return lena_astrology_public_api(new WP_REST_Request('/lena/v1/chart', $headers, [], $body)); }
$valid_headers = ['origin'=>'https://lena.example:8443', 'content-type'=>'application/json; charset=UTF-8'];
check(chart()->status === 403, 'missing origin rejected');
check(chart(['origin'=>'https://foreign.example'])->status === 403, 'foreign origin rejected');
check(chart(['origin'=>'https://lena.example:8443/'])->status === 403, 'origin must match exactly');
check(chart(['origin'=>'https://lena.example:8443', 'content-type'=>'text/plain'])->status === 415, 'content type enforced');
check(chart($valid_headers, '')->status === 413, 'empty body rejected');
check(chart($valid_headers, str_repeat('x', 4097))->status === 413, 'oversized body rejected');
check(chart($valid_headers, '[]')->status === 400, 'top-level arrays rejected');
check(chart($valid_headers, '{')->status === 400, 'invalid JSON rejected');
check(chart($valid_headers, '{"a":' . str_repeat('[', 40) . '0' . str_repeat(']', 40) . '}')->status === 400, 'excessive JSON depth rejected');
foreach ([['q'=>['a']], ['q'=>str_repeat('á',121)], ['q'=>"a\nb"]] as $params) {
    check(lena_astrology_public_api(new WP_REST_Request('/lena/v1/places', [], $params))->status === 400, 'query guard');
}
check(lena_astrology_public_run_engine('arbitrary')['status'] === 503, 'unknown engine action rejected');
check(lena_astrology_public_run_engine('chart', ['date'=>str_repeat('a',4096)])['status'] === 413, 'encoded stdin bounded');
$transients = [];
for ($i=0; $i<60; $i++) { check(chart()->status === 403, 'first sixty attempts allowed through guards'); }
check(chart()->status === 429, 'sixty-first request rate limited');
check(chart()->headers['Retry-After'] === '60', 'rate limit retry guidance');
$key = array_key_first($transients);
check(strpos($key, '192.0.2.1') === false, 'transient key contains no raw IP');
$options['lena_astrology_ready'] = false;
check(chart($valid_headers)->status === 503, 'disabled API never calculates');

$handoff_server = ['HTTP_ORIGIN' => 'https://lena.example:8443', 'CONTENT_TYPE' => 'application/x-www-form-urlencoded; charset=UTF-8'];
$handoff_fields = ['date' => '1990-05-21', 'place_id' => '3054643', 'place_label' => 'Budapest, Magyarország', 'place_timezone' => 'Europe/Budapest'];
$handoff_body = http_build_query($handoff_fields);
$handoff = lena_astrology_public_prefill($handoff_body, $handoff_server);
check($handoff['status'] === 200, 'homepage handoff accepted');
check($handoff['payload'] === ['date' => '1990-05-21', 'place' => ['id' => '3054643', 'label' => 'Budapest, Magyarország', 'timezone' => 'Europe/Budapest']], 'date and selected Budapest preserved without a guessed time');
$changed_place = array_replace($handoff_fields, ['place_id' => '715429', 'place_label' => 'Szeged, Magyarország']);
check(lena_astrology_public_prefill(http_build_query($changed_place), $handoff_server)['payload']['place']['id'] === '715429', 'selected alternative city preserved');
check(lena_astrology_public_prefill($handoff_body, [])['status'] === 403, 'handoff needs origin');
check(lena_astrology_public_prefill($handoff_body, array_replace($handoff_server, ['HTTP_ORIGIN' => 'https://foreign.example']))['status'] === 403, 'foreign handoff refused');
check(lena_astrology_public_prefill($handoff_body, array_replace($handoff_server, ['CONTENT_TYPE' => 'application/json']))['status'] === 415, 'handoff accepts form encoding only');
check(lena_astrology_public_prefill(str_repeat('x', 4097), $handoff_server)['status'] === 413, 'handoff body bounded');
check(lena_astrology_public_prefill('', $handoff_server)['status'] === 413, 'empty handoff refused');
foreach (['1900-02-29', '2023-02-29', '1990-13-01', '1990-04-31', '1899-12-31', '9999-01-01', '19900521', '1990-05-21<script>'] as $date) {
    $rejected = lena_astrology_public_prefill(http_build_query(array_replace($handoff_fields, ['date' => $date])), $handoff_server);
    check($rejected['status'] === 400 && array_keys($rejected['payload']) === ['error'], 'invalid date is neither prefilled nor reflected');
}
foreach (['1900-01-01', '2000-02-29', gmdate('Y-m-d')] as $date) {
    check(lena_astrology_public_prefill(http_build_query(array_replace($handoff_fields, ['date' => $date])), $handoff_server)['status'] === 200, 'valid date boundary accepted');
}
foreach ([['date' => ['1990-05-21']], ['place_id' => ['3054643']], ['place_id' => '3054643x'], ['place_id' => str_repeat('1', 13)],
          ['place_label' => "Budapest\nOther"], ['place_label' => ' '], ['place_label' => str_repeat('á', 241)], ['place_label' => "\xff"],
          ['place_timezone' => ['Europe/Budapest']], ['place_timezone' => '<script>'], ['unexpected' => 'data']] as $invalid_fields) {
    check(lena_astrology_public_prefill(http_build_query(array_replace($handoff_fields, $invalid_fields)), $handoff_server)['status'] === 400, 'invalid handoff field rejected');
}
check(lena_astrology_public_prefill('date=1990-05-21', $handoff_server)['status'] === 400, 'incomplete handoff rejected');
$hostile_label = '</script><script>alert("x")</script> & O\'Town';
$escaped = lena_astrology_public_prefill(http_build_query(array_replace($handoff_fields, ['place_label' => $hostile_label])), $handoff_server);
check($escaped['status'] === 200, 'presentation text treated as data');
$injected = lena_astrology_public_prefill_html('<body><!-- LENA_BIRTH_PREFILL --></body>', $escaped['payload']);
check(substr_count($injected, '</script>') === 1 && strpos($injected, '<script>alert') === false, 'untrusted text cannot escape inert script');
preg_match('/<script type="application\/json" id="birth-prefill">(.*?)<\/script>/s', $injected, $prefill_match);
check(json_decode($prefill_match[1], true)['place']['label'] === $hostile_label, 'encoded prefill roundtrips without HTML interpretation');
check(lena_astrology_public_prefill_html('<body><!-- LENA_BIRTH_PREFILL --></body>', []) === '<body></body>', 'direct GET has no prefill data');
check(lena_astrology_public_page_methods('public/analysis.html') === ['GET', 'HEAD', 'POST'], 'analysis route accepts form navigation');
foreach (['public/licenses.html', 'source.zip', 'LICENSE', 'THIRD_PARTY_NOTICES.md'] as $route_file) {
    check(lena_astrology_public_page_methods($route_file) === ['GET', 'HEAD'], 'other public routes remain read only');
}
echo $checks . " public adapter checks passed\n";
