import test from 'node:test';
import assert from 'node:assert/strict';
import {pointForLongitude, circularMidpoint, arrangePlanetLabels} from '../astro-wheel-geometry.js';

const norm = angle => ((angle % 360) + 360) % 360;
const distance = (a, b) => Math.min(norm(a - b), norm(b - a));
const close = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);

function verifyLayout(planets, gap = 9) {
  const before = structuredClone(planets);
  const arranged = arrangePlanetLabels(planets, gap);
  assert.deepEqual(planets, before, 'source data changed');
  assert.equal(arranged.length, planets.length);
  arranged.forEach((planet, index) => {
    assert.notEqual(planet, planets[index], 'returned a source object');
    assert.equal(planet.key, planets[index].key, 'input order changed');
    assert.equal(planet.longitude, planets[index].longitude, 'true longitude changed');
    assert.ok(Number.isFinite(planet.displayLongitude));
    assert.ok(planet.displayLongitude >= 0 && planet.displayLongitude < 360);
  });
  if (planets.length > 1) {
    const ordered = planets.map((p, i) => ({index: i, angle: norm(p.longitude)}))
      .sort((a, b) => a.angle - b.angle || a.index - b.index);
    let totalArc = 0;
    ordered.forEach((item, index) => {
      const next = ordered[(index + 1) % ordered.length];
      const arc = norm(arranged[next.index].displayLongitude - arranged[item.index].displayLongitude);
      assert.ok(arc >= gap - 1e-7, `gap ${arc} smaller than ${gap}`);
      totalArc += arc;
    });
    close(totalArc, 360, 1e-6); // Preserves one cyclic order, without crossings.
    for (let a = 0; a < arranged.length; a++) {
      for (let b = a + 1; b < arranged.length; b++) {
        assert.ok(distance(arranged[a].displayLongitude, arranged[b].displayLongitude) >= gap - 1e-7);
      }
    }
  }
  return arranged;
}

test('ASC orientation and cardinal positions follow the requested SVG convention', () => {
  for (const ascendant of [0, 57.25, 359.5, -90, 720]) {
    for (const [delta, x, y] of [[0, 250, 450], [90, 450, 650], [180, 650, 450], [270, 450, 250]]) {
      const point = pointForLongitude(ascendant + delta, ascendant, 200);
      close(point.x, x);
      close(point.y, y);
    }
  }
  assert.deepEqual(pointForLongitude(12, 88, 0, 20, 40), {x: 20, y: 40});
});

test('rotating all longitudes and ASC together leaves every projected position unchanged', () => {
  const original = pointForLongitude(133.7, 28.6, 311, 420, 380);
  const rotated = pointForLongitude(133.7 + 293.25, 28.6 + 293.25, 311, 420, 380);
  close(rotated.x, original.x);
  close(rotated.y, original.y);
});

test('cusp midpoints follow the increasing-longitude arc over zero', () => {
  close(circularMidpoint(350, 20), 5);
  close(circularMidpoint(20, 350), 185);
  close(circularMidpoint(359, 1), 0);
  close(circularMidpoint(-10, 380), 5);
  close(circularMidpoint(30, 60), 45);
  close(circularMidpoint(360, 720), 0);
});

test('wrap clusters stay separated, ordered, and retain original source longitudes', () => {
  const planets = [359.8, 0, 0.2, 357, 2.3, 140, 218].map((longitude, index) => Object.freeze({key: `p${index}`, longitude, house: index + 1}));
  Object.freeze(planets);
  const arranged = verifyLayout(planets);
  for (let index = 0; index < 5; index++) {
    assert.ok(distance(arranged[index].displayLongitude, planets[index].longitude) < 25);
  }
});

test('all thirteen exact conjunctions form a centered cluster without overlapping labels', () => {
  const planets = Array.from({length: 13}, (_, index) => ({key: `body${index}`, longitude: 359.9, retrograde: index % 2 === 0}));
  const arranged = verifyLayout(planets);
  arranged.forEach((planet, index) => close(distance(planet.displayLongitude, 359.9 + (index - 6) * 9), 0));
});

test('well-spaced positions are left in place and singleton/empty inputs work', () => {
  const planets = [0, 30, 90, 120, 180, 210, 270, 330].map((longitude, index) => ({key: `${index}`, longitude}));
  verifyLayout(planets).forEach((planet, index) => close(distance(planet.displayLongitude, planets[index].longitude), 0));
  assert.deepEqual(arrangePlanetLabels([]), []);
  const source = {key: 'sun', longitude: 725.2};
  const single = arrangePlanetLabels([source])[0];
  close(single.displayLongitude, 5.2);
  assert.equal(single.longitude, 725.2);
  assert.notEqual(single, source);
});

test('tight full-circle layouts also enforce the final-to-first gap', () => {
  verifyLayout(Array.from({length: 13}, (_, index) => ({key: `${index}`, longitude: index * 23.4})), 27);
  verifyLayout(Array.from({length: 13}, (_, index) => ({key: `${index}`, longitude: index % 3})), 360 / 13);
});

test('deterministically generated sparse, dense and wrap layouts remain robust', () => {
  let seed = 0x5eedc0de;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  for (let iteration = 0; iteration < 1200; iteration++) {
    const count = 2 + Math.floor(random() * 12);
    const centre = random() * 360;
    const spread = iteration % 3 === 0 ? 4 : iteration % 3 === 1 ? 100 : 360;
    const planets = Array.from({length: count}, (_, index) => ({key: `p${index}`, longitude: centre + (random() - 0.5) * spread}));
    const gap = iteration % 4 === 0 ? (360 / count) * 0.97 : 9;
    verifyLayout(planets, gap);
  }
});

test('invalid numerical inputs and impossible packing are rejected explicitly', () => {
  assert.throws(() => pointForLongitude(NaN, 0, 100), TypeError);
  assert.throws(() => pointForLongitude(0, Infinity, 100), TypeError);
  assert.throws(() => pointForLongitude(0, 0, -1), RangeError);
  assert.throws(() => circularMidpoint(0, Infinity), TypeError);
  assert.throws(() => arrangePlanetLabels(null), TypeError);
  assert.throws(() => arrangePlanetLabels([{longitude: NaN}]), TypeError);
  assert.throws(() => arrangePlanetLabels([{longitude: 0}], 0), RangeError);
  assert.throws(() => arrangePlanetLabels(Array.from({length: 13}, () => ({longitude: 0})), 30), RangeError);
});
