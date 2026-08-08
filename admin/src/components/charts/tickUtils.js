export function niceTicks(maxValue, tickCount = 4) {
  if (!maxValue || maxValue <= 0) return { max: 0, ticks: [0] };

  let step = maxValue / tickCount;
  const pow = Math.pow(10, Math.floor(Math.log10(step)));
  const n = step / pow;
  let nice;
  if (n <= 1) nice = 1;
  else if (n <= 2) nice = 2;
  else if (n <= 2.5) nice = 2.5;
  else if (n <= 5) nice = 5;
  else nice = 10;
  step = nice * pow;

  if (Number.isInteger(maxValue)) {
    step = Math.max(1, Math.ceil(step));
  }

  const ticks = [];
  for (let v = 0; v <= maxValue; v += step) {
    ticks.push(Math.round(v * 1000) / 1000);
  }
  if (ticks[ticks.length - 1] < maxValue) {
    ticks.push(Number(maxValue.toFixed(3)));
  }
  return { max: ticks[ticks.length - 1], ticks };
}
