const radixForm = document.querySelector("#radix-form");
const signTitle = document.querySelector("#sign-title");
const signCopy = document.querySelector("#sign-copy");
const sunSignBadge = document.querySelector("#sun-sign-badge");
const ascendantBadge = document.querySelector("#ascendant-badge");
const mcBadge = document.querySelector("#mc-badge");
const locationBadge = document.querySelector("#location-badge");
const statusBox = document.querySelector("#status-box");
const chartPaper = document.querySelector("#chart-paper");
const chartPlaceholder = document.querySelector("#chart-placeholder");
const chartMeta = document.querySelector("#chart-meta");
const aspectList = document.querySelector("#aspect-list");
const aspectPlaceholder = document.querySelector("#aspect-placeholder");
const angleSummary = document.querySelector("#angle-summary");
const planetList = document.querySelector("#planet-list");
const houseList = document.querySelector("#house-list");
const birthDaySelect = document.querySelector("#birth-day");
const birthMonthSelect = document.querySelector("#birth-month");
const birthYearInput = document.querySelector("#birth-year");
const birthTimeInput = document.querySelector("#birth-time");

const monthNames = [
  "Januar",
  "Februar",
  "Marcius",
  "Aprilis",
  "Majus",
  "Junius",
  "Julius",
  "Augusztus",
  "Szeptember",
  "Oktober",
  "November",
  "December"
];

const zodiacSigns = [
  {
    key: "Aries",
    label: "Kos",
    inText: "Kosban",
    tone: "kezdemenyezo, egyenes es bator hangon",
    quick: "gyorsan lep, indit es szereti az oszinte mozdulatokat"
  },
  {
    key: "Taurus",
    label: "Bika",
    inText: "Bikaban",
    tone: "stabil, erzeki es epito modon",
    quick: "biztonsagot, ritmust es kezzelfoghato minoseget keres"
  },
  {
    key: "Gemini",
    label: "Ikrek",
    inText: "Ikrekben",
    tone: "mozgekony, kivancsi es kapcsolodo modon",
    quick: "beszelget, osszekot es gyorsan tanul"
  },
  {
    key: "Cancer",
    label: "Rak",
    inText: "Rakban",
    tone: "erzekeny, gondoskodo es belso radarbol mukodo stilusban",
    quick: "erzelmi biztonsagot epitenek, es finoman hangolodik masokra"
  },
  {
    key: "Leo",
    label: "Oroszlan",
    inText: "Oroszlanban",
    tone: "szivkozpontu, kreativ es lathato modon",
    quick: "szeret ragyogni, alkotni es melegen jelen lenni"
  },
  {
    key: "Virgo",
    label: "Szuz",
    inText: "Szuzben",
    tone: "reszletekre figyelo, rendezett es szolgalo modon",
    quick: "pontosit, rendszerez es hasznossa akar tenni a dolgokat"
  },
  {
    key: "Libra",
    label: "Merleg",
    inText: "Merlegben",
    tone: "kapcsolati intelligenciaval, szepseg-erzekkel es egyensulyra torekedve",
    quick: "egyeztet, finomit es a kapcsolatok minoseget figyeli"
  },
  {
    key: "Scorpio",
    label: "Skorpio",
    inText: "Skorpioban",
    tone: "mely, intenziv es atalakulast kereso modon",
    quick: "a lenyeget kutatja, es nem elegszik meg a felszinnel"
  },
  {
    key: "Sagittarius",
    label: "Nyilas",
    inText: "Nyilasban",
    tone: "tag, ertelmet kereso es lelkes modon",
    quick: "iranyt keres, tavlatokat nyit es inspiralodni akar"
  },
  {
    key: "Capricorn",
    label: "Bak",
    inText: "Bakban",
    tone: "fegyelmezetten, celorientaltan es osszeszedetten",
    quick: "felelosseget vallal, epitkezik es hosszabb tavra gondolkodik"
  },
  {
    key: "Aquarius",
    label: "Vizonto",
    inText: "Vizontoben",
    tone: "szabad, eredeti es jovo-fele figyelo modon",
    quick: "uj nezopontokat hoz, es nem szeret szuk keretek kozott maradni"
  },
  {
    key: "Pisces",
    label: "Halak",
    inText: "Halakban",
    tone: "intuicional, atfogoan es erzekenyen",
    quick: "sejt, aterez es konnyen kapcsolodik a lathatatlan retegekhez"
  }
];

const planetLabels = {
  sun: "Nap",
  moon: "Hold",
  mercury: "Merkur",
  venus: "Venusz",
  mars: "Mars",
  jupiter: "Jupiter",
  saturn: "Szaturnusz",
  uranus: "Uranusz",
  neptune: "Neptunusz",
  pluto: "Pluto",
  chiron: "Chiron",
  northnode: "Felszallo holdcsomo",
  lilith: "Lilith"
};

const planetThemes = {
  sun: "az identitas, az onkifejezes es az eletero kozeppontja",
  moon: "az erzelmi reakciok, a biztonsagerzet es a belso ritmus terulete",
  mercury: "a gondolkodas, a kommunikacio es a tanulasi stilus terulete",
  venus: "a kapcsolodas, az ertekek es a vonzalom mintazata",
  mars: "az akarat, a cselekves es a hatarhuzas modja",
  jupiter: "a novekedes, hit es lehetoseglatas terulete",
  saturn: "a felelosseg, struktura es erettseg mintaja",
  uranus: "a szabadsag, ujitas es kiszabadulas igenye",
  neptune: "az intuicio, kepzelet es feloldodas retege",
  pluto: "a mely atalakulasi ero es a belso intenzitas",
  chiron: "az erzekeny pont, ahol gyogyulas es tudatossag szulethet",
  northnode: "az a fejlodesi irany, amerre a keplet huz",
  lilith: "az osztonos, szabad es nehezen megszeliditheto reteg"
};

const houseThemes = {
  1: {
    label: "1. haz",
    focus: "onkep, megjelenes, inditas es az elso benyomas"
  },
  2: {
    label: "2. haz",
    focus: "ertekek, anyagi vilag, onbecsules es biztonsag"
  },
  3: {
    label: "3. haz",
    focus: "kommunikacio, tanulas, testveri dinamika es a kozvetlen kornyezet"
  },
  4: {
    label: "4. haz",
    focus: "otthon, gyokerek, belso biztonsag es csaladi mintak"
  },
  5: {
    label: "5. haz",
    focus: "kreativitas, orom, onkifejezes, szerelem es jatek"
  },
  6: {
    label: "6. haz",
    focus: "mindennapi rutin, munka, testtudat es szolgalo jelenlet"
  },
  7: {
    label: "7. haz",
    focus: "parkapcsolat, egyuttmukodes, tukrok es szovetsegek"
  },
  8: {
    label: "8. haz",
    focus: "melysegek, intimitas, kozos eroforrasok es atalakulasi folyamatok"
  },
  9: {
    label: "9. haz",
    focus: "hit, vilagnezet, utazas, ertelmezes es tavlatok"
  },
  10: {
    label: "10. haz",
    focus: "hivatas, lathatosag, celok es tarsadalmi szerep"
  },
  11: {
    label: "11. haz",
    focus: "kozossegek, jovo, halos kapcsolodasok es kozos ugyek"
  },
  12: {
    label: "12. haz",
    focus: "visszavonulas, belso vilag, spiritualis reteg es elengedes"
  }
};

const aspectLabels = {
  conjunction: {
    label: "egyuttallas",
    meaning: "a ket tema egy pontba surusodik, es nagyon eros hangsulyt kap"
  },
  sextile: {
    label: "szextil",
    meaning: "konnyebben aramlo, tamogato kapcsolat a ket terulet kozott"
  },
  square: {
    label: "kvadrat",
    meaning: "feszultseg, ami mozdulast, fejlodest es tudatositast ker"
  },
  trine: {
    label: "trigon",
    meaning: "termeszetesebb aramlas, tehetseg vagy konnyebb osszhang"
  },
  opposition: {
    label: "oppozicio",
    meaning: "ket polus feszulo tukre, amely egyensulyt keres"
  }
};

const houseSystemLabels = {
  placidus: "Placidus",
  "whole-sign": "Whole Sign",
  "equal-house": "Equal House"
};

const chartPointMap = {
  sun: "Sun",
  moon: "Moon",
  mercury: "Mercury",
  venus: "Venus",
  mars: "Mars",
  jupiter: "Jupiter",
  saturn: "Saturn",
  uranus: "Uranus",
  neptune: "Neptune",
  pluto: "Pluto",
  chiron: "Chiron",
  northnode: "NNode",
  lilith: "Lilith"
};

const bodyOrder = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "chiron"
];

const pointOrder = ["northnode", "lilith"];

function populateDateInputs() {
  const dayOptions = ['<option value="">Nap</option>'];
  const monthOptions = ['<option value="">Honap</option>'];

  for (let day = 1; day <= 31; day += 1) {
    dayOptions.push(`<option value="${day}">${day}</option>`);
  }

  monthNames.forEach((month, index) => {
    monthOptions.push(`<option value="${index + 1}">${month}</option>`);
  });

  birthDaySelect.innerHTML = dayOptions.join("");
  birthMonthSelect.innerHTML = monthOptions.join("");
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function normalizeDegree(value) {
  return ((Number(value) % 360) + 360) % 360;
}

function formatDegreeInSign(decimalDegree) {
  const normalized = normalizeDegree(decimalDegree) % 30;
  let degrees = Math.floor(normalized);
  let minutes = Math.round((normalized - degrees) * 60);

  if (minutes === 60) {
    degrees += 1;
    minutes = 0;
  }

  if (degrees === 30) {
    degrees = 0;
  }

  return `${degrees}° ${pad2(minutes)}'`;
}

function getSignFromDegree(decimalDegree) {
  const normalized = normalizeDegree(decimalDegree);
  const index = Math.floor(normalized / 30);
  return zodiacSigns[index] || zodiacSigns[0];
}

function buildDisplayName(place) {
  const parts = [place.name];

  if (place.admin1 && place.admin1 !== place.name) {
    parts.push(place.admin1);
  }

  if (place.country) {
    parts.push(place.country);
  }

  return parts.join(", ");
}

async function geocodeCity(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city
  )}&count=5&language=hu&format=json`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });

  if (!response.ok) {
    throw new Error("A helyszin keresese most nem erheto el.");
  }

  const data = await response.json();
  const [place] = data.results || [];

  if (!place) {
    throw new Error("Nem talaltam ilyen szuletesi helyet. Probald varos, megye vagy orszag megadasaval.");
  }

  return place;
}

function validateBirthDate(day, month, year) {
  if (!day || !month || !year) {
    throw new Error("A pontos keplethez nap, honap es ev is szukseges.");
  }

  const testDate = new Date(year, month - 1, day);
  const isValidDate =
    testDate.getFullYear() === year &&
    testDate.getMonth() === month - 1 &&
    testDate.getDate() === day;

  if (!isValidDate) {
    throw new Error("A megadott szuletesi datum nem ervenyes.");
  }
}

function getHoroscopeLibrary() {
  const library = window.CircularNatalHoroscope;

  if (!library?.Origin || !library?.Horoscope) {
    throw new Error("A horoszkop-szamolo konyvtar nem toltodott be.");
  }

  return library;
}

function getAstroChartLibrary() {
  const library = window.astrochart;

  if (!library?.Chart) {
    throw new Error("A chart-rajzolo konyvtar nem toltodott be.");
  }

  return library;
}

function degreeInRange(degree, start, end) {
  if (start <= end) {
    return degree >= start && degree < end;
  }

  return degree >= start || degree < end;
}

function findHouseNumberByDegree(degree, cuspDegrees) {
  for (let index = 0; index < cuspDegrees.length; index += 1) {
    const start = cuspDegrees[index];
    const end = cuspDegrees[(index + 1) % cuspDegrees.length];

    if (degreeInRange(degree, start, end)) {
      return index + 1;
    }
  }

  return 12;
}

function createSummaryItem(title, copy) {
  const wrapper = document.createElement("article");
  wrapper.className = "summary-item";

  const heading = document.createElement("h3");
  heading.textContent = title;

  const paragraph = document.createElement("p");
  paragraph.textContent = copy;

  wrapper.append(heading, paragraph);
  return wrapper;
}

function createPill(text) {
  const pill = document.createElement("span");
  pill.className = "pill";
  pill.textContent = text;
  return pill;
}

function clearDynamicAreas() {
  chartPaper.innerHTML = "";
  chartPaper.classList.add("hidden");
  chartPlaceholder.classList.remove("hidden");

  aspectList.innerHTML = "";
  aspectList.classList.add("hidden");
  aspectPlaceholder.classList.remove("hidden");

  angleSummary.innerHTML = "";
  angleSummary.textContent = "A Nap, az aszcendens es az MC rovid osszefoglaloja itt jelenik meg.";

  planetList.innerHTML = "";
  planetList.textContent = "Itt jelennek meg a bolygok jegyei, hazai es rovid kulcsmondatuk.";

  houseList.innerHTML = "";
  houseList.textContent = "A hazak rovid jelentese es a bennuk allo bolygok itt jelennek meg.";
}

function buildBodyPlacements(horoscope) {
  const cuspDegrees = horoscope.Houses.map((house) =>
    normalizeDegree(house.ChartPosition.StartPosition.Ecliptic.DecimalDegrees)
  );

  return horoscope.CelestialBodies.all
    .filter((body) => bodyOrder.includes(body.key))
    .sort((left, right) => bodyOrder.indexOf(left.key) - bodyOrder.indexOf(right.key))
    .map((body) => {
      const degree = normalizeDegree(body.ChartPosition.Ecliptic.DecimalDegrees);
      const sign = getSignFromDegree(degree);
      const houseNumber = body.House?.id || findHouseNumberByDegree(degree, cuspDegrees);

      return {
        key: body.key,
        label: planetLabels[body.key] || body.label || body.key,
        degree,
        sign,
        houseNumber,
        retrograde: Boolean(body.isRetrograde)
      };
    });
}

function buildPointPlacements(horoscope, cuspDegrees) {
  return horoscope.CelestialPoints.all
    .filter((point) => pointOrder.includes(point.key))
    .sort((left, right) => pointOrder.indexOf(left.key) - pointOrder.indexOf(right.key))
    .map((point) => {
      const degree = normalizeDegree(point.ChartPosition.Ecliptic.DecimalDegrees);
      const sign = getSignFromDegree(degree);
      const houseNumber = point.House?.id || findHouseNumberByDegree(degree, cuspDegrees);

      return {
        key: point.key,
        label: planetLabels[point.key] || point.label || point.key,
        degree,
        sign,
        houseNumber,
        retrograde: false
      };
    });
}

function createChartData(bodyPlacements, pointPlacements, cuspDegrees) {
  const planets = {};

  [...bodyPlacements, ...pointPlacements].forEach((placement) => {
    const chartKey = chartPointMap[placement.key];

    if (!chartKey) {
      return;
    }

    planets[chartKey] = [placement.degree, placement.retrograde ? -1 : 1];
  });

  return {
    planets,
    cusps: cuspDegrees
  };
}

function renderChart(bodyPlacements, pointPlacements, cuspDegrees) {
  const { Chart } = getAstroChartLibrary();
  const hostWidth = chartPaper.parentElement?.clientWidth || 680;
  const size = Math.max(320, Math.min(720, hostWidth - 28));
  const symbolScale = size < 430 ? 0.74 : size < 560 ? 0.88 : 1;

  chartPaper.innerHTML = "";
  chartPaper.classList.remove("hidden");
  chartPlaceholder.classList.add("hidden");

  const chart = new Chart("chart-paper", size, size, {
    MARGIN: 44,
    SYMBOL_SCALE: symbolScale,
    COLOR_BACKGROUND: "transparent",
    POINTS_COLOR: "#f6f0e5",
    SIGNS_COLOR: "#f6f0e5",
    CIRCLE_COLOR: "#d8b06d",
    LINE_COLOR: "#7ea8b7",
    CUSPS_FONT_COLOR: "#f2d8ac",
    SYMBOL_AXIS_FONT_COLOR: "#f6f0e5",
    COLORS_SIGNS: [
      "#d8b06d",
      "#c58c6b",
      "#7ec7d8",
      "#86c6b2",
      "#f0c36c",
      "#f4d7ab",
      "#9fd1de",
      "#cc8d8d",
      "#d5a85e",
      "#baa46d",
      "#8ec6e1",
      "#8ec2ae"
    ]
  });

  chart.radix(createChartData(bodyPlacements, pointPlacements, cuspDegrees));
}

function renderAngleSummary(sunPlacement, ascSign, mcSign) {
  angleSummary.innerHTML = "";
  angleSummary.append(
    createSummaryItem(
      "Nap",
      `${sunPlacement.label} ${sunPlacement.sign.inText}, a ${sunPlacement.houseNumber}. hazban: ${planetThemes[sunPlacement.key]} ${sunPlacement.sign.tone}, es eros hangsulyt kap nala ${houseThemes[sunPlacement.houseNumber].focus}.`
    ),
    createSummaryItem(
      "Aszcendens",
      `${ascSign.label}: ez adja az elso benyomast, a kulso stilust es azt, hogyan nyitsz az elet fele. Itt ${ascSign.quick}.`
    ),
    createSummaryItem(
      "MC",
      `${mcSign.label}: a hivatasi irany, a lathatosag es a kulvilag fele mutatott ambicio ezen a hangon keresztul jelenik meg. Itt ${mcSign.quick}.`
    )
  );
}

function renderPlanetSummary(placements) {
  planetList.innerHTML = "";

  placements.forEach((placement) => {
    const retroText = placement.retrograde
      ? " Retrograd szinezet is latszik, ezert ez a tema inkabb belso feldolgozassal erik."
      : "";

    planetList.append(
      createSummaryItem(
        `${placement.label} · ${placement.sign.label} · ${placement.houseNumber}. haz`,
        `${placement.label} ${placement.sign.inText}, a ${placement.houseNumber}. hazban all: ${planetThemes[placement.key]} ${placement.sign.tone}, es foleg ${houseThemes[placement.houseNumber].focus} teren ker hangsulyt.${retroText}`
      )
    );
  });
}

function renderAspectSummary(aspects) {
  aspectList.innerHTML = "";

  if (!aspects.length) {
    aspectPlaceholder.textContent = "Most nem jelent meg kiemelt major fényszög a fo pontok kozott.";
    aspectPlaceholder.classList.remove("hidden");
    aspectList.classList.add("hidden");
    return;
  }

  aspects.forEach((aspect) => {
    const wrapper = document.createElement("article");
    wrapper.className = "insight-item";

    const title = document.createElement("h3");
    title.textContent = `${aspect.leftLabel} ${aspect.aspectLabel} ${aspect.rightLabel}`;

    const copy = document.createElement("p");
    copy.textContent = `${aspect.leftLabel} es ${aspect.rightLabel} kozott ${aspect.aspectMeaning}; az orbisz kb. ${aspect.orb.toFixed(
      1
    )}°.`;

    wrapper.append(title, copy);
    aspectList.append(wrapper);
  });

  aspectPlaceholder.classList.add("hidden");
  aspectList.classList.remove("hidden");
}

function renderHouseSummary(cuspDegrees, placements) {
  houseList.innerHTML = "";

  cuspDegrees.forEach((degree, index) => {
    const houseNumber = index + 1;
    const sign = getSignFromDegree(degree);
    const occupants = placements.filter((placement) => placement.houseNumber === houseNumber);
    const card = document.createElement("article");
    card.className = "house-card";

    const top = document.createElement("div");
    top.className = "house-top";

    const title = document.createElement("h3");
    title.textContent = `${houseNumber}. haz`;

    const cusp = document.createElement("span");
    cusp.className = "house-cusp";
    cusp.textContent = `${sign.label} ${formatDegreeInSign(degree)}`;

    top.append(title, cusp);

    const copy = document.createElement("p");
    copy.textContent = `${houseThemes[houseNumber].focus}. A kuszp ${sign.inText} all, ezert ez a haz ${sign.tone} kap hangsulyt.`;

    const pills = document.createElement("div");
    pills.className = "pill-row";

    if (occupants.length) {
      occupants.forEach((placement) => {
        pills.append(createPill(placement.label));
      });
    } else {
      pills.append(createPill("Jelenleg nincs benne fo bolygo"));
    }

    card.append(top, copy, pills);
    houseList.append(card);
  });
}

function buildAspectInsights(horoscope) {
  return horoscope.Aspects.all
    .filter((aspect) => aspectLabels[aspect.aspectKey])
    .filter((aspect) => planetLabels[aspect.point1Key] && planetLabels[aspect.point2Key])
    .sort((left, right) => left.orb - right.orb)
    .slice(0, 6)
    .map((aspect) => ({
      leftLabel: planetLabels[aspect.point1Key],
      rightLabel: planetLabels[aspect.point2Key],
      aspectLabel: aspectLabels[aspect.aspectKey].label,
      aspectMeaning: aspectLabels[aspect.aspectKey].meaning,
      orb: aspect.orb
    }));
}

function updateHeroSummary(name, placeLabel, sunPlacement, ascSign, mcSign, houseSystem) {
  signTitle.textContent = name ? `${name} keplete elkeszult.` : "A kepleted elkeszult.";
  signCopy.textContent = `${sunPlacement.sign.label} adja az alaphangot, kifele eros ${ascSign.label} karakter mutatkozik, a hivatasi tengely pedig ${mcSign.label} szinezetet kap. A hazak a ${houseSystemLabels[houseSystem]} rendszerben keszultek.`;
  sunSignBadge.textContent = `Napjegy: ${sunPlacement.sign.label}`;
  ascendantBadge.textContent = `Aszcendens: ${ascSign.label}`;
  mcBadge.textContent = `MC: ${mcSign.label}`;
  locationBadge.textContent = `Hely: ${placeLabel}`;
  chartMeta.textContent = `Tropical zodiac · ${houseSystemLabels[houseSystem]}`;
}

function getFormValues() {
  const formData = new FormData(radixForm);
  const name = String(formData.get("full-name") || "").trim();
  const day = Number(formData.get("birth-day") || 0);
  const month = Number(formData.get("birth-month") || 0);
  const year = Number(formData.get("birth-year") || 0);
  const time = String(formData.get("birth-time") || "");
  const city = String(formData.get("birth-city") || "").trim();
  const houseSystem = String(formData.get("house-system") || "placidus");

  validateBirthDate(day, month, year);

  if (!time) {
    throw new Error("A pontos radixhoz szuletesi ido is szukseges.");
  }

  if (!city) {
    throw new Error("A szuletesi helyet is meg kell adni a szamitashoz.");
  }

  const [hour, minute] = time.split(":").map(Number);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new Error("A szuletesi ido formatuma nem megfelelo.");
  }

  return {
    name,
    day,
    month,
    year,
    hour,
    minute,
    city,
    houseSystem
  };
}

async function calculateRadix(values) {
  const { Origin, Horoscope } = getHoroscopeLibrary();
  const place = await geocodeCity(values.city);
  const origin = new Origin({
    year: values.year,
    month: values.month - 1,
    date: values.day,
    hour: values.hour,
    minute: values.minute,
    second: 0,
    latitude: place.latitude,
    longitude: place.longitude
  });

  const horoscope = new Horoscope({
    origin,
    houseSystem: values.houseSystem,
    zodiac: "tropical",
    aspectPoints: ["bodies", "angles"],
    aspectWithPoints: ["bodies", "angles"],
    aspectTypes: ["major"],
    language: "en"
  });

  return {
    place,
    horoscope
  };
}

function primeDefaultInputs() {
  populateDateInputs();

  const today = new Date();
  birthDaySelect.value = String(today.getDate());
  birthMonthSelect.value = String(today.getMonth() + 1);
  birthYearInput.value = String(today.getFullYear() - 28);

  if (birthTimeInput && !birthTimeInput.value) {
    birthTimeInput.value = "12:00";
  }
}

primeDefaultInputs();

radixForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearDynamicAreas();

  try {
    const values = getFormValues();

    statusBox.textContent = "A szuletesi hely keresese folyamatban van...";

    const { place, horoscope } = await calculateRadix(values);
    const placeLabel = buildDisplayName(place);
    const cuspDegrees = horoscope.Houses.map((house) =>
      normalizeDegree(house.ChartPosition.StartPosition.Ecliptic.DecimalDegrees)
    );
    const bodyPlacements = buildBodyPlacements(horoscope);
    const pointPlacements = buildPointPlacements(horoscope, cuspDegrees);
    const allPlacements = [...bodyPlacements, ...pointPlacements];
    const sunPlacement = bodyPlacements.find((body) => body.key === "sun");
    const ascSign = getSignFromDegree(horoscope.Ascendant.ChartPosition.Ecliptic.DecimalDegrees);
    const mcSign = getSignFromDegree(horoscope.Midheaven.ChartPosition.Ecliptic.DecimalDegrees);

    if (!sunPlacement) {
      throw new Error("A Nap helyzetet most nem sikerult kiolvasni a kepletbol.");
    }

    updateHeroSummary(values.name, placeLabel, sunPlacement, ascSign, mcSign, values.houseSystem);
    statusBox.textContent = "A keplet kiszamolt, most rajzolom a radixot es a rovid ertelmezest.";

    renderChart(bodyPlacements, pointPlacements, cuspDegrees);
    renderAngleSummary(sunPlacement, ascSign, mcSign);
    renderPlanetSummary(bodyPlacements);
    renderAspectSummary(buildAspectInsights(horoscope));
    renderHouseSummary(cuspDegrees, allPlacements);

    statusBox.textContent = "A radix, a hazak es a fo hangsulyok is megjelentek.";
  } catch (error) {
    chartPlaceholder.textContent = "A radixhoz pontos szuletesi adatok es jol felismerheto helyszin szukseges.";
    aspectPlaceholder.textContent = "A fényszogek a sikeres szamitas utan jelennek meg.";
    statusBox.textContent =
      error instanceof Error
        ? error.message
        : "Valami hiba tortent a szamitas kozben. Kérlek probald ujra.";
  }
});
