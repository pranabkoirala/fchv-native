const ndc = require('nepali-date-converter');
const NepaliDate = ndc.default ? ndc.default : ndc;

try {
  const d1 = new NepaliDate(2083, 0, 15);
  console.log("From components:", d1.format('YYYY-MM-DD'));
  const ad = d1.getAD();
  console.log("AD:", ad);
  const jsDate = new Date(ad.year, ad.month, ad.date);
  console.log("JS Date:", jsDate.toISOString());
  const d2 = new NepaliDate(jsDate);
  console.log("Back to BS:", d2.format('YYYY-MM-DD'));
} catch(e) {
  console.error(e);
}
