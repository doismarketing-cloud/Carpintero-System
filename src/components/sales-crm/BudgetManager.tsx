import React, { useState, useEffect } from "react";
import { CRMBudget, CRMClient, BudgetStatus, CalculationMethod, BudgetRoom, BudgetItem } from "./types";
import { 
  ClipboardList, 
  Plus, 
  Trash2, 
  Check, 
  ChevronRight, 
  DollarSign, 
  HelpCircle, 
  Users, 
  FileText, 
  FolderPlus, 
  Edit3, 
  ArrowRight,
  Eye,
  CheckCircle,
  AlertCircle,
  Globe,
  Printer,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CutPart } from "../../types";

interface BudgetManagerProps {
  budgets: CRMBudget[];
  clients: CRMClient[];
  importedParts?: CutPart[];
  onSaveBudget: (budget: CRMBudget) => void;
  onDeleteBudget: (id: string) => void;
  onNavigateToTab: (tab: string) => void;
  selectedBudgetExternal: CRMBudget | null;
  onClearExternalSelection: () => void;
  onGenerateContract: (budget: CRMBudget) => void;
}

export default function BudgetManager({
  budgets,
  clients,
  importedParts,
  onSaveBudget,
  onDeleteBudget,
  onNavigateToTab,
  selectedBudgetExternal,
  onClearExternalSelection,
  onGenerateContract
}: BudgetManagerProps) {
  const [activeBudget, setActiveBudget] = useState<CRMBudget | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | BudgetStatus>("all");

  // Portal States
  const [showClientPortal, setShowClientPortal] = useState<boolean>(false);
  const [approverName, setApproverName] = useState("");
  const [isApprovedSuccess, setIsApprovedSuccess] = useState(false);

  // Form States for creating/editing budgets
  const [title, setTitle] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Transferencia Bancaria");
  const [notes, setNotes] = useState("");
  const [rooms, setRooms] = useState<BudgetRoom[]>([]);
  const [status, setStatus] = useState<BudgetStatus>("pending");
  const [approvedBy, setApprovedBy] = useState("");

  // Room & Item Creation Helpers
  const [newRoomName, setNewRoomName] = useState("");

  // Handle external selection (from home or client tab)
  useEffect(() => {
    if (selectedBudgetExternal) {
      setActiveBudget(selectedBudgetExternal);
      setIsEditing(false);
      onClearExternalSelection();
    }
  }, [selectedBudgetExternal]);

  // If parts are imported, suggest pre-filling a kitchen/wardrobe budget!
  useEffect(() => {
    if (importedParts && importedParts.length > 0) {
      // Calculate a suggested material cost based on parts area
      const boardWidth = 2.44;
      const boardHeight = 1.83;
      const singleBoardArea = boardWidth * boardHeight;
      const totalPartsArea = importedParts.reduce((acc, p) => acc + ((p.width / 1000) * (p.length / 1000) * p.quantity), 0);
      const estimatedBoards = Math.max(1, Math.ceil((totalPartsArea * 1.25) / singleBoardArea));
      const materialCostEstimate = estimatedBoards * 65.0; // $65 per board typical

      // Prepare a room with imported items
      const importedItem: BudgetItem = {
        id: `ii-${Date.now()}`,
        description: `Mueble Diseñado en IA (${importedParts.length} piezas)`,
        calculationMethod: "material_hours_markup",
        materialCost: Math.round(materialCostEstimate),
        productionHours: Math.max(4, Math.round(importedParts.length * 1.5)),
        hourlyRate: 25,
        markupPercent: 40,
        options: "Melamina de diseño premium, cantos perfilados.",
        totalPrice: Math.round((materialCostEstimate + Math.max(4, Math.round(importedParts.length * 1.5)) * 25) * 1.40)
      };

      // Set up a default budget draft
      setTitle("Proyecto Importado del Diseñador");
      setSelectedClientId(clients[0]?.id || "");
      setPaymentMethod("Transferencia (50% anticipo)");
      setNotes(`Presupuesto calculado automáticamente a partir de ${importedParts.length} piezas importadas.`);
      setRooms([
        {
          id: `room-${Date.now()}`,
          name: "Módulo Diseñado",
          items: [importedItem]
        }
      ]);
      setStatus("pending");
      
      // Open editor
      setActiveBudget({
        id: `b-draft-${Date.now()}`,
        title: "Proyecto Importado del Diseñador",
        clientId: clients[0]?.id || "",
        clientName: clients[0]?.name || "",
        status: "pending",
        createdAt: new Date().toISOString(),
        paymentMethod: "Transferencia (50% anticipo)",
        notes: `Presupuesto calculado automáticamente a partir de ${importedParts.length} piezas importadas.`,
        rooms: [{ id: `room-${Date.now()}`, name: "Módulo Diseñado", items: [importedItem] }],
        totalPrice: importedItem.totalPrice
      });
      setIsEditing(true);
    }
  }, [importedParts]);

  const handleStartNewBudget = () => {
    setTitle("Nuevo Presupuesto");
    setSelectedClientId(clients[0]?.id || "");
    setPaymentMethod("Efectivo / Transferencia");
    setNotes("");
    setRooms([]);
    setStatus("pending");
    setApprovedBy("");
    
    const newBudgetDraft: CRMBudget = {
      id: `b-${Date.now()}`,
      title: "Nuevo Presupuesto",
      clientId: clients[0]?.id || "",
      clientName: clients[0]?.name || "Cliente Particular",
      status: "pending",
      createdAt: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentMethod: "Efectivo / Transferencia",
      notes: "",
      rooms: [],
      totalPrice: 0
    };
    setActiveBudget(newBudgetDraft);
    setIsEditing(true);
  };

  const handleStartEdit = () => {
    if (!activeBudget) return;
    setTitle(activeBudget.title);
    setSelectedClientId(activeBudget.clientId);
    setPaymentMethod(activeBudget.paymentMethod);
    setNotes(activeBudget.notes || "");
    setRooms(activeBudget.rooms);
    setStatus(activeBudget.status);
    setApprovedBy(activeBudget.approvedBy || "");
    setIsEditing(true);
  };

  const handleAddRoom = () => {
    if (!newRoomName.trim()) return;
    const newRoom: BudgetRoom = {
      id: `room-${Date.now()}-${Math.random()}`,
      name: newRoomName.trim(),
      items: []
    };
    setRooms([...rooms, newRoom]);
    setNewRoomName("");
  };

  const handleDeleteRoom = (roomId: string) => {
    setRooms(rooms.filter(r => r.id !== roomId));
  };

  const handleAddItemToRoom = (roomId: string) => {
    const newItem: BudgetItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      description: "Nuevo Artículo a Medida",
      calculationMethod: "linear_meter",
      length: 1.0,
      linearMeterPrice: 500,
      options: "Acabado mate, herrajes estándar",
      totalPrice: 500
    };

    setRooms(rooms.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          items: [...room.items, newItem]
        };
      }
      return room;
    }));
  };

  const handleDeleteItemFromRoom = (roomId: string, itemId: string) => {
    setRooms(rooms.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          items: room.items.filter(item => item.id !== itemId)
        };
      }
      return room;
    }));
  };

  const calculateItemPrice = (item: Omit<BudgetItem, "totalPrice"> & { totalPrice?: number }): number => {
    switch (item.calculationMethod) {
      case "material_markup":
        const cost = item.materialCost || 0;
        const markup = 1 + (item.markupPercent || 0) / 100;
        return Math.round(cost * markup);
      case "linear_meter":
        return Math.round((item.length || 0) * (item.linearMeterPrice || 0));
      case "sq_meter":
        return Math.round((item.width || 0) * (item.height || 0) * (item.sqMeterPrice || 0));
      case "cu_meter":
        return Math.round((item.width || 0) * (item.height || 0) * (item.height || 0) * (item.cuMeterPrice || 0));
      case "material_hours_markup":
        const mat = item.materialCost || 0;
        const labor = (item.productionHours || 0) * (item.hourlyRate || 0);
        const mk = 1 + (item.markupPercent || 0) / 100;
        return Math.round((mat + labor) * mk);
      case "hourly_rate":
        const standardRate = Number(localStorage.getItem("melamina_standard_hourly_rate")) || 1200;
        const currentRate = item.hourlyRate || standardRate;
        return Math.round((item.productionHours || 0) * currentRate);
      case "manual":
        return item.manualPrice || 0;
      default:
        return 0;
    }
  };

  const handleUpdateItem = (roomId: string, itemId: string, field: keyof BudgetItem, value: any) => {
    setRooms(rooms.map(room => {
      if (room.id === roomId) {
        const updatedItems = room.items.map(item => {
          if (item.id === itemId) {
            const partialItem = { ...item, [field]: value };
            const finalPrice = calculateItemPrice(partialItem);
            return { ...partialItem, totalPrice: finalPrice };
          }
          return item;
        });
        return { ...room, items: updatedItems };
      }
      return room;
    }));
  };

  const calculateGrandTotal = (): number => {
    return rooms.reduce((acc, r) => {
      return acc + r.items.reduce((sum, item) => {
        if (item.isOptional && !item.isIncluded) return sum;
        return sum + item.totalPrice;
      }, 0);
    }, 0);
  };

  const handleSaveBudget = () => {
    if (!title.trim()) {
      alert("Por favor ingresa un título descriptivo para el presupuesto.");
      return;
    }
    const client = clients.find(c => c.id === selectedClientId);
    const calculatedTotal = calculateGrandTotal();

    const budgetToSave: CRMBudget = {
      id: activeBudget?.id || `b-${Date.now()}`,
      title: title.trim(),
      clientId: selectedClientId,
      clientName: client ? client.name : "Cliente Particular",
      status,
      expirationDate: activeBudget?.expirationDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentMethod,
      notes,
      rooms,
      totalPrice: calculatedTotal,
      createdAt: activeBudget?.createdAt || new Date().toISOString(),
      ...(status === "approved" ? {
        approvedBy: approvedBy || (client ? client.name : "Cliente Particular"),
        approvedAt: activeBudget?.approvedAt || new Date().toISOString()
      } : {})
    };

    onSaveBudget(budgetToSave);
    setActiveBudget(budgetToSave);
    setIsEditing(false);
  };

  const filteredBudgets = budgets.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (showClientPortal && activeBudget) {
    const activeRooms = activeBudget.rooms;
    
    // Recalculate customer total price based on active itemization choices
    const currentGrandTotal = activeRooms.reduce((acc, r) => {
      return acc + r.items.reduce((sum, item) => {
        if (item.isOptional && !item.isIncluded) return sum;
        return sum + item.totalPrice;
      }, 0);
    }, 0);

    // Toggle item in Client View
    const handleClientToggleItem = (roomId: string, itemId: string) => {
      const updatedRooms = activeBudget.rooms.map(r => {
        if (r.id === roomId) {
          const updatedItems = r.items.map(item => {
            if (item.id === itemId) {
              return { ...item, isIncluded: !item.isIncluded };
            }
            return item;
          });
          return { ...r, items: updatedItems };
        }
        return r;
      });

      const updatedBudget = {
        ...activeBudget,
        rooms: updatedRooms,
        totalPrice: updatedRooms.reduce((acc, r) => {
          return acc + r.items.reduce((sum, item) => {
            if (item.isOptional && !item.isIncluded) return sum;
            return sum + item.totalPrice;
          }, 0);
        }, 0)
      };

      setActiveBudget(updatedBudget);
      onSaveBudget(updatedBudget);
    };

    // Client confirms online approval
    const handleClientApprove = () => {
      if (!approverName.trim()) {
        alert("Por favor, ingresa tu nombre completo para firmar la aprobación.");
        return;
      }

      const finalRooms = activeBudget.rooms;
      const finalTotal = currentGrandTotal;

      const approvedBudget: CRMBudget = {
        ...activeBudget,
        status: "approved",
        approvedBy: approverName.trim(),
        approvedAt: new Date().toISOString(),
        totalPrice: finalTotal,
        rooms: finalRooms
      };

      onSaveBudget(approvedBudget);
      setActiveBudget(approvedBudget);
      setIsApprovedSuccess(true);
      
      // Auto close portal
      setTimeout(() => {
        setIsApprovedSuccess(false);
        setShowClientPortal(false);
      }, 3000);
    };

    // Retrieve company settings from local storage
    const companyName = localStorage.getItem("company_name") || "Carpintería de Diseño";
    const companyPhone = localStorage.getItem("company_phone") || "+54 11 9876-5432";
    const companyEmail = localStorage.getItem("company_email") || "contacto@carpinteria.com";
    const companyAddress = localStorage.getItem("company_address") || "Av. Industrial 4500, Córdoba";

    return (
      <div className="bg-slate-50 min-h-screen text-slate-800 p-4 md:p-8 flex justify-center items-start font-sans" id="printable-budget-view">
        <style>{`
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            .no-print {
              display: none !important;
            }
            .print-container {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              max-width: 100% !important;
            }
          }
        `}</style>

        {isApprovedSuccess && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in no-print">
            <div className="bg-white p-8 rounded-3xl text-center max-w-sm w-full mx-4 border border-slate-200 shadow-2xl space-y-4 animate-scale-up">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-black">
                ✓
              </div>
              <h3 className="text-lg font-black text-slate-900">¡Presupuesto Aprobado!</h3>
              <p className="text-slate-500 text-xs">El presupuesto ha sido firmado con éxito y se guardó en el CRM. El taller ha sido notificado.</p>
            </div>
          </div>
        )}
        
        <div className="max-w-4xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden print-container">
          {/* Header Bar */}
          <div className="bg-slate-900 text-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400">Portal de Aprobación en Línea</span>
              <h1 className="text-2xl font-black">{companyName}</h1>
              <p className="text-slate-400 text-xs">{companyAddress} | {companyPhone} | {companyEmail}</p>
            </div>
            
            <div className="flex items-center gap-3 no-print">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border border-slate-700"
              >
                <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
              </button>
              <button
                onClick={() => setShowClientPortal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border border-slate-700"
              >
                <ArrowLeft className="w-4 h-4" /> Volver al CRM
              </button>
            </div>
          </div>

          <div className="p-6 md:p-10 space-y-8">
            
            {/* Status alerts */}
            {activeBudget.status === "approved" ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">¡Presupuesto Aprobado Digitalmente!</h4>
                  <p className="text-emerald-700 font-medium">Aprobado por {activeBudget.approvedBy} el {new Date(activeBudget.approvedAt || "").toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl text-xs flex items-center gap-3 no-print">
                <HelpCircle className="w-6 h-6 text-blue-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Presupuesto en espera de confirmación</h4>
                  <p className="text-blue-700 font-medium">Puedes revisar el detalle por habitación, activar/desactivar los módulos opcionales y firmar tu aprobación en línea.</p>
                </div>
              </div>
            )}

            {/* General info block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-slate-100 pb-8">
              <div className="space-y-2">
                <h3 className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider">Información del Cliente</h3>
                <p className="text-base font-black text-slate-900">{activeBudget.clientName}</p>
                <p className="text-xs text-slate-500">Proyecto: <strong className="text-slate-800">{activeBudget.title}</strong></p>
                <p className="text-xs text-slate-500">Forma de pago propuesta: <strong className="text-slate-800">{activeBudget.paymentMethod}</strong></p>
              </div>
              <div className="space-y-2 md:text-right">
                <h3 className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider">Fecha de Emisión</h3>
                <p className="text-base font-black text-slate-900">{new Date(activeBudget.createdAt).toLocaleDateString()}</p>
                <p className="text-xs text-slate-500">Presupuesto Vence: <strong>{new Date(new Date(activeBudget.createdAt).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong></p>
                <p className="text-xs text-slate-400">Validez de 15 días debido a actualizaciones de costos de herrajes y madera.</p>
              </div>
            </div>

            {/* Room list and interactive items */}
            <div className="space-y-6">
              <h2 className="font-black text-slate-900 text-lg">Módulos de Carpintería Cotizados</h2>
              
              {activeRooms.map((room) => (
                <div key={room.id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-slate-50">
                  <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <span className="font-extrabold text-slate-800 text-sm">{room.name}</span>
                    <span className="font-bold text-slate-600 font-mono text-xs">
                      Subtotal: ${room.items.reduce((sum, item) => {
                        if (item.isOptional && !item.isIncluded) return sum;
                        return sum + item.totalPrice;
                      }, 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 bg-white">
                    {room.items.map((item) => {
                      const isItemOptional = !!item.isOptional;
                      const isItemIncluded = !!item.isIncluded;
                      
                      return (
                        <div key={item.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-sm">{item.description}</h4>
                              {isItemOptional && (
                                <span className="px-2 py-0.5 bg-blue-100 border border-blue-200 text-blue-800 rounded-full font-bold text-[9px] uppercase tracking-wide">
                                  Opcional Adicional
                                </span>
                              )}
                            </div>
                            {item.options && (
                              <p className="text-xs text-slate-500 font-medium">Especificaciones: <span className="italic text-slate-700">{item.options}</span></p>
                            )}
                          </div>

                          <div className="flex items-center gap-6 justify-between md:justify-end">
                            {/* Interactive toggle for optional item */}
                            {isItemOptional && activeBudget.status !== "approved" ? (
                              <button
                                onClick={() => handleClientToggleItem(room.id, item.id)}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer border transition-all no-print ${
                                  isItemIncluded
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {isItemIncluded ? (
                                  <>
                                    <Check className="w-4 h-4 text-emerald-600" /> Incluido en pedido
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4 text-slate-400" /> Añadir a mi pedido
                                  </>
                                )}
                              </button>
                            ) : isItemOptional ? (
                              <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                                isItemIncluded 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                  : "bg-slate-100 text-slate-400 border-slate-200 line-through"
                              }`}>
                                {isItemIncluded ? "Incluido" : "No incluido"}
                              </span>
                            ) : null}

                            <div className="text-right min-w-[100px]">
                              <span className={`font-black font-mono text-sm block ${
                                isItemOptional && !isItemIncluded ? "text-slate-400 line-through" : "text-slate-900"
                              }`}>
                                ${item.totalPrice.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Display Footer */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-md">
              <div>
                <h3 className="text-sm font-bold text-slate-300 font-sans">IMPORTE TOTAL TOTALIZADO</h3>
                <p className="text-[10px] text-slate-400 mt-1 font-medium font-sans">Los opcionales se calculan automáticamente en tiempo real.</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black font-mono block">
                  ${currentGrandTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-300 font-medium">Suma final del presupuesto a medida</span>
              </div>
            </div>

            {/* Client Approval and Signature Panel */}
            <div className="border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 no-print bg-slate-50">
              <div className="border-b border-slate-200 pb-4">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  Firma de Aprobación Digital
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Al presionar "Confirmar Aprobación" usted autoriza al taller la compra de materiales y el inicio del despiece del mobiliario.</p>
              </div>

              {activeBudget.status === "approved" ? (
                <div className="text-center py-6 text-emerald-700 font-bold text-sm bg-emerald-50 rounded-2xl border border-emerald-200">
                  ✓ Este presupuesto ya ha sido firmado y aprobado por {activeBudget.approvedBy}.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-8 space-y-2">
                    <label className="font-bold text-xs text-slate-700 block">Nombre Completo del Cliente Autorizante</label>
                    <input
                      type="text"
                      placeholder="Ej: Juan Carlos Pérez"
                      value={approverName}
                      onChange={(e) => setApproverName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-350 rounded-xl bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 text-xs"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <button
                      onClick={handleClientApprove}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Confirmar Aprobación
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Signature fields for print only */}
            <div className="hidden print:grid grid-cols-2 gap-12 pt-20 text-center text-xs">
              <div className="space-y-1">
                <div className="border-b border-slate-300 h-10 w-4/5 mx-auto"></div>
                <p className="font-bold">Firma {companyName}</p>
              </div>
              <div className="space-y-1">
                <div className="border-b border-slate-300 h-10 w-4/5 mx-auto"></div>
                <p className="font-bold">Firma Cliente Aceptante</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* List vs Detail toggle */}
      {!isEditing && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              Gestor de Presupuestos
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">Genera cotizaciones precisas por habitación y asocia fletes o mano de obra con fórmulas avanzadas.</p>
          </div>

          <button
            onClick={handleStartNewBudget}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Crear Nuevo Presupuesto
          </button>
        </div>
      )}

      {/* Primary view splitter */}
      {isEditing ? (
        // EDITOR MODE (highly interactive, nested form for spaces and metrics)
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900">Editar Detalle de Presupuesto</h3>
              <p className="text-slate-500 text-xs">Calcula con precisión ingresando detalles por ambientes.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (confirm("¿Estás seguro de cancelar? Se perderán los cambios no guardados.")) {
                    setIsEditing(false);
                  }
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveBudget}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer animate-pulse"
              >
                Guardar Presupuesto
              </button>
            </div>
          </div>

          {/* Form parameters fields grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Título / Nombre del Proyecto</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Bajo Mesada Cocina de Alejandra"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Asociar Cliente Registrado</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800"
              >
                <option value="">-- Selecciona un Cliente --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.company || "Particular"})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Forma / Método de Pago Acordado</label>
              <input
                type="text"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder="Ej: Transferencia Bancaria (50% anticipo)"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-bold text-slate-700">Notas / Detalles Particulares</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Añade especificaciones del color de la melamina, marcas de guías o bisagras recomendadas..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Estado</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BudgetStatus)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 font-bold"
                >
                  <option value="pending">⏳ Pendiente</option>
                  <option value="approved">✅ Aprobado</option>
                  <option value="unanswered">❌ No respondido</option>
                </select>
              </div>

              {status === "approved" && (
                <div className="space-y-1 animate-fade-in">
                  <label className="font-bold text-emerald-800">¿Quién Aprobó el Proyecto?</label>
                  <input
                    type="text"
                    value={approvedBy}
                    onChange={(e) => setApprovedBy(e.target.value)}
                    placeholder="Ej: Alejandra Gómez (Firma)"
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg bg-emerald-50 text-emerald-950 font-semibold"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Rooms and Items Creator Interface */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Organización de Muebles por Habitación</h4>
                <p className="text-slate-500 text-xs mt-0.5">Divide el proyecto en habitaciones (ej: Cocina, Baño) para crear cotizaciones claras.</p>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ej: Baño Secundario"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 w-44"
                />
                <button
                  type="button"
                  onClick={handleAddRoom}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" /> Crear Habitación
                </button>
              </div>
            </div>

            {/* Loop through custom rooms */}
            <div className="space-y-6">
              {rooms.map((room) => {
                const roomTotal = room.items.reduce((sum, item) => sum + item.totalPrice, 0);
                
                return (
                  <div key={room.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="bg-slate-100 p-4 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800 text-sm">{room.name}</span>
                        <span className="text-slate-400 font-bold font-mono">
                          (${roomTotal.toLocaleString()})
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleAddItemToRoom(room.id)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Agregar Artículo
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRoom(room.id)}
                          className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                          title="Eliminar habitación completa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Room's item rows list */}
                    <div className="p-4 space-y-4 divide-y divide-slate-100 bg-white">
                      {room.items.map((item, index) => (
                        <div key={item.id} className={`${index > 0 ? "pt-4" : ""} grid grid-cols-1 lg:grid-cols-12 gap-4 items-end text-slate-700`}>
                          
                          {/* Item Name */}
                          <div className="lg:col-span-3 space-y-1">
                            <label className="font-bold text-[10px] text-slate-500 uppercase">Nombre / Descripción del Artículo</label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleUpdateItem(room.id, item.id, "description", e.target.value)}
                              placeholder="Ej: Alacena superior con repisas"
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-md font-semibold"
                            />
                          </div>

                          {/* Calculation Method Selection */}
                          <div className="lg:col-span-2 space-y-1">
                            <label className="font-bold text-[10px] text-slate-500 uppercase">Método de Cálculo</label>
                            <select
                              value={item.calculationMethod}
                              onChange={(e) => handleUpdateItem(room.id, item.id, "calculationMethod", e.target.value as CalculationMethod)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-[11px]"
                            >
                              <option value="linear_meter">Metro Lineal</option>
                              <option value="sq_meter">Metro Cuadrado (m²)</option>
                              <option value="cu_meter">Metro Cúbico (m³)</option>
                              <option value="material_markup">Material + % Ganancia</option>
                              <option value="material_hours_markup">Material + Horas + %</option>
                              <option value="hourly_rate">Mano de Obra (Horas)</option>
                              <option value="manual">Precio Fijo Manual</option>
                            </select>
                          </div>

                          {/* Formula calculation parameters based on selection */}
                          <div className="lg:col-span-4 grid grid-cols-3 gap-2">
                            {item.calculationMethod === "material_markup" && (
                              <>
                                <div className="space-y-1">
                                  <label className="font-bold text-[9px] text-slate-500">Costo Mat. ($)</label>
                                  <input
                                    type="number"
                                    value={item.materialCost || 0}
                                    onChange={(e) => handleUpdateItem(room.id, item.id, "materialCost", Number(e.target.value))}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-md font-mono"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="font-bold text-[9px] text-slate-500">% Ganancia</label>
                                  <input
                                    type="number"
                                    value={item.markupPercent || 0}
                                    onChange={(e) => handleUpdateItem(room.id, item.id, "markupPercent", Number(e.target.value))}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-md font-mono"
                                  />
                                </div>
                              </>
                            )}

                            {item.calculationMethod === "linear_meter" && (
                              <>
                                <div className="space-y-1">
                                  <label className="font-bold text-[9px] text-slate-500">Largo (m)</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={item.length || 0}
                                    onChange={(e) => handleUpdateItem(room.id, item.id, "length", Number(e.target.value))}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-md font-mono"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="font-bold text-[9px] text-slate-500">Precio/m ($)</label>
                                  <input
                                    type="number"
                                    value={item.linearMeterPrice || 0}
                                    onChange={(e) => handleUpdateItem(room.id, item.id, "linearMeterPrice", Number(e.target.value))}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-md font-mono"
                                  />
                                </div>
                              </>
                            )}

                            {item.calculationMethod === "sq_meter" && (
                              <>
                                <div className="space-y-1">
                                  <label className="font-bold text-[9px] text-slate-500">Ancho (m)</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={item.width || 0}
                                    onChange={(e) => handleUpdateItem(room.id, item.id, "width", Number(e.target.value))}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-md font-mono"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="font-bold text-[9px] text-slate-500">Alto (m)</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={item.height || 0}
                                    onChange={(e) => handleUpdateItem(room.id, item.id, "height", Number(e.target.value))}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-md font-mono"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="font-bold text-[9px] text-slate-500">Precio/m² ($)</label>
                                  <input
                                    type="number"
                                    value={item.sqMeterPrice || 0}
                                    onChange={(e) => handleUpdateItem(room.id, item.id, "sqMeterPrice", Number(e.target.value))}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-md font-mono"
                                  />
                                </div>
                              </>
                            )}

                            {item.calculationMethod === "cu_meter" && (
                              <>
                                <div className="space-y-1">
                                  <label className="font-bold text-[9px] text-slate-500">Ancho (m)</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={item.width || 0}
                                    onChange={(e) => handleUpdateItem(room.id, item.id, "width", Number(e.target.value))}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-md font-mono"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="font-bold text-[9px] text-slate-500">Alto (m)</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={item.height || 0}
                                    onChange={(e) => handleUpdateItem(room.id, item.id, "height", Number(e.target.value))}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-md font-mono"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="font-bold text-[9px] text-slate-500">Precio/m³ ($)</label>
                                  <input
                                    type="number"
                                    value={item.cuMeterPrice || 0}
                                    onChange={(e) => handleUpdateItem(room.id, item.id, "cuMeterPrice", Number(e.target.value))}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-md font-mono"
                                  />
                                </div>
                              </>
                            )}

                            {item.calculationMethod === "material_hours_markup" && (
                              <>
                                <div className="space-y-1">
                                  <label className="font-bold text-[9px] text-slate-500">Costo Mat. ($)</label>
                                  <input
                                    type="number"
                                    value={item.materialCost || 0}
                                    onChange={(e) => handleUpdateItem(room.id, item.id, "materialCost", Number(e.target.value))}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-md font-mono text-[10px]"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="font-bold text-[9px] text-slate-500">Horas Prod.</label>
                                  <input
                                    type="number"
                                    value={item.productionHours || 0}
                                    onChange={(e) => handleUpdateItem(room.id, item.id, "productionHours", Number(e.target.value))}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-md font-mono text-[10px]"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="font-bold text-[9px] text-slate-500">% Ganancia</label>
                                  <input
                                    type="number"
                                    value={item.markupPercent || 0}
                                    onChange={(e) => handleUpdateItem(room.id, item.id, "markupPercent", Number(e.target.value))}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-md font-mono text-[10px]"
                                  />
                                </div>
                              </>
                            )}

                            {item.calculationMethod === "hourly_rate" && (
                              <>
                                <div className="space-y-1">
                                  <label className="font-bold text-[9px] text-slate-500">Horas Prod.</label>
                                  <input
                                    type="number"
                                    value={item.productionHours || 0}
                                    onChange={(e) => handleUpdateItem(room.id, item.id, "productionHours", Number(e.target.value))}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-md font-mono text-[10px]"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="font-bold text-[9px] text-slate-500">Tarifa/h ($)</label>
                                  <input
                                    type="number"
                                    value={item.hourlyRate || Number(localStorage.getItem("melamina_standard_hourly_rate")) || 1200}
                                    onChange={(e) => handleUpdateItem(room.id, item.id, "hourlyRate", Number(e.target.value))}
                                    className="w-full px-2 py-1 border border-slate-200 rounded-md font-mono text-[10px]"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="font-bold text-[9px] text-slate-400 block truncate">Standard Rate</label>
                                  <span className="text-[10px] text-slate-400 font-mono flex items-center h-7 select-none">
                                    ${Number(localStorage.getItem("melamina_standard_hourly_rate")) || 1200}/h
                                  </span>
                                </div>
                              </>
                            )}

                            {item.calculationMethod === "manual" && (
                              <div className="space-y-1 col-span-3">
                                <label className="font-bold text-[9px] text-slate-500">Precio Fijo Total ($)</label>
                                <input
                                  type="number"
                                  value={item.manualPrice || 0}
                                  onChange={(e) => handleUpdateItem(room.id, item.id, "manualPrice", Number(e.target.value))}
                                  className="w-full px-2 py-1 border border-slate-200 rounded-md font-mono text-[10px]"
                                />
                              </div>
                            )}
                          </div>

                          {/* Individual Custom Options (Edge, Colors) */}
                          <div className="lg:col-span-1 space-y-1">
                            <label className="font-bold text-[10px] text-slate-500 uppercase">Opciones</label>
                            <input
                              type="text"
                              value={item.options || ""}
                              onChange={(e) => handleUpdateItem(room.id, item.id, "options", e.target.value)}
                              placeholder="Ej: Roble"
                              className="w-full px-1.5 py-1.5 border border-slate-200 rounded-md text-[10px]"
                            />
                          </div>

                          {/* Optional item toggle checks */}
                          <div className="lg:col-span-1 space-y-1 flex flex-col justify-end pb-1.5">
                            <label className="font-bold text-[9px] text-slate-500 uppercase flex items-center gap-1 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={!!item.isOptional}
                                onChange={(e) => {
                                  handleUpdateItem(room.id, item.id, "isOptional", e.target.checked);
                                  if (e.target.checked && item.isIncluded === undefined) {
                                    handleUpdateItem(room.id, item.id, "isIncluded", true);
                                  }
                                }}
                                className="rounded text-blue-600 border-slate-300"
                              />
                              ¿Opcional?
                            </label>
                            {item.isOptional && (
                              <label className="font-bold text-[9px] text-emerald-600 uppercase flex items-center gap-1 cursor-pointer mt-1 select-none">
                                <input
                                  type="checkbox"
                                  checked={!!item.isIncluded}
                                  onChange={(e) => handleUpdateItem(room.id, item.id, "isIncluded", e.target.checked)}
                                  className="rounded text-emerald-600 border-emerald-300"
                                />
                                Incluido
                              </label>
                            )}
                          </div>

                          {/* Individual computed total price */}
                          <div className="lg:col-span-1 text-right space-y-1 min-w-[70px]">
                            <label className="font-bold text-[10px] text-slate-500 uppercase block">Subtotal</label>
                            <span className="font-black text-slate-900 text-sm font-mono block mb-1">
                              ${item.totalPrice.toLocaleString()}
                            </span>
                          </div>

                          {/* Delete Item button */}
                          <div className="lg:col-span-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleDeleteItemFromRoom(room.id, item.id)}
                              className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-md cursor-pointer mb-0.5"
                              title="Eliminar artículo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>
                      ))}

                      {room.items.length === 0 && (
                        <div className="p-6 text-center text-slate-400">
                          Haz clic en "Agregar Artículo" para cotizar componentes en esta habitación.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {rooms.length === 0 && (
                <div className="p-12 border-2 border-dashed border-slate-200 text-center text-slate-400 rounded-2xl">
                  Aún no has creado habitaciones. Ingresa el nombre arriba para añadir la primera sección del mueble.
                </div>
              )}
            </div>

            {/* Bottom calculation footer with final sum */}
            {rooms.length > 0 && (
              <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-xl border border-slate-950 mt-6 shadow-sm">
                <div>
                  <h4 className="text-sm font-bold text-slate-300">TOTAL PRESUPUESTADO</h4>
                  <p className="text-[10px] text-slate-400">Suma total de todos los ambientes y cálculos configurados.</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black font-mono tracking-tight">
                    ${calculateGrandTotal().toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // LIST & DETAIL VIEW (Default mode)
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Budget List with Filters */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Filter controls */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Buscar por título o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800"
                />
              </div>

              {/* Status Pills */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    statusFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Todos ({budgets.length})
                </button>
                <button
                  onClick={() => setStatusFilter("approved")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    statusFilter === "approved" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  Aprobados ({budgets.filter(b => b.status === "approved").length})
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    statusFilter === "pending" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                  }`}
                >
                  Pendientes ({budgets.filter(b => b.status === "pending").length})
                </button>
                <button
                  onClick={() => setStatusFilter("unanswered")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    statusFilter === "unanswered" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                  }`}
                >
                  Sin Responder ({budgets.filter(b => b.status === "unanswered").length})
                </button>
              </div>
            </div>

            {/* List items */}
            <div className="space-y-3">
              {filteredBudgets.map((budget) => {
                const isActive = activeBudget?.id === budget.id;
                
                return (
                  <div
                    key={budget.id}
                    onClick={() => {
                      setActiveBudget(budget);
                      setIsEditing(false);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer bg-white text-xs ${
                      isActive 
                        ? "border-blue-600 ring-2 ring-blue-50" 
                        : "border-slate-200 hover:border-slate-350 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-extrabold text-slate-900 text-sm truncate">{budget.title}</span>
                      <span className="font-black text-slate-900 font-mono">
                        ${budget.totalPrice.toLocaleString("es-AR")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 mt-2 text-slate-500">
                      <span>Cliente: <strong className="text-slate-700">{budget.clientName}</strong></span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${
                        budget.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : budget.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}>
                        {budget.status === "approved" ? "Aprobado" : budget.status === "pending" ? "Pendiente" : "Sin respuesta"}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredBudgets.length === 0 && (
                <div className="p-8 bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 rounded-xl text-xs">
                  No se encontraron presupuestos que coincidan con los filtros.
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Complete Budget Detail View & Actions */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {activeBudget ? (
                <motion.div
                  key={activeBudget.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs text-xs text-slate-700"
                >
                  {/* Budget Title / Header */}
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          activeBudget.status === "approved" 
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                            : activeBudget.status === "pending"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}>
                          {activeBudget.status === "approved" ? "Presupuesto Aprobado" : activeBudget.status === "pending" ? "Pendiente" : "No respondido"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {activeBudget.id}</span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900">{activeBudget.title}</h3>
                      <p className="text-slate-500 text-xs">Asociado a: <strong className="text-slate-800">{activeBudget.clientName}</strong></p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowClientPortal(true)}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg cursor-pointer flex items-center gap-1 text-[11px]"
                        title="Abrir enlace de aprobación digital para el cliente"
                      >
                        <Globe className="w-3.5 h-3.5" /> Portal Cliente
                      </button>
                      <button
                        onClick={() => {
                          setShowClientPortal(true);
                          setTimeout(() => {
                            window.print();
                          }, 500);
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer flex items-center gap-1 text-[11px]"
                        title="Imprimir presupuesto o exportar como PDF"
                      >
                        <Printer className="w-3.5 h-3.5" /> Exportar PDF
                      </button>
                      <button
                        onClick={handleStartEdit}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg cursor-pointer flex items-center gap-1 text-[11px]"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("¿Estás seguro de eliminar este presupuesto?")) {
                            onDeleteBudget(activeBudget.id);
                            setActiveBudget(null);
                          }
                        }}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                        title="Eliminar presupuesto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expiration alert if issued > 15 days ago */}
                  {new Date().getTime() - new Date(activeBudget.createdAt).getTime() > 15 * 24 * 60 * 60 * 1000 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-[10px]">⚠️ <strong>Presupuesto Expirado (más de 15 días):</strong> Se aconseja actualizar tarifas debido a la inflación de materiales.</span>
                    </div>
                  )}

                  {/* Summary grid information */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Fecha Emisión</span>
                      <span className="font-semibold text-slate-800">{new Date(activeBudget.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Método de Pago</span>
                      <span className="font-semibold text-slate-800">{activeBudget.paymentMethod}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Total Final</span>
                      <span className="font-bold text-slate-900 font-mono text-sm">
                        ${activeBudget.totalPrice.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Aprobado Por</span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {activeBudget.status === "approved" ? (activeBudget.approvedBy || "Cliente") : "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Rooms list visualization (room by room itemized billing) */}
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-1.5">Mobiliario Detallado</h4>
                    
                    {activeBudget.rooms.map((room) => (
                      <div key={room.id} className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-slate-100/50 px-3 py-1.5 rounded-lg">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                          <span>{room.name}</span>
                        </div>
                        
                        <div className="space-y-2 pl-3">
                          {room.items.map((item) => (
                            <div key={item.id} className="p-3 bg-white border border-slate-100 rounded-lg flex items-center justify-between gap-4">
                              <div className="space-y-1">
                                <span className="font-bold text-slate-800 block text-xs">{item.description}</span>
                                {item.options && (
                                  <span className="text-[10px] text-slate-500 font-medium bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md inline-block">
                                    {item.options}
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="font-black text-slate-900 font-mono text-xs block">
                                  ${item.totalPrice.toLocaleString()}
                                </span>
                                <span className="text-[9px] text-slate-400 italic">
                                  {item.calculationMethod === "linear_meter" && `Metro lineal (${item.length}m)`}
                                  {item.calculationMethod === "sq_meter" && `m² (${item.width}x{item.height})`}
                                  {item.calculationMethod === "cu_meter" && `m³`}
                                  {item.calculationMethod === "material_markup" && `Material + Markup`}
                                  {item.calculationMethod === "material_hours_markup" && `Por horas (${item.productionHours}h)`}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {activeBudget.rooms.length === 0 && (
                      <p className="text-center text-slate-400 py-6">Este presupuesto no contiene artículos.</p>
                    )}
                  </div>

                  {activeBudget.notes && (
                    <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h5 className="font-bold text-slate-800">Especificaciones y Notas</h5>
                      <p className="text-slate-600 text-xs italic leading-relaxed">{activeBudget.notes}</p>
                    </div>
                  )}

                  {/* Actions footer (Generate Contract, etc.) */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                    {activeBudget.status === "approved" ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-between w-full">
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span>¡Este presupuesto está aprobado! Ya puedes redactar el contrato de compra-venta.</span>
                        </span>
                        
                        <button
                          onClick={() => {
                            onGenerateContract(activeBudget!);
                            onNavigateToTab("contracts");
                          }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer ml-3 transition-colors"
                        >
                          <FileText className="w-4 h-4" /> Generar Contrato <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-[11px] flex items-center gap-2 w-full">
                        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Para generar el contrato definitivo, cambia el estado del presupuesto a "Aprobado" y guarda los cambios.</span>
                      </div>
                    )}
                  </div>

                </motion.div>
              ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
                  Selecciona un presupuesto de la lista de la izquierda o crea uno nuevo para ver su desglose por ambiente y fórmula de costos.
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}
    </div>
  );
}
