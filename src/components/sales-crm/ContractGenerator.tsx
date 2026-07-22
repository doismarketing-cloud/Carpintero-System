import React, { useState, useEffect, useRef } from "react";
import { CRMBudget, CRMContract } from "./types";
import { 
  FileText, 
  Settings, 
  Share2, 
  Download, 
  Check, 
  PenTool, 
  Copy, 
  Clock, 
  CheckCircle, 
  UserCheck, 
  Edit, 
  Printer, 
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getContractTemplate, saveContractTemplate } from "./mockStore";

interface ContractGeneratorProps {
  budgets: CRMBudget[];
  contracts: CRMContract[];
  onSaveContract: (contract: CRMContract) => void;
  selectedBudgetForContract: CRMBudget | null;
  onClearSelectedBudget: () => void;
}

export default function ContractGenerator({
  budgets,
  contracts,
  onSaveContract,
  selectedBudgetForContract,
  onClearSelectedBudget
}: ContractGeneratorProps) {
  const [activeContract, setActiveContract] = useState<CRMContract | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [templateText, setTemplateText] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [signingName, setSigningName] = useState("");
  const [deliveryDays, setDeliveryDays] = useState(30);

  // Signature drawing canvas ref & states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Load contract template from mockStore
  useEffect(() => {
    setTemplateText(getContractTemplate());
  }, []);

  // Handle auto-generation trigger from Budget tab
  useEffect(() => {
    if (selectedBudgetForContract) {
      handleGenerateContractFromBudget(selectedBudgetForContract);
      onClearSelectedBudget();
    }
  }, [selectedBudgetForContract]);

  // Generate contract with preloaded template values
  const handleGenerateContractFromBudget = (budget: CRMBudget) => {
    // Check if contract already exists
    const existing = contracts.find(c => c.budgetId === budget.id);
    if (existing) {
      setActiveContract(existing);
      return;
    }

    const roomsList = budget.rooms.map(r => r.name).join(", ");
    const currentTemplate = getContractTemplate();
    
    // Replace tags
    const filledText = currentTemplate
      .replace(/{CLIENT_NAME}/g, budget.clientName)
      .replace(/{PROJECT_TITLE}/g, budget.title)
      .replace(/{ROOMS_LIST}/g, roomsList || "Mobiliario a medida")
      .replace(/{PROJECT_TOTAL}/g, `$${budget.totalPrice.toLocaleString("es-AR")}`)
      .replace(/{PAYMENT_METHOD}/g, budget.paymentMethod)
      .replace(/{DELIVERY_DAYS}/g, deliveryDays.toString())
      .replace(/{SIGNATURE_DATE}/g, new Date().toLocaleDateString());

    const newContract: CRMContract = {
      id: `cont-${Date.now()}`,
      budgetId: budget.id,
      contractText: filledText,
      status: "draft",
      sentLink: `${window.location.origin}/firmar-contrato/${budget.id}`
    };

    onSaveContract(newContract);
    setActiveContract(newContract);
    setSuccessMsg("¡Contrato generado con éxito con datos precargados!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleSaveTemplate = () => {
    saveContractTemplate(templateText);
    setShowTemplateEditor(false);
    setSuccessMsg("¡Plantilla de contrato guardada correctamente!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleCopySignatureLink = () => {
    if (!activeContract) return;
    navigator.clipboard.writeText(activeContract.sentLink || "");
    setSuccessMsg("¡Enlace de firma copiado al portapapeles!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    const pos = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getCoordinates(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Check if touch event
    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const handleSignContractSubmit = () => {
    if (!activeContract) return;
    if (!signingName.trim()) {
      alert("Por favor ingresa el nombre de la persona que firma.");
      return;
    }

    const canvas = canvasRef.current;
    let signatureUrl = "";
    if (canvas) {
      signatureUrl = canvas.toDataURL("image/png");
    }

    const updatedContract: CRMContract = {
      ...activeContract,
      status: "signed",
      signedBy: signingName.trim(),
      signedAt: new Date().toISOString(),
      signatureDataUrl: signatureUrl
    };

    onSaveContract(updatedContract);
    setActiveContract(updatedContract);
    setShowSigningModal(false);
    setSuccessMsg("¡Contrato firmado digitalmente con éxito!");
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  const handleDownloadTxt = () => {
    if (!activeContract) return;
    const element = document.createElement("a");
    const file = new Blob([activeContract.contractText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Contrato_${activeContract.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrintContract = () => {
    window.print();
  };

  // Get associated budget for contract
  const associatedBudget = activeContract 
    ? budgets.find(b => b.id === activeContract.budgetId) 
    : null;

  return (
    <div className="space-y-6">
      
      {/* Page header and control action bars */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 print:hidden">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Contratos de Venta
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Transforma tus presupuestos aprobados en contratos legales detallados y listos para firmar digitalmente.</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowTemplateEditor(true)}
            className="px-3.5 py-2 border border-slate-250 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-500" /> Configurar Plantilla
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-2 print:hidden">
          <Check className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* Main split: left generated contracts list vs right document viewer */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Contracts List */}
        <div className="lg:col-span-4 space-y-4 print:hidden">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase">Presupuestos Listos para Contrato</h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">Selecciona un presupuesto aprobado para redactar el contrato de compra-venta automáticamente.</p>
            
            <div className="space-y-2 pt-2">
              {budgets.filter(b => b.status === "approved").map(b => (
                <button
                  key={b.id}
                  onClick={() => handleGenerateContractFromBudget(b)}
                  className="w-full text-left p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between gap-3 group transition-all"
                >
                  <div className="truncate">
                    <span className="font-bold text-slate-800 block truncate">{b.title}</span>
                    <span className="text-[10px] text-slate-400 block truncate">Cliente: {b.clientName}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                </button>
              ))}

              {budgets.filter(b => b.status === "approved").length === 0 && (
                <div className="p-4 bg-white text-center text-slate-400 rounded-lg text-[11px]">
                  No hay presupuestos "Aprobados" listos para contrato. Ve a la pestaña de presupuestos y aprueba uno.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
            <div className="p-4 bg-slate-100/50">
              <h4 className="font-extrabold text-slate-800 text-xs uppercase">Contratos Redactados</h4>
            </div>

            {contracts.map(c => {
              const b = budgets.find(bu => bu.id === c.budgetId);
              const isActive = activeContract?.id === c.id;
              
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveContract(c)}
                  className={`p-4 hover:bg-slate-50 transition-all cursor-pointer text-xs flex flex-col gap-1.5 ${
                    isActive ? "bg-emerald-50/60 border-l-4 border-emerald-500 pl-3" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">{b ? b.title : "Contrato de Obra"}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${
                      c.status === "signed" 
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {c.status === "signed" ? "Firmado" : "Borrador"}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Cliente: {b ? b.clientName : "Particular"}</span>
                </div>
              );
            })}

            {contracts.length === 0 && (
              <div className="p-6 text-center text-slate-400">
                Aún no se han redactado contratos.
              </div>
            )}
          </div>
        </div>

        {/* Right column: Document Viewer / Contract Preview */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {activeContract ? (
              <motion.div
                key={activeContract.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6 text-xs text-slate-800 print:border-none print:shadow-none print:p-0"
              >
                {/* Actions banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 print:hidden">
                  <div className="space-y-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      activeContract.status === "signed"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}>
                      {activeContract.status === "signed" ? "Contrato Firmado Legalmente" : "Pendiente de Firma Digital"}
                    </span>
                    <h3 className="text-sm font-black text-slate-900">Vista del Documento de Venta</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handlePrintContract}
                      className="p-2 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg cursor-pointer flex items-center gap-1"
                      title="Imprimir contrato"
                    >
                      <Printer className="w-4 h-4" /> Imprimir
                    </button>
                    <button
                      onClick={handleDownloadTxt}
                      className="p-2 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg cursor-pointer flex items-center gap-1"
                      title="Descargar contrato TXT"
                    >
                      <Download className="w-4 h-4" /> Descargar
                    </button>
                    
                    {activeContract.status !== "signed" && (
                      <button
                        onClick={() => {
                          setSigningName(associatedBudget?.clientName || "");
                          setShowSigningModal(true);
                        }}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                      >
                        <PenTool className="w-4 h-4" /> Firmar Ahora
                      </button>
                    )}
                  </div>
                </div>

                {/* Share Link box if pending signature */}
                {activeContract.status !== "signed" && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                    <div className="space-y-1 text-[11px] text-amber-900">
                      <span className="font-extrabold block">Enlace para Firma del Cliente</span>
                      <p className="text-amber-800 leading-relaxed max-w-lg">Envía este enlace simulado a tu cliente para que realice la firma digital desde su teléfono móvil o computadora.</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="text"
                        readOnly
                        value={activeContract.sentLink}
                        className="px-3 py-1.5 border border-amber-300 rounded-lg bg-white text-slate-500 font-mono text-[10px] w-48 truncate"
                      />
                      <button
                        onClick={handleCopySignatureLink}
                        className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg cursor-pointer"
                        title="Copiar enlace"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Main scrollable contract layout */}
                <div className="bg-slate-50 p-8 border border-slate-200 rounded-xl max-h-[500px] overflow-y-auto font-serif text-[13px] leading-relaxed text-slate-800 shadow-inner whitespace-pre-wrap print:max-h-none print:overflow-visible print:bg-white print:border-none print:p-0">
                  {activeContract.contractText}

                  {/* Signature visual representation */}
                  {activeContract.status === "signed" && (
                    <div className="mt-8 pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 font-sans text-xs">
                      <div className="space-y-1 text-slate-500">
                        <span className="font-bold text-slate-700 block">FIRMADO DIGITALMENTE POR:</span>
                        <p className="font-extrabold text-emerald-700">{activeContract.signedBy}</p>
                        <p>Fecha: {new Date(activeContract.signedAt || "").toLocaleString()}</p>
                        <p className="text-[10px]">Autenticación IP / Hash sim: SHA-256 Verified</p>
                      </div>

                      <div className="space-y-2 text-right">
                        <span className="font-bold text-slate-700 block">FIRMA VERIFICADA</span>
                        <div className="border border-slate-200 rounded-lg bg-white p-2 inline-block max-w-[200px] shadow-2xs">
                          {activeContract.signatureDataUrl ? (
                            <img 
                              src={activeContract.signatureDataUrl} 
                              alt="Firma del cliente" 
                              className="max-h-16 mx-auto object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="italic text-slate-400">Firma electrónica registrada</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </motion.div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
                Selecciona un contrato del panel lateral para previsualizarlo, enviarlo a firmar digitalmente o descargarlo como archivo.
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Contract Template Editor Modal */}
      {showTemplateEditor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-6 text-xs text-slate-700"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Editar Plantilla de Contrato</h3>
              <p className="text-slate-500 text-xs">Usa etiquetas entre llaves para que los datos del presupuesto se carguen automáticamente.</p>
            </div>

            {/* Template tags cheat sheet */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
              <span className="font-bold text-slate-800 block mb-1">Etiquetas Soportadas:</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[9px] text-purple-700">
                <span>{"{CLIENT_NAME}"}</span>
                <span>{"{PROJECT_TITLE}"}</span>
                <span>{"{ROOMS_LIST}"}</span>
                <span>{"{PROJECT_TOTAL}"}</span>
                <span>{"{PAYMENT_METHOD}"}</span>
                <span>{"{DELIVERY_DAYS}"}</span>
                <span>{"{SIGNATURE_DATE}"}</span>
              </div>
            </div>

            <textarea
              value={templateText}
              onChange={(e) => setTemplateText(e.target.value)}
              rows={12}
              className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-mono text-[11px] leading-relaxed"
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowTemplateEditor(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
              >
                Guardar Plantilla
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Signing Simulation Drawer/Modal */}
      {showSigningModal && activeContract && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 text-xs text-slate-700"
          >
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Simulador de Firma Digital</h3>
                <p className="text-slate-500 text-xs">Firma el documento de compra-venta de forma electrónica.</p>
              </div>
              <PenTool className="w-5 h-5 text-emerald-600 shrink-0" />
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nombre del Firmante *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Alejandra Gómez"
                  value={signingName}
                  onChange={(e) => setSigningName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800"
                />
              </div>

              {/* Drawing Board Canvas */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Dibuja tu Firma abajo</label>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer flex items-center gap-0.5"
                  >
                    <RefreshCw className="w-3 h-3" /> Limpiar Panel
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 shadow-inner">
                  <canvas
                    ref={canvasRef}
                    width={350}
                    height={150}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[150px] cursor-crosshair block bg-slate-50 TouchEvents-none"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-[10px] leading-relaxed text-slate-500">
                Al pulsar "Firmar Contrato", se incrustará de forma inalterable la firma electrónica y se actualizará el estado de la cotización.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSigningModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSignContractSubmit}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
              >
                Firmar Contrato
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
