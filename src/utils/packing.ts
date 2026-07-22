import { CutPart, BoardLayout, OptimizedCutLayout } from "../types";

/**
 * Heurística de Empaquetado en Estantes (Shelf Next-Fit Decidido)
 * Adaptado para tableros de carpintería considerando el ancho de corte del disco (sierra).
 */
export function optimizeCuts(
  parts: CutPart[],
  boardWidth: number = 2440,
  boardHeight: number = 1830,
  bladeWidth: number = 4
): BoardLayout[] {
  // 1. Expandir las piezas según su cantidad
  const flatParts: { id: string; partId: string; name: string; w: number; h: number; allowRotation: boolean }[] = [];
  
  parts.forEach((part) => {
    for (let q = 0; q < part.quantity; q++) {
      flatParts.push({
        id: `${part.id}-${q}`,
        partId: part.id,
        name: part.name,
        w: part.width,
        h: part.length,
        allowRotation: part.allowRotation ?? true,
      });
    }
  });

  // 2. Ordenar las piezas por área descendente para un empaquetado más óptimo
  flatParts.sort((a, b) => (b.w * b.h) - (a.w * a.h));

  const boards: BoardLayout[] = [];

  // Función para agregar un nuevo tablero vacío
  function createNewBoard(index: number): BoardLayout {
    return {
      boardIndex: index,
      width: boardWidth,
      height: boardHeight,
      placedCuts: [],
      freeRects: [],
      efficiency: 0,
    };
  }

  // Estructura interna para rastrear estantes por tablero
  interface Shelf {
    y: number;
    height: number;
    currentX: number;
  }

  const boardShelves: Map<number, Shelf[]> = new Map();

  flatParts.forEach((part) => {
    let placed = false;

    // Intentar ubicar en tableros existentes
    for (let bIndex = 0; bIndex < boards.length; bIndex++) {
      const board = boards[bIndex];
      const shelves = boardShelves.get(bIndex) || [];

      // Intentar colocar en algún estante existente de este tablero
      for (let sIndex = 0; sIndex < shelves.length; sIndex++) {
        const shelf = shelves[sIndex];
        
        // Probar orientación normal
        let fitsNormal = 
          shelf.currentX + part.w <= boardWidth && 
          part.h <= shelf.height;
        
        // Probar orientación rotada (si se permite)
        let fitsRotated = 
          part.allowRotation && 
          shelf.currentX + part.h <= boardWidth && 
          part.w <= shelf.height;

        if (fitsNormal || fitsRotated) {
          const finalW = fitsNormal ? part.w : part.h;
          const finalH = fitsNormal ? part.h : part.w;
          const rotated = !fitsNormal;

          board.placedCuts.push({
            partId: part.partId,
            name: part.name,
            x: shelf.currentX,
            y: shelf.y,
            width: finalW,
            height: finalH,
            rotated,
          });

          // Avanzar la coordenada X del estante, sumando el ancho de la pieza y el ancho de la sierra
          shelf.currentX += finalW + bladeWidth;
          placed = true;
          break;
        }
      }

      if (placed) break;

      // Si no cupo en ningún estante existente, probar crear un estante nuevo arriba en este mismo tablero
      const lastShelf = shelves[shelves.length - 1];
      const nextY = lastShelf ? lastShelf.y + lastShelf.height + bladeWidth : 0;
      
      // Probar si el estante nuevo cabe verticalmente
      let fitsNormalNewShelf = nextY + part.h <= boardHeight && part.w <= boardWidth;
      let fitsRotatedNewShelf = part.allowRotation && nextY + part.w <= boardHeight && part.h <= boardWidth;

      if (fitsNormalNewShelf || fitsRotatedNewShelf) {
        const finalW = fitsNormalNewShelf ? part.w : part.h;
        const finalH = fitsNormalNewShelf ? part.h : part.w;
        const rotated = !fitsNormalNewShelf;

        const newShelf: Shelf = {
          y: nextY,
          height: finalH,
          currentX: finalW + bladeWidth,
        };

        shelves.push(newShelf);
        boardShelves.set(bIndex, shelves);

        board.placedCuts.push({
          partId: part.partId,
          name: part.name,
          x: 0,
          y: nextY,
          width: finalW,
          height: finalH,
          rotated,
        });

        placed = true;
        break;
      }
    }

    // Si aún no se colocó, crear un tablero nuevo
    if (!placed) {
      const newBIndex = boards.length;
      const newBoard = createNewBoard(newBIndex);
      
      // La pieza define la altura del primer estante
      const normalW = part.w <= boardWidth && part.h <= boardHeight;
      const rotateW = part.allowRotation && part.h <= boardWidth && part.w <= boardHeight;
      
      const finalW = normalW ? part.w : (rotateW ? part.h : part.w);
      const finalH = normalW ? part.h : (rotateW ? part.w : part.h);
      const rotated = !normalW && rotateW;

      const firstShelf: Shelf = {
        y: 0,
        height: finalH,
        currentX: finalW + bladeWidth,
      };

      boardShelves.set(newBIndex, [firstShelf]);
      newBoard.placedCuts.push({
        partId: part.partId,
        name: part.name,
        x: 0,
        y: 0,
        width: finalW,
        height: finalH,
        rotated,
      });

      boards.push(newBoard);
    }
  });

  // 3. Calcular la eficiencia de cada tablero
  boards.forEach((board) => {
    const totalBoardArea = boardWidth * boardHeight;
    const totalCutArea = board.placedCuts.reduce((acc, cut) => acc + (cut.width * cut.height), 0);
    board.efficiency = parseFloat(((totalCutArea / totalBoardArea) * 100).toFixed(1));
  });

  return boards;
}
