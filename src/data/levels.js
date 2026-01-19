export const levelsData = [
  {
    id: 1,
    difficulty: 'facile',
    name: "INITIATION",
    desc: "Une courte distance pour tester le moteur.",
    distance: 20, // 20 mètres
    fuel: 100,    // 100% carburant
    suggested: "x / 2", // Indice pour le joueur
    stars: 0 // Par défaut
  },
  {
    id: 2,
    difficulty: 'facile',
    name: "LA BOSSE",
    desc: "Apprenez à gérer l'élan.",
    distance: 30,
    fuel: 100,
    suggested: "sin(x) + 2",
    stars: 0
  },
  {
    id: 3,
    difficulty: 'moyen',
    name: "LE GOUFFRE",
    desc: "Attention à ne pas tomber.",
    distance: 45,
    fuel: 80, // Moins de carburant !
    suggested: "x / 3 + 5",
    stars: 0
  },
  {
    id: 4,
    difficulty: 'difficile',
    name: "MONTAGNES RUSSES",
    desc: "Ça va secouer.",
    distance: 60,
    fuel: 60,
    suggested: "sin(x) * x / 5",
    stars: 0
  }
];