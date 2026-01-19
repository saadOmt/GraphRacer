// Constante : Combien de pixels pour 1 mètre ?
// Cela permet d'avoir une belle courbe, pas un truc tout petit.
export const SCALE = 40; 

export const generateCurve = (equationStr, distance) => {
  try {
    const points = [];
    
    // 1. Nettoyage de l'équation
    // On remplace les mots humains par du code JS
    let safeEquation = equationStr.toLowerCase().trim();
    
    if (!safeEquation) return { error: "L'équation est vide." };

    safeEquation = safeEquation
      .replace(/sin/g, 'Math.sin')
      .replace(/cos/g, 'Math.cos')
      .replace(/tan/g, 'Math.tan')
      .replace(/abs/g, 'Math.abs')
      .replace(/sqrt/g, 'Math.sqrt')
      .replace(/pow/g, 'Math.pow')
      .replace(/pi/g, 'Math.PI')
      .replace(/\^/g, '**'); // Transforme x^2 en x**2 (compréhensible par JS)

    // 2. Création de la fonction mathématique
    // "new Function" est comme eval() mais cantonné à une fonction, un peu plus propre.
    const f = new Function('x', `return ${safeEquation}`);

    // 3. Génération des points
    // On avance de 0.1 mètre par 0.1 mètre
    for (let x = 0; x <= distance; x += 0.1) {
      const y = -f(x); // IMPORTANT : On inverse Y car en informatique, Y descend vers le bas !
      
      // Vérification de sécurité (si on divise par zéro)
      if (!isFinite(y) || isNaN(y)) {
        continue; // On ignore ce point buggé
      }

      points.push({
        x: x * SCALE,       // Position écran X
        y: y * SCALE,       // Position écran Y
        realX: x,           // Vraie distance (mètres)
        realY: -y           // Vraie hauteur (mètres)
      });
    }

    return { points, error: null };

  } catch (err) {
    return { points: [], error: "Erreur de syntaxe dans l'équation." };
  }
};