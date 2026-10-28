/* Places and arrows drawn on the map. Coordinates: OCHA COD-AB Ethiopia v04 where available,
   otherwise approximate town centres (WGS84). */
window.PLACES = {
  cluj:       { name: 'Cluj-Napoca', lon: 23.59, lat: 46.77, color: 'sand', capital: true },
  mekelle:    { name: 'Mekelle', lon: 39.47, lat: 13.48, color: 'ochre', capital: true },
  addis:      { name: 'Addis Ababa', lon: 38.76, lat: 9.01, color: 'sand', capital: true },
  asmara:     { name: 'Asmara', lon: 38.925, lat: 15.323, color: 'sand', capital: true },
  axum:       { name: 'Axum', lon: 38.72, lat: 14.12, color: 'ochre' },
  adwa:       { name: 'Adwa', lon: 38.90, lat: 14.16, color: 'ochre', dy: -14 },
  axumL:      { name: 'Axum', lon: 38.72, lat: 14.12, color: 'ochre', dx: -16 },  // label on the left, for steps that also show Adwa
  shire:      { name: 'Shire', lon: 38.28, lat: 14.10, color: 'ochre', dx: -16 },
  adigrat:    { name: 'Adigrat', lon: 39.47, lat: 14.27, color: 'ochre' },
  zalambessa: { name: 'Zalambessa', lon: 39.39, lat: 14.52, color: 'oxide', dx: -16 },
  idagahamus: { name: 'Idaga Hamus', lon: 39.56, lat: 14.19, color: 'oxide', dy: 16 },
  wukro:      { name: 'Wukro', lon: 39.59, lat: 13.78, color: 'ochre' },
  alamata:    { name: 'Alamata', lon: 39.56, lat: 12.42, color: 'ochre' },
  kobo:       { name: 'Kobo', lon: 39.63, lat: 12.15, color: 'sand' },
  erebti:     { name: 'Erebti', lon: 40.15, lat: 13.14, color: 'sand' },
  tselemti:   { name: 'Tselemti', lon: 38.01, lat: 13.64, color: 'oxide', dx: -16 },
  humera:     { name: 'Humera', lon: 36.62, lat: 14.27, color: 'oxide' },
  maikadra:   { name: 'Mai Kadra', lon: 36.57, lat: 14.0, color: 'oxide', dy: 16 },
  welkait:    { name: 'Welkait', lon: 37.0, lat: 13.6, color: 'oxide' },
  badme:      { name: 'Badme', lon: 37.81, lat: 14.73, color: 'oxide' },
  assab:      { name: 'Assab', lon: 42.739, lat: 13.009, color: 'oxide' },
  djibouti:   { name: 'Djibouti port', lon: 43.145, lat: 11.588, color: 'sand' },
  sekota:     { name: 'Sekota', lon: 39.04, lat: 12.62, color: 'sand', dx: -16 },
  dessie:     { name: 'Dessie', lon: 39.64, lat: 11.14, color: 'sand' },
  debresina:  { name: 'Debre Sina', lon: 39.76, lat: 9.85, color: 'sand' },
  gondar:     { name: 'Gondar', lon: 37.47, lat: 12.6, color: 'sand', dx: -16 }
};

window.ARROWS = {
  // 2020: federal + allied offensive converging on Mekelle
  fed2020:   { from: [38.9, 11.2], to: [39.42, 13.35], color: 'lichen', label: 'Federal army', bend: -.1 },
  eri2020:   { from: [38.6, 15.0], to: [38.75, 14.2], color: 'oxide', label: 'Eritrea', bend: .1 },
  amh2020:   { from: [37.4, 12.8], to: [36.9, 13.8], color: 'oxide', label: 'Amhara forces', bend: .15 },
  // 2021: Tigrayan counter-offensive south
  tdf2021:   { from: [39.5, 13.2], to: [39.76, 10.0], color: 'ochre', label: 'Tigrayan forces, Nov 2021', bend: -.08 },
  // 2026: renewed war
  endfSouth: { from: [39.6, 11.7], to: [39.56, 12.35], color: 'lichen', label: '', bend: .1, width: 5 },
  tdfAfar:   { from: [39.75, 13.3], to: [40.1, 13.15], color: 'ochre', label: '', bend: .2, width: 5 },
  endf2026:  { from: [39.6, 12.5], to: [39.48, 13.4], color: 'lichen', label: 'Federal army', bend: -.12 },
  eri2026:   { from: [39.3, 14.85], to: [39.47, 14.32], color: 'oxide', label: 'Eritrea', bend: .12 },
  endfOct:   { from: [39.48, 13.62], to: [38.98, 14.08], color: 'lichen', label: 'Federal army', bend: .12 },
  // the Red Sea question: Ethiopia looks at Assab
  sea:       { from: [39.3, 11.5], to: [42.6, 13.0], color: 'oxide', dashed: true, label: 'Red Sea access?', bend: -.2, width: 5 },
  // the 1998–2000 border war
  border98:  { from: [38.4, 15.4], to: [37.85, 14.8], color: 'oxide', label: '1998', bend: .2, width: 5 }
};

/* added for the regional scenes (approximate city centres, WGS84) */
Object.assign(window.PLACES, {
  rome:        { name: 'Rome', lon: 12.5, lat: 41.9, color: 'sand', capital: true },
  cairo:       { name: 'Cairo', lon: 31.24, lat: 30.04, color: 'sand', capital: true },
  suez:        { name: 'Suez Canal', lon: 32.55, lat: 30.3, color: 'sky' },
  damietta:    { name: 'Damietta', lon: 31.8, lat: 31.42, color: 'oxide' },
  riyadh:      { name: 'Riyadh', lon: 46.72, lat: 24.71, color: 'sand', capital: true },
  jeddah:      { name: 'Jeddah', lon: 39.17, lat: 21.54, color: 'sand' },
  yanbu:       { name: 'Yanbu', lon: 38.06, lat: 24.09, color: 'gold' },
  rastanura:   { name: 'Ras Tanura', lon: 50.16, lat: 26.64, color: 'oxide' },
  abudhabi:    { name: 'Abu Dhabi', lon: 54.37, lat: 24.45, color: 'sand', capital: true },
  doha:        { name: 'Doha', lon: 51.53, lat: 25.29, color: 'sand', capital: true },
  ankara:      { name: 'Ankara', lon: 32.85, lat: 39.93, color: 'sand', capital: true },
  tehran:      { name: 'Tehran', lon: 51.39, lat: 35.69, color: 'sand', capital: true },
  hormuz:      { name: 'Strait of Hormuz', lon: 56.4, lat: 26.55, color: 'oxide' },
  sanaa:       { name: "Sana'a", lon: 44.21, lat: 15.35, color: 'sand', capital: true },
  hodeidah:    { name: 'Hodeidah', lon: 42.95, lat: 14.8, color: 'sand', dx: -16 },
  mocha:       { name: 'Mocha', lon: 43.25, lat: 13.32, color: 'sand' },
  babelmandeb: { name: 'Bab el-Mandeb', lon: 43.42, lat: 12.62, color: 'oxide' },
  aden:        { name: 'Aden', lon: 45.03, lat: 12.79, color: 'sand' },
  khartoum:    { name: 'Khartoum', lon: 32.53, lat: 15.5, color: 'sand', capital: true },
  portsudan:   { name: 'Port Sudan', lon: 37.22, lat: 19.6, color: 'sand' },
  elfasher:    { name: 'El Fasher', lon: 25.35, lat: 13.63, color: 'oxide' },
  elobeid:     { name: 'El Obeid', lon: 30.22, lat: 13.18, color: 'sand' },
  mogadishu:   { name: 'Mogadishu', lon: 45.34, lat: 2.05, color: 'sand', capital: true },
  berbera:     { name: 'Berbera', lon: 45.03, lat: 10.44, color: 'gold' },
  massawa:     { name: 'Massawa', lon: 39.45, lat: 15.61, color: 'oxide' },
  irob:        { name: 'Irob', lon: 39.62, lat: 14.43, color: 'oxide' },
  bahirdar:    { name: 'Bahir Dar', lon: 37.39, lat: 11.59, color: 'sand', dx: -16 },
  jijiga:      { name: 'Ogaden', lon: 43.2, lat: 7.6, color: 'sand' },
  moscow:      { name: 'Moscow', lon: 37.62, lat: 55.75, color: 'sand', capital: true },
  newyork:     { name: 'New York (UN)', lon: -74, lat: 40.7, color: 'sky' },
  pretoria:    { name: 'Pretoria', lon: 28.19, lat: -25.75, color: 'lichen', capital: true },
  geneva:      { name: 'Geneva', lon: 6.14, lat: 46.2, color: 'sky' },
  gerd:        { name: 'GERD dam', lon: 35.09, lat: 11.21, color: 'sky' },
  hitsats:     { name: 'Hitsats camp', lon: 37.95, lat: 14.3, color: 'oxide' },
  adet:        { name: 'Adet mountains', lon: 38.85, lat: 13.85, color: 'ochre' },
  debresina2:  { name: 'Debre Sina', lon: 39.76, lat: 9.85, color: 'oxide' }
});
Object.assign(window.PLACES, {
  washington: { name: 'Washington', lon: -77.04, lat: 38.9, color: 'sky', capital: true },
  beijing:    { name: 'Beijing', lon: 116.4, lat: 39.9, color: 'oxide', capital: true },
  brussels:   { name: 'Brussels', lon: 4.35, lat: 50.85, color: 'sky', capital: true },
  london:     { name: 'London', lon: -0.12, lat: 51.5, color: 'sand', capital: true },
  hornpt:     { name: '', lon: 40.5, lat: 12.5, color: 'sand' }
});
Object.assign(window.PLACES, {
  mukalla:    { name: 'Mukalla', lon: 49.12, lat: 14.54, color: 'oxide' },
  fashaga:    { name: 'al-Fashaga', lon: 36.25, lat: 13.75, color: 'oxide', dx: -16 },
  telaviv:    { name: 'Israel', lon: 34.78, lat: 32.08, color: 'sky' },
  shewa:      { name: 'Shewa', lon: 39.3, lat: 9.6, color: 'gold' },
  hargeisa:   { name: 'Somaliland', lon: 44.06, lat: 9.56, color: 'gold' },
  gedaref:    { name: 'Gedaref', lon: 35.38, lat: 14.03, color: 'sand' }
});
