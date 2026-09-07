import { findAccessory } from "@shared/accessories.js"

// Scalable, transparent UI layers. Markup is static; ids are catalog-validated.
let nextId = 0
export function buildAccessory(id: string): SVGSVGElement | null {
  if (!findAccessory(id)) return null
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  svg.setAttribute("viewBox", "0 0 100 100")
  svg.setAttribute("aria-hidden", "true")
  svg.setAttribute("class", `avatar-accessory accessory--${id}`)
  svg.setAttribute("data-accessory", id)
  const key = `acc-${nextId++}`
  const gold = `url(#${key}-gold)`, lens = `url(#${key}-lens)`
  const teal = `url(#${key}-teal)`, pink = `url(#${key}-pink)`, dark = `url(#${key}-dark)`
  const heart = "M0 4C-13 -8 -24 1 -20 12C-18 20 -7 27 0 33C7 27 18 20 20 12C24 1 13 -8 0 4Z"
  const star = "0,-19 6,-6 21,-4 11,7 14,22 0,15 -14,22 -11,7 -21,-4 -6,-6"
  const shapes: Record<string, string> = {
    "heart-glasses": `<g stroke="#ed303e" stroke-width="4" fill="${lens}" stroke-linejoin="round"><path d="${heart}" transform="translate(25 34)"/><path d="${heart}" transform="translate(75 34)"/><path d="M46 46Q50 41 54 46M3 45H0M97 45H100" fill="none"/></g><path d="M12 43L23 39M62 43L73 39" stroke="#b8e8ff" stroke-width="3" stroke-linecap="round"/>`,
    "round-glasses": `<g fill="${lens}" stroke="${pink}" stroke-width="5"><circle cx="25" cy="50" r="21"/><circle cx="75" cy="50" r="21"/><path d="M46 48Q50 44 54 48M0 48H4M96 48H100" fill="none"/></g><path d="M12 42L23 36M62 42L73 36" stroke="#ead8ff" stroke-width="3" stroke-linecap="round"/>`,
    "star-glasses": `<g fill="${lens}" stroke="${gold}" stroke-width="4" stroke-linejoin="round"><polygon points="${star}" transform="translate(25 48)"/><polygon points="${star}" transform="translate(75 48)"/><path d="M46 48H54M0 48H4M96 48H100"/></g><path d="M16 46L24 40M66 46L74 40" stroke="#f0d9ff" stroke-width="2"/>`,
    crown: `<path d="M15 77L6 29L31 46L50 12L69 46L94 29L85 77Z" fill="${gold}" stroke="#89501b" stroke-width="2"/><path d="M16 69Q50 61 84 69L83 81Q50 87 17 81Z" fill="${gold}" stroke="#ffd987" stroke-width="2"/><g fill="${gold}" stroke="#ffe7a4"><circle cx="6" cy="26" r="5"/><circle cx="50" cy="11" r="6"/><circle cx="94" cy="26" r="5"/></g><path d="M50 37L59 51L50 65L41 51Z" fill="${teal}" stroke="#ffe9ac" stroke-width="2"/><ellipse cx="26" cy="56" rx="4" ry="7" fill="#cc3157"/><ellipse cx="74" cy="56" rx="4" ry="7" fill="#7754ce"/>`,
    headphones: `<path d="M12 65V44A38 38 0 0 1 88 44V65" fill="none" stroke="${gold}" stroke-width="9"/><path d="M18 38A32 32 0 0 1 82 38" fill="none" stroke="${teal}" stroke-width="9"/><g fill="${teal}" stroke="${gold}" stroke-width="3"><rect x="4" y="46" width="17" height="32" rx="8"/><rect x="79" y="46" width="17" height="32" rx="8"/></g><g fill="${dark}"><rect x="16" y="49" width="7" height="26" rx="3"/><rect x="77" y="49" width="7" height="26" rx="3"/></g>`,
    "party-hat": `<path d="M13 86L50 10L87 86Q50 99 13 86Z" fill="#603291" stroke="#b98735" stroke-width="2"/><path d="M49 13L67 88Q76 90 86 86Z" fill="#351c59" opacity=".55"/><g fill="${gold}"><polygon points="${star}" transform="translate(45 52) scale(.4)"/><polygon points="${star}" transform="translate(67 76) scale(.28)"/><polygon points="${star}" transform="translate(31 78) scale(.27)"/><circle cx="50" cy="11" r="10"/></g><path d="M13 86Q50 100 87 86" fill="none" stroke="${gold}" stroke-width="7" stroke-linecap="round"/>`,
    propeller: `<path d="M12 83A38 38 0 0 1 88 83Z" fill="#ec861c" stroke="#eab74f" stroke-width="2"/><path d="M50 44Q28 53 32 83H68Q72 53 50 44Z" fill="${gold}"/><path d="M50 24V44" stroke="${gold}" stroke-width="5"/><g fill="${teal}" stroke="#61d7dc"><ellipse cx="31" cy="25" rx="20" ry="6" transform="rotate(-10 31 25)"/><ellipse cx="69" cy="25" rx="20" ry="6" transform="rotate(10 69 25)"/></g><circle cx="50" cy="25" r="6" fill="${gold}"/><path d="M10 82Q50 76 90 82L94 91Q50 82 9 93Z" fill="#d36517" stroke="#ffbb4d" stroke-width="2"/>`,
    "top-hat": `<ellipse cx="50" cy="84" rx="46" ry="11" fill="${dark}" stroke="#bf8c3e" stroke-width="2"/><path d="M23 81L18 21Q50 12 82 21L77 81Q50 91 23 81Z" fill="${dark}" stroke="#66523a" stroke-width="2"/><path d="M22 65Q50 73 78 65L77 79Q50 88 23 79Z" fill="${gold}"/><path d="M24 24L29 62" stroke="#72624d" stroke-width="2"/>`,
    snorkel: `<path d="M86 13V76Q86 91 72 90H66" fill="none" stroke="#961e2b" stroke-width="9" stroke-linecap="round"/><path d="M85 14V75Q85 87 73 87" fill="none" stroke="#f36560" stroke-width="5"/><path d="M10 41Q44 33 73 41Q83 45 79 61Q76 76 60 68L46 60L32 68Q13 76 8 60Q4 46 10 41Z" fill="#62c5d1" fill-opacity=".2" stroke="${gold}" stroke-width="5"/><path d="M15 45L31 43" stroke="#d4faff" stroke-width="2" stroke-linecap="round"/>`,
    "heart-band": `<path d="M13 82Q8 33 50 33Q92 33 87 82" fill="none" stroke="${gold}" stroke-width="4"/><g stroke="${gold}" stroke-width="2"><path d="M18 48L9 26M33 35L28 17M50 32V9M67 35L73 17M82 48L93 26"/></g><g fill="${pink}" stroke="#ffb7c6" stroke-width="1.5"><path d="${heart}" transform="translate(9 13) scale(.35)"/><path d="${heart}" transform="translate(28 4) scale(.38)"/><path d="${heart}" transform="translate(50 -3) scale(.42)"/><path d="${heart}" transform="translate(73 4) scale(.38)"/><path d="${heart}" transform="translate(93 13) scale(.35)"/></g>`,
    beanie: `<path d="M15 76Q15 30 50 28Q85 30 85 76Z" fill="${pink}" stroke="#7b213f" stroke-width="2"/><g stroke="#e06583" stroke-width="2" opacity=".65"><path d="M29 70Q28 41 43 33M42 72L47 33M57 72L53 33M71 70Q72 41 57 33"/></g><rect x="12" y="70" width="76" height="20" rx="7" fill="#861f43" stroke="#d45b7a" stroke-width="2"/><path d="M23 73V87M33 73V88M44 73V88M55 73V88M66 73V88M77 73V87" stroke="#be4263" stroke-width="3"/><circle cx="50" cy="20" r="14" fill="${gold}" stroke="#ffdf79" stroke-width="3" stroke-dasharray="2 2"/>`,
    "bow-tie": `<path d="M44 43L12 25Q3 21 5 49Q3 77 13 74L44 59M56 43L88 25Q97 21 95 49Q97 77 87 74L56 59" fill="${teal}" stroke="#187e87" stroke-width="2"/><path d="M14 38L40 49L14 62M86 38L60 49L86 62" fill="none" stroke="#46aeb9" stroke-width="2"/><rect x="41" y="38" width="18" height="25" rx="5" fill="${gold}" stroke="#ffdf90"/>`
  }
  svg.innerHTML = `<defs>
    <linearGradient id="${key}-gold" x2=".8" y2="1"><stop stop-color="#fff0a5"/><stop offset=".3" stop-color="#e8ae39"/><stop offset=".65" stop-color="#a66216"/><stop offset="1" stop-color="#ffd977"/></linearGradient>
    <linearGradient id="${key}-lens" x2=".6" y2="1"><stop stop-color="${id === "heart-glasses" ? "#2e8dcc" : "#ab60e7"}"/><stop offset=".48" stop-color="${id === "heart-glasses" ? "#143966" : "#552b89"}"/><stop offset="1" stop-color="#17142b"/></linearGradient>
    <linearGradient id="${key}-teal" x2="1" y2="1"><stop stop-color="#68e1df"/><stop offset=".4" stop-color="#188a98"/><stop offset="1" stop-color="#064453"/></linearGradient>
    <linearGradient id="${key}-pink" x2=".6" y2="1"><stop stop-color="#ff8ca7"/><stop offset=".35" stop-color="#e93473"/><stop offset="1" stop-color="#8a1641"/></linearGradient>
    <linearGradient id="${key}-dark" x2="1" y2=".7"><stop stop-color="#54505a"/><stop offset=".45" stop-color="#15141c"/><stop offset="1" stop-color="#35303b"/></linearGradient>
  </defs>${shapes[id] ?? ""}`
  return svg
}
