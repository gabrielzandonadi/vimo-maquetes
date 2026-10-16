// Posição solar pelo algoritmo NOAA (precisão ~0,01° para 1800–2100).
// Retorna azimute (graus a partir do Norte, sentido horário) e elevação (graus acima do horizonte).

const rad = Math.PI / 180;

export const TZ_OFFSET_H = -3; // Espírito Santo: UTC-3, sem horário de verão desde 2019

// Converte data local (YYYY-MM-DD) + hora decimal local em Date UTC
export function localToDate(isoDay, hours) {
  const [y, m, d] = isoDay.split('-').map(Number);
  const ms = Date.UTC(y, m - 1, d, 0, 0, 0) + (hours - TZ_OFFSET_H) * 3600e3;
  return new Date(ms);
}

export function sunPosition(date, lat, lon) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const T = (jd - 2451545) / 36525;
  const L0 = (280.46646 + T * (36000.76983 + 0.0003032 * T)) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C = Math.sin(M * rad) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
            Math.sin(2 * M * rad) * (0.019993 - 0.000101 * T) +
            Math.sin(3 * M * rad) * 0.000289;
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega * rad);
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(omega * rad);
  const decl = Math.asin(Math.sin(eps * rad) * Math.sin(lambda * rad)) / rad;

  const y = Math.tan(eps / 2 * rad) ** 2;
  const eqTime = 4 / rad * (y * Math.sin(2 * L0 * rad) - 2 * e * Math.sin(M * rad) +
    4 * e * y * Math.sin(M * rad) * Math.cos(2 * L0 * rad) -
    0.5 * y * y * Math.sin(4 * L0 * rad) - 1.25 * e * e * Math.sin(2 * M * rad)); // minutos

  const utcMin = (date.getTime() / 60000) % 1440;
  let tst = (utcMin + eqTime + 4 * lon + 1440) % 1440; // tempo solar verdadeiro
  let ha = tst / 4 - 180;
  if (ha < -180) ha += 360;

  const cosZen = Math.sin(lat * rad) * Math.sin(decl * rad) +
                 Math.cos(lat * rad) * Math.cos(decl * rad) * Math.cos(ha * rad);
  const zen = Math.acos(Math.min(1, Math.max(-1, cosZen))) / rad;
  let elev = 90 - zen;

  // Refração atmosférica (aproximação NOAA)
  if (elev > -0.575 && elev < 85) {
    const te = Math.tan(elev * rad);
    let corr;
    if (elev > 5) corr = 58.1 / te - 0.07 / te ** 3 + 0.000086 / te ** 5;
    else corr = 1735 + elev * (-518.2 + elev * (103.4 + elev * (-12.79 + elev * 0.711)));
    elev += corr / 3600;
  } else if (elev <= -0.575) {
    elev += (-20.774 / Math.tan(elev * rad)) / 3600;
  }

  let az = Math.atan2(Math.sin(ha * rad),
    Math.cos(ha * rad) * Math.sin(lat * rad) - Math.tan(decl * rad) * Math.cos(lat * rad)) / rad + 180;
  az = (az + 360) % 360;

  // meio-dia solar em hora local
  const solarNoonLocal = (720 - 4 * lon - eqTime) / 60 + TZ_OFFSET_H;
  return { azimuth: az, elevation: elev, declination: decl, solarNoon: solarNoonLocal };
}

// Vetor unitário apontando para o sol no sistema da cena (x = leste, y = cima, z = sul)
export function sunVector(az, el) {
  const a = az * rad, e = el * rad;
  return { x: Math.sin(a) * Math.cos(e), y: Math.sin(e), z: -Math.cos(a) * Math.cos(e) };
}

// Nascer / pôr do sol por busca (hora local decimal)
export function sunTimes(isoDay, lat, lon) {
  const elevAt = h => sunPosition(localToDate(isoDay, h), lat, lon).elevation;
  const find = (a, b) => {
    for (let i = 0; i < 40; i++) {
      const m = (a + b) / 2;
      if ((elevAt(a) + 0.833) * (elevAt(m) + 0.833) <= 0) b = m; else a = m;
    }
    return (a + b) / 2;
  };
  const noon = sunPosition(localToDate(isoDay, 12), lat, lon).solarNoon;
  return { sunrise: find(noon - 9, noon), sunset: find(noon, noon + 9), noon };
}

export function fmtHour(h) {
  if (h == null || isNaN(h)) return '--:--';
  let hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  if (mm === 60) { hh++; mm = 0; }
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

export function compassName(az) {
  const n = ['N', 'NNE', 'NE', 'ENE', 'L', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
  return n[Math.round(((az % 360) + 360) % 360 / 22.5) % 16];
}
