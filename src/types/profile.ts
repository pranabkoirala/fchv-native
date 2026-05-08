export type Ward = {
  id: string;
  number: number;
}

export type Municipality = {
  id: string;
  name_en: string;
  name_ne: string;
  wards: Ward[];
}

export type District = {
  id: string;
  name_en: string;
  name_ne: string;
  municipalities: Municipality[];
}

export type Province = {
  id: string;
  name_en: string;
  name_ne: string;
  districts: District[];
}