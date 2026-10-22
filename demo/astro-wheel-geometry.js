// Pure geometry for a chart calculated by the local ephemeris. These helpers
// reposition labels only; a planet's actual longitude is never changed.
const FULL_CIRCLE = 360;

function finite(value, label) {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be a finite number.`);
  return value;
}

function normalize(longitude) {
  return ((longitude % FULL_CIRCLE) + FULL_CIRCLE) % FULL_CIRCLE;
}

/** ASC is left; ASC+90 is bottom; ASC+180 right; ASC+270 top. */
export function pointForLongitude(longitude, ascendant, radius, cx = 450, cy = 450) {
  finite(longitude, 'longitude');
  finite(ascendant, 'ascendant');
  finite(radius, 'radius');
  finite(cx, 'cx');
  finite(cy, 'cy');
  if (radius < 0) throw new RangeError('radius must not be negative.');
  const delta = normalize(normalize(longitude) - normalize(ascendant)) * Math.PI / 180;
  return {x: cx - radius * Math.cos(delta), y: cy + radius * Math.sin(delta)};
}

/** Midpoint of the increasing-longitude arc, including a cusp crossing 0°. */
export function circularMidpoint(start, end) {
  finite(start, 'start');
  finite(end, 'end');
  const first = normalize(start);
  return normalize(first + normalize(normalize(end) - first) / 2);
}

/**
 * Return fresh objects, in input order, with a non-overlapping displayLongitude.
 * longitude remains the original source value for accurate position markers
 * and leader lines. Equal longitudes keep their stable input order.
 *
 * The circle is cut at its largest natural gap. A pooled-adjacent-violators
 * projection separates labels by minimumGap with least squared displacement
 * on that unwrapped arc. Bounding the projected sequence's range additionally
 * guarantees the last/first gap. This avoids special-case wrap collisions.
 */
export function arrangePlanetLabels(planets, minimumGap = 9) {
  if (!Array.isArray(planets)) throw new TypeError('planets must be an array.');
  finite(minimumGap, 'minimumGap');
  if (minimumGap <= 0) throw new RangeError('minimumGap must be positive.');
  const count = planets.length;
  if (count * minimumGap > FULL_CIRCLE + 1e-9) {
    throw new RangeError('The requested label gaps do not fit on a circle.');
  }
  const sorted = planets.map((planet, index) => {
    if (!planet || typeof planet !== 'object' || Array.isArray(planet)) {
      throw new TypeError('Each planet must be an object with a longitude.');
    }
    finite(planet.longitude, 'planet.longitude');
    return {index, angle: normalize(planet.longitude)};
  }).sort((a, b) => a.angle - b.angle || a.index - b.index);
  if (!count) return [];
  if (count === 1) return [{...planets[0], displayLongitude: sorted[0].angle}];

  let largestGap = -1;
  let startIndex = 0;
  for (let index = 0; index < count; index++) {
    const gap = (index === count - 1 ? sorted[0].angle + FULL_CIRCLE : sorted[index + 1].angle) - sorted[index].angle;
    if (gap > largestGap) {
      largestGap = gap;
      startIndex = (index + 1) % count;
    }
  }
  const ordered = Array.from({length: count}, (_, index) => ({...sorted[(startIndex + index) % count]}));
  for (let index = 1; index < count; index++) {
    while (ordered[index].angle < ordered[index - 1].angle) ordered[index].angle += FULL_CIRCLE;
  }

  // z[i+1] - z[i] >= gap becomes nondecreasing y[i] = z[i] - i*gap.
  const blocks = [];
  for (let index = 0; index < count; index++) {
    const target = ordered[index].angle - index * minimumGap;
    blocks.push({start: index, end: index, total: target, weight: 1, mean: target});
    while (blocks.length > 1 && blocks[blocks.length - 2].mean > blocks[blocks.length - 1].mean) {
      const right = blocks.pop();
      const left = blocks.pop();
      const weight = left.weight + right.weight;
      const total = left.total + right.total;
      blocks.push({start: left.start, end: right.end, total, weight, mean: total / weight});
    }
  }

  // The circular closing gap requires range(y) <= 360 - count*gap.
  const capacity = Math.max(0, FULL_CIRCLE - count * minimumGap);
  let lowerBound = blocks[0].mean;
  if (blocks[blocks.length - 1].mean - lowerBound > capacity) {
    let low = blocks[0].mean - capacity;
    let high = blocks[blocks.length - 1].mean;
    // For a fixed interval [a,a+capacity], clamping PAVA means is the
    // least-squares bounded isotonic solution. Its derivative is monotone.
    for (let step = 0; step < 80; step++) {
      const midpoint = (low + high) / 2;
      let derivative = 0;
      for (const block of blocks) {
        if (block.mean < midpoint) derivative += block.weight * (midpoint - block.mean);
        else if (block.mean > midpoint + capacity) derivative += block.weight * (midpoint + capacity - block.mean);
      }
      if (derivative < 0) low = midpoint;
      else high = midpoint;
    }
    lowerBound = (low + high) / 2;
  }

  const positions = Array(count);
  for (const block of blocks) {
    const level = Math.min(lowerBound + capacity, Math.max(lowerBound, block.mean));
    for (let index = block.start; index <= block.end; index++) {
      positions[ordered[index].index] = normalize(level + index * minimumGap);
    }
  }
  return planets.map((planet, index) => ({...planet, displayLongitude: positions[index]}));
}
