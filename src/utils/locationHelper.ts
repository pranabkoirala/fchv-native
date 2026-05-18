import municipalitiesData from '../assets/json/municipalities.json';

export const getProvinceById = (id: string, lang: 'en' | 'np' = 'en'): string => {
  if (!id) return '';
  const p = (municipalitiesData as any[]).find(p => p.id === id);
  if (!p) return id;
  return lang === 'np' ? p.name_ne : p.name_en;
};

export const getDistrictById = (id: string, lang: 'en' | 'np' = 'en'): string => {
  if (!id) return '';
  for (const p of municipalitiesData as any[]) {
    const d = (p.districts || []).find((d: any) => d.id === id);
    if (d) return lang === 'np' ? d.name_ne : d.name_en;
  }
  return id;
};

export const getMunicipalityById = (id: string, lang: 'en' | 'np' = 'en'): string => {
  if (!id) return '';
  for (const p of municipalitiesData as any[]) {
    for (const d of p.districts || []) {
      const m = (d.municipalities || []).find((m: any) => m.id === id);
      if (m) return lang === 'np' ? m.name_ne : m.name_en;
    }
  }
  return id;
};

export const getWardById = (id: string): string => {
  if (!id) return '';
  // If it's not a UUID (i.e. just a simple number), return it directly
  if (id.length < 10) return id; 
  
  for (const p of municipalitiesData as any[]) {
    for (const d of p.districts || []) {
      for (const m of d.municipalities || []) {
        const w = (m.wards || []).find((w: any) => w.id === id);
        if (w) return String(w.number);
      }
    }
  }
  return id;
};
