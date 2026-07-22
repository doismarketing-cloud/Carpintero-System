import React, { useState, useEffect } from "react";
import { CRMBudget, CRMClient, BudgetStatus } from "./types";
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  FileText, 
  ArrowUpRight,
  Download,
  FileSpreadsheet,
  Calendar,
  Sparkles,
  UserCheck,
  Check,
  Printer
} from "lucide-react";
import { motion } from "motion/react";
import { 
  getCompanyConfig, 
  getTeamMembers, 
  getSavedReminders, 
  saveBudgets, 
  getSavedBudgets 
} from "./mockStore";

interface SalesDashboardProps {
  budgets: CRMBudget[];
  clients: CRMClient[];
  onNavigateToTab: (tab: string) => void;
  onSelectBudget: (budget: CRMBudget) => void;
}

export default function SalesDashboard({ 
  budgets: initialBudgets, 
  clients, 
  onNavigateToTab,
  onSelectBudget 
}: SalesDashboardProps) {
  const [budgets, setBudgets] = useState<CRMBudget[]>(initialBudgets);
  const [simulatedToday, setSimulatedToday] = useState("2026-07-15");
  const [hasFastForwarded, setHasFastForwarded] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  
  const companyConfig = getCompanyConfig();
  const teamMembers = getTeamMembers();
  const reminders = getSavedReminders();
  const activeEmployeeId = localStorage.getItem("melamina_active_employee_id") || "tm-1";
  const activeUser = teamMembers.find(m => m.id === activeEmployeeId) || teamMembers[0];

  // Refresh local budgets state if prop changes
  useEffect(() => {
    setBudgets(initialBudgets);
  }, [initialBudgets]);

  // Real-time metrics calculations based on custom status types
  const approvedBudgets = budgets.filter(b => b.status === "approved" || b.status === "completed");
  const pendingBudgets = budgets.filter(b => b.status === "pending");
  const unansweredBudgets = budgets.filter(b => b.status === "unanswered");
  const expiredBudgets = budgets.filter(b => b.status === "expired");
  const completedBudgets = budgets.filter(b => b.status === "completed");
  
  const totalApprovedBilling = approvedBudgets.reduce((acc, b) => acc + b.totalPrice, 0);
  const totalPendingBilling = pendingBudgets.reduce((acc, b) => acc + b.totalPrice, 0);
  
  // Real profit calculation subtracting material and labor
  let totalApprovedMaterialsCost = 0;
  let totalApprovedLaborCost = 0;
  approvedBudgets.forEach(b => {
    b.rooms.forEach(r => {
      r.items.forEach(item => {
        // If they have defined items, use actual costs, otherwise estimate 45% materials, 20% labor
        const mat = item.materialCost || (item.totalPrice * 0.45);
        const lab = (item.productionHours && item.hourlyRate) ? (item.productionHours * item.hourlyRate) : (item.totalPrice * 0.20);
        totalApprovedMaterialsCost += mat;
        totalApprovedLaborCost += lab;
      });
    });
  });
  
  const totalApprovedProfit = totalApprovedBilling - totalApprovedMaterialsCost - totalApprovedLaborCost;

  const totalBudgetsCount = budgets.length;
  const conversionRate = totalBudgetsCount > 0 
    ? Math.round((approvedBudgets.length / totalBudgetsCount) * 100) 
    : 0;

  // Let's take the latest 4 budgets to display as recent activity
  const recentBudgets = [...budgets]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  // Simulated Fast Forward to verify Expired status automatically
  const handleFastForwardTime = () => {
    const futureDate = "2026-07-30"; // Fast forward 15 days
    setSimulatedToday(futureDate);
    setHasFastForwarded(true);

    // Filter which budgets became expired
    let wasUpdated = false;
    const updated = budgets.map(b => {
      if ((b.status === "pending" || b.status === "unanswered") && b.expirationDate && b.expirationDate < futureDate) {
        wasUpdated = true;
        return { ...b, status: "expired" as const };
      }
      return b;
    });

    if (wasUpdated) {
      setBudgets(updated);
      saveBudgets(updated);
      // Trigger temporary success notification
      setSuccessMsg("¡Se avanzó en el tiempo (+15 días)! Los presupuestos vencidos cambiaron de estado automáticamente.");
    } else {
      setSuccessMsg("Se avanzó en el tiempo, pero no había presupuestos pendientes vencidos en este período.");
    }
    setTimeout(() => setSuccessMsg(""), 4500);
  };

  // CSV General Report Export (Excel format)
  const handleExportCSVReport = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM for Spanish accents
    
    csvContent += `REPORTE GENERAL COMERCIAL - ${companyConfig.name.toUpperCase()}\n`;
    csvContent += `Fecha Simulada:;${simulatedToday}\n`;
    csvContent += `Direccion de Taller:;${companyConfig.address}\n`;
    csvContent += `Operador de Turno:;${activeUser?.name} (${activeUser?.role})\n\n`;

    // Budgets Financials
    csvContent += "1. RESUMEN DE COTIZACIONES Y PROYECTOS\n";
    csvContent += "ID;Proyecto;Cliente;Estado;Monto Total;Metodo de Pago;Vence el;Fecha de Emision\n";
    budgets.forEach(b => {
      csvContent += `${b.id};"${b.title}";"${b.clientName}";${b.status};$${b.totalPrice.toFixed(2)};"${b.paymentMethod}";${b.expirationDate};${b.createdAt.split("T")[0]}\n`;
    });
    csvContent += "\n";

    // Clients Registered
    csvContent += "2. CARTERA DE CLIENTES REGISTRADOS\n";
    csvContent += "ID;Nombre Completo;Email;Telefono;Direccion;Organizacion\n";
    clients.forEach(c => {
      csvContent += `${c.id};"${c.name}";"${c.email}";"${c.phone}";"${c.address}";"${c.company || "Particular"}"\n`;
    });
    csvContent += "\n";

    // Team Members
    csvContent += "3. NOMINA Y ROLES DE TRABAJO\n";
    csvContent += "ID;Nombre;Rol de Acceso;Email;Estado Activo\n";
    teamMembers.forEach(m => {
      csvContent += `${m.id};"${m.name}";${m.role};"${m.email}";${m.active ? "SI" : "NO"}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Informe_CarpinteroSystem_${companyConfig.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintDashboard = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      
      {/* Simulation & Info Top Panel */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-700 font-bold">
            Fecha de Simulación: <span className="font-mono bg-white border border-slate-250 px-2 py-0.5 rounded-md text-purple-700">{simulatedToday}</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium">({hasFastForwarded ? "Paso del tiempo activado" : "Tiempo real"})</span>
        </div>

        <div className="flex items-center gap-2">
          {!hasFastForwarded ? (
            <button
              onClick={handleFastForwardTime}
              className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
            >
              <Clock className="w-3.5 h-3.5 animate-spin" /> Avanzar 15 días (Probar Vencidos)
            </button>
          ) : (
            <button
              onClick={() => {
                setSimulatedToday("2026-07-15");
                setHasFastForwarded(false);
                setBudgets(getSavedBudgets());
              }}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
            >
              Restablecer Fecha
            </button>
          )}

          <button
            onClick={handleExportCSVReport}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
            title="Exportar base completa a Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Exportar Excel / CSV
          </button>
          <button
            onClick={handlePrintDashboard}
            className="p-1.5 border border-slate-250 hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
            title="Imprimir panel"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-2 print:hidden">
          <Check className="w-4.5 h-4.5" /> {successMsg}
        </div>
      )}

      {/* Real-time Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Billing */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
          id="billing-card"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Facturación Ganada</p>
            <h3 className="text-2xl font-black text-slate-900 font-mono">
              ${totalApprovedBilling.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> De proyectos aprobados
            </p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Dynamic Net Profit */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
          id="profit-card"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Utilidad Neta Est. (Taller)</p>
            <h3 className="text-2xl font-black text-purple-700 font-mono">
              ${totalApprovedProfit.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-purple-600 font-bold flex items-center gap-0.5">
              <Sparkles className="w-3 h-3 animate-bounce" /> Descontando materiales y labor
            </p>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <Sparkles className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Pending Budgets */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
          id="pending-card"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pendientes de Aprobación</p>
            <h3 className="text-2xl font-black text-slate-900 font-mono">
              {pendingBudgets.length}
            </h3>
            <p className="text-[10px] text-amber-600 font-semibold">
              Monto en espera: ${totalPendingBilling.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Expired Deadlines (Vencidos) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
          id="expired-card"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Presupuestos Vencidos</p>
            <h3 className="text-2xl font-black text-rose-600 font-mono">
              {expiredBudgets.length}
            </h3>
            <p className="text-[10px] text-rose-600 font-semibold">
              Requieren re-cotización por inflación
            </p>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </motion.div>

      </div>

      {/* Visual Analytics / Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Conversion Chart & Period Billing */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Estado de Presupuestos y Conversión</h3>
              <p className="text-xs text-slate-500">Distribución de ingresos esperados y ganados por estado.</p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full font-mono">
              Total: {totalBudgetsCount} proyectos
            </span>
          </div>

          {/* Styled progress/revenue meters */}
          <div className="space-y-6 py-2">
            
            {/* Approved revenue */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  Ingresos Ganados (Aprobados)
                </span>
                <span className="font-bold text-slate-900 font-mono">
                  ${totalApprovedBilling.toLocaleString()} ({Math.round(totalApprovedBilling / (totalApprovedBilling + totalPendingBilling || 1) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${(totalApprovedBilling / (totalApprovedBilling + totalPendingBilling || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Pending revenue */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  Ingresos Potenciales (Pendientes)
                </span>
                <span className="font-bold text-slate-900 font-mono">
                  ${totalPendingBilling.toLocaleString()} ({Math.round(totalPendingBilling / (totalApprovedBilling + totalPendingBilling || 1) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${(totalPendingBilling / (totalApprovedBilling + totalPendingBilling || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* General conversion status bars */}
            <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-100 text-center text-[10px]">
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <span className="block uppercase font-bold text-emerald-800">Aprobados</span>
                <span className="text-base font-black text-emerald-700 font-mono">{approvedBudgets.length}</span>
              </div>
              <div className="p-2.5 bg-amber-50 rounded-xl">
                <span className="block uppercase font-bold text-amber-800">Pendientes</span>
                <span className="text-base font-black text-amber-700 font-mono">{pendingBudgets.length}</span>
              </div>
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <span className="block uppercase font-bold text-rose-800">Vencidos</span>
                <span className="text-base font-black text-rose-700 font-mono">{expiredBudgets.length}</span>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <span className="block uppercase font-bold text-blue-800">Sin Enviar</span>
                <span className="text-base font-black text-blue-700 font-mono">{unansweredBudgets.length}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Quick Action Quick links & Reminders Feed */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Alarmas Comerciales</h3>
              <p className="text-xs text-slate-500">Próximos plazos de seguimiento cargados.</p>
            </div>
            <button
              onClick={() => onNavigateToTab("settings")}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              Ir a Agenda
            </button>
          </div>

          {/* Mini agenda loop */}
          <div className="space-y-3">
            {reminders.filter(r => !r.isCompleted).slice(0, 3).map(r => (
              <div key={r.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 text-[11px] leading-relaxed flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">{r.message}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Cliente: {r.clientName} | Vence {new Date(r.dueDate).toLocaleDateString()}</span>
                </div>
                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold font-mono rounded text-[9px] uppercase">
                  Urgente
                </span>
              </div>
            ))}

            {reminders.filter(r => !r.isCompleted).length === 0 && (
              <p className="p-4 text-center text-slate-400 italic">No hay recordatorios urgentes para hoy.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <button 
              onClick={() => onNavigateToTab("budget")}
              className="p-4 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-xl text-left transition-all group cursor-pointer"
            >
              <FileText className="w-5 h-5 text-blue-600 mb-2" />
              <span className="block text-xs font-bold text-slate-800 group-hover:text-blue-700 transition-colors">Crear Presupuesto</span>
              <span className="text-[10px] text-slate-500 leading-tight block mt-1">Por ambientes y método de cálculo</span>
            </button>
            <button 
              onClick={() => onNavigateToTab("settings")}
              className="p-4 bg-purple-50/50 hover:bg-purple-50 border border-purple-100 rounded-xl text-left transition-all group cursor-pointer"
            >
              <Users className="w-5 h-5 text-purple-600 mb-2" />
              <span className="block text-xs font-bold text-slate-800 group-hover:text-purple-700 transition-colors">Personalizar Taller</span>
              <span className="text-[10px] text-slate-500 leading-tight block mt-1">Tarifa horaria, logo y personal</span>
            </button>
          </div>
        </div>

      </div>

      {/* Recent Activity List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Presupuestos Recientes</h3>
            <p className="text-xs text-slate-500">Últimos presupuestos emitidos a clientes.</p>
          </div>
          <button 
            onClick={() => onNavigateToTab("budget")}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentBudgets.map((budget) => (
            <div 
              key={budget.id}
              className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{budget.title}</span>
                  <span className="px-2 py-0.5 rounded-full font-mono text-[9px] bg-slate-100 text-slate-600 border border-slate-200">
                    ID: {budget.id}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-slate-500">
                  <span>Cliente: <strong className="text-slate-700">{budget.clientName}</strong></span>
                  <span>Pago: <span className="italic">{budget.paymentMethod}</span></span>
                  <span>Validez hasta: <strong className="text-purple-700">{budget.expirationDate || "N/A"}</strong></span>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6">
                <div className="text-right font-mono">
                  <span className="block font-black text-slate-900 text-sm">
                    ${budget.totalPrice.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Total bruto</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full font-semibold text-[10px] uppercase ${
                    budget.status === "approved" 
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                      : budget.status === "pending"
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : budget.status === "expired"
                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                      : "bg-blue-100 text-blue-800 border border-blue-200"
                  }`}>
                    {budget.status === "approved" ? "Aprobado" : budget.status === "pending" ? "Pendiente" : budget.status === "expired" ? "Vencido" : "No enviado"}
                  </span>

                  <button
                    onClick={() => {
                      onSelectBudget(budget);
                      onNavigateToTab("budget");
                    }}
                    className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                    title="Editar Presupuesto"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {recentBudgets.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              No hay presupuestos registrados en el sistema.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
