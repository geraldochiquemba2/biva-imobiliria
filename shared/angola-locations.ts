export interface Municipality {
  name: string;
  coordinates?: { lat: number; lng: number };
}

export interface Province {
  name: string;
  coordinates: { lat: number; lng: number };
  municipalities: Municipality[];
}

export const angolaProvinces: Province[] = [
  {
    name: "Luanda",
    coordinates: { lat: -8.8383, lng: 13.2344 },
    municipalities: [
      { name: "Belas", coordinates: { lat: -8.9500, lng: 13.1667 } },
      { name: "Cacuaco", coordinates: { lat: -8.7833, lng: 13.3667 } },
      { name: "Cazenga", coordinates: { lat: -8.8667, lng: 13.2833 } },
      { name: "Icolo e Bengo", coordinates: { lat: -9.0333, lng: 13.5500 } },
      { name: "Kilamba Kiaxi", coordinates: { lat: -8.8833, lng: 13.2667 } },
      { name: "Luanda", coordinates: { lat: -8.8383, lng: 13.2344 } },
      { name: "Quiçama", coordinates: { lat: -9.7500, lng: 13.6167 } },
      { name: "Talatona", coordinates: { lat: -8.9500, lng: 13.1833 } },
      { name: "Viana", coordinates: { lat: -8.8833, lng: 13.3667 } },
    ],
  },
  {
    name: "Bengo",
    coordinates: { lat: -8.9667, lng: 13.7167 },
    municipalities: [
      { name: "Ambriz", coordinates: { lat: -7.8500, lng: 13.1167 } },
      { name: "Bula Atumba", coordinates: { lat: -8.9000, lng: 13.7000 } },
      { name: "Dande", coordinates: { lat: -8.8333, lng: 13.5000 } },
      { name: "Dembos", coordinates: { lat: -9.1667, lng: 14.0833 } },
      { name: "Nambuangongo", coordinates: { lat: -9.2833, lng: 14.3167 } },
      { name: "Pango Aluquém", coordinates: { lat: -8.7833, lng: 13.6333 } },
    ],
  },
  {
    name: "Benguela",
    coordinates: { lat: -12.5763, lng: 13.4055 },
    municipalities: [
      { name: "Balombo", coordinates: { lat: -12.3500, lng: 14.7167 } },
      { name: "Baía Farta", coordinates: { lat: -12.5333, lng: 13.1833 } },
      { name: "Benguela", coordinates: { lat: -12.5763, lng: 13.4055 } },
      { name: "Bocoio", coordinates: { lat: -12.7333, lng: 13.8500 } },
      { name: "Caimbambo", coordinates: { lat: -12.3833, lng: 13.9833 } },
      { name: "Catumbela", coordinates: { lat: -12.4333, lng: 13.5500 } },
      { name: "Chongoroi", coordinates: { lat: -12.5833, lng: 14.2500 } },
      { name: "Cubal", coordinates: { lat: -13.0000, lng: 14.2500 } },
      { name: "Ganda", coordinates: { lat: -13.0333, lng: 14.3833 } },
      { name: "Lobito", coordinates: { lat: -12.3644, lng: 13.5487 } },
    ],
  },
  {
    name: "Bié",
    coordinates: { lat: -12.3833, lng: 17.4167 },
    municipalities: [
      { name: "Andulo", coordinates: { lat: -11.4833, lng: 16.7167 } },
      { name: "Camacupa", coordinates: { lat: -12.0167, lng: 17.4833 } },
      { name: "Catabola", coordinates: { lat: -12.2000, lng: 17.2833 } },
      { name: "Chinguar", coordinates: { lat: -12.6500, lng: 16.7500 } },
      { name: "Chitembo", coordinates: { lat: -13.0000, lng: 16.9833 } },
      { name: "Cuemba", coordinates: { lat: -12.3833, lng: 16.8833 } },
      { name: "Cunhinga", coordinates: { lat: -12.9667, lng: 16.6167 } },
      { name: "Cuíto", coordinates: { lat: -12.3833, lng: 17.4167 } },
      { name: "Nharea", coordinates: { lat: -11.9167, lng: 16.3333 } },
    ],
  },
  {
    name: "Cabinda",
    coordinates: { lat: -5.5550, lng: 12.2010 },
    municipalities: [
      { name: "Belize", coordinates: { lat: -5.5000, lng: 12.6667 } },
      { name: "Buco-Zau", coordinates: { lat: -5.1667, lng: 12.6167 } },
      { name: "Cabinda", coordinates: { lat: -5.5550, lng: 12.2010 } },
      { name: "Cacongo", coordinates: { lat: -5.1167, lng: 12.2000 } },
    ],
  },
  {
    name: "Cuando Cubango",
    coordinates: { lat: -14.6667, lng: 17.5833 },
    municipalities: [
      { name: "Calai", coordinates: { lat: -13.6500, lng: 21.2000 } },
      { name: "Cuangar", coordinates: { lat: -16.0167, lng: 21.7667 } },
      { name: "Cuchi", coordinates: { lat: -14.4333, lng: 16.9333 } },
      { name: "Cuito Cuanavale", coordinates: { lat: -15.1667, lng: 19.1667 } },
      { name: "Dirico", coordinates: { lat: -17.8667, lng: 20.9500 } },
      { name: "Mavinga", coordinates: { lat: -15.7833, lng: 20.3833 } },
      { name: "Menongue", coordinates: { lat: -14.6667, lng: 17.5833 } },
      { name: "Nankova", coordinates: { lat: -15.0000, lng: 18.5000 } },
      { name: "Rivungo", coordinates: { lat: -16.7500, lng: 22.1000 } },
    ],
  },
  {
    name: "Cuanza Norte",
    coordinates: { lat: -9.2667, lng: 14.3833 },
    municipalities: [
      { name: "Ambaca", coordinates: { lat: -9.2000, lng: 14.5667 } },
      { name: "Banga", coordinates: { lat: -9.4333, lng: 14.7667 } },
      { name: "Bolongongo", coordinates: { lat: -9.5000, lng: 14.8333 } },
      { name: "Cambambe", coordinates: { lat: -9.7500, lng: 14.7667 } },
      { name: "Cazengo", coordinates: { lat: -9.2667, lng: 14.3833 } },
      { name: "Golungo Alto", coordinates: { lat: -9.1167, lng: 14.6333 } },
      { name: "Gonguembo", coordinates: { lat: -9.5500, lng: 14.5500 } },
      { name: "Lucala", coordinates: { lat: -9.6667, lng: 14.8333 } },
      { name: "Quiculungo", coordinates: { lat: -9.3667, lng: 14.5167 } },
      { name: "Samba Cajú", coordinates: { lat: -9.0833, lng: 14.3500 } },
    ],
  },
  {
    name: "Cuanza Sul",
    coordinates: { lat: -11.2052, lng: 13.8462 },
    municipalities: [
      { name: "Amboim", coordinates: { lat: -10.7333, lng: 14.2167 } },
      { name: "Cassongue", coordinates: { lat: -11.5500, lng: 14.6167 } },
      { name: "Cela", coordinates: { lat: -11.4833, lng: 14.7667 } },
      { name: "Conda", coordinates: { lat: -11.9667, lng: 14.8667 } },
      { name: "Ebo", coordinates: { lat: -11.1833, lng: 14.1667 } },
      { name: "Libolo", coordinates: { lat: -10.3500, lng: 14.6000 } },
      { name: "Mussende", coordinates: { lat: -10.4833, lng: 14.9167 } },
      { name: "Porto Amboim", coordinates: { lat: -10.7333, lng: 13.7667 } },
      { name: "Quibala", coordinates: { lat: -10.7333, lng: 14.4667 } },
      { name: "Quilenda", coordinates: { lat: -11.1167, lng: 14.0000 } },
      { name: "Seles", coordinates: { lat: -11.8667, lng: 14.4333 } },
      { name: "Sumbe", coordinates: { lat: -11.2052, lng: 13.8462 } },
    ],
  },
  {
    name: "Cunene",
    coordinates: { lat: -16.1667, lng: 15.7333 },
    municipalities: [
      { name: "Cahama", coordinates: { lat: -16.3000, lng: 14.9667 } },
      { name: "Cuanhama", coordinates: { lat: -17.0667, lng: 15.7667 } },
      { name: "Curoca", coordinates: { lat: -17.2833, lng: 15.6000 } },
      { name: "Cuvelai", coordinates: { lat: -16.9167, lng: 16.0833 } },
      { name: "Namacunde", coordinates: { lat: -17.4167, lng: 16.7167 } },
      { name: "Ombadja", coordinates: { lat: -16.8000, lng: 15.3333 } },
    ],
  },
  {
    name: "Huambo",
    coordinates: { lat: -12.7761, lng: 15.7389 },
    municipalities: [
      { name: "Bailundo", coordinates: { lat: -12.1833, lng: 15.3167 } },
      { name: "Cachiungo", coordinates: { lat: -12.4167, lng: 15.4333 } },
      { name: "Caála", coordinates: { lat: -12.8500, lng: 15.5667 } },
      { name: "Ecunha", coordinates: { lat: -12.5333, lng: 15.9333 } },
      { name: "Huambo", coordinates: { lat: -12.7761, lng: 15.7389 } },
      { name: "Londuimbali", coordinates: { lat: -12.4833, lng: 15.7833 } },
      { name: "Longonjo", coordinates: { lat: -12.9167, lng: 15.2500 } },
      { name: "Mungo", coordinates: { lat: -12.6667, lng: 15.7500 } },
      { name: "Chicala-Choloanga", coordinates: { lat: -12.5667, lng: 15.6333 } },
      { name: "Chinjenje", coordinates: { lat: -12.8500, lng: 15.6833 } },
      { name: "Ucuma", coordinates: { lat: -13.0500, lng: 15.9167 } },
    ],
  },
  {
    name: "Huíla",
    coordinates: { lat: -14.9176, lng: 13.4897 },
    municipalities: [
      { name: "Caconda", coordinates: { lat: -13.7333, lng: 15.0833 } },
      { name: "Cacula", coordinates: { lat: -13.7000, lng: 14.5000 } },
      { name: "Caluquembe", coordinates: { lat: -13.9667, lng: 14.8333 } },
      { name: "Chiange", coordinates: { lat: -14.2500, lng: 14.3333 } },
      { name: "Chibia", coordinates: { lat: -15.1667, lng: 13.8833 } },
      { name: "Chicomba", coordinates: { lat: -14.3833, lng: 15.0167 } },
      { name: "Chipindo", coordinates: { lat: -13.7167, lng: 14.9167 } },
      { name: "Cuvango", coordinates: { lat: -14.5000, lng: 16.0833 } },
      { name: "Humpata", coordinates: { lat: -15.0500, lng: 13.3333 } },
      { name: "Jamba", coordinates: { lat: -14.8333, lng: 16.1000 } },
      { name: "Lubango", coordinates: { lat: -14.9176, lng: 13.4897 } },
      { name: "Matala", coordinates: { lat: -15.4833, lng: 16.0833 } },
      { name: "Quilengues", coordinates: { lat: -13.9833, lng: 14.0167 } },
      { name: "Quipungo", coordinates: { lat: -14.8500, lng: 14.6667 } },
    ],
  },
  {
    name: "Lunda Norte",
    coordinates: { lat: -8.8048, lng: 20.7354 },
    municipalities: [
      { name: "Cambulo", coordinates: { lat: -8.5000, lng: 21.6000 } },
      { name: "Capenda-Camulemba", coordinates: { lat: -9.4333, lng: 18.4333 } },
      { name: "Caungula", coordinates: { lat: -9.3000, lng: 20.7000 } },
      { name: "Chitato", coordinates: { lat: -7.5667, lng: 20.5667 } },
      { name: "Cuango", coordinates: { lat: -8.2167, lng: 18.5833 } },
      { name: "Cuílo", coordinates: { lat: -7.9667, lng: 20.7667 } },
      { name: "Lóvua", coordinates: { lat: -8.7333, lng: 21.3667 } },
      { name: "Lubalo", coordinates: { lat: -8.6500, lng: 18.9000 } },
      { name: "Lucapa", coordinates: { lat: -8.8048, lng: 20.7354 } },
      { name: "Xá-Muteba", coordinates: { lat: -9.6500, lng: 20.6000 } },
    ],
  },
  {
    name: "Lunda Sul",
    coordinates: { lat: -9.6667, lng: 20.3833 },
    municipalities: [
      { name: "Cacolo", coordinates: { lat: -9.3333, lng: 19.1667 } },
      { name: "Dala", coordinates: { lat: -9.9667, lng: 20.7833 } },
      { name: "Muconda", coordinates: { lat: -10.2500, lng: 20.0667 } },
      { name: "Saurimo", coordinates: { lat: -9.6667, lng: 20.3833 } },
    ],
  },
  {
    name: "Malanje",
    coordinates: { lat: -9.5404, lng: 16.3411 },
    municipalities: [
      { name: "Cacuso", coordinates: { lat: -9.7667, lng: 15.0833 } },
      { name: "Calandula", coordinates: { lat: -9.2167, lng: 15.8500 } },
      { name: "Cambundi-Catembo", coordinates: { lat: -9.9667, lng: 17.1833 } },
      { name: "Cangandala", coordinates: { lat: -9.7500, lng: 16.7333 } },
      { name: "Caombo", coordinates: { lat: -9.2000, lng: 15.3667 } },
      { name: "Cuaba Nzogo", coordinates: { lat: -9.6500, lng: 15.7000 } },
      { name: "Cunda-Dia-Baze", coordinates: { lat: -9.3833, lng: 16.7000 } },
      { name: "Lubango", coordinates: { lat: -9.8000, lng: 16.3000 } },
      { name: "Luquembo", coordinates: { lat: -9.9333, lng: 16.1000 } },
      { name: "Malanje", coordinates: { lat: -9.5404, lng: 16.3411 } },
      { name: "Marimba", coordinates: { lat: -9.2167, lng: 16.2167 } },
      { name: "Massango", coordinates: { lat: -10.2500, lng: 16.2500 } },
      { name: "Mucari", coordinates: { lat: -10.2333, lng: 15.5000 } },
      { name: "Quela", coordinates: { lat: -8.9833, lng: 16.5833 } },
    ],
  },
  {
    name: "Moxico",
    coordinates: { lat: -11.6933, lng: 19.9256 },
    municipalities: [
      { name: "Alto Zambeze", coordinates: { lat: -11.4500, lng: 23.6167 } },
      { name: "Bundas", coordinates: { lat: -10.3667, lng: 21.9667 } },
      { name: "Camanongue", coordinates: { lat: -13.4833, lng: 20.3000 } },
      { name: "Cameia", coordinates: { lat: -11.7000, lng: 21.3000 } },
      { name: "Léua", coordinates: { lat: -11.7333, lng: 20.4667 } },
      { name: "Luau", coordinates: { lat: -10.7167, lng: 22.2333 } },
      { name: "Luacano", coordinates: { lat: -12.4667, lng: 20.3333 } },
      { name: "Luchazes", coordinates: { lat: -13.2833, lng: 20.6167 } },
      { name: "Moxico", coordinates: { lat: -11.6933, lng: 19.9256 } },
    ],
  },
  {
    name: "Namibe",
    coordinates: { lat: -15.1961, lng: 12.1522 },
    municipalities: [
      { name: "Bibala", coordinates: { lat: -14.9833, lng: 13.3833 } },
      { name: "Camucuio", coordinates: { lat: -15.4000, lng: 12.6667 } },
      { name: "Moçâmedes", coordinates: { lat: -15.1961, lng: 12.1522 } },
      { name: "Tômbwa", coordinates: { lat: -15.7667, lng: 11.9167 } },
      { name: "Virei", coordinates: { lat: -14.4167, lng: 13.3667 } },
    ],
  },
  {
    name: "Uíge",
    coordinates: { lat: -7.6086, lng: 15.0628 },
    municipalities: [
      { name: "Alto Cauale", coordinates: { lat: -7.7667, lng: 14.9167 } },
      { name: "Ambuíla", coordinates: { lat: -7.1333, lng: 15.4167 } },
      { name: "Bembe", coordinates: { lat: -7.1667, lng: 15.8000 } },
      { name: "Buengas", coordinates: { lat: -8.0333, lng: 15.1333 } },
      { name: "Bungo", coordinates: { lat: -8.1000, lng: 15.4333 } },
      { name: "Damba", coordinates: { lat: -7.5000, lng: 14.4500 } },
      { name: "Kimbele", coordinates: { lat: -7.7667, lng: 15.2833 } },
      { name: "Macocola", coordinates: { lat: -8.1667, lng: 16.0000 } },
      { name: "Milunga", coordinates: { lat: -7.4667, lng: 15.6667 } },
      { name: "Mucaba", coordinates: { lat: -7.2833, lng: 15.6333 } },
      { name: "Negage", coordinates: { lat: -7.7667, lng: 15.2667 } },
      { name: "Puri", coordinates: { lat: -7.3833, lng: 15.2500 } },
      { name: "Quimbele", coordinates: { lat: -7.6667, lng: 15.0000 } },
      { name: "Quitexe", coordinates: { lat: -7.3500, lng: 15.9833 } },
      { name: "Sanza Pombo", coordinates: { lat: -6.8167, lng: 15.4833 } },
      { name: "Songo", coordinates: { lat: -6.7667, lng: 15.6167 } },
      { name: "Uíge", coordinates: { lat: -7.6086, lng: 15.0628 } },
      { name: "Zombo", coordinates: { lat: -6.9500, lng: 14.8833 } },
    ],
  },
  {
    name: "Zaire",
    coordinates: { lat: -6.2692, lng: 14.2431 },
    municipalities: [
      { name: "Cuimba", coordinates: { lat: -5.9167, lng: 13.6167 } },
      { name: "Mbanza Kongo", coordinates: { lat: -6.2692, lng: 14.2431 } },
      { name: "Nóqui", coordinates: { lat: -5.8500, lng: 12.5333 } },
      { name: "Nzeto", coordinates: { lat: -7.2333, lng: 12.8667 } },
      { name: "Soio", coordinates: { lat: -6.1333, lng: 12.3667 } },
      { name: "Tomboco", coordinates: { lat: -6.7667, lng: 13.8333 } },
    ],
  },
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findClosestLocation(lat: number, lng: number): {
  province: string;
  municipality: string;
} {
  let closestProvince = angolaProvinces[0];
  let minProvinceDistance = Infinity;

  for (const province of angolaProvinces) {
    const distance = calculateDistance(
      lat,
      lng,
      province.coordinates.lat,
      province.coordinates.lng
    );
    if (distance < minProvinceDistance) {
      minProvinceDistance = distance;
      closestProvince = province;
    }
  }

  let closestMunicipality = closestProvince.municipalities[0];
  let minMunicipalityDistance = Infinity;

  for (const municipality of closestProvince.municipalities) {
    if (municipality.coordinates) {
      const distance = calculateDistance(
        lat,
        lng,
        municipality.coordinates.lat,
        municipality.coordinates.lng
      );
      if (distance < minMunicipalityDistance) {
        minMunicipalityDistance = distance;
        closestMunicipality = municipality;
      }
    }
  }

  return {
    province: closestProvince.name,
    municipality: closestMunicipality.name,
  };
}
