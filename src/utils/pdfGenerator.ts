import * as Print from 'expo-print';
import * as Share from 'expo-sharing';
import { StorageAccessFramework, readAsStringAsync, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { getPregnantWomenList, PregnantWomenListItem } from '../hooks/database/models/PregnantWomenModal';
import { getAllMaternalDeaths } from '../hooks/database/models/MaternalDeathModel';
import { getAllNewbornDeaths } from '../hooks/database/models/NewbornDeathModel';
import { getAllInfantMonitorings } from '../hooks/database/models/InfantMonitoringModel';
import { AdToBs } from 'react-native-nepali-picker';
import storage from './storage';

export const convertToNepaliNumber = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined) return '';
  const nepaliNumbers = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(num).replace(/[0-9]/g, match => nepaliNumbers[parseInt(match)]);
};

const parseDateToNepali = (dateStr: string | null | undefined) => {
  if (!dateStr) return { year: '', month: '', day: '' };
  try {
    const bsDate = AdToBs(dateStr);
    const [year, month, day] = bsDate.split('-');
    return {
      year: convertToNepaliNumber(year),
      month: convertToNepaliNumber(month),
      day: convertToNepaliNumber(day),
    };
  } catch (e) {
    return { year: '', month: '', day: '' };
  }
};

const convertAdYmdToBs = (y: number | string | null | undefined, m: number | string | null | undefined, d: number | string | null | undefined) => {
  if (!y || !m || !d) return { year: '', month: '', day: '' };
  const adString = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
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
  let rows = '';
  for (let i = 0; i < count; i++) {
    rows += '<tr>';
    for (let j = 0; j < cols; j++) {
      rows += '<td></td>';
    }
    rows += '</tr>';
  }
  return rows;
};

const generatePregnancyTable = (data: PregnantWomenListItem[]) => {
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
  for(let i=1; i<=23; i++) html += `<th>${convertToNepaliNumber(i)}</th>`;
  html += `</tr></thead><tbody>`;

  data.forEach((item, index) => {
    const regDate = parseDateToNepali(item.created_at ? item.created_at.split('T')[0] : null);
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
  });

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
  for(let i=1; i<=16; i++) html += `<th>${convertToNepaliNumber(i)}</th>`;
  html += `</tr></thead><tbody>`;

  data.forEach((item, index) => {
    const deathDate = convertAdYmdToBs(item.death_year, item.death_month, item.death_day);
    html += `
      <tr>
        <td>${convertToNepaliNumber(index + 1)}</td>
        <td>${item.mother_name || ''}</td>
        <td>${convertToNepaliNumber(item.mother_age)}</td>
        <td>${item.death_condition === 'Pregnant' ? '✔️' : '❌'}</td>
        <td>${item.death_condition === 'Labor' ? '✔️' : '❌'}</td>
        <td>${item.death_condition === 'Post_delivery' ? '✔️' : '❌'}</td>
        <td>${deathDate.day}</td>
        <td>${deathDate.month}</td>
        <td>${deathDate.year}</td>
        <td></td><td></td><td></td>
        <td>${item.death_place === 'Home' ? '✔️' : '❌'}</td>
        <td>${item.death_place === 'Institution' ? '✔️' : '❌'}</td>
        <td>${item.death_place === 'Other' ? '✔️' : '❌'}</td>
        <td>${item.remarks || ''}</td>
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
  for(let i=1; i<=17; i++) html += `<th>${convertToNepaliNumber(i)}</th>`;
  html += `</tr></thead><tbody>`;

  const newbornData = data.filter(item => item.death_age_unit === 'days');

  newbornData.forEach((item, index) => {
    const birthDate = convertAdYmdToBs(item.birth_year, item.birth_month, item.birth_day);
    html += `
      <tr>
        <td>${convertToNepaliNumber(index + 1)}</td>
        <td>${item.baby_name || ''}</td>
        <td>${item.mother_name || ''}</td>
        <td></td>
        <td>${birthDate.day}</td>
        <td>${birthDate.month}</td>
        <td>${birthDate.year}</td>
        <td>${item.birth_condition === 'Preterm' ? '✔️' : '❌'}</td>
        <td>${item.birth_condition === 'LowWeight' ? '✔️' : '❌'}</td>
        <td>${item.birth_condition === 'Normal' ? '✔️' : '❌'}</td>
        <td>${item.birth_condition === 'Other' ? '✔️' : '❌'}</td>
        <td>${convertToNepaliNumber(item.death_age_days)}</td>
        <td>${item.cause_of_death || ''}</td>
        <td>${item.death_place === 'Home' ? '✔️' : '❌'}</td>
        <td>${item.death_place === 'Institution' ? '✔️' : '❌'}</td>
        <td>${item.death_place === 'Other' ? '✔️' : '❌'}</td>
        <td>${item.remarks || ''}</td>
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
  for(let i=1; i<=9; i++) html += `<th>${convertToNepaliNumber(i)}</th>`;
  html += `</tr></thead><tbody>`;
  
  const childData = data.filter(item => item.death_age_unit === 'months');
  
  childData.forEach((item, index) => {
    const birthDate = convertAdYmdToBs(item.birth_year, item.birth_month, item.birth_day);
    html += `
      <tr>
        <td>${convertToNepaliNumber(index + 1)}</td>
        <td>${item.baby_name || ''}</td>
        <td>${item.mother_name || ''}</td>
        <td>${birthDate.day}</td>
        <td>${birthDate.month}</td>
        <td>${birthDate.year}</td>
        <td>${convertToNepaliNumber(item.death_age_days)}</td>
        <td>${item.cause_of_death || ''}</td>
        <td>${item.remarks || ''}</td>
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
  for(let i=1; i<=9; i++) html += `<th>${convertToNepaliNumber(i)}</th>`;
  html += `</tr></thead><tbody>`;

  data.forEach((item) => {
    const dob = parseDateToNepali(item.date_of_birth);
    html += `
      <tr>
        <td>${dob.day}/${dob.month}/${dob.year}</td>
        <td>${item.mother_name || ''}</td>
        <td>${item.baby_name || ''}</td>
        <td></td>
        <td>${item.birth_place === 'home' ? '✔️' : '❌'}</td>
        <td>${item.birth_place === 'institution' ? '✔️' : '❌'}</td>
        <td>${item.birth_place === 'other' ? '✔️' : '❌'}</td>
        <td>${item.fchv_present ? '✔️' : '❌'}</td>
        <td>${item.asphyxiated_newborn ? '✔️' : '❌'}</td>
      </tr>
    `;
  });

  if (data.length === 0) {
    html += getEmptyRows(9, 10);
  }

  html += `</tbody></table>`;
  return html;
};

export const exportAllDataToPdf = async () => {
  try {
    const pregnancies = await getPregnantWomenList();
    const maternalDeaths = await getAllMaternalDeaths();
    const newbornDeaths = await getAllNewbornDeaths();
    const infants = await getAllInfantMonitorings();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          ${getCss()}
        </head>
        <body>
          ${generatePregnancyTable(pregnancies)}
          ${generateMaternalDeathTable(maternalDeaths)}
          ${generateNewbornDeathTable(newbornDeaths)}
          ${generateChildDeathTable(newbornDeaths)}
          ${generateInfantCareTable(infants)}
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false
    });

    if (Platform.OS === 'android') {
      try {
        let directoryUri = await storage.get<string>('export_directory_uri');
        
        if (!directoryUri) {
          const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (!permissions.granted) return;
          
          directoryUri = permissions.directoryUri;
          await storage.set('export_directory_uri', directoryUri);
        }

        const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
        
        try {
          const newUri = await StorageAccessFramework.createFileAsync(directoryUri, 'FCHV_Export_Data.pdf', 'application/pdf');
          await writeAsStringAsync(newUri, base64, { encoding: EncodingType.Base64 });
        } catch (e) {
          // If file creation fails (e.g., folder deleted or permission revoked), clear cached URI
          await storage.remove('export_directory_uri');
          alert('Download folder not found or permission revoked. Please try again.');
        }
      } catch (err) {
        console.error(err);
        alert('An error occurred during download.');
      }
    } else {
      await Share.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Export FCHV Data PDF'
      });
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
