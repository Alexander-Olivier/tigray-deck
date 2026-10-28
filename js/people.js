/* The cast. ring = the side colour drawn around the photo. Photos: Wikimedia Commons, free licences,
   see img/leaders/CREDITS.json. Groups without a person get initials. */
window.PEOPLE = {
  haile_selassie: { name: 'Haile Selassie', role: 'Emperor 1930–74', photo: 'img/leaders/haile_selassie.jpg', flag: 'ethiopia_empire', ring: 'gold' },
  mussolini: { name: 'Mussolini', role: 'Italy 1922–43', photo: 'img/leaders/mussolini.jpg', flag: 'italy', ring: 'oxide' },
  mengistu:  { name: 'Mengistu', role: 'Derg dictator 1977–91', photo: 'img/leaders/mengistu.jpg', flag: 'derg', ring: 'oxide' },
  meles:     { name: 'Meles Zenawi', role: 'TPLF · PM 1995–2012', photo: 'img/leaders/meles.jpg', flag: 'tigray', ring: 'tig' },
  isaias:    { name: 'Isaias Afwerki', role: 'Eritrea since 1991', photo: 'img/leaders/isaias.jpg', flag: 'eritrea', ring: 'eri' },
  abiy:      { name: 'Abiy Ahmed', role: 'Ethiopia PM since 2018', photo: 'img/leaders/abiy.jpg', flag: 'ethiopia', ring: 'fed' },
  debretsion:{ name: 'Debretsion', role: 'TPLF chairman', photo: 'img/leaders/debretsion.jpg', flag: 'tigray', ring: 'tig' },
  getachew:  { name: 'Getachew Reda', role: 'Interim admin. 2023–25', photo: 'img/leaders/getachew.png', flag: 'tigray', ring: 'teal' },
  tplf:      { name: 'TPLF', role: 'Tigrayan forces', initials: 'TPLF', flag: 'tigray', ring: 'tig' },
  eplf:      { name: 'EPLF', role: 'Eritrean guerrilla', initials: 'EPLF', flag: 'eritrea', ring: 'eri' },
  fano:      { name: 'Fano', role: 'Amhara militias', initials: 'FANO', flag: 'amhara_fano', ring: 'amh' },
  tpf:       { name: 'TPF', role: 'anti-TPLF Tigrayans', initials: 'TPF', flag: 'tpf', ring: 'teal' },
  ola:       { name: 'OLA', role: 'Oromo insurgents', initials: 'OLA', flag: 'ola', ring: 'rose' },
  ussr:      { name: 'USSR', role: 'arms + advisers', initials: 'USSR', flag: 'ussr', ring: 'oxide' },
  sisi:      { name: 'el-Sisi', role: 'Egypt', photo: 'img/leaders/sisi.jpg', flag: 'egypt', ring: 'oxide' },
  mbs:       { name: 'Mohammed bin Salman', role: 'Saudi Arabia', photo: 'img/leaders/mbs.jpg', flag: 'saudi', ring: 'lichen' },
  mbz:       { name: 'Mohamed bin Zayed', role: 'UAE', photo: 'img/leaders/mbz.jpg', flag: 'uae', ring: 'gold' },
  erdogan:   { name: 'Erdoğan', role: 'Turkey', photo: 'img/leaders/erdogan.jpg', flag: 'turkey', ring: 'oxide' },
  mojtaba:   { name: 'Mojtaba Khamenei', role: 'Iran, leader since Mar 2026', photo: 'img/leaders/mojtaba.jpg', flag: 'iran', ring: 'lichen' },
  houthi:    { name: 'Abdul-Malik al-Houthi', role: 'Ansar Allah', photo: 'img/leaders/houthi.jpg', flag: 'houthi', ring: 'hou' },
  burhan:    { name: 'al-Burhan', role: 'Sudan army (SAF)', photo: 'img/leaders/burhan.jpg', flag: 'sudan', ring: 'saf' },
  hemedti:   { name: 'Hemedti', role: 'RSF', photo: 'img/leaders/hemedti.jpg', flag: 'rsf', ring: 'rsf' },
  trump:     { name: 'Trump', role: 'United States', photo: 'img/leaders/trump.jpg', flag: 'usa', ring: 'sky' },
  putin:     { name: 'Putin', role: 'Russia', photo: 'img/leaders/putin.jpg', flag: 'russia', ring: 'oxide' },
  xi:        { name: 'Xi Jinping', role: 'China', photo: 'img/leaders/xi.jpg', flag: 'china', ring: 'oxide' },
  kallas:    { name: 'Kaja Kallas', role: 'EU foreign policy', photo: 'img/leaders/kallas.jpg', flag: 'eu', ring: 'sky' },
  guterres:  { name: 'Guterres', role: 'UN Secretary-General', photo: 'img/leaders/guterres.jpg', flag: 'un', ring: 'sky' },
  obasanjo:  { name: 'Obasanjo', role: 'AU mediator', photo: 'img/leaders/obasanjo.jpg', flag: 'au', ring: 'lichen' },
  youssouf:  { name: 'Youssouf', role: 'AU Commission chair', photo: 'img/leaders/youssouf.jpg', flag: 'au', ring: 'lichen' },
  hsm:       { name: 'Hassan Sheikh', role: 'Somalia', photo: 'img/leaders/hsm.jpg', flag: 'somalia', ring: 'sky' },
  unsc:      { name: 'UN Security Council', role: '5 vetoes', initials: 'UNSC', flag: 'un', ring: 'sky' }
};

/* control areas drawn on the map (approximate; clipped to the country so they never spill over borders) */
window.POLYS = {
  houthi:  { clip: 'Yemen', fill: 'hou', coords: [[42.5,17.3],[44.2,17.5],[45.4,17.1],[46.0,16.1],[45.4,15.1],[45.1,14.2],[44.3,13.7],[43.6,13.5],[43.3,12.55],[42.5,12.9],[42.5,17.3]] },
  rsf:     { clip: 'Sudan', fill: 'rsf', coords: [[21.0,20.4],[24.5,20.4],[27.7,20.4],[27.7,14.9],[29.2,13.4],[29.6,11.1],[28.9,9.0],[22.0,9.0],[21.0,12.0],[21.0,20.4]] },
  tdf2021: { clip: 'Ethiopia', fill: 'tig', coords: [[38.9,12.7],[38.5,11.95],[39.15,11.05],[39.45,10.0],[39.95,9.8],[40.15,11.0],[40.5,12.0],[40.3,13.2],[39.9,13.3],[39.55,12.75],[38.9,12.7]] }
};
Object.assign(window.PEOPLE, {
  redwan:  { name: 'Redwan Hussein', role: 'signed for the government', initials: 'RH', flag: 'ethiopia', ring: 'fed' },
  un_old:  { name: 'United Nations', role: 'GA Res. 390(A), 1950', initials: 'UN', flag: 'un', ring: 'sky' },
  uk:      { name: 'Britain', role: '1941 liberation', initials: 'UK', flag: 'uk', ring: 'sky' },
  eprdf:   { name: 'EPRDF', role: 'one ruling party', initials: 'EPRDF', flag: 'ethiopia', ring: 'gold' }
});
Object.assign(window.PEOPLE, {
  menelik:   { name: 'Menelik II', role: 'Emperor 1889–1913', initials: 'M II', flag: 'ethiopia_empire', ring: 'gold' },
  walleligne:{ name: 'Walleligne Makonnen', role: 'student leader, 1969', initials: 'WM', flag: 'ethiopia_empire', ring: 'rose' },
  us_old:    { name: 'United States', role: 'Kagnew base, Asmara', initials: 'US', flag: 'usa', ring: 'sky' },
  olf:       { name: 'OLF', role: 'left the government, 1992', initials: 'OLF', flag: 'ola', ring: 'rose' },
  israel:    { name: 'Israel', role: 'recognised Somaliland, Dec 2025', initials: 'IL', flag: 'israel', ring: 'sky' },
  somaliland:{ name: 'Somaliland', role: 'de facto state since 1991', initials: 'SL', flag: 'somaliland', ring: 'gold' },
  eebc:      { name: 'Border Commission', role: '"final and binding", 2002', initials: 'EEBC', flag: 'un', ring: 'sky' }
});
