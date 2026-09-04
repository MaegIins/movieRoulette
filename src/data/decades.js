// id = année de début de la décennie, utilisée comme identifiant stable et passée à decadeRange()
// weight = poids relatif du tirage, les décennies récentes sont un peu favorisées
export const DECADES = [
  { id: 1920, weight: 1, labels: { fr: 'Années 1920', en: '1920s' } },
  { id: 1930, weight: 1, labels: { fr: 'Années 1930', en: '1930s' } },
  { id: 1940, weight: 1, labels: { fr: 'Années 1940', en: '1940s' } },
  { id: 1950, weight: 1, labels: { fr: 'Années 1950', en: '1950s' } },
  { id: 1960, weight: 1, labels: { fr: 'Années 1960', en: '1960s' } },
  { id: 1970, weight: 1, labels: { fr: 'Années 1970', en: '1970s' } },
  { id: 1980, weight: 2, labels: { fr: 'Années 1980', en: '1980s' } },
  { id: 1990, weight: 2, labels: { fr: 'Années 1990', en: '1990s' } },
  { id: 2000, weight: 2, labels: { fr: 'Années 2000', en: '2000s' } },
  { id: 2010, weight: 2, labels: { fr: 'Années 2010', en: '2010s' } },
  { id: 2020, weight: 2, labels: { fr: 'Années 2020', en: '2020s' } },
]
