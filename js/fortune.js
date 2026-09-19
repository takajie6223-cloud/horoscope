/* =====================================================
 * 每日运势算法
 * 以「日期 + 星座」为种子生成确定性结果：
 * 同一天所有人结果相同，第二天自动更新。
 * ===================================================== */

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function todayStr() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function dailyFortune(signKey, dateStr) {
  dateStr = dateStr || todayStr();
  const rnd = mulberry32(hashSeed(dateStr + '|' + signKey));
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  const score = () => 45 + Math.floor(rnd() * 55); // 45 - 99

  const love = score(), career = score(), money = score(), health = score();
  return {
    date: dateStr,
    love: love, career: career, money: money, health: health,
    overall: Math.round((love + career + money + health) / 4),
    color: pick(FORTUNE.colors),
    number: 1 + Math.floor(rnd() * 9),
    texts: {
      love: pick(FORTUNE.love),
      career: pick(FORTUNE.career),
      money: pick(FORTUNE.money),
      health: pick(FORTUNE.health)
    },
    advice: pick(FORTUNE.advice)
  };
}
