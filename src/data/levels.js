export const LEVELS = [
  {
    id: 1,
    title: "Initiation",
    description: "Le terrain est plat. Appuie sur la flèche DROITE pour avancer.",
    distance: 40,
    suggested: "0",
    difficulty: "Tuto",
    holes: [], 
    obstacles: [],
    stars: [{ x: 20, y: 0 }, { x: 30, y: 0 }]
  },
  {
    id: 2,
    title: "Le Fossé",
    description: "Un trou ! Écris '0' pour créer un pont, ou fais un saut.",
    distance: 50,
    suggested: "0",
    difficulty: "Facile",
    holes: [
        { start: 20, end: 30 } 
    ], 
    obstacles: [],
    stars: [{ x: 25, y: 5 }]
  },
  {
    id: 3,
    title: "Le Mur",
    description: "Un mur bloque la route. Passe par dessus (ex: une parabole).",
    distance: 60,
    suggested: "0",
    difficulty: "Moyen",
    holes: [],
    obstacles: [
        { x: 30, y: 0, width: 3, height: 5 } 
    ],
    stars: [{ x: 31, y: 8 }]
  },
  {
    id: 4,
    title: "Grand Canyon",
    description: "Plusieurs fonctions nécessaires pour traverser.",
    distance: 100,
    suggested: "0",
    difficulty: "Difficile",
    holes: [
        { start: 20, end: 35 },
        { start: 60, end: 75 }
    ],
    obstacles: [],
    stars: [{ x: 27, y: 5 }, { x: 67, y: 5 }]
  }
];