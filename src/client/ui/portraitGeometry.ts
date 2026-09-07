type Eye = readonly [x: number, y: number, radiusX: number, radiusY: number]
type Mount = readonly [x: number, y: number, width: number, angle: number]
type Headset = readonly [left: number, right: number, earY: number, topY: number]

export interface AccessoryFit {
  eyes: readonly Eye[]
  hat: Mount
  headset: Headset
  neck: Mount
}

interface PortraitLandmarks extends AccessoryFit { crop: readonly [number, number] }

// Landmarks measured on the 1024 x 1536 artwork, in atlas pixels. Keeping the
// eyes separate preserves perspective, different eye sizes and Blinky's one eye.
// Hat y is the contact line with the hair; neck y sits below the chin.
const PORTRAITS: readonly PortraitLandmarks[] = [
  { crop:[24,201], eyes:[[103,336,21,21],[153,325,24,22]], hat:[121,254,133,-10], headset:[52,191,348,218], neck:[145,435,72,-8] }, // Ace
  { crop:[228,201], eyes:[[303,350,21,22],[353,338,24,22]], hat:[328,267,132,-12], headset:[261,389,354,226], neck:[334,425,64,-12] }, // Ruby
  { crop:[425,200], eyes:[[479,344,29,36],[550,349,31,37]], hat:[519,275,110,2], headset:[454,594,358,225], neck:[523,425,81,0] }, // Pebble
  { crop:[622,200], eyes:[[715,325,27,29],[768,341,22,25]], hat:[735,282,118,10], headset:[663,793,352,259], neck:[741,421,70,8] }, // Gizmo
  { crop:[812,200], eyes:[[889,334,26,23],[944,344,22,21]], hat:[910,263,141,8], headset:[845,976,354,227], neck:[916,429,73,8] }, // Silver
  { crop:[17,486], eyes:[[78,614,30,35],[141,620,32,35]], hat:[112,561,150,4], headset:[42,188,627,515], neck:[113,709,92,0] }, // Fuzz
  { crop:[222,486], eyes:[[318,617,25,33],[365,632,21,30]], hat:[339,559,108,13], headset:[279,391,647,531], neck:[324,706,71,10] }, // Wisp
  { crop:[418,486], eyes:[[493,623,21,20],[538,612,23,21]], hat:[519,553,145,-10], headset:[460,580,638,513], neck:[520,722,66,-8] }, // Nova
  { crop:[614,486], eyes:[[670,622,27,36],[735,617,29,37]], hat:[709,566,137,-3], headset:[641,783,631,524], neck:[711,718,68,-3] }, // Bolt
  { crop:[809,486], eyes:[[852,615,28,35],[918,621,33,35]], hat:[895,559,156,4], headset:[833,972,637,530], neck:[890,712,87,3] }, // Splash
  { crop:[14,785], eyes:[[108,906,23,21],[150,909,21,20]], hat:[117,850,139,4], headset:[52,182,924,805], neck:[119,1017,74,5] }, // Rusty
  { crop:[214,785], eyes:[[266,916,21,21],[316,911,24,21]], hat:[313,847,137,-8], headset:[249,382,932,810], neck:[301,1015,67,-8] }, // Luna
  { crop:[416,785], eyes:[[450,919,18,28],[518,929,32,34]], hat:[508,862,103,8], headset:[443,576,943,824], neck:[507,1011,78,8] }, // Ember
  { crop:[611,785], eyes:[[704,916,39,42]], hat:[704,857,133,0], headset:[641,784,948,825], neck:[704,1010,80,0] }, // Blinky
  { crop:[808,785], eyes:[[859,910,21,20],[903,912,23,21]], hat:[891,847,142,0], headset:[833,975,937,810], neck:[894,1018,77,0] }, // Cosmo
  { crop:[11,1086], eyes:[[116,1221,23,20],[165,1227,20,20]], hat:[128,1165,139,6], headset:[61,187,1243,1118], neck:[128,1320,70,7] }, // Jade
  { crop:[212,1086], eyes:[[305,1230,20,20],[352,1239,18,20]], hat:[314,1177,137,12], headset:[251,379,1252,1140], neck:[315,1320,65,10] }, // Pixie
  { crop:[414,1086], eyes:[[490,1246,25,30],[543,1248,25,29]], hat:[516,1158,110,0], headset:[444,582,1268,1110], neck:[514,1316,76,0] }, // Mochi
  { crop:[610,1086], eyes:[[659,1228,23,29],[724,1228,26,30]], hat:[697,1161,124,0], headset:[629,769,1264,1140], neck:[698,1316,75,0] }, // Onyx
  { crop:[807,1086], eyes:[[873,1221,24,23],[917,1218,26,24]], hat:[901,1150,150,-5], headset:[837,970,1240,1110], neck:[898,1320,70,-4] } // Milo
]

export function portraitGeometry(index: number): { crop: readonly [number, number]; fit: AccessoryFit } {
  const portrait = PORTRAITS[index]!
  const [x, y] = portrait.crop
  const px = (value: number) => (value - x) / 204 * 100
  const py = (value: number) => (value - y) / 264 * 100
  const mount = ([cx, cy, width, angle]: Mount): Mount => [px(cx), py(cy), width / 204 * 100, angle]
  const [left, right, earY, topY] = portrait.headset
  return {
    crop: portrait.crop,
    fit: {
      eyes: portrait.eyes.map(([cx, cy, rx, ry]) => [px(cx), py(cy), rx / 204 * 100, ry / 264 * 100]),
      hat: mount(portrait.hat),
      headset: [px(left), px(right), py(earY), py(topY)],
      neck: mount(portrait.neck)
    }
  }
}
