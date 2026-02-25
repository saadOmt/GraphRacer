export const LEVELS = [
  // --- NIVEAUX DE BASE (1 à 4) ---
  {
    id: 1,
    title: "Décollage",
    description: "Une simple rampe pour commencer. Attrape l'étoile en hauteur ! (Indice: f(x) = 0.5 * x)",
    distance: 40,
    suggested: "0.5 * x",
    difficulty: "Tuto",
    fuelObjective: 10,
    memo: "💡 RAPPEL MATHS :\nUne fonction linéaire s'écrit f(x) = a * x.\n\n• Si a = 1, ça monte à 45°.\n• Si a = 0.5, ça monte doucement.\n• Si a = 2, ça monte très fort !",
    holes: [], 
    obstacles: [],
    stars: [{ x: 10, y: 0 }, { x: 30, y: 10 }]
  },
  {
    id: 2,
    title: "Le Grand Saut",
    description: "Un fossé avec un mur juste après. Il faut sauter loin et haut !",
    distance: 50,
    suggested: "0",
    difficulty: "Facile",
    fuelObjective: 30,
    memo: "💡 ASTUCE :\nPour faire un saut, tu peux utiliser une fonction en forme de cloche, ou juste monter très haut avant le trou !",
    holes: [{ start: 15, end: 25 }], 
    obstacles: [{ x: 28, y: 0, width: 2, height: 3 }],
    stars: [{ x: 20, y: 2 }, { x: 35, y: 0 }]
  },
  {
    id: 3,
    title: "La Parabole",
    description: "Ce mur est infranchissable en ligne droite. Utilise une courbe en cloche.",
    distance: 60,
    suggested: "-0.1 * (x-30)^2 + 15",
    difficulty: "Moyen",
    fuelObjective: 50,
    memo: "💡 LA PARABOLE :\nFormule : f(x) = -a * (x - b)^2 + c\n\n• Le '-' au début fait une bosse (et pas un creux).\n• 'b' déplace la bosse vers la droite.\n• 'c' définit la hauteur max.",
    holes: [],
    obstacles: [{ x: 30, y: 0, width: 4, height: 12 }],
    stars: [{ x: 32, y: 14 }, { x: 50, y: 0 }]
  },
  {
    id: 4,
    title: "Sinus Valley",
    description: "Un terrain accidenté. Il faut suivre le mouvement ! (Indice: Fonctions trigonométriques)",
    distance: 80,
    suggested: "5 * sin(x/5)",
    difficulty: "Difficile",
    fuelObjective: 60,
    memo: "💡 TRIGONOMÉTRIE :\nLa fonction sin(x) fait des vagues.\n\n• 5 * sin(x) : Vagues de 5m de haut.\n• sin(x / 5) : Vagues très larges (espacées).\n• sin(5 * x) : Vagues très serrées.",
    holes: [{ start: 10, end: 15 }, { start: 50, end: 55 }],
    obstacles: [{ x: 35, y: 0, width: 2, height: 5 }],
    stars: [{ x: 35, y: 7 }, { x: 65, y: -2 }]
  },

  // --- NOUVEAUX NIVEAUX (5 à 8) ---
  {
    id: 5,
    title: "La Pyramide",
    description: "Un grand mur pointu au milieu d'un trou. Fais une forme en pic parfait avec la valeur absolue.",
    distance: 50,
    suggested: "0",
    difficulty: "Moyen",
    fuelObjective: 40,
    memo: "💡 VALEUR ABSOLUE :\nLa fonction abs(x) transforme tout nombre en positif (forme en 'V').\n\nSi tu mets un '-' devant, comme -abs(x), ça s'inverse et forme une montagne parfaite (en '^') !",
    holes: [{ start: 10, end: 30 }],
    obstacles: [{ x: 19, y: 0, width: 2, height: 15 }], // Mur très fin et haut au milieu du trou
    stars: [{ x: 20, y: 17 }, { x: 40, y: 0 }] // Etoile juste au dessus du pic
  },
  {
    id: 6,
    title: "Les Tronçons",
    description: "Ici, une seule équation ne suffira pas. Divise ton trajet en plusieurs parties !",
    distance: 70,
    suggested: "0",
    difficulty: "Difficile",
    fuelObjective: 30,
    memo: "💡 OUTIL AVANCÉ :\nUtilise le bouton 'AJOUTER' en bas pour créer plusieurs fonctions à la suite.\n\nPar exemple :\n1. f(x) = 0 sur [0 ; 30]\n2. f(x) = x sur [30 ; 70]\nAttention : Le 'x' du deuxième tronçon repart de 0 !",
    holes: [{ start: 10, end: 20 }], // Premier obstacle : un trou
    obstacles: [{ x: 45, y: 0, width: 3, height: 10 }], // Deuxième obstacle : un mur
    stars: [{ x: 15, y: 5 }, { x: 46, y: 12 }]
  },
  {
    id: 7,
    title: "Slalom Géant",
    description: "Passe au-dessus de ces deux murs géants de manière fluide. La trigonométrie absolue ?",
    distance: 80,
    suggested: "15 * abs(sin(x/10))",
    difficulty: "Expert",
    fuelObjective: 45,
    memo: "💡 COMBINAISON :\nTu peux mélanger les fonctions ! Que se passe-t-il si tu mets un sinus dans une valeur absolue ?\n\nEssaie de taper : 15 * abs(sin(x/10))",
    holes: [],
    obstacles: [
        { x: 20, y: 0, width: 2, height: 12 },
        { x: 50, y: 0, width: 2, height: 12 }
    ],
    stars: [{ x: 21, y: 14 }, { x: 51, y: 14 }]
  },
  {
    id: 8,
    title: "L'Examen Final",
    description: "Le test ultime. Des trous, des murs, et une gestion de carburant très stricte. Bonne chance, Ingénieur.",
    distance: 100,
    suggested: "0",
    difficulty: "Cauchemar",
    fuelObjective: 20, // Très peu de carburant autorisé
    memo: "💡 COURAGE !\nPour ce niveau, analyse bien le terrain :\n1. Un saut au-dessus d'un trou.\n2. Une rampe pour passer le mur.\n3. Une parabole pour franchir le dernier grand gouffre.\n\nDivise le problème en 3 ou 4 segments !",
    holes: [
        { start: 15, end: 25 },
        { start: 60, end: 85 } // Un gouffre énorme à la fin
    ],
    obstacles: [
        { x: 40, y: 0, width: 3, height: 10 }
    ],
    stars: [{ x: 41, y: 12 }, { x: 72, y: 10 }] // Des étoiles perchées dans des endroits improbables
  }
];