import { 
  CRMClient, 
  CRMBudget, 
  HourlyRateConfig, 
  CompanyConfig, 
  TeamMember, 
  SaleReminder 
} from "./types";

// Default clients seed
const DEFAULT_CLIENTS: CRMClient[] = [
  {
    id: "c-1",
    name: "Alejandra Gómez",
    email: "alejandra.gomez@gmail.com",
    phone: "+54 9 11 5566-7788",
    address: "Av. Libertador 1420, Palermo, CABA",
    company: "Particular",
    createdAt: "2026-05-10T14:32:00Z"
  },
  {
    id: "c-2",
    name: "Carlos Rodríguez",
    email: "carlos.rodriguez@constructora.com",
    phone: "+56 9 8877-6655",
    address: "Calle Suecia 425, Providencia, Santiago",
    company: "Constructora Andes Ltda",
    createdAt: "2026-06-01T09:15:00Z"
  },
  {
    id: "c-3",
    name: "Sofía Martínez",
    email: "sofia.m@outlook.com",
    phone: "+34 612 345 678",
    address: "Gran Vía 12, 3º B, Madrid",
    company: "Estudio Diseño M&M",
    createdAt: "2026-06-15T18:45:00Z"
  }
];

// Default budgets seed
const DEFAULT_BUDGETS: CRMBudget[] = [
  {
    id: "b-101",
    title: "Mobiliario Completo Cocina Nórdica",
    clientId: "c-1",
    clientName: "Alejandra Gómez",
    status: "approved",
    approvedBy: "Alejandra Gómez (Firma Digital)",
    approvedAt: "2026-07-10T16:40:00Z",
    createdAt: "2026-07-08T10:00:00Z",
    expirationDate: "2026-07-23", // 15 days validity
    paymentMethod: "Transferencia (50% anticipo, 50% contra entrega)",
    notes: "Utilizar Melamina Roble Escandinavo combinada con Blanco Mate. Herrajes con sistema de cierre suave.",
    totalPrice: 4250.00,
    rooms: [
      {
        id: "r-1",
        name: "Cocina Principal",
        items: [
          {
            id: "i-1",
            description: "Bajo Mesada de Melamina Roble 18mm",
            calculationMethod: "linear_meter",
            length: 3.4,
            linearMeterPrice: 750,
            options: "Canto PVC 2mm en frentes. Tiradores perfil gola de aluminio.",
            totalPrice: 2550.00
          },
          {
            id: "i-2",
            description: "Alacena Aérea con Puertas de Vidrio y Marco de Aluminio",
            calculationMethod: "linear_meter",
            length: 2.5,
            linearMeterPrice: 680,
            options: "Pistones de gas para apertura controlada hacia arriba.",
            totalPrice: 1700.00
          }
        ]
      }
    ],
    contract: {
      id: "cont-101",
      budgetId: "b-101",
      status: "signed",
      signedBy: "Alejandra Gómez",
      signedAt: "2026-07-10T16:40:00Z",
      signatureDataUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='40'><path d='M10,20 Q30,5 50,25 T90,15' stroke='blue' stroke-width='2' fill='none'/></svg>",
      contractText: `CONTRATO DE VENTA DE MUEBLES A MEDIDA

Entre el Proveedor de Muebles en Melamina ("El Fabricante") y el cliente Alejandra Gómez ("El Cliente"), se acuerda lo siguiente:

1. OBJETO DEL CONTRATO: El Fabricante se compromete a fabricar e instalar el mobiliario detallado en el Presupuesto N° b-101 ("Mobiliario Completo Cocina Nórdica"), con las dimensiones, materiales y acabados allí descritos.

2. PRECIO Y FORMA DE PAGO: El costo total del proyecto es de $4250.00. El Cliente abonará un 50% en carácter de anticipo para compra de materiales y el 50% restante al finalizar la instalación de conformidad.

3. TIEMPO DE ENTREGA: El plazo estimado de entrega e instalación es de 25 días hábiles a partir de la firma del presente y acreditación del anticipo.`
    }
  },
  {
    id: "b-102",
    title: "Armario de Dormitorio con Puertas Corredizas",
    clientId: "c-2",
    clientName: "Carlos Rodríguez",
    status: "pending",
    createdAt: "2026-07-12T11:30:00Z",
    expirationDate: "2026-07-27",
    paymentMethod: "Efectivo / Cheque 30 días",
    notes: "Puertas con perfil de aluminio anodizado natural. Espejo en una de las puertas centrales.",
    totalPrice: 1850.00,
    rooms: [
      {
        id: "r-2",
        name: "Dormitorio Principal",
        items: [
          {
            id: "i-3",
            description: "Placard Empotrado Blanco Liso 18mm",
            calculationMethod: "sq_meter",
            width: 2.2,
            height: 2.4,
            sqMeterPrice: 350,
            options: "Cajoneras con guías telescópicas. Perchero de aluminio reforzado.",
            totalPrice: 1848.00 // rounded to 1850 in total
          }
        ]
      }
    ]
  },
  {
    id: "b-103",
    title: "Mesa de Escritorio y Estantes Flotantes",
    clientId: "c-3",
    clientName: "Sofía Martínez",
    status: "unanswered",
    createdAt: "2026-07-01T15:20:00Z",
    expirationDate: "2026-07-16", // Will appear expired/vencido soon depending on date
    paymentMethod: "Tarjeta de Crédito en 3 cuotas",
    notes: "Color Gris Grafito combinado con detalles en madera de nogal.",
    totalPrice: 980.00,
    rooms: [
      {
        id: "r-3",
        name: "Home Office / Estudio",
        items: [
          {
            id: "i-4",
            description: "Escritorio en L Reforzado",
            calculationMethod: "manual",
            materialCost: 400,
            productionHours: 12,
            hourlyRate: 25,
            markupPercent: 40,
            options: "Patas metálicas de diseño industrial, pasacables de aluminio.",
            totalPrice: 980.00 // (400 + 12*25) * 1.40 = 700 * 1.40 = 980.00
          }
        ]
      }
    ]
  }
];

const DEFAULT_CONTRACT_TEMPLATE = `CONTRATO DE VENTA DE MUEBLES A MEDIDA

Entre el Proveedor de Muebles en Melamina y Carpintería Pro ("El Fabricante") y el cliente {CLIENT_NAME} ("El Cliente"), se acuerda la contratación de los servicios de diseño, fabricación e instalación conforme a las siguientes cláusulas:

1. OBJETO DEL CONTRATO: El Fabricante se compromete a realizar la entrega del proyecto denominado "{PROJECT_TITLE}", que abarca el mobiliario diseñado y detallado para los ambientes de: {ROOMS_LIST}.

2. VALOR DE LA OBRA Y FORMA DE PAGO: Las partes convienen fijar el valor total del presente contrato en la suma de {PROJECT_TOTAL}, el cual será abonado por El Cliente a través del método de pago acordado de: {PAYMENT_METHOD}.

3. TIEMPO DE ENTREGA: El plazo acordado para la fabricación e instalación final de los muebles se fija en un plazo de {DELIVERY_DAYS} días hábiles, contados a partir del cobro del anticipo inicial del 50%.

Firma El Cliente: {CLIENT_NAME}
Fecha de firma: {SIGNATURE_DATE}`;

const DEFAULT_HOURLY_RATE_CONFIG: HourlyRateConfig = {
  monthlyFixedCosts: 120000, // ARS or arbitrary currency
  workingDaysPerMonth: 22,
  hoursPerDay: 8,
  teamMembersCount: 2,
  targetMonthlySalary: 280000,
  desiredProfitMarginPercent: 30,
  calculatedRatePerHour: 2477.27 // Rounded: ((120000 + 2*280000) / (22 * 8 * 2)) * 1.3
};

const DEFAULT_COMPANY_CONFIG: CompanyConfig = {
  name: "Carpintería System Pro",
  email: "ventas@carpinteriasystem.com",
  phone: "+54 9 11 9876-5432",
  address: "Av. de los Artesanos 1950, Zona Industrial, Argentina",
  representative: "Esteban Melamínico",
  taxNumber: "CUIT 30-71458925-9",
  primaryColor: "slate",
  termsAndConditions: `1. Validez de esta cotización: 15 días corridos.
2. Forma de Pago: 50% de anticipo para compra de melamina y herrajes, 50% contra entrega e instalación.
3. Plazo de Entrega: Estimado en 30 días hábiles tras confirmación del pago inicial.
4. Ajuste por cambios: Modificaciones de diseño o medidas posteriores a la firma alterarán el presupuesto original.`
};

const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  { id: "tm-1", name: "Esteban Melamínico", role: "admin", email: "esteban@carpinteriasystem.com", active: true },
  { id: "tm-2", name: "Sofía Madera", role: "seller", email: "sofia@carpinteriasystem.com", active: true },
  { id: "tm-3", name: "Martín Canteador", role: "carpenter", email: "martin@carpinteriasystem.com", active: true }
];

const DEFAULT_REMINDERS: SaleReminder[] = [
  {
    id: "rem-1",
    budgetId: "b-102",
    budgetTitle: "Armario de Dormitorio con Puertas Corredizas",
    clientName: "Carlos Rodríguez",
    dueDate: "2026-07-20",
    message: "Llamar por teléfono a Carlos para ofrecer descuento del 5% si cierra esta semana.",
    isCompleted: false,
    createdAt: "2026-07-13T10:00:00Z"
  },
  {
    id: "rem-2",
    budgetId: "b-103",
    budgetTitle: "Mesa de Escritorio y Estantes Flotantes",
    clientName: "Sofía Martínez",
    dueDate: "2026-07-15",
    message: "Enviar recordatorio por WhatsApp de vencimiento inminente del presupuesto.",
    isCompleted: true,
    createdAt: "2026-07-12T14:00:00Z"
  }
];

// Helper hooks/functions to manage persistence
export function getSavedClients(): CRMClient[] {
  const data = localStorage.getItem("melamina_crm_clients");
  if (!data) {
    localStorage.setItem("melamina_crm_clients", JSON.stringify(DEFAULT_CLIENTS));
    return DEFAULT_CLIENTS;
  }
  return JSON.parse(data);
}

export function saveClients(clients: CRMClient[]) {
  localStorage.setItem("melamina_crm_clients", JSON.stringify(clients));
}

export function getSavedBudgets(): CRMBudget[] {
  const data = localStorage.getItem("melamina_crm_budgets");
  if (!data) {
    localStorage.setItem("melamina_crm_budgets", JSON.stringify(DEFAULT_BUDGETS));
    return DEFAULT_BUDGETS;
  }
  return JSON.parse(data);
}

export function saveBudgets(budgets: CRMBudget[]) {
  localStorage.setItem("melamina_crm_budgets", JSON.stringify(budgets));
}

export function getContractTemplate(): string {
  const data = localStorage.getItem("melamina_contract_template");
  if (!data) {
    localStorage.setItem("melamina_contract_template", DEFAULT_CONTRACT_TEMPLATE);
    return DEFAULT_CONTRACT_TEMPLATE;
  }
  return data;
}

export function saveContractTemplate(template: string) {
  localStorage.setItem("melamina_contract_template", template);
}

export function getHourlyRateConfig(): HourlyRateConfig {
  const data = localStorage.getItem("melamina_hourly_rate_config");
  if (!data) {
    localStorage.setItem("melamina_hourly_rate_config", JSON.stringify(DEFAULT_HOURLY_RATE_CONFIG));
    return DEFAULT_HOURLY_RATE_CONFIG;
  }
  return JSON.parse(data);
}

export function saveHourlyRateConfig(config: HourlyRateConfig) {
  localStorage.setItem("melamina_hourly_rate_config", JSON.stringify(config));
}

export function getCompanyConfig(): CompanyConfig {
  const data = localStorage.getItem("melamina_company_config");
  if (!data) {
    localStorage.setItem("melamina_company_config", JSON.stringify(DEFAULT_COMPANY_CONFIG));
    return DEFAULT_COMPANY_CONFIG;
  }
  return JSON.parse(data);
}

export function saveCompanyConfig(config: CompanyConfig) {
  localStorage.setItem("melamina_company_config", JSON.stringify(config));
}

export function getTeamMembers(): TeamMember[] {
  const data = localStorage.getItem("melamina_team_members");
  if (!data) {
    localStorage.setItem("melamina_team_members", JSON.stringify(DEFAULT_TEAM_MEMBERS));
    return DEFAULT_TEAM_MEMBERS;
  }
  return JSON.parse(data);
}

export function saveTeamMembers(members: TeamMember[]) {
  localStorage.setItem("melamina_team_members", JSON.stringify(members));
}

export function getSavedReminders(): SaleReminder[] {
  const data = localStorage.getItem("melamina_sale_reminders");
  if (!data) {
    localStorage.setItem("melamina_sale_reminders", JSON.stringify(DEFAULT_REMINDERS));
    return DEFAULT_REMINDERS;
  }
  return JSON.parse(data);
}

export function saveReminders(reminders: SaleReminder[]) {
  localStorage.setItem("melamina_sale_reminders", JSON.stringify(reminders));
}
