import React, { useState, useEffect } from "react";
import { 
  getCompanyConfig, 
  saveCompanyConfig, 
  getHourlyRateConfig, 
  saveHourlyRateConfig, 
  getTeamMembers, 
  saveTeamMembers, 
  getSavedReminders, 
  saveReminders 
} from "./mockStore";
import { 
  CompanyConfig, 
  HourlyRateConfig, 
  TeamMember, 
  SaleReminder 
} from "./types";
import { 
  Settings, 
  Building, 
  Clock, 
  Users, 
  Bell, 
  Save, 
  Plus, 
  Check, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Briefcase,
  ShieldAlert,
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function SettingsManager() {
  const [activeTab, setActiveTab] = useState<"company" | "hourly" | "team" | "reminders">("company");
  
  // State variables
  const [company, setCompany] = useState<CompanyConfig | null>(null);
  const [hourlyConfig, setHourlyConfig] = useState<HourlyRateConfig | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [reminders, setReminders] = useState<SaleReminder[]>([]);
  
  const [successMsg, setSuccessMsg] = useState("");
  const [activeEmployeeId, setActiveEmployeeId] = useState("");

  // Sub-forms states
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"admin" | "seller" | "carpenter">("seller");

  const [newReminderMessage, setNewReminderMessage] = useState("");
  const [newReminderDate, setNewReminderDate] = useState("");
  const [newReminderBudgetTitle, setNewReminderBudgetTitle] = useState("");
  const [newReminderClient, setNewReminderClient] = useState("");

  // Load configuration
  useEffect(() => {
    setCompany(getCompanyConfig());
    setHourlyConfig(getHourlyRateConfig());
    setTeamMembers(getTeamMembers());
    setReminders(getSavedReminders());
    
    const activeId = localStorage.getItem("melamina_active_employee_id") || "tm-1";
    setActiveEmployeeId(activeId);
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // Company savings
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    saveCompanyConfig(company);
    triggerSuccess("¡Configuración de la empresa guardada!");
  };

  // Hourly rate calculation updates
  const handleCalculateHourlyRate = () => {
    if (!hourlyConfig) return;
    
    const totalCosts = hourlyConfig.monthlyFixedCosts;
    const totalTargetSalary = hourlyConfig.targetMonthlySalary * hourlyConfig.teamMembersCount;
    const totalWorkingHoursPerMonth = hourlyConfig.workingDaysPerMonth * hourlyConfig.hoursPerDay * hourlyConfig.teamMembersCount;
    
    if (totalWorkingHoursPerMonth <= 0) return;

    // Cost per hour = (Fixed costs + Total desired salaries) / Total productive hours
    const baseCostPerHour = (totalCosts + totalTargetSalary) / totalWorkingHoursPerMonth;
    // Applied margin markup
    const rateWithMargin = baseCostPerHour * (1 + hourlyConfig.desiredProfitMarginPercent / 100);

    const updatedConfig = {
      ...hourlyConfig,
      calculatedRatePerHour: Math.round(rateWithMargin * 100) / 100
    };
    
    setHourlyConfig(updatedConfig);
  };

  const handleSaveHourlyRate = () => {
    if (!hourlyConfig) return;
    saveHourlyRateConfig(hourlyConfig);
    
    // Also update general standard hourly rates across local stores
    localStorage.setItem("melamina_standard_hourly_rate", hourlyConfig.calculatedRatePerHour.toString());
    triggerSuccess(`¡Tarifa horaria sugerida de $${hourlyConfig.calculatedRatePerHour.toLocaleString("es-AR")} guardada!`);
  };

  // Add/Switch Team Members
  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      alert("Por favor completa los campos obligatorios.");
      return;
    }

    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      name: newMemberName.trim(),
      role: newMemberRole,
      email: newMemberEmail.trim(),
      active: true
    };

    const updated = [...teamMembers, newMember];
    setTeamMembers(updated);
    saveTeamMembers(updated);

    setNewMemberName("");
    setNewMemberEmail("");
    setNewMemberRole("seller");
    triggerSuccess("¡Nuevo colaborador registrado con éxito!");
  };

  const handleDeleteTeamMember = (id: string) => {
    if (id === "tm-1") {
      alert("No se puede eliminar el administrador principal por defecto.");
      return;
    }
    const updated = teamMembers.filter(m => m.id !== id);
    setTeamMembers(updated);
    saveTeamMembers(updated);
    
    if (activeEmployeeId === id) {
      setActiveEmployeeId("tm-1");
      localStorage.setItem("melamina_active_employee_id", "tm-1");
    }
    triggerSuccess("Colaborador removido.");
  };

  const handleSwitchActiveEmployee = (id: string) => {
    setActiveEmployeeId(id);
    localStorage.setItem("melamina_active_employee_id", id);
    triggerSuccess(`Sesión cambiada. Operando como: ${teamMembers.find(m => m.id === id)?.name}`);
  };

  // Add/Complete Reminders
  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderMessage.trim()) return;

    const newRem: SaleReminder = {
      id: `rem-${Date.now()}`,
      budgetId: `custom-${Date.now()}`,
      budgetTitle: newReminderBudgetTitle || "Consulta General",
      clientName: newReminderClient || "Particular",
      dueDate: newReminderDate || new Date().toISOString().split("T")[0],
      message: newReminderMessage.trim(),
      isCompleted: false,
      createdAt: new Date().toISOString()
    };

    const updated = [newRem, ...reminders];
    setReminders(updated);
    saveReminders(updated);

    setNewReminderMessage("");
    setNewReminderBudgetTitle("");
    setNewReminderClient("");
    setNewReminderDate("");
    triggerSuccess("¡Recordatorio agendado!");
  };

  const handleToggleReminder = (id: string) => {
    const updated = reminders.map(r => {
      if (r.id === id) {
        return { ...r, isCompleted: !r.isCompleted };
      }
      return r;
    });
    setReminders(updated);
    saveReminders(updated);
    triggerSuccess("Estado del recordatorio actualizado.");
  };

  const handleDeleteReminder = (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
    saveReminders(updated);
    triggerSuccess("Recordatorio eliminado.");
  };

  return (
    <div className="space-y-6">
      
      {/* Session Header Status */}
      <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-lg text-emerald-400">
            <UserCheck className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Nivel de Acceso y Sesión Activa</span>
            <span className="text-xs font-bold text-white flex items-center gap-2">
              Operando como: <strong className="text-emerald-400 font-extrabold">{teamMembers.find(m => m.id === activeEmployeeId)?.name || "Esteban Melamínico"}</strong> 
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                {teamMembers.find(m => m.id === activeEmployeeId)?.role === "admin" ? "Administrador" : teamMembers.find(m => m.id === activeEmployeeId)?.role === "seller" ? "Vendedor" : "Carpintero Oficial"}
              </span>
            </span>
          </div>
        </div>

        {/* User quick selector */}
        <div className="flex items-center gap-2 text-xs">
          <label className="text-slate-400 text-[11px] font-semibold">Simular Empleado:</label>
          <select
            value={activeEmployeeId}
            onChange={(e) => handleSwitchActiveEmployee(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-700 rounded-lg text-white font-bold cursor-pointer"
          >
            {teamMembers.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Category Navigator */}
        <div className="lg:col-span-3 space-y-2">
          <button
            onClick={() => setActiveTab("company")}
            className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-3 ${
              activeTab === "company"
                ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Building className="w-4 h-4" /> Datos de Empresa e Impresión
          </button>
          <button
            onClick={() => setActiveTab("hourly")}
            className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-3 ${
              activeTab === "hourly"
                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Clock className="w-4 h-4" /> Calculadora de Tarifa Horaria
          </button>
          <button
            onClick={() => setActiveTab("team")}
            className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-3 ${
              activeTab === "team"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Users className="w-4 h-4" /> Equipo Multiusuario ({teamMembers.length})
          </button>
          <button
            onClick={() => setActiveTab("reminders")}
            className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-3 ${
              activeTab === "reminders"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Bell className="w-4 h-4" /> Plazos y Alertas de Venta
          </button>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs leading-relaxed text-slate-500 mt-6 space-y-1">
            <h4 className="font-bold text-slate-700">Ajustes Centralizados</h4>
            <p className="text-[11px]">Todos los valores configurados impactarán automáticamente en los PDF, contratos generados y en el panel comercial de la carpintería.</p>
          </div>
        </div>

        {/* Right Side: Active Workspace Card */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            
            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4" /> {successMsg}
              </div>
            )}

            {/* TAB 1: Company Profile Personalization */}
            {activeTab === "company" && company && (
              <motion.div
                key="company-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 text-xs text-slate-700"
              >
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Building className="w-5 h-5 text-purple-600" />
                    Personalización e Identidad de Empresa
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">Define los datos comerciales que se mostrarán impresos en la cabecera de tus presupuestos y contratos de melamina.</p>
                </div>

                <form onSubmit={handleSaveCompany} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Nombre de la Carpintería</label>
                      <input
                        type="text"
                        value={company.name}
                        onChange={(e) => setCompany({ ...company, name: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Persona Responsable (Firma en Presupuestos)</label>
                      <input
                        type="text"
                        value={company.representative}
                        onChange={(e) => setCompany({ ...company, representative: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Correo Electrónico de Contacto</label>
                      <input
                        type="email"
                        value={company.email}
                        onChange={(e) => setCompany({ ...company, email: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Teléfono / WhatsApp de Ventas</label>
                      <input
                        type="text"
                        value={company.phone}
                        onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Identificación Tributaria (CUIT / Rut)</label>
                      <input
                        type="text"
                        value={company.taxNumber || ""}
                        onChange={(e) => setCompany({ ...company, taxNumber: e.target.value })}
                        placeholder="Ej: CUIT 30-71458925-9"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Dirección Física del Taller / Showroom</label>
                      <input
                        type="text"
                        value={company.address}
                        onChange={(e) => setCompany({ ...company, address: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block mb-1">Términos, Garantías y Condiciones Generales por Defecto</label>
                    <textarea
                      value={company.termsAndConditions}
                      onChange={(e) => setCompany({ ...company, termsAndConditions: e.target.value })}
                      rows={5}
                      className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 font-sans leading-relaxed text-[11px]"
                    />
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" /> Guardar Cambios
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* TAB 2: Hourly Rate Advanced Calculator */}
            {activeTab === "hourly" && hourlyConfig && (
              <motion.div
                key="hourly-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 text-xs text-slate-700"
              >
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Calculadora Avanzada de Tarifa Horaria del Taller
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">Determina el costo operativo real de tu hora de trabajo y la de tu equipo de carpintería para garantizar la rentabilidad en cada presupuesto.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  
                  {/* Calculation Parameters */}
                  <div className="space-y-4 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                    <h4 className="font-extrabold text-slate-800 uppercase tracking-wide text-[10px] mb-2 border-b border-slate-200 pb-1.5">Costos del Taller y Nómina</h4>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Costos Fijos Mensuales ($)</label>
                        <span className="text-[10px] text-slate-400 block -mt-1">Alquiler de taller, electricidad de máquinas, herramientas, software de diseño, seguros...</span>
                        <input
                          type="number"
                          value={hourlyConfig.monthlyFixedCosts}
                          onChange={(e) => {
                            setHourlyConfig({ ...hourlyConfig, monthlyFixedCosts: Number(e.target.value) });
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg font-mono text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Salario Deseado Neto Mensual por Empleado / Dueño ($)</label>
                        <span className="text-[10px] text-slate-400 block -mt-1">Retribución mensual esperada por cada oficial carpintero.</span>
                        <input
                          type="number"
                          value={hourlyConfig.targetMonthlySalary}
                          onChange={(e) => {
                            setHourlyConfig({ ...hourlyConfig, targetMonthlySalary: Number(e.target.value) });
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg font-mono text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 text-[10px]">Cantidad Personal</label>
                          <input
                            type="number"
                            value={hourlyConfig.teamMembersCount}
                            min={1}
                            onChange={(e) => {
                              setHourlyConfig({ ...hourlyConfig, teamMembersCount: Math.max(1, Number(e.target.value)) });
                            }}
                            className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg font-mono text-center"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 text-[10px]">Días Lab. / Mes</label>
                          <input
                            type="number"
                            value={hourlyConfig.workingDaysPerMonth}
                            min={1}
                            onChange={(e) => {
                              setHourlyConfig({ ...hourlyConfig, workingDaysPerMonth: Math.max(1, Number(e.target.value)) });
                            }}
                            className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg font-mono text-center"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 text-[10px]">Horas / Día</label>
                          <input
                            type="number"
                            value={hourlyConfig.hoursPerDay}
                            min={1}
                            onChange={(e) => {
                              setHourlyConfig({ ...hourlyConfig, hoursPerDay: Math.max(1, Number(e.target.value)) });
                            }}
                            className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg font-mono text-center"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">% Margen de Utilidad sobre Costo de Labor</label>
                        <span className="text-[10px] text-slate-400 block -mt-1">Margen de ganancia o colchón de contingencia operativa.</span>
                        <input
                          type="number"
                          value={hourlyConfig.desiredProfitMarginPercent}
                          onChange={(e) => {
                            setHourlyConfig({ ...hourlyConfig, desiredProfitMarginPercent: Number(e.target.value) });
                          }}
                          className="w-full px-2.5 py-1.5 border border-slate-200 bg-white rounded-lg font-mono text-sm"
                        />
                      </div>
                    </div>

                    <div className="pt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={handleCalculateHourlyRate}
                        className="w-full px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-4 h-4" /> Recalcular Tarifa Real
                      </button>
                    </div>
                  </div>

                  {/* Calculations Visual Explanation Output */}
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl text-center space-y-4">
                      <span className="text-[10px] uppercase font-black text-blue-800 tracking-wider">Tarifa Ideal Calculada</span>
                      <h2 className="text-4xl font-black text-blue-900 font-mono tracking-tight">
                        ${hourlyConfig.calculatedRatePerHour.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        <span className="text-xs font-normal text-blue-700 block mt-1">por hora hombre de producción</span>
                      </h2>
                      
                      <p className="text-[11px] text-blue-800 max-w-sm mx-auto leading-relaxed">
                        Cobrar menos de este valor significa que estás absorbiendo pérdidas operativas o desvalorizando la mano de obra calificada del taller.
                      </p>
                    </div>

                    {/* Breakdown table */}
                    <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-slate-600 bg-white shadow-xs overflow-hidden">
                      <div className="p-3 bg-slate-100/50 flex items-center justify-between font-bold text-slate-800 text-[10px] uppercase">
                        <span>Fórmula Aplicada</span>
                        <span>Valor Mensual</span>
                      </div>
                      <div className="p-3 flex justify-between">
                        <span>Horas productivas de taller</span>
                        <span className="font-bold font-mono text-slate-800">
                          {hourlyConfig.workingDaysPerMonth * hourlyConfig.hoursPerDay * hourlyConfig.teamMembersCount} hs / mes
                        </span>
                      </div>
                      <div className="p-3 flex justify-between">
                        <span>Costo de operación total (Fijos + Salarios)</span>
                        <span className="font-bold font-mono text-slate-800">
                          ${(hourlyConfig.monthlyFixedCosts + hourlyConfig.targetMonthlySalary * hourlyConfig.teamMembersCount).toLocaleString()}
                        </span>
                      </div>
                      <div className="p-3 flex justify-between">
                        <span>Costo base técnico por hora</span>
                        <span className="font-bold font-mono text-slate-800">
                          ${Math.round(((hourlyConfig.monthlyFixedCosts + hourlyConfig.targetMonthlySalary * hourlyConfig.teamMembersCount) / (hourlyConfig.workingDaysPerMonth * hourlyConfig.hoursPerDay * hourlyConfig.teamMembersCount || 1)) * 100) / 100}
                        </span>
                      </div>
                      <div className="p-3 flex justify-between text-blue-900 bg-blue-50/40">
                        <span className="font-bold">Tarifa con {hourlyConfig.desiredProfitMarginPercent}% de ganancia</span>
                        <span className="font-black font-mono">
                          ${hourlyConfig.calculatedRatePerHour.toLocaleString("es-AR")}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleSaveHourlyRate}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                      >
                        <Save className="w-4 h-4" /> Guardar Tarifa en Ajustes
                      </button>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB 3: Multiusuario Team Administration */}
            {activeTab === "company" || activeTab === "team" && (
              <motion.div
                key="team-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 text-xs text-slate-700"
              >
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-slate-800" />
                    Niveles de Acceso y Gestión de Empleados
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">Controla quiénes preparan presupuestos en tu negocio y simula cambios de roles. Los vendedores solo cotizan, los carpinteros ven planos de despiece, los admins controlan todo.</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                  
                  {/* Left sub-col: register employee */}
                  <form onSubmit={handleAddTeamMember} className="lg:col-span-5 bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
                    <h4 className="font-extrabold text-slate-800 uppercase tracking-wide text-[10px] border-b border-slate-200 pb-1">Registrar Colaborador</h4>
                    
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Nombre Completo *</label>
                      <input
                        type="text"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        required
                        placeholder="Ej: Sofía Madera"
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">E-mail Laboral *</label>
                      <input
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        required
                        placeholder="sofia@carpinteriasystem.com"
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Rol de Acceso en Sistema</label>
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value as any)}
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-slate-800"
                      >
                        <option value="seller">Vendedor comercial (Solo cotizaciones)</option>
                        <option value="carpenter">Oficial Carpintero (Vistas técnicas)</option>
                        <option value="admin">Administrador (Control total financiero)</option>
                      </select>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> Registrar Empleado
                      </button>
                    </div>
                  </form>

                  {/* Right sub-col: listing registered team */}
                  <div className="lg:col-span-7 space-y-4">
                    <h4 className="font-extrabold text-slate-800 uppercase tracking-wide text-[10px]">Equipo Registrado</h4>
                    
                    <div className="space-y-2">
                      {teamMembers.map(m => {
                        const isCurrentlyActiveSession = m.id === activeEmployeeId;
                        return (
                          <div 
                            key={m.id}
                            className={`p-4 border rounded-xl flex items-center justify-between gap-4 transition-all bg-white ${
                              isCurrentlyActiveSession ? "border-emerald-500 ring-2 ring-emerald-50" : "border-slate-200"
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">{m.name}</span>
                                {isCurrentlyActiveSession && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase">
                                    Sesión activa
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 block">{m.email}</span>
                              <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase mt-1 ${
                                m.role === "admin" 
                                  ? "bg-purple-100 text-purple-800" 
                                  : m.role === "seller" 
                                  ? "bg-blue-100 text-blue-800" 
                                  : "bg-amber-100 text-amber-800"
                              }`}>
                                {m.role === "admin" ? "Administrador" : m.role === "seller" ? "Ventas / Comercial" : "Taller / Despiece"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {!isCurrentlyActiveSession ? (
                                <button
                                  onClick={() => handleSwitchActiveEmployee(m.id)}
                                  className="px-2.5 py-1 border border-slate-250 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-[10px] cursor-pointer"
                                >
                                  Simular Entrada
                                </button>
                              ) : (
                                <span className="p-1 bg-emerald-500 rounded-full text-white">
                                  <Check className="w-3 h-3" />
                                </span>
                              )}

                              {m.id !== "tm-1" && (
                                <button
                                  onClick={() => handleDeleteTeamMember(m.id)}
                                  className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB 4: Sale Reminders & Deadline Followups */}
            {activeTab === "reminders" && (
              <motion.div
                key="reminders-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 text-xs text-slate-700"
              >
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-emerald-600 animate-bounce" />
                    Plazos de Envío y Alertas de Seguimiento
                  </h3>
                  <p className="text-slate-500 text-xs mt-0.5">Establece alarmas de contacto comercial y recordatorios de validez de presupuestos para no perder ningún posible negocio.</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                  
                  {/* Create follow-up */}
                  <form onSubmit={handleAddReminder} className="lg:col-span-5 bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
                    <h4 className="font-extrabold text-slate-800 uppercase tracking-wide text-[10px] border-b border-slate-200 pb-1">Agendar Tarea de Seguimiento</h4>
                    
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Acción Requerida *</label>
                      <input
                        type="text"
                        value={newReminderMessage}
                        onChange={(e) => setNewReminderMessage(e.target.value)}
                        required
                        placeholder="Ej: Llamar por descuento de herrajes"
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Asociado al Proyecto / Presupuesto</label>
                      <input
                        type="text"
                        value={newReminderBudgetTitle}
                        onChange={(e) => setNewReminderBudgetTitle(e.target.value)}
                        placeholder="Ej: Placard de Carlos"
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-slate-800"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Cliente</label>
                        <input
                          type="text"
                          value={newReminderClient}
                          onChange={(e) => setNewReminderClient(e.target.value)}
                          placeholder="Carlos R."
                          className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Fecha Vence</label>
                        <input
                          type="date"
                          value={newReminderDate}
                          onChange={(e) => setNewReminderDate(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-slate-800 font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> Programar Alerta
                      </button>
                    </div>
                  </form>

                  {/* List reminders */}
                  <div className="lg:col-span-7 space-y-4">
                    <h4 className="font-extrabold text-slate-800 uppercase tracking-wide text-[10px]">Agenda de Contacto y Alarmas Comerciales</h4>
                    
                    <div className="space-y-2">
                      {reminders.map(r => (
                        <div 
                          key={r.id}
                          className={`p-4 border rounded-xl flex items-start justify-between gap-4 transition-all ${
                            r.isCompleted 
                              ? "bg-slate-50 border-slate-200 opacity-60" 
                              : "bg-white border-emerald-100 shadow-xs"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleReminder(r.id)}
                              className={`p-1 rounded-md border mt-0.5 cursor-pointer ${
                                r.isCompleted 
                                  ? "bg-emerald-500 border-emerald-500 text-white" 
                                  : "border-slate-300 bg-white hover:bg-slate-100"
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            
                            <div className="space-y-1">
                              <span className={`font-bold block text-xs ${r.isCompleted ? "line-through text-slate-500" : "text-slate-800"}`}>
                                {r.message}
                              </span>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
                                <span className="font-medium text-slate-600">Ref: {r.budgetTitle}</span>
                                <span>•</span>
                                <span className="font-medium text-slate-600">Cliente: {r.clientName}</span>
                                <span>•</span>
                                <span className="font-bold text-rose-600 flex items-center gap-0.5">
                                  <AlertCircle className="w-3 h-3" /> {new Date(r.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteReminder(r.id)}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer mt-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {reminders.length === 0 && (
                        <p className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl">No hay recordatorios pendientes. ¡Excelente trabajo!</p>
                      )}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
