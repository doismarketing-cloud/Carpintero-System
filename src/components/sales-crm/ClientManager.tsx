import React, { useState } from "react";
import { CRMClient, CRMBudget } from "./types";
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase, 
  FileText, 
  Trash2, 
  Check, 
  TrendingUp, 
  Calendar 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ClientManagerProps {
  clients: CRMClient[];
  budgets: CRMBudget[];
  onAddClient: (client: Omit<CRMClient, "id" | "createdAt">) => void;
  onDeleteClient: (id: string) => void;
  onSelectBudget: (budget: CRMBudget) => void;
  onNavigateToTab: (tab: string) => void;
}

export default function ClientManager({
  clients,
  budgets,
  onAddClient,
  onDeleteClient,
  onSelectBudget,
  onNavigateToTab
}: ClientManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<CRMClient | null>(null);

  // New client form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [company, setCompany] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMsg("El nombre y el correo electrónico son obligatorios.");
      return;
    }
    onAddClient({ name, email, phone, address, company: company || "Particular" });
    
    // Reset state
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCompany("");
    setErrorMsg("");
    setShowAddModal(false);
  };

  // Helper metrics for selected client
  const clientBudgets = selectedClient 
    ? budgets.filter(b => b.clientId === selectedClient.id)
    : [];

  const approvedClientBudgets = clientBudgets.filter(b => b.status === "approved");
  const totalClientBilling = approvedClientBudgets.reduce((acc, b) => acc + b.totalPrice, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Control de Clientes
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Registra clientes, consulta sus historiales de compra y monitorea tus prospectos de venta.</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Agregar Nuevo Cliente
        </button>
      </div>

      {/* Main layout splitting List vs. Details Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Clients List with Search */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar por nombre, correo o empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs text-slate-800 bg-transparent outline-hidden w-full"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
            {filteredClients.map((client) => {
              const count = budgets.filter(b => b.clientId === client.id).length;
              const isSelected = selectedClient?.id === client.id;
              
              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`p-4 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between gap-4 text-xs ${
                    isSelected ? "bg-purple-50/60 border-l-4 border-purple-600 pl-3" : ""
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">{client.name}</span>
                      {client.company && client.company !== "Particular" && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 text-[9px] rounded-md font-medium">
                          {client.company}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> {client.email}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {client.phone || "Sin teléfono"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-[10px]">
                      {count} {count === 1 ? "presupuesto" : "presupuestos"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Estás seguro de eliminar a ${client.name}?`)) {
                          onDeleteClient(client.id);
                          if (selectedClient?.id === client.id) setSelectedClient(null);
                        }
                      }}
                      className="p-1 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-md transition-colors"
                      title="Eliminar cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredClients.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No se encontraron clientes que coincidan con la búsqueda.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive History Drawer */}
        <div className="lg:col-span-6">
          <AnimatePresence mode="wait">
            {selectedClient ? (
              <motion.div
                key={selectedClient.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6"
              >
                {/* Client profile banner */}
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Ficha del Cliente
                    </span>
                    <h3 className="text-lg font-black text-slate-900">{selectedClient.name}</h3>
                    <p className="text-slate-500 text-xs flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      Empresa: {selectedClient.company || "Particular"}
                    </p>
                  </div>
                  
                  {/* Total billing stat */}
                  <div className="text-right p-3 bg-purple-50/50 rounded-xl border border-purple-100/50">
                    <span className="block text-[9px] uppercase font-bold text-purple-800">Facturación Total</span>
                    <span className="text-base font-black text-purple-900 font-mono">
                      ${totalClientBilling.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Contact data sheet */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="space-y-2">
                    <p className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>{selectedClient.email}</span>
                    </p>
                    <p className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>{selectedClient.phone || "No especificado"}</span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="line-clamp-2">{selectedClient.address || "No especificada"}</span>
                    </p>
                    <p className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Registrado: {new Date(selectedClient.createdAt).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>

                {/* Client's budget history list */}
                <div className="space-y-4">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center justify-between">
                    <span>Historial de Presupuestos ({clientBudgets.length})</span>
                    <button
                      onClick={() => onNavigateToTab("budget")}
                      className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
                    >
                      Nuevo Presupuesto <Plus className="w-3.5 h-3.5" />
                    </button>
                  </h4>

                  <div className="space-y-3">
                    {clientBudgets.map((budget) => (
                      <div 
                        key={budget.id}
                        className="p-4 rounded-xl border border-slate-150 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 text-xs"
                      >
                        <div className="space-y-1">
                          <span className="font-bold text-slate-900 block">{budget.title}</span>
                          <div className="flex items-center gap-3 text-slate-500 text-[10px]">
                            <span>ID: {budget.id}</span>
                            <span>{new Date(budget.createdAt).toLocaleDateString()}</span>
                            <span>{budget.paymentMethod}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="block font-bold text-slate-900 font-mono">
                              ${budget.totalPrice.toLocaleString("es-AR")}
                            </span>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] uppercase font-semibold ${
                              budget.status === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : budget.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}>
                              {budget.status === "approved" ? "Aprobado" : budget.status === "pending" ? "Pendiente" : "No respondido"}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              onSelectBudget(budget);
                              onNavigateToTab("budget");
                            }}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-[10px] transition-all cursor-pointer"
                          >
                            Editar
                          </button>
                        </div>
                      </div>
                    ))}

                    {clientBudgets.length === 0 && (
                      <div className="p-6 border border-dashed border-slate-200 text-center text-slate-400 rounded-xl text-xs">
                        Este cliente aún no tiene presupuestos creados.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
                Selecciona un cliente de la lista para ver su ficha técnica, historial de presupuestos y facturación.
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* New Client Modal Simulation */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Agregar Nuevo Cliente</h3>
              <p className="text-slate-500 text-xs mt-0.5">Ingresa los datos para registrarlo en el sistema.</p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-lg">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Alejandra Gómez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="Ej: alejandra.gomez@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Teléfono</label>
                  <input
                    type="text"
                    placeholder="Ej: +54 9 11 5566-7788"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Empresa / Particular</label>
                  <input
                    type="text"
                    placeholder="Ej: Estudio M&M"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Dirección</label>
                <input
                  type="text"
                  placeholder="Ej: Av. Libertador 1420, Palermo, CABA"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Registrar Cliente
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
