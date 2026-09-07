import { findAccessory } from "@shared/accessories.js"
import type { AccessoryFit } from "./portraitGeometry.js"

let nextId = 0
const ICON_FIT: AccessoryFit = {
  eyes: [[27,50,20,21],[73,50,20,21]], hat: [50,88,94,0],
  headset: [13,87,64,17], neck: [50,52,90,0]
}

/** Artwork follows measured portrait landmarks; omitting the fit renders an icon. */
export function buildAccessory(id: string, portrait?: AccessoryFit): SVGSVGElement | null {
  if (!findAccessory(id)) return null
  const fit = portrait ?? ICON_FIT
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  svg.setAttribute("viewBox", "0 0 100 100")
  svg.setAttribute("aria-hidden", "true")
  svg.setAttribute("class", `avatar-accessory accessory--${id}`)
  svg.setAttribute("data-accessory", id)
  svg.setAttribute("data-lens-count", String(fit.eyes.length))
  const key = `acc-${nextId++}`
  const paint = (name: string) => `url(#${key}-${name})`
  const gold = paint("gold"), rose = paint("rose"), ink = paint("ink")
  const velvet = paint("velvet"), teal = paint("teal"), glass = paint("glass")
  const heart = "M0 -9C-9 -23 -24 -17 -22 -5C-20 6 -10 15 0 22C10 15 20 6 22 -5C24 -17 9 -23 0 -9Z"
  const star = "M0 -23L7 -8L23 -6L12 6L15 23L0 15L-15 23L-12 6L-23 -6L-7 -8Z"

  function glasses(): string {
    const diving = id === "snorkel"
    const frame = id === "heart-glasses" || id === "round-glasses" ? rose : diving ? teal : gold
    const edge = id === "heart-glasses" ? 1.12 : id === "star-glasses" ? 1.16 : diving ? 1.1 : 1
    const start = fit.eyes[0]!, end = fit.eyes[fit.eyes.length - 1]!
    // Preserve a bridge even on narrow faces and in the wider novelty frames.
    const scale = start === end ? 1 : Math.min(1, (end[0]-start[0]-2) / ((start[2]+end[2])*edge))
    const eyes = fit.eyes.map(([x,y,rx,ry]) => [x,y,rx*scale,ry*scale] as const)
    const first = eyes[0]!, last = eyes[eyes.length - 1]!
    const angle = first === last ? 0 : Math.atan2(last[1] - first[1], last[0] - first[0]) * 180 / Math.PI
    const lenses = eyes.map(([x,y,rx,ry]) => {
      const shape = id === "heart-glasses" ? heart : id === "star-glasses" ? star : diving
        ? "M-15 -19H15Q22 -19 22 -11V11Q22 20 13 20H-13Q-22 20 -22 11V-11Q-22 -19 -15 -19Z"
        : "M20 0A20 20 0 1 1 -20 0A20 20 0 1 1 20 0Z"
      return `<g class="accessory-lens" transform="translate(${x} ${y}) rotate(${angle}) scale(${rx/20} ${ry/20})">
        <path d="${shape}" fill="none" stroke="#15131bcc" stroke-width="4" stroke-linejoin="round"/>
        <path d="${shape}" fill="${glass}" stroke="${frame}" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M-13 -8Q-10 -13 -5 -14" fill="none" stroke="#fff4df" stroke-opacity=".65" stroke-width="1.2" stroke-linecap="round"/>
      </g>`
    }).join("")
    const [left, right] = fit.headset
    const temples = `<path d="M${first[0]-first[2]} ${first[1]}L${Math.min(left,first[0]-first[2]-2)} ${first[1]-2}M${last[0]+last[2]} ${last[1]}L${Math.max(right,last[0]+last[2]+2)} ${last[1]-2}" fill="none" stroke="${frame}" stroke-width="1.2" stroke-linecap="round"/>`
    const bridge = first === last ? "" : `<path d="M${first[0]+first[2]*.96} ${first[1]}Q${(first[0]+last[0])/2} ${(first[1]+last[1])/2-2.2} ${last[0]-last[2]*.96} ${last[1]}" fill="none" stroke="${frame}" stroke-width="${diving ? 2.2 : 1.3}"/>`
    const tubeX = Math.min(94, Math.max(right+3,last[0]+last[2]+4))
    const tubeY = Math.max(10,last[1]-29)
    const mouthY = Math.min(86, fit.neck[1]-9)
    const tube = diving ? `<path d="M${tubeX} ${tubeY}V${mouthY-7}Q${tubeX} ${mouthY} ${tubeX-7} ${mouthY}H${tubeX-11}" fill="none" stroke="#19292c" stroke-width="4.8" stroke-linecap="round"/><path d="M${tubeX-.4} ${tubeY}V${mouthY-7}Q${tubeX-.4} ${mouthY-1} ${tubeX-7} ${mouthY-1}" fill="none" stroke="${teal}" stroke-width="2.7" stroke-linecap="round"/><path d="M${tubeX-2} ${tubeY+3}H${tubeX+2}" stroke="${gold}" stroke-width="2.1"/><path d="M${tubeX-12} ${mouthY-2}V${mouthY+2}" stroke="#293238" stroke-width="3" stroke-linecap="round"/>` : ""
    return tube + temples + bridge + lenses
  }

  function mounted(markup: string, factor = 1, offsetY = 0): string {
    const [x,y,width,angle] = fit.hat
    return `<g transform="translate(${x} ${y+offsetY}) rotate(${angle}) scale(${width*factor/100}) translate(-50 -82)">${markup}</g>`
  }

  function headphones(): string {
    const [l,r,y,top] = fit.headset
    const mid = (l+r)/2
    const band = `M${l} ${y-2}C${l-1} ${top+11} ${l+7} ${top} ${mid} ${top}C${r-7} ${top} ${r+1} ${top+11} ${r} ${y-2}`
    const cups = [l,r].map((x,i) => `<g transform="translate(${x} ${y}) rotate(${i ? 7 : -7})">
      <rect x="-4.6" y="-10.5" width="9.2" height="21" rx="4" fill="#0b1016"/>
      <rect x="-3.8" y="-9.5" width="7.6" height="19" rx="3.4" fill="${ink}" stroke="${gold}" stroke-width=".8"/>
      <rect x="-2.7" y="-7.8" width="5.4" height="15.6" rx="2.5" fill="${teal}"/>
      <path d="M-1.7 -6V5" stroke="#bce0d5" stroke-opacity=".35" stroke-width=".6"/>
      <path d="M-1.4 1H1.4M-1.4 3H1.4" stroke="#081a20" stroke-opacity=".45" stroke-width=".7"/>
      <circle cy="-10.7" r="1.3" fill="${gold}"/>
    </g>`).join("")
    return `<path d="${band}" fill="none" stroke="#11151c" stroke-width="5.5"/><path d="${band}" fill="none" stroke="${gold}" stroke-width="3.6"/><path d="${band}" fill="none" stroke="${ink}" stroke-width="2.2"/>${cups}`
  }

  function headband(): string {
    const [l,r,,top] = fit.headset
    const mid = (l+r)/2, width = r-l
    const path = `M${l} ${top+31}Q${l-2} ${top-1} ${mid} ${top-1}Q${r+2} ${top-1} ${r} ${top+31}`
    const rim = `<path d="${path}" fill="none" stroke="#2b1c21" stroke-width="2.5"/><path d="${path}" fill="none" stroke="${gold}" stroke-width="1.2"/>`
    return rim + [-1,0,1].map(i => {
      const x = mid+i*width*.26, y = top+Math.abs(i)*3
      return `<path d="M${x} ${y+4}L${x+i} ${y-4}" stroke="${gold}" stroke-width=".9"/><g transform="translate(${x+i} ${y-7}) rotate(${i*12}) scale(.19)"><path d="${heart}" fill="${velvet}" stroke="${rose}" stroke-width="2.8"/><path d="M-13 -7Q-12 -13 -6 -12" fill="none" stroke="#f6c4bf" stroke-width="2" stroke-linecap="round"/></g>`
    }).join("")
  }

  const crown = `<path d="M13 76L9 45L30 58L50 32L70 58L91 45L87 76Z" fill="${gold}" stroke="#5c3a1d" stroke-width="1.8"/><path d="M17 68L15 53L32 66L50 42L68 66L85 53L83 68" fill="none" stroke="#fff0bb" stroke-opacity=".5" stroke-width="1.1"/><path d="M13 75Q50 66 87 75L86 83Q50 90 14 83Z" fill="${gold}" stroke="#674323" stroke-width="1.3"/><path d="M17 78Q50 72 83 78" fill="none" stroke="#fff0bb" stroke-width="1.2"/><path d="M50 52L57 63L50 74L43 63Z" fill="${teal}" stroke="#f7d995" stroke-width="1.4"/><path d="M50 55L50 70L45 63Z" fill="#a4e0c0" opacity=".55"/><g fill="${gold}" stroke="#fae1a2" stroke-width=".9"><circle cx="9" cy="44" r="3.3"/><circle cx="50" cy="31" r="4"/><circle cx="91" cy="44" r="3.3"/></g><g fill="#572e40" stroke="#eed5a1" stroke-width=".8"><ellipse cx="28" cy="72" rx="3" ry="4"/><ellipse cx="72" cy="72" rx="3" ry="4"/></g>`
  const party = `<path d="M17 79L50 9L83 79Q50 91 17 79Z" fill="${velvet}" stroke="#4b2336" stroke-width="1.8"/><path d="M50 11L66 81L81 79Z" fill="#161c33" opacity=".5"/><path d="M45 23L26 69" stroke="#d9a0a9" stroke-opacity=".4" stroke-width="1.2"/><g fill="${gold}"><path d="${star}" transform="translate(45 51) scale(.23)"/><path d="${star}" transform="translate(64 71) scale(.16)"/><circle cx="35" cy="71" r="1.5"/><circle cx="57" cy="39" r="1.2"/></g><path d="M17 79Q50 91 83 79" fill="none" stroke="${gold}" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="9" r="5.5" fill="${gold}"/><circle cx="48.5" cy="7.5" r="1.8" fill="#ffebbc"/>`
  const cap = `<path d="M12 80Q12 40 50 39Q88 40 88 80Z" fill="${ink}" stroke="#263239" stroke-width="1.5"/><path d="M50 39Q30 49 32 79H68Q70 49 50 39Z" fill="${teal}"/><path d="M50 41V76" stroke="#94b5a5" stroke-opacity=".55" stroke-width="1"/><path d="M13 78Q50 72 88 78L96 84Q68 91 42 83L12 85Z" fill="${teal}" stroke="#1c3238" stroke-width="1.4"/><path d="M43 80Q73 87 92 83" fill="none" stroke="#b8ce0a" stroke-opacity=".4" stroke-width="1"/><path d="M50 24V39" stroke="${gold}" stroke-width="3"/><ellipse cx="32" cy="23" rx="19" ry="4.5" fill="${gold}" transform="rotate(-8 32 23)"/><ellipse cx="68" cy="23" rx="19" ry="4.5" fill="${teal}" transform="rotate(8 68 23)"/><circle cx="50" cy="23" r="4.4" fill="${gold}"/>`
  const topHat = `<ellipse cx="50" cy="82" rx="44" ry="8" fill="${ink}" stroke="#c5a26a" stroke-width="1.1"/><path d="M24 79L20 20Q50 12 80 20L76 79Q50 87 24 79Z" fill="${ink}" stroke="#625743" stroke-width="1.4"/><path d="M25 23L29 61" stroke="#c2b5a1" stroke-opacity=".36" stroke-width="1.8"/><path d="M24 65Q50 73 76 65V77Q50 85 24 77Z" fill="${velvet}" stroke="#ab8460" stroke-width=".9"/><rect x="58" y="68" width="9" height="9" rx="1" fill="none" stroke="${gold}" stroke-width="1.8"/><path d="M12 82Q50 90 88 82" fill="none" stroke="#d4ba88" stroke-opacity=".6" stroke-width="1"/>`
  const beanie = `<path d="M13 74Q14 29 50 29Q86 29 87 74Z" fill="${velvet}" stroke="#442736" stroke-width="1.6"/><g fill="none" stroke="#d398a3" stroke-opacity=".38" stroke-width="1.1"><path d="M25 72Q23 45 40 34M36 72Q35 46 46 32M48 72V31M61 72Q65 46 54 32M74 72Q79 45 60 34"/></g><path d="M13 68Q50 75 87 68L88 83Q50 91 12 83Z" fill="${velvet}" stroke="#bc8f93" stroke-width="1.1"/><g stroke="#d39c9f" stroke-opacity=".4" stroke-width="1.2">${[19,27,35,43,51,59,67,75,83].map(x=>`<path d="M${x} 73V82"/>`).join("")}</g><circle cx="50" cy="25" r="11" fill="${velvet}" stroke="#c4979c" stroke-width="1.3"/><path d="M45 17L42 28M50 15L48 33M56 18L54 31" stroke="#e0adb0" stroke-opacity=".5" stroke-width="1.2"/><rect x="65" y="74" width="10" height="9" rx="1.5" fill="${gold}"/><path d="M68 80L70 77L72 80" fill="none" stroke="#553f2d" stroke-width="1"/>`

  function bowTie(): string {
    const [x,y,width,angle] = fit.neck
    return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${width/100}) translate(-50 -50)">
      <path d="M4 48Q50 61 96 48" fill="none" stroke="#16282d" stroke-width="7"/>
      <path d="M44 43L12 28Q7 26 8 49Q7 72 13 70L44 58M56 43L88 28Q93 26 92 49Q93 72 87 70L56 58Z" fill="${teal}" stroke="#172e32" stroke-width="1.7"/>
      <path d="M14 34L40 48L14 64M86 34L60 48L86 64" fill="none" stroke="#9abbab" stroke-opacity=".55" stroke-width="1.2"/>
      <path d="M19 47L39 50L20 55M81 47L61 50L80 55" fill="#09222a" opacity=".48"/>
      <rect x="42" y="39" width="16" height="22" rx="4" fill="${teal}" stroke="#12343b" stroke-width="1.3"/>
      <path d="M46 43V56" stroke="#b0cbb6" stroke-opacity=".45" stroke-width="1.3"/>
    </g>`
  }

  let artwork: string
  switch (id) {
    case "heart-glasses": case "round-glasses": case "star-glasses": case "snorkel": artwork = glasses(); break
    case "crown": artwork = mounted(crown,.78); break
    case "party-hat": artwork = mounted(party,.66,1); break
    case "propeller": artwork = mounted(cap,.98,3); break
    case "top-hat": artwork = mounted(topHat,.85); break
    case "beanie": artwork = mounted(beanie,1.03,7); break
    case "headphones": artwork = headphones(); break
    case "heart-band": artwork = headband(); break
    case "bow-tie": artwork = bowTie(); break
    default: return null
  }

  svg.innerHTML = `<defs>
    <linearGradient id="${key}-gold" x1="0" y1="0" x2="80%" y2="100%"><stop stop-color="#f3dba1"/><stop offset=".32" stop-color="#b58d4b"/><stop offset=".65" stop-color="#876136"/><stop offset="1" stop-color="#e1c184"/></linearGradient>
    <linearGradient id="${key}-rose" x1="0" y1="0" x2="40%" y2="100%"><stop stop-color="#ecc3b3"/><stop offset=".45" stop-color="#a86569"/><stop offset="1" stop-color="#dca099"/></linearGradient>
    <linearGradient id="${key}-ink" x1="0" y1="0" x2="100%" y2="30%"><stop stop-color="#151923"/><stop offset=".28" stop-color="#424650"/><stop offset=".64" stop-color="#171b25"/><stop offset="1" stop-color="#32333e"/></linearGradient>
    <linearGradient id="${key}-velvet" x1="0" y1="0" x2="100%" y2="45%"><stop stop-color="#a45e75"/><stop offset=".28" stop-color="#7d405e"/><stop offset=".7" stop-color="#462c49"/><stop offset="1" stop-color="#74405b"/></linearGradient>
    <linearGradient id="${key}-teal" x1="0" y1="0" x2="85%" y2="100%"><stop stop-color="#9ebead"/><stop offset=".3" stop-color="#487a79"/><stop offset=".65" stop-color="#1d454f"/><stop offset="1" stop-color="#547f7b"/></linearGradient>
    <linearGradient id="${key}-glass" x1="0" y1="0" x2="70%" y2="100%"><stop stop-color="#d7e9e4" stop-opacity=".2"/><stop offset=".42" stop-color="#7898a8" stop-opacity=".06"/><stop offset="1" stop-color="#628399" stop-opacity=".14"/></linearGradient>
  </defs>${artwork}`
  return svg
}
