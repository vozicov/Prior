declare module "jalaali-js" {
  interface JalaaliDate {
    jy: number;
    jm: number;
    jd: number;
  }
  interface GregorianDate {
    gy: number;
    gm: number;
    gd: number;
  }
  function toJalaali(gy: number, gm: number, gd: number): JalaaliDate;
  function toGregorian(jy: number, jm: number, jd: number): GregorianDate;
  function isLeapJalaaliYear(jy: number): boolean;
  function jalaaliMonthLength(jy: number, jm: number): number;

  const jalaali: {
    toJalaali: typeof toJalaali;
    toGregorian: typeof toGregorian;
    isLeapJalaaliYear: typeof isLeapJalaaliYear;
    jalaaliMonthLength: typeof jalaaliMonthLength;
  };

  export default jalaali;
}
