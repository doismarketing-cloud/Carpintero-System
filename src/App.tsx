import React, { useState, useEffect } from "react";
import { 
  Hammer, 
  TrendingUp, 
  Users, 
  ClipboardList, 
  FileText, 
  Settings, 
  Menu, 
  X,
  ShieldCheck
} from "lucide-react";
import { CRMClient, CRMBudget, CRMContract } from "./components/sales-crm/types";
import { 
  getSavedClients, 
  saveClients, 
  getSavedBudgets, 
  saveBudgets 
} from "./components/sales-crm/mockStore";

import SalesDashboard from "./components/sales-crm/SalesDashboard";
import BudgetManager from "./components/sales-crm/BudgetManager";
import ClientManager from "./components/sales-crm/ClientManager";
import ContractGenerator from "./components/sales-crm/ContractGenerator";
import SettingsManager from "./components/sales-crm/SettingsManager";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "budget" | "clients" | "contracts" | "settings">("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core CRM States
  const [clients, setClients] = useState<CRMClient[]>([]);
  const [budgets, setBudgets] = useState<CRMBudget[]>([]);
  const [contracts, setContracts] = useState<CRMContract[]>([]);

  // Selection buffers for cross-tab workflows
  const [selectedBudgetExternal, setSelectedBudgetExternal] = useState<CRMBudget | null>(null);
  const [selectedBudgetForContract, setSelectedBudgetForContract] = useState<CRMBudget | null>(null);

  // Load persistence on mount
  useEffect(() => {
    setClients(getSavedClients());
    setBudgets(getSavedBudgets());
    
    // Extract saved contracts from the budgets
    const savedBudgets = getSavedBudgets();
    const existingContracts: CRMContract[] = [];
    savedBudgets.forEach(b => {
      if (b.contract) {
        existingContracts.push(b.contract);
      }
    });
    setContracts(existingContracts);
  }, []);

  // Clients persistence helpers
  const handleAddClient = (newClientData: Omit<CRMClient, "id" | "createdAt">) => {
    const newClient: CRMClient = {
      ...newClientData,
      id: `c-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newClient, ...clients];
    setClients(updated);
    saveClients(updated);
  };

  const handleDeleteClient = (clientId: string) => {
    const updated = clients.filter(c => c.id !== clientId);
    setClients(updated);
    saveClients(updated);

    // Clean up budgets associated with this client
    const updatedBudgets = budgets.filter(b => b.clientId !== clientId);
    setBudgets(updatedBudgets);
    saveBudgets(updatedBudgets);
  };

  // Budgets persistence helpers
  const handleSaveBudget = (savedBudget: CRMBudget) => {
    const index = budgets.findIndex(b => b.id === savedBudget.id);
    let updated: CRMBudget[] = [];
    
    if (index >= 0) {
      updated = [...budgets];
      updated[index] = savedBudget;
    } else {
      updated = [savedBudget, ...budgets];
    }
    
    setBudgets(updated);
    saveBudgets(updated);
  };

  const handleDeleteBudget = (budgetId: string) => {
    const updated = budgets.filter(b => b.id !== budgetId);
    setBudgets(updated);
    saveBudgets(updated);
  };

  // Contracts persistence helpers
  const handleSaveContract = (savedContract: CRMContract) => {
    const index = contracts.findIndex(c => c.id === savedContract.id);
    let updatedContracts = [...contracts];
    if (index >= 0) {
      updatedContracts[index] = savedContract;
    } else {
      updatedContracts = [savedContract, ...contracts];
    }
    setContracts(updatedContracts);

    // Embed contract in the respective budget
    const updatedBudgets = budgets.map(b => {
      if (b.id === savedContract.budgetId) {
        return {
          ...b,
          contract: savedContract,
          // Sign contract auto-approves the budget
          status: (savedContract.status === "signed" ? "approved" : b.status) as any,
          approvedBy: savedContract.status === "signed" ? savedContract.signedBy : b.approvedBy,
          approvedAt: savedContract.status === "signed" ? savedContract.signedAt : b.approvedAt
        };
      }
      return b;
    });

    setBudgets(updatedBudgets);
    saveBudgets(updatedBudgets);
  };

  // Clean-up or close printable view when going print-mode
  const isPrintablePortalActive = activeTab === "budget" && selectedBudgetExternal && (BudgetManager as any);

  const menuItems = [
    { id: "dashboard", label: "Panel de Control", icon: TrendingUp },
    { id: "budget", label: "Presupuestos", icon: ClipboardList },
    { id: "clients", label: "Clientes", icon: Users },
    { id: "contracts", label: "Contratos de Venta", icon: FileText },
    { id: "settings", label: "Configuración", icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:24px_24px] bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      
      {/* Top Premium Unified Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Branding / Logo */}
            <div
              onClick={() => {
                setActiveTab("dashboard");
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 cursor-pointer select-none group"
            >
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-all duration-300">
                <Hammer className="w-5 h-5" />
              </div>
              <div className="space-y-0">
                <span className="text-base font-extrabold tracking-tight text-white block leading-none">
                  SYSTEM CARPINTERO
                </span>
                <span className="text-[10px] text-amber-400 font-bold tracking-widest font-mono">
                  SISTEMA COMERCIAL
                </span>
              </div>
            </div>

            {/* Desktop Unified Tabs */}
            <nav className="hidden lg:flex items-center gap-1.5">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (item.id !== "budget") {
                        setSelectedBudgetExternal(null);
                      }
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${isActive ? "text-slate-950" : "text-slate-400"}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Active Status Badge */}
            <div className="hidden md:flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SISTEMA COMERCIAL ONLINE
              </span>
            </div>

            {/* Mobile menu trigger */}
            <div className="lg:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900/98 backdrop-blur-lg border-b border-slate-800 py-4 px-4 space-y-2 animate-slide-down">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                    if (item.id !== "budget") {
                      setSelectedBudgetExternal(null);
                    }
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-amber-500 text-slate-950 shadow-md"
                      : "text-slate-300 hover:bg-slate-800/80"
                  }`}
                >
                  <IconComponent className={`w-4 h-4 ${isActive ? "text-slate-950" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Container Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        
        {activeTab === "dashboard" && (
          <SalesDashboard
            budgets={budgets}
            clients={clients}
            onNavigateToTab={(tab: any) => setActiveTab(tab)}
            onSelectBudget={(b) => {
              setSelectedBudgetExternal(b);
              setActiveTab("budget");
            }}
          />
        )}

        {activeTab === "budget" && (
          <BudgetManager
            budgets={budgets}
            clients={clients}
            importedParts={[]}
            onSaveBudget={handleSaveBudget}
            onDeleteBudget={handleDeleteBudget}
            onNavigateToTab={(tab: any) => setActiveTab(tab)}
            selectedBudgetExternal={selectedBudgetExternal}
            onClearExternalSelection={() => setSelectedBudgetExternal(null)}
            onGenerateContract={(b) => {
              setSelectedBudgetForContract(b);
              setActiveTab("contracts");
            }}
          />
        )}

        {activeTab === "clients" && (
          <ClientManager
            clients={clients}
            budgets={budgets}
            onAddClient={handleAddClient}
            onDeleteClient={handleDeleteClient}
            onSelectBudget={(b) => {
              setSelectedBudgetExternal(b);
              setActiveTab("budget");
            }}
            onNavigateToTab={(tab: any) => setActiveTab(tab)}
          />
        )}

        {activeTab === "contracts" && (
          <ContractGenerator
            budgets={budgets}
            contracts={contracts}
            onSaveContract={handleSaveContract}
            selectedBudgetForContract={selectedBudgetForContract}
            onClearSelectedBudget={() => setSelectedBudgetForContract(null)}
          />
        )}

        {activeTab === "settings" && (
          <SettingsManager />
        )}

      </main>

      {/* Elegant Professional Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-center text-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-bold text-slate-300 tracking-wider">SYSTEM CARPINTERO • SUITE COMERCIAL</p>
          <p className="max-w-xl mx-auto text-slate-500 leading-relaxed font-sans">
            Sistema comercial avanzado para carpinterías: presupuestos a medida con múltiples métodos de cálculo, gestión de clientes, panel de control comercial y firma digital de contratos en segundos.
          </p>
        </div>
      </footer>

    </div>
  );
}
