export interface CutPart {
  id: string;
  name: string;
  length: number; // in mm
  width: number;  // in mm
  quantity: number;
  thickness: number; // in mm
  edgeBanding: string; // descriptive edge banding info
  color?: string; // hex color or style class for visual representation
  allowRotation?: boolean; // true if grain direction doesn't matter
}

export interface OptimizedCutLayout {
  partId: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
}

export interface BoardLayout {
  boardIndex: number;
  width: number;
  height: number;
  placedCuts: OptimizedCutLayout[];
  freeRects: { x: number; y: number; width: number; height: number }[];
  efficiency: number; // percentage used
}

export interface MaterialCostItem {
  id: string;
  name: string;
  category: "placa" | "canto" | "herraje" | "otro";
  unit: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  notes?: string;
}

export interface BlueprintProject {
  id: string;
  title: string;
  category: string;
  description: string;
  dimensions: { height: number; width: number; depth: number }; // overall dimensions in mm
  difficulty: "Fácil" | "Medio" | "Avanzado";
  thickness: number;
  materialsList: { name: string; quantity: string; notes?: string }[];
  cutList: CutPart[];
  assemblySteps: string[];
  imagePrompt?: string; // prompt used to represent it visually
}
