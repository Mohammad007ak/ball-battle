/**
 * Deterministic math for the simulation. Online, the phone and the server run the engine side by
 * side, and bot matches are replayed on the server: results must be bit-identical everywhere.
 * `Math.sin/cos/atan2/hypot` may round the last bit differently across JS engines and versions
 * (measured: server Node vs Android WebView drifted within seconds), so the engine uses these,
 * built only from + − × ÷, floor and sqrt, which IEEE 754 defines exactly. Ported from fdlibm.
 */

const PIO2_HI = 1.5707963267341256, // first 33 bits of π/2
  PIO2_LO = 6.0771005065061922e-11, // π/2 − PIO2_HI
  INV_PIO2 = 6.3661977236758138e-1;

// fdlibm __kernel_sin / __kernel_cos coefficients, |x| ≤ π/4.
const S1 = -1.66666666666666324348e-1,
  S2 = 8.33333333332248946124e-3,
  S3 = -1.98412698298579493134e-4,
  S4 = 2.75573137070700676789e-6,
  S5 = -2.50507602534068634195e-8,
  S6 = 1.58969099521155010221e-10;
const C1 = 4.16666666666666019037e-2,
  C2 = -1.38888888888741095749e-3,
  C3 = 2.48015872894767294178e-5,
  C4 = -2.75573143513906633035e-7,
  C5 = 2.0875723212981748279e-9,
  C6 = -1.13596475577881948265e-11;

function ksin(x: number) {
  const z = x * x;
  return x + x * z * (S1 + z * (S2 + z * (S3 + z * (S4 + z * (S5 + z * S6)))));
}
function kcos(x: number) {
  const z = x * x;
  return 1 - 0.5 * z + z * z * (C1 + z * (C2 + z * (C3 + z * (C4 + z * (C5 + z * C6)))));
}
/** x = k·π/2 + r, |r| ≤ π/4 (Cody–Waite; exact enough for the angles a game produces). */
function reduce(x: number): [number, number] {
  const k = Math.floor(x * INV_PIO2 + 0.5);
  return [k, x - k * PIO2_HI - k * PIO2_LO];
}

export function sin(x: number): number {
  const [k, r] = reduce(x);
  switch (((k % 4) + 4) % 4) {
    case 0:
      return ksin(r);
    case 1:
      return kcos(r);
    case 2:
      return -ksin(r);
    default:
      return -kcos(r);
  }
}
export function cos(x: number): number {
  const [k, r] = reduce(x);
  switch (((k % 4) + 4) % 4) {
    case 0:
      return kcos(r);
    case 1:
      return -ksin(r);
    case 2:
      return -kcos(r);
    default:
      return ksin(r);
  }
}

// fdlibm atan.
const ATANHI = [
  4.63647609000806093515e-1, 7.85398163397448278999e-1, 9.82793723247329054082e-1,
  1.570796326794896558,
];
const ATANLO = [
  2.26987774529616870924e-17, 3.06161699786838301793e-17, 1.39033110312309984516e-17,
  6.12323399573676603587e-17,
];
const AT = [
  3.33333333333329318027e-1, -1.99999999998764832476e-1, 1.42857142725034663711e-1,
  -1.11111104054623557880e-1, 9.09088713343650656196e-2, -7.69187620504482999495e-2,
  6.66107313738753120669e-2, -5.83357013379057348645e-2, 4.97687799461593236017e-2,
  -3.65315727442169155270e-2, 1.62858201153657823623e-2,
]; // prettier-ignore

function atan(x0: number): number {
  const neg = x0 < 0;
  let x = neg ? -x0 : x0,
    id = -1;
  if (x >= 0.4375) {
    if (x < 1.1875) {
      if (x < 0.6875) {
        id = 0;
        x = (2 * x - 1) / (2 + x);
      } else {
        id = 1;
        x = (x - 1) / (x + 1);
      }
    } else if (x < 2.4375) {
      id = 2;
      x = (x - 1.5) / (1 + 1.5 * x);
    } else {
      id = 3;
      x = -1 / x;
    }
  }
  const z = x * x,
    w = z * z;
  const s1 = z * (AT[0]! + w * (AT[2]! + w * (AT[4]! + w * (AT[6]! + w * (AT[8]! + w * AT[10]!)))));
  const s2 = w * (AT[1]! + w * (AT[3]! + w * (AT[5]! + w * (AT[7]! + w * AT[9]!))));
  const r = id < 0 ? x - x * (s1 + s2) : ATANHI[id]! - (x * (s1 + s2) - ATANLO[id]! - x);
  return neg ? -r : r;
}

const PI = 3.141592653589793;
export function atan2(y: number, x: number): number {
  if (x === 0) return y > 0 ? PI / 2 : y < 0 ? -PI / 2 : 0;
  const a = atan(y / x);
  if (x > 0) return a;
  return y >= 0 ? a + PI : a - PI;
}

/** Length of (x, y). sqrt is correctly rounded by IEEE 754, unlike Math.hypot. */
export function hypot(x: number, y: number): number {
  return Math.sqrt(x * x + y * y);
}
