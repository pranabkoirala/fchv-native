import {
  EncodingType,
  readAsStringAsync,
  StorageAccessFramework,
  writeAsStringAsync,
} from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Share from "expo-sharing";
import { Platform } from "react-native";
import { AdToBs } from "react-native-nepali-picker";
import { getAllAdolescentIfa } from "../hooks/database/models/AdolescentIfaModel";
import { getAllInfantMonitorings } from "../hooks/database/models/InfantMonitoringModel";
import { getAllMaternalDeaths } from "../hooks/database/models/MaternalDeathModel";
import { getAllNewbornDeaths } from "../hooks/database/models/NewbornDeathModel";
import {
  getPregnantWomenList,
  PregnantWomenListItem,
} from "../hooks/database/models/PregnantWomenModal";
import storage from "./storage";

export const convertToNepaliNumber = (
  num: number | string | null | undefined,
): string => {
  if (num === null || num === undefined) return "";
  const nepaliNumbers = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return String(num).replace(
    /[0-9]/g,
    (match) => nepaliNumbers[parseInt(match)],
  );
};

const parseDateToNepali = (dateStr: string | null | undefined) => {
  if (!dateStr) return { year: "", month: "", day: "" };
  try {
    const bsDate = AdToBs(dateStr);
    const [year, month, day] = bsDate.split("-");
    return {
      year: convertToNepaliNumber(year),
      month: convertToNepaliNumber(month),
      day: convertToNepaliNumber(day),
    };
  } catch (e) {
    return { year: "", month: "", day: "" };
  }
};

const convertAdYmdToBs = (
  y: number | string | null | undefined,
  m: number | string | null | undefined,
  d: number | string | null | undefined,
) => {
  if (!y || !m || !d) return { year: "", month: "", day: "" };
  const adString = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return parseDateToNepali(adString);
};

const getCss = () => `
  <style>
    body { font-family: sans-serif; font-size: 10px; color: #333; padding: 20px; }
    h2, h3, h4 { text-align: center; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th, td { border: 1px solid #000; padding: 4px; text-align: center; font-size: 9px; word-wrap: break-word; }
    th { background-color: #f2f2f2; font-weight: bold; }
    .page-break { page-break-before: always; }
    .title { font-size: 14px; font-weight: bold; margin-bottom: 10px; }
    .subtitle { font-size: 12px; margin-bottom: 5px; }
  </style>
`;

const getEmptyRows = (cols: number, count = 3) => {
  let rows = "";
  for (let i = 0; i < count; i++) {
    rows += "<tr>";
    for (let j = 0; j < cols; j++) {
      rows += "<td></td>";
    }
    rows += "</tr>";
  }
  return rows;
};

const generatePregnancyTable = async (data: PregnantWomenListItem[]) => {
  let html = `
    <div class="title" style="text-align: center;">मातृ तथा नवजात शिशु सम्बन्धि विवरण</div>
    <table>
      <thead>
        <tr>
          <th rowspan="2">क्र.सं.</th>
          <th colspan="3">मिति</th>
          <th colspan="2">गर्भवती महिलाको</th>
          <th colspan="3">अन्तिम रजश्वला भएको<br>(LMP)<br>(ग.म.सा.)</th>
          <th colspan="3">प्रसूतिको अनुमानित मिति<br>(EDD)<br>(ग.म.सा.)</th>
          <th colspan="2">जीवन सुरक्षा परामर्श दिएको</th>
          <th colspan="9">स्वास्थ्य संस्थामा गर्भ जाँच गरेको पटक (औं हप्तामा)</th>
        </tr>
        <tr>
          <th>गते</th><th>महिना</th><th>साल</th>
          <th>नाम, थर</th><th>उमेर</th>
          <th>गते</th><th>महिना</th><th>साल</th>
          <th>गते</th><th>महिना</th><th>साल</th>
          <th>छ</th><th>छैन</th>
          <th>१२ हप्ता सम्म</th><th>१६ हप्ता सम्म</th><th>२०-२४ हप्ता</th><th>२८ हप्ता</th><th>३२ हप्ता</th><th>३४ हप्ता</th><th>३६ हप्ता</th><th>३८-४० हप्ता</th><th>अन्य</th>
        </tr>
        <tr>
  `;
  for (let i = 1; i <= 23; i++) html += `<th>${convertToNepaliNumber(i)}</th>`;
  html += `</tr></thead><tbody>`;

  for (let index = 0; index < data.length; index++) {
    const item = data[index];
    const regDate = parseDateToNepali(
      item.created_at ? item.created_at.split("T")[0] : null,
    );
    const lmp = parseDateToNepali(item.lmp_date);
    const edd = parseDateToNepali(item.edd);

    html += `
      <tr>
        <td>${convertToNepaliNumber(index + 1)}</td>
        <td>${regDate.day}</td><td>${regDate.month}</td><td>${regDate.year}</td>
        <td>${item.name}</td><td>${convertToNepaliNumber(item.age)}</td>
        <td>${lmp.day}</td><td>${lmp.month}</td><td>${lmp.year}</td>
        <td>${edd.day}</td><td>${edd.month}</td><td>${edd.year}</td>
        <td></td><td></td>
        <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
      </tr>
    `;
  }

  if (data.length === 0) {
    html += getEmptyRows(23, 5);
  }

  html += `</tbody></table>`;
  return html;
};

const generateMaternalDeathTable = (data: any[]) => {
  let html = `
    <div class="title" style="text-align: center; margin-top: 20px;">मातृ मृत्यु विवरण</div>
    <div class="subtitle" style="text-align: center;">(गर्भवती अवस्था, प्रशव अवस्था तथा सुत्केरी भएको ४२ दिन भित्र मृत्यु भएका महिलाको लागि मात्र)</div>
    <table>
      <thead>
        <tr>
          <th rowspan="2">क्र.सं.</th>
          <th rowspan="2">मृतक महिलाको नाम</th>
          <th rowspan="2">उमेर<br>(वर्षमा)</th>
          <th colspan="3">मृत्यु हुँदाको अवस्था*</th>
          <th colspan="3">मृत्यु भएको मिति</th>
          <th colspan="3">प्रसुति भएको स्थान*</th>
          <th colspan="3">मृत्यु भएको स्थान*</th>
          <th rowspan="2">कैफियत</th>
        </tr>
        <tr>
          <th>गर्भवती</th><th>प्रशव</th><th>सुत्केरी</th>
          <th>गते</th><th>महिना</th><th>साल</th>
          <th>घर</th><th>संस्था</th><th>अन्य</th>
          <th>घर</th><th>संस्था</th><th>अन्य</th>
        </tr>
        <tr>
  `;
  for (let i = 1; i <= 16; i++) html += `<th>${convertToNepaliNumber(i)}</th>`;
  html += `</tr></thead><tbody>`;

  data.forEach((item, index) => {
    const deathDate = convertAdYmdToBs(
      item.death_year,
      item.death_month,
      item.death_day,
    );
    html += `
      <tr>
        <td>${convertToNepaliNumber(index + 1)}</td>
        <td>${item.mother_name || ""}</td>
        <td>${convertToNepaliNumber(item.mother_age)}</td>
        <td>${item.death_condition === "Pregnant" ? "✔️" : "❌"}</td>
        <td>${item.death_condition === "Labor" ? "✔️" : "❌"}</td>
        <td>${item.death_condition === "Post_delivery" ? "✔️" : "❌"}</td>
        <td>${deathDate.day}</td>
        <td>${deathDate.month}</td>
        <td>${deathDate.year}</td>
        <td></td><td></td><td></td>
        <td>${item.death_place === "Home" ? "✔️" : "❌"}</td>
        <td>${item.death_place === "Institution" ? "✔️" : "❌"}</td>
        <td>${item.death_place === "Other" ? "✔️" : "❌"}</td>
        <td>${item.remarks || ""}</td>
      </tr>
    `;
  });

  if (data.length === 0) {
    html += getEmptyRows(16, 3);
  }

  html += `</tbody></table>`;
  return html;
};

const generateNewbornDeathTable = (data: any[]) => {
  let html = `
    <div class="title" style="text-align: center; margin-top: 20px;">नवजात शिशु मृत्यु विवरण</div>
    <div class="subtitle" style="text-align: center;">(जन्मेको २८ दिन भित्र मृत्यु भएका नवजात शिशुको लागि मात्र)</div>
    <table>
      <thead>
        <tr>
          <th rowspan="2">क्र.सं.</th>
          <th rowspan="2">मृतक नवजात<br>शिशुको नाम</th>
          <th colspan="2">आमाको</th>
          <th colspan="3">नवजात शिशु<br>जन्मेको मिति</th>
          <th colspan="4">बच्चा जन्मदाको अवस्था*</th>
          <th rowspan="2">मृत्यु हुँदा<br>शिशुको उमेर<br>(दिनमा)</th>
          <th rowspan="2">मृत्युको सम्भाव्य कारण*</th>
          <th colspan="3">मृत्यु भएको स्थान*</th>
          <th rowspan="2">कैफियत</th>
        </tr>
        <tr>
          <th>नाम, थर</th><th>पुरा<br>गरेको<br>उमेर</th>
          <th>गते</th><th>महिना</th><th>साल</th>
          <th>समय नपुगेको<br>(३७ हप्ता<br>भन्दा कम)</th><th>कम तौल<br>(२५०० ग्राम<br>भन्दा कम)</th><th>सामान्य</th><th>अन्य</th>
          <th>घर</th><th>संस्था</th><th>अन्य</th>
        </tr>
        <tr>
  `;
  for (let i = 1; i <= 17; i++) html += `<th>${convertToNepaliNumber(i)}</th>`;
  html += `</tr></thead><tbody>`;

  const newbornData = data.filter((item) => item.death_age_unit === "days");

  newbornData.forEach((item, index) => {
    const birthDate = convertAdYmdToBs(
      item.birth_year,
      item.birth_month,
      item.birth_day,
    );
    html += `
      <tr>
        <td>${convertToNepaliNumber(index + 1)}</td>
        <td>${item.baby_name || ""}</td>
        <td>${item.mother_name || ""}</td>
        <td></td>
        <td>${birthDate.day}</td>
        <td>${birthDate.month}</td>
        <td>${birthDate.year}</td>
        <td>${item.birth_condition === "Preterm" ? "✔️" : "❌"}</td>
        <td>${item.birth_condition === "LowWeight" ? "✔️" : "❌"}</td>
        <td>${item.birth_condition === "Normal" ? "✔️" : "❌"}</td>
        <td>${item.birth_condition === "Other" ? "✔️" : "❌"}</td>
        <td>${convertToNepaliNumber(item.death_age_days)}</td>
        <td>${item.cause_of_death || ""}</td>
        <td>${item.death_place === "Home" ? "✔️" : "❌"}</td>
        <td>${item.death_place === "Institution" ? "✔️" : "❌"}</td>
        <td>${item.death_place === "Other" ? "✔️" : "❌"}</td>
        <td>${item.remarks || ""}</td>
      </tr>
    `;
  });

  if (newbornData.length === 0) {
    html += getEmptyRows(17, 3);
  }

  html += `</tbody></table>`;
  return html;
};

const generateChildDeathTable = (data: any[]) => {
  let html = `
    <div class="title" style="text-align: center; margin-top: 20px;">२८ दिन देखि ५९ महिना सम्मको बच्चाहरू मृत्यु विवरण</div>
    <table>
      <thead>
        <tr>
          <th rowspan="2">क्र.सं.</th>
          <th rowspan="2">मृतक बच्चाको नाम</th>
          <th rowspan="2">मृतक बच्चाको आमा वा बाबुको नाम,<br>थर</th>
          <th colspan="3">बच्चा जन्मेको मिति</th>
          <th rowspan="2">मृत्यु हुँदा बच्चाको<br>उमेर (महिनामा)</th>
          <th rowspan="2">मृत्युको सम्भाव्य कारण*</th>
          <th rowspan="2">कैफियत</th>
        </tr>
        <tr>
          <th>गते</th><th>महिना</th><th>साल</th>
        </tr>
        <tr>
  `;
  for (let i = 1; i <= 9; i++) html += `<th>${convertToNepaliNumber(i)}</th>`;
  html += `</tr></thead><tbody>`;

  const childData = data.filter((item) => item.death_age_unit === "months");

  childData.forEach((item, index) => {
    const birthDate = convertAdYmdToBs(
      item.birth_year,
      item.birth_month,
      item.birth_day,
    );
    html += `
      <tr>
        <td>${convertToNepaliNumber(index + 1)}</td>
        <td>${item.baby_name || ""}</td>
        <td>${item.mother_name || ""}</td>
        <td>${birthDate.day}</td>
        <td>${birthDate.month}</td>
        <td>${birthDate.year}</td>
        <td>${convertToNepaliNumber(item.death_age_days)}</td>
        <td>${item.cause_of_death || ""}</td>
        <td>${item.remarks || ""}</td>
      </tr>
    `;
  });

  if (childData.length === 0) {
    html += getEmptyRows(9, 3);
  }

  html += `</tbody></table>`;
  return html;
};

const generateInfantCareTable = (data: any[]) => {
  let html = `
    <div class="page-break"></div>
    <div class="title" style="text-align: center;">नवजात शिशु स्याहार कार्यक्रम</div>
    <div class="subtitle" style="text-align: center;">(कार्यक्रम लागु भएका जिल्लाहरुका म.स्वा.स्व.से. हरुले मात्र भर्ने)</div>
    <table>
      <thead>
        <tr>
          <th rowspan="2">शिशु जन्म<br>मिति<br>(ग.म.सा.)</th>
          <th rowspan="2">आमाको नाम र थर</th>
          <th rowspan="2">शिशुको नाम</th>
          <th rowspan="2">टोल</th>
          <th colspan="3">शिशु जन्म</th>
          <th rowspan="2">शिशु जन्मदा<br>म.स्वा.स्व.से.<br>उपस्थित भएका</th>
          <th rowspan="2">निसासिएको<br>शिशुको<br>व्यवस्थापन</th>
        </tr>
        <tr>
          <th>घर</th><th>स्वास्थ्य संस्था</th><th>तालिम प्राप्त<br>स्वास्थ्यकर्मीबाट</th>
        </tr>
        <tr>
  `;
  for (let i = 1; i <= 9; i++) html += `<th>${convertToNepaliNumber(i)}</th>`;
  html += `</tr></thead><tbody>`;

  data.forEach((item) => {
    const dob = parseDateToNepali(item.date_of_birth);
    html += `
      <tr>
        <td>${dob.day}/${dob.month}/${dob.year}</td>
        <td>${item.mother_name || ""}</td>
        <td>${item.baby_name || ""}</td>
        <td></td>
        <td>${item.birth_place === "home" ? "✔️" : "❌"}</td>
        <td>${item.birth_place === "institution" ? "✔️" : "❌"}</td>
        <td>${item.birth_place === "other" ? "✔️" : "❌"}</td>
        <td>${item.fchv_present ? "✔️" : "❌"}</td>
        <td>${item.asphyxiated_newborn ? "✔️" : "❌"}</td>
      </tr>
    `;
  });

  if (data.length === 0) {
    html += getEmptyRows(9, 10);
  }

  html += `</tbody></table>`;
  return html;
};

const savePdfToDevice = async (htmlContent: string, fileName: string) => {
  const { uri } = await Print.printToFileAsync({
    html: htmlContent,
    base64: false,
  });

  if (Platform.OS === "android") {
    try {
      let directoryUri = await storage.get<string>("export_directory_uri");

      if (!directoryUri) {
        const permissions =
          await StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) return;

        directoryUri = permissions.directoryUri;
        await storage.set("export_directory_uri", directoryUri);
      }

      const base64 = await readAsStringAsync(uri, {
        encoding: EncodingType.Base64,
      });

      try {
        const newUri = await StorageAccessFramework.createFileAsync(
          directoryUri,
          fileName,
          "application/pdf",
        );
        await writeAsStringAsync(newUri, base64, {
          encoding: EncodingType.Base64,
        });
      } catch (e) {
        // If file creation fails (e.g., folder deleted or permission revoked), clear cached URI
        await storage.remove("export_directory_uri");
        alert(
          "Download folder not found or permission revoked. Please try again.",
        );
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during download.");
    }
  } else {
    await Share.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: `Export ${fileName}`,
    });
  }
};

const wrapHtml = (bodyHtml: string) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      ${getCss()}
    </head>
    <body>
      ${bodyHtml}
    </body>
  </html>
`;

export const exportAllDataToPdf = async () => {
  try {
    const pregnancies = await getPregnantWomenList();
    const maternalDeaths = await getAllMaternalDeaths();
    const newbornDeaths = await getAllNewbornDeaths();
    const infants = await getAllInfantMonitorings();
    const adolescents = await getAllAdolescentIfa();

    const htmlContent = wrapHtml(`
      ${await generatePregnancyTable(pregnancies)}
      ${generateMaternalDeathTable(maternalDeaths)}
      ${generateNewbornDeathTable(newbornDeaths)}
      ${generateChildDeathTable(newbornDeaths)}
      ${generateInfantCareTable(infants)}
      <div class="page-break"></div>
      ${generateAdolescentIfaTable(adolescents)}
    `);

    await savePdfToDevice(htmlContent, "FCHV_Export_All.pdf");
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

export const exportPregnancyToPdf = async () => {
  try {
    const data = await getPregnantWomenList();
    const htmlContent = wrapHtml(await generatePregnancyTable(data));
    await savePdfToDevice(htmlContent, "FCHV_Pregnancy.pdf");
  } catch (error) {
    console.error("Error generating Pregnancy PDF:", error);
    throw error;
  }
};

export const exportMaternalDeathToPdf = async () => {
  try {
    const data = await getAllMaternalDeaths();
    const htmlContent = wrapHtml(generateMaternalDeathTable(data));
    await savePdfToDevice(htmlContent, "FCHV_Maternal_Death.pdf");
  } catch (error) {
    console.error("Error generating Maternal Death PDF:", error);
    throw error;
  }
};

export const exportNewbornDeathToPdf = async () => {
  try {
    const data = await getAllNewbornDeaths();
    const htmlContent = wrapHtml(generateNewbornDeathTable(data));
    await savePdfToDevice(htmlContent, "FCHV_Newborn_Death.pdf");
  } catch (error) {
    console.error("Error generating Newborn Death PDF:", error);
    throw error;
  }
};

export const exportChildDeathToPdf = async () => {
  try {
    const data = await getAllNewbornDeaths();
    const htmlContent = wrapHtml(generateChildDeathTable(data));
    await savePdfToDevice(htmlContent, "FCHV_Child_Death.pdf");
  } catch (error) {
    console.error("Error generating Child Death PDF:", error);
    throw error;
  }
};

export const exportInfantCareToPdf = async () => {
  try {
    const data = await getAllInfantMonitorings();
    const htmlContent = wrapHtml(generateInfantCareTable(data));
    await savePdfToDevice(htmlContent, "FCHV_Infant_Care.pdf");
  } catch (error) {
    console.error("Error generating Infant Care PDF:", error);
    throw error;
  }
};

const generateAdolescentIfaTable = (data: any[]) => {
  let html = `
    <div style="background-color: #A9D1EC; padding: 12px; text-align: center; margin-bottom: 20px; font-weight: bold; font-size: 22px; color: #000; letter-spacing: 0.5px; border-radius: 4px;">
      किशोरी लक्षित आइरन फोलिक एसिड वितरण अभिलेख
    </div>
    
    <table style="width: 100%; border: none; margin-bottom: 15px; font-size: 11px; border-collapse: collapse;">
      <tr style="border: none;">
        <td style="width: 60%; text-align: left; border: none; padding: 5px;">महिला सामुदायिक स्वास्थ्य स्वयं सेविकाको नाम : ............................................</td>
        <td style="width: 40%; text-align: left; border: none; padding: 5px;">प्रदेश : ............................................</td>
      </tr>
      <tr style="border: none;">
        <td style="width: 60%; text-align: left; border: none; padding: 5px;">महा/उप/न.पा/गाउँपालिकाको नाम : ............................................</td>
        <td style="width: 40%; text-align: left; border: none; padding: 5px;">वडा नं. : ...........</td>
      </tr>
      <tr style="border: none;">
        <td style="width: 60%; text-align: left; border: none; padding: 5px;">साल : ............................</td>
        <td style="width: 40%; text-align: left; border: none; padding: 5px;">वडा भित्र विद्यालय नजाने किशोरीहरुको संख्या: ...........</td>
      </tr>
    </table>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
      <thead>
        <tr>
          <th rowspan="3" style="width: 3%;">क्र.सं.</th>
          <th rowspan="3" style="width: 15%;">किशोरीको नाम</th>
          <th colspan="2" rowspan="2" style="width: 8%;">उमेर समूह<br>(वर्षमा)</th>
          <th colspan="13">पहिलो चरण (साउन देखि असोज सम्म)</th>
          <th rowspan="3" style="width: 4%;">१३ हप्ता<br>खाएको</th>
          <th colspan="13">दोस्रो चरण (माघ देखि चैत्र सम्म)</th>
          <th rowspan="3" style="width: 4%;">२६ हप्ता<br>खाएको</th>
          <th rowspan="3" style="width: 10%;">कैफियत</th>
        </tr>
        <tr>
          <th colspan="13">हप्ता</th>
          <th colspan="13">हप्ता</th>
        </tr>
        <tr>
          <th style="font-size: 8px; font-weight: normal; padding: 2px;">१०-१४</th>
          <th style="font-size: 8px; font-weight: normal; padding: 2px;">१५-१९</th>
          ${Array.from({ length: 13 })
            .map(
              (_, i) =>
                `<th style="padding: 2px; font-size: 8px;">${convertToNepaliNumber(i + 1)}</th>`,
            )
            .join("")}
          ${Array.from({ length: 13 })
            .map(
              (_, i) =>
                `<th style="padding: 2px; font-size: 8px;">${convertToNepaliNumber(i + 1)}</th>`,
            )
            .join("")}
        </tr>
      </thead>
      <tbody>
  `;

  // Dynamically calculate totals
  let total10_14 = 0;
  let total15_19 = 0;
  const totalP1Weeks = Array(13).fill(0);
  let totalP1Completed = 0;
  const totalP2Weeks = Array(13).fill(0);
  let totalP2Completed = 0;

  data.forEach((item, index) => {
    const is10_14 = item.age_group === "10-14";
    const is15_19 = item.age_group === "15-19";

    if (is10_14) total10_14++;
    if (is15_19) total15_19++;
    if (item.phase1_completed === 1) totalP1Completed++;
    if (item.phase2_completed === 1) totalP2Completed++;

    // Calculate weekly sums
    for (let w = 1; w <= 13; w++) {
      if (item[`phase1_week_${w}`] === 1) totalP1Weeks[w - 1]++;
      if (item[`phase2_week_${w}`] === 1) totalP2Weeks[w - 1]++;
    }

    html += `
      <tr>
        <td>${convertToNepaliNumber(index + 1)}</td>
        <td style="text-align: left; padding-left: 5px;">${item.name || ""}</td>
        <td>${is10_14 ? "✔️" : ""}</td>
        <td>${is15_19 ? "✔️" : ""}</td>
        ${Array.from({ length: 13 })
          .map(
            (_, i) =>
              `<td>${item[`phase1_week_${i + 1}`] === 1 ? "✔️" : ""}</td>`,
          )
          .join("")}
        <td>${item.phase1_completed === 1 ? "✔️" : ""}</td>
        ${Array.from({ length: 13 })
          .map(
            (_, i) =>
              `<td>${item[`phase2_week_${i + 1}`] === 1 ? "✔️" : ""}</td>`,
          )
          .join("")}
        <td>${item.phase2_completed === 1 ? "✔️" : ""}</td>
        <td style="text-align: left; padding-left: 5px; font-size: 8px;">${item.remarks || ""}</td>
      </tr>
    `;
  });

  // If empty, add placeholder rows
  if (data.length === 0) {
    html += getEmptyRows(33, 5);
  }

  // Add the "जम्मा" footer row
  html += `
    <tr style="background-color: #f2f2f2; font-weight: bold;">
      <td colspan="2" style="text-align: center; font-weight: bold;">जम्मा</td>
      <td>${total10_14 > 0 ? convertToNepaliNumber(total10_14) : "०"}</td>
      <td>${total15_19 > 0 ? convertToNepaliNumber(total15_19) : "०"}</td>
      ${totalP1Weeks.map((v) => `<td>${v > 0 ? convertToNepaliNumber(v) : "०"}</td>`).join("")}
      <td>${totalP1Completed > 0 ? convertToNepaliNumber(totalP1Completed) : "०"}</td>
      ${totalP2Weeks.map((v) => `<td>${v > 0 ? convertToNepaliNumber(v) : "०"}</td>`).join("")}
      <td>${totalP2Completed > 0 ? convertToNepaliNumber(totalP2Completed) : "०"}</td>
      <td></td>
    </tr>
  `;

  html += `</tbody></table>`;
  return html;
};

export const exportAdolescentIfaToPdf = async () => {
  try {
    const data = await getAllAdolescentIfa();
    const htmlContent = wrapHtml(generateAdolescentIfaTable(data));
    await savePdfToDevice(htmlContent, "FCHV_Iron_Adolescent.pdf");
  } catch (error) {
    console.error("Error generating Adolescent IFA PDF:", error);
    throw error;
  }
};
