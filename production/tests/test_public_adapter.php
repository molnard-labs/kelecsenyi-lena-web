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
echo $checks . " public adapter checks passed\n";
