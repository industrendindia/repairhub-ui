import { ArrowLeft, ArrowRight, Camera, CheckCircle2, Home, LogOut, Menu, Plus, Printer, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { httpClient } from "@/lib/api/httpClient";
import { storage } from "@/lib/storage/storage";
import { Button } from "@/shared/components/ui/Button";
import { FileUpload } from "@/shared/components/ui/FileUpload";
import { FormField } from "@/shared/components/ui/FormField";
import { Input } from "@/shared/components/ui/Input";
import { Select } from "@/shared/components/ui/Select";
import { Textarea } from "@/shared/components/ui/Textarea";

type IntakeStep = "customer" | "items" | "billing" | "payment" | "final" | "billingHistory" | "repairMaintenance";

type CustomerDetails = {
  customerName: string;
  mobile: string;
  email: string;
  address: string;
  notes: string;
};

type WorkItemOption = {
  workItemId: string;
  itemName: string;
  category: string;
  description: string;
  defaultPrice: number;
  warrantyDays: number;
};

type ItemPhoto = {
  name: string;
  url: string;
};

type RepairItem = {
  id: string;
  repairItemId?: number;
  workItemId: string;
  itemName: string;
  category: string;
  serialNo: string;
  description: string;
  quantity: number;
  basePrice: number;
  actualPrice: number;
  discount: number;
  warrantyDays: number;
  photos: ItemPhoto[];
  technicianNames?: string;
};

type BillingDetails = {
  discount: number;
  adjustment: number;
  tax: number;
};

type PaymentDetails = {
  paymentMode: string;
  amount: number;
  referenceNumber: string;
  remarks: string;
};

type PersistedBillDetails = {
  billId: number;
  repairId: number;
  customerId: number;
  repairNumber: string;
  billNumber: string;
  paymentStatus: string;
};

type BillSearchResult = {
  billId: number;
  billNumber: string;
  repairNumber: string;
  customerName: string;
  mobile: string;
  grandTotal: number;
  amountPaid: number;
  balance: number;
  paymentStatus: string;
  photoId: string | null;
  photoUrl: string | null;
};

type BillDetail = PersistedBillDetails & {
  customer: CustomerDetails;
  repairMeta: RepairMeta;
  items: Array<Omit<RepairItem, "id" | "photos"> & { photos?: ItemPhoto[] }>;
  subtotal: number;
  discount: number;
  adjustment: number;
  tax: number;
  grandTotal: number;
  amountPaid: number;
  balance: number;
  technicianNames: string;
};

type Employee = {
  employeeId: number;
  employeeCode: string;
  name: string;
  mobile: string;
  status: string;
};

type MaintenanceRepairItem = {
  repairItemId: number;
  itemName: string;
  serialNo: string;
  description: string;
  status: string;
  technicianNames: string;
};

type MaintenanceBill = {
  billId: number;
  billNumber: string;
  repairNumber: string;
  customerName: string;
  mobile: string;
  grandTotal: number;
  balance: number;
  paymentStatus: string;
  items: MaintenanceRepairItem[];
};

type JobCard = {
  header: {
    repairItemId: number;
    billNumber: string;
    repairNumber: string;
    customerName: string;
    itemName: string;
    serialNo: string;
    description: string;
    status: string;
  };
  assignments: Array<{
    assignmentId: number;
    employeeId: number;
    employeeName: string;
    assignedBy: string;
    assignedOn: string;
    releasedOn: string | null;
    active: boolean;
  }>;
  activities: Array<{
    activityId: number;
    employeeName: string;
    activityType: string;
    startTime: string;
    endTime: string | null;
    durationMinutes: number | null;
    remarks: string;
  }>;
  statusHistory: Array<{
    oldStatus: string | null;
    newStatus: string;
    changedBy: string;
    changedOn: string;
    remarks: string;
  }>;
  attachments: Array<{ attachmentId: number; fileName: string; filePath: string; attachmentType: string }>;
  parts: Array<{ repairPartId: number; partName: string; quantity: number; unitPrice: number; totalPrice: number }>;
};

type RepairMeta = {
  expectedDelivery: string;
  priority: string;
  remarks: string;
};

type IntakeDraft = {
  step: IntakeStep;
  customer: CustomerDetails;
  repairMeta: RepairMeta;
  items: RepairItem[];
  draftItem: RepairItem;
  billing: BillingDetails;
  payment: PaymentDetails;
  persistedBill: PersistedBillDetails | null;
  loadedBill: BillDetail | null;
  previousAmountPaid: number;
};

const steps: Array<{ key: IntakeStep; label: string }> = [
  { key: "customer", label: "Customer" },
  { key: "items", label: "Items" },
  { key: "billing", label: "Billing" },
  { key: "payment", label: "Payment" },
  { key: "final", label: "Final Bill" },
];

const workflowSteps = steps.filter((entry) => entry.key !== "billingHistory");
const intakeSteps: IntakeStep[] = [...steps.map((entry) => entry.key), "billingHistory", "repairMaintenance"];

const navigationMenuItems = ["Home", "Repair Maintenance", "Employees", "Repair History", "Billing History", "Customers"];
const billingHistoryPageSize = 10;

const defaultCustomer: CustomerDetails = {
  customerName: "",
  mobile: "",
  email: "",
  address: "",
  notes: "",
};

const defaultRepairMeta: RepairMeta = {
  expectedDelivery: "",
  priority: "NORMAL",
  remarks: "",
};

const defaultDraftItem: RepairItem = {
  id: "",
  workItemId: "",
  itemName: "",
  category: "",
  serialNo: "",
  description: "",
  quantity: 1,
  basePrice: 0,
  actualPrice: 0,
  discount: 0,
  warrantyDays: 0,
  photos: [],
};

const defaultBilling: BillingDetails = {
  discount: 0,
  adjustment: 0,
  tax: 0,
};

const defaultPayment: PaymentDetails = {
  paymentMode: "CASH",
  amount: 0,
  referenceNumber: "",
  remarks: "",
};

const defaultIntakeDraft: IntakeDraft = {
  step: "customer",
  customer: defaultCustomer,
  repairMeta: defaultRepairMeta,
  items: [],
  draftItem: defaultDraftItem,
  billing: defaultBilling,
  payment: defaultPayment,
  persistedBill: null,
  loadedBill: null,
  previousAmountPaid: 0,
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

function toMoney(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function formatDate(value?: string) {
  const date = value ? new Date(value) : new Date();

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string) {
  const date = value ? new Date(value) : new Date();

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function amount(value: number) {
  return toMoney(value).toFixed(2);
}

function emptyDraftItem(): RepairItem {
  return { ...defaultDraftItem, photos: [] };
}

function fileToPhoto(file: File): Promise<ItemPhoto> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name,
        url: typeof reader.result === "string" ? reader.result : "",
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function intakeDraftKey(userId?: string) {
  return `repairhub.intake.draft.${userId || "anonymous"}`;
}

function readIntakeDraft(key: string): IntakeDraft {
  const savedDraft = storage.get<Partial<IntakeDraft>>(key);
  const savedStep: IntakeStep = intakeSteps.includes(savedDraft?.step as IntakeStep)
    ? (savedDraft?.step as IntakeStep)
    : defaultIntakeDraft.step;

  return {
    step: savedStep,
    customer: { ...defaultCustomer, ...savedDraft?.customer },
    repairMeta: { ...defaultRepairMeta, ...savedDraft?.repairMeta },
    items: Array.isArray(savedDraft?.items) ? savedDraft.items : [],
    draftItem: { ...emptyDraftItem(), ...savedDraft?.draftItem, photos: savedDraft?.draftItem?.photos ?? [] },
    billing: { ...defaultBilling, ...savedDraft?.billing },
    payment: { ...defaultPayment, ...savedDraft?.payment },
    persistedBill: savedDraft?.persistedBill ?? null,
    loadedBill: savedDraft?.loadedBill ?? null,
    previousAmountPaid: toMoney(savedDraft?.previousAmountPaid ?? 0),
  };
}

async function createTemporaryBillLink(payload: { billNumber: string }) {
  await httpClient.post("/bills/print-links", {
    billNumber: payload.billNumber,
  });
}

async function saveIntakeBill(payload: {
  customer: CustomerDetails;
  repairMeta: RepairMeta;
  items: RepairItem[];
  billing: BillingDetails;
  payment: PaymentDetails;
  subtotal: number;
  grandTotal: number;
  balance: number;
}) {
  const response = await httpClient.post<PersistedBillDetails>("/intakes/bills", {
    customer: payload.customer,
    repairMeta: payload.repairMeta,
    items: payload.items,
    subtotal: payload.subtotal,
    discount: toMoney(payload.billing.discount),
    adjustment: toMoney(payload.billing.adjustment),
    tax: toMoney(payload.billing.tax),
    grandTotal: payload.grandTotal,
    balance: payload.balance,
    payment: payload.payment,
  });

  return response.data;
}

async function searchBills(query: string) {
  const response = await httpClient.get<BillSearchResult[]>("/bills/search", {
    params: { query },
  });
  return response.data;
}

async function getBillDetail(billId: number) {
  const response = await httpClient.get<BillDetail>(`/bills/${billId}`);
  return response.data;
}

async function addBillPayment(billId: number, payment: PaymentDetails) {
  const response = await httpClient.post<{ amountPaid: number; balance: number; paymentStatus: string }>(`/bills/${billId}/payments`, payment);
  return response.data;
}

async function searchMaintenanceBills(query: string) {
  const response = await httpClient.get<MaintenanceBill[]>("/repair-maintenance/bills/search", {
    params: { query },
  });
  return response.data;
}

async function getEmployees() {
  const response = await httpClient.get<Employee[]>("/repair-maintenance/employees");
  return response.data;
}

async function getWorkItems() {
  const response = await httpClient.get<Array<{
    workItemId: number;
    itemName: string;
    category: string | null;
    description: string | null;
    rate: number;
  }>>("/work-items");
  return response.data.map((item) => ({
    workItemId: String(item.workItemId),
    itemName: item.itemName,
    category: item.category ?? "",
    description: item.description ?? "",
    defaultPrice: Number(item.rate),
    warrantyDays: 0,
  }));
}

async function getJobCard(repairItemId: number) {
  const response = await httpClient.get<JobCard>(`/repair-maintenance/repair-items/${repairItemId}/job-card`);
  return response.data;
}

async function assignRepairItem(repairItemId: number, employeeId: number, remarks: string) {
  const response = await httpClient.post(`/repair-maintenance/repair-items/${repairItemId}/assignments`, { employeeId, remarks });
  return response.data;
}

type BillPrintLayoutProps = {
  companyName: string;
  logoUrl?: string | null;
  billNumber: string;
  repairNumber: string;
  customer: CustomerDetails;
  items: RepairItem[];
  subtotal: number;
  grandTotal: number;
  payment: PaymentDetails;
  balance: number;
};

function BillPrintLayout({
  companyName,
  logoUrl,
  billNumber,
  repairNumber,
  customer,
  items,
  subtotal,
  grandTotal,
  payment,
  balance,
}: BillPrintLayoutProps) {
  const [previewPhoto, setPreviewPhoto] = useState<ItemPhoto | null>(null);
  const paymentStatus = payment.amount <= 0 ? "UNPAID" : balance > 0 ? "PARTIALLY PAID" : "PAID";
  const isPaidInFull = grandTotal > 0 && balance <= 0;
  const printableItems =
    items.length > 0
      ? items.slice(0, 3)
      : [
          {
            id: "empty",
            workItemId: "",
            itemName: "-",
            category: "",
            serialNo: "",
            description: "",
            quantity: 1,
            basePrice: 0,
            actualPrice: 0,
            discount: 0,
            warrantyDays: 0,
            photos: [],
          },
        ];

  return (
    <article className="half-a4-bill bg-white text-slate-950">
      <div className="grid grid-cols-[24mm_1fr_72mm] gap-2 border-b border-[#0b2a66] pb-1.5">
        <div className="flex items-center justify-center">
          {logoUrl ? (
            <img src={logoUrl} alt={`${companyName} logo`} className="h-16 w-16 object-contain" />
          ) : (
            <div className="relative h-16 w-16">
              <div className="absolute left-6 top-0 h-16 w-6 -skew-x-12 bg-amber-400" />
              <div className="absolute inset-0 flex items-center justify-center text-3xl font-black tracking-tighter text-[#05245f]">RH</div>
            </div>
          )}
        </div>
        <div className="leading-tight">
          <h2 className="text-[15px] font-black uppercase tracking-wide text-[#05245f]">{companyName}</h2>
          <p className="mt-1 text-[10px] font-bold">Electricals Repair & Service Center</p>
          <p className="mt-2 text-[10px]">Dhanori, Pune - 411015, Maharashtra</p>
          <p className="mt-1 text-[10px]">9876543210 | support@repairhub.local</p>
          <p className="mt-2 text-[10px]">GSTIN : 27ABCDE1234F1Z1</p>
        </div>
        <div className="text-[11px] font-bold">
          <div className="mb-2 rounded bg-[#05245f] py-1 text-center text-[14px] font-black uppercase text-white">
            Invoice
          </div>
          <div className="grid grid-cols-[31mm_3mm_1fr] gap-y-1">
            <span>Invoice No.</span>
            <span>:</span>
            <span className="text-red-700">{billNumber}</span>
            <span>Repair No.</span>
            <span>:</span>
            <span className="text-red-700">{repairNumber}</span>
            <span>Bill Date</span>
            <span>:</span>
            <span>{formatDateTime()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 border-b border-[#0b2a66] py-2 text-[11px] font-bold">
        <div className="grid grid-cols-[18mm_3mm_1fr] gap-y-1">
          <span>Customer</span>
          <span>:</span>
          <span>{customer.customerName || "-"}</span>
          <span>Mobile</span>
          <span>:</span>
          <span>{customer.mobile || "-"}</span>
        </div>
        <div className="grid grid-cols-[26mm_3mm_1fr] gap-y-1">
          <span>Payment Status</span>
          <span>:</span>
          <span className="text-[#075db3]">{paymentStatus}</span>
        </div>
      </div>

      <table className="mt-1 w-full table-fixed border-collapse text-[10px]">
        <thead>
          <tr className="bg-[#05245f] text-white">
            <th className="w-[10mm] border border-slate-400 py-1">Sr.</th>
            <th className="w-[27mm] border border-slate-400 py-1">Item</th>
            <th className="border border-slate-400 py-1">Description / Work Done</th>
            <th className="w-[14mm] border border-slate-400 py-1">Quantity</th>
            <th className="w-[28mm] border border-slate-400 py-1">Photo</th>
            <th className="w-[23mm] border border-slate-400 py-1">Rate</th>
            <th className="w-[25mm] border border-slate-400 py-1">Amount</th>
          </tr>
        </thead>
        <tbody>
          {printableItems.map((item, index) => {
            const itemTotal = Math.max(item.actualPrice * item.quantity - item.discount, 0);

            return (
              <tr key={item.id} className="h-[14mm]">
                <td className="border border-slate-400 text-center">{index + 1}</td>
                <td className="border border-slate-400 px-1 text-center font-bold">{item.itemName}</td>
                <td className="border border-slate-400 px-2">{item.description || item.serialNo || "-"}</td>
                <td className="border border-slate-400 px-1 text-center">{item.quantity}</td>
                <td className="border border-slate-400 px-1 text-center">
                  {item.photos[0] ? (
                    <button
                      type="button"
                      className="no-print-reset mx-auto block h-10 w-16 overflow-hidden rounded border bg-slate-100"
                      onClick={() => setPreviewPhoto(item.photos[0])}
                    >
                      <img src={item.photos[0].url} alt={item.photos[0].name} className="h-full w-full object-cover" />
                    </button>
                  ) : (
                    <div className="mx-auto flex h-10 w-16 items-center justify-center rounded border bg-slate-100 text-[8px] text-slate-500">
                      No photo
                    </div>
                  )}
                </td>
                <td className="border border-slate-400 px-2 text-right">{amount(item.actualPrice)}</td>
                <td className="border border-slate-400 px-2 text-right font-bold">{amount(itemTotal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-1 grid grid-cols-2 gap-1 text-[10px]">
        <div className="rounded border border-slate-400 p-2">
          <div className="grid grid-cols-[1fr_5mm_22mm] gap-y-1">
            <span>Sub Total</span>
            <span>Rs</span>
            <span className="text-right">{amount(subtotal)}</span>
          </div>
          <div className="my-1 border-t border-dashed border-slate-400" />
          <div className="grid grid-cols-[1fr_5mm_22mm] font-black text-[#05245f]">
            <span>FINAL AMOUNT</span>
            <span>Rs</span>
            <span className="text-right">{amount(grandTotal)}</span>
          </div>
          <div className="my-1 border-t border-dashed border-slate-400" />
          <div className="grid grid-cols-[1fr_5mm_22mm] gap-y-1">
            <span>Amount Paid</span>
            <span>Rs</span>
            <span className="text-right">{amount(payment.amount)}</span>
            <span>Balance Amount</span>
            <span>Rs</span>
            <span className="text-right font-bold text-red-700">{amount(balance)}</span>
          </div>
        </div>

        <div className="rounded border border-slate-400 p-2">
          <div className="mx-auto mb-2 w-32 rounded bg-[#05245f] py-0.5 text-center font-black uppercase text-white">Payment Details</div>
          <div className="grid grid-cols-[21mm_3mm_1fr] gap-y-1">
            <span>Paid On</span>
            <span>:</span>
            <span className="font-bold">{formatDate()}</span>
            <span>Payment Mode</span>
            <span>:</span>
            <span>{payment.paymentMode}</span>
            <span>Amount Paid</span>
            <span>:</span>
            <span className="font-bold">Rs {amount(payment.amount)}</span>
            <span>Balance</span>
            <span>:</span>
            <span className="font-bold text-red-700">Rs {amount(balance)}</span>
          </div>
        </div>

      </div>

      <div className="mt-1 grid grid-cols-[92mm_1fr] gap-2 text-[9px]">
        <div className="grid grid-cols-2 rounded border border-slate-400">
          <div className="min-h-[18mm] border-r border-slate-400 p-1 text-center font-bold">
            Customer Signature
            <div className="mx-auto mt-8 w-28 border-t border-slate-500" />
          </div>
          <div className="relative min-h-[18mm] p-1 text-center font-bold">
            Owner Signature / Stamp
            {isPaidInFull ? (
              <div className="absolute left-1/2 top-5 -translate-x-1/2 rotate-[-12deg] rounded border-2 border-green-700 px-3 py-1 text-[14px] font-black tracking-widest text-green-700">
                PAID
              </div>
            ) : null}
            <div className="mx-auto mt-8 w-28 border-t border-slate-500" />
          </div>
        </div>
        <div className="rounded border border-slate-400 p-1.5 text-[8px] leading-tight">
          <p className="mb-0.5 text-center text-[8px] font-black uppercase text-[#05245f]">Terms & Conditions</p>
          <ul className="list-disc space-y-0.5 pl-3">
            <li>Advance of work has to be given.</li>
            <li>No guaranty on repaired appliances.</li>
            <li>Repairs will be done at customer's responsibility. Appliances will not be given without receipt.</li>
            <li>Replacement parts will not be returned after the appliance has been repaired.</li>
            <li>Shop hours: Monday to Saturday 10am to 8pm.</li>
            <li>The shop will be closed on Sunday.</li>
          </ul>
        </div>
      </div>
      {previewPhoto ? (
        <div className="no-print fixed inset-0 z-50 flex flex-col bg-black/90 p-4">
          <div className="mb-3 flex justify-end">
            <Button type="button" variant="secondary" size="icon" onClick={() => setPreviewPhoto(null)} aria-label="Close image preview">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <img src={previewPhoto.url} alt={previewPhoto.name} className="max-h-full max-w-full rounded-md object-contain" />
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function RepairIntakePage() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const draftStorageKey = intakeDraftKey(session?.user.id);
  const savedDraft = useMemo(() => readIntakeDraft(draftStorageKey), [draftStorageKey]);
  const [step, setStep] = useState<IntakeStep>(() => savedDraft.step);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSavingBill, setIsSavingBill] = useState(false);
  const [isSearchingBills, setIsSearchingBills] = useState(false);
  const [billSearchQuery, setBillSearchQuery] = useState("");
  const [billSearchResults, setBillSearchResults] = useState<BillSearchResult[]>([]);
  const [billingHistoryPage, setBillingHistoryPage] = useState(1);
  const [maintenanceSearchQuery, setMaintenanceSearchQuery] = useState("");
  const [maintenanceBills, setMaintenanceBills] = useState<MaintenanceBill[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workItemOptions, setWorkItemOptions] = useState<WorkItemOption[]>([]);
  const [selectedRepairItem, setSelectedRepairItem] = useState<MaintenanceRepairItem | null>(null);
  const [selectedJobCard, setSelectedJobCard] = useState<JobCard | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [assignmentRemarks, setAssignmentRemarks] = useState("");
  const [isLoadingMaintenance, setIsLoadingMaintenance] = useState(false);
  const [loadedBill, setLoadedBill] = useState<BillDetail | null>(() => savedDraft.loadedBill);
  const [previousAmountPaid, setPreviousAmountPaid] = useState(() => savedDraft.previousAmountPaid);
  const [customer, setCustomer] = useState<CustomerDetails>(() => savedDraft.customer);
  const [repairMeta, setRepairMeta] = useState<RepairMeta>(() => savedDraft.repairMeta);
  const [items, setItems] = useState<RepairItem[]>(() => savedDraft.items);
  const [draftItem, setDraftItem] = useState<RepairItem>(() => savedDraft.draftItem);
  const [billing, setBilling] = useState<BillingDetails>(() => savedDraft.billing);
  const [payment, setPayment] = useState<PaymentDetails>(() => savedDraft.payment);
  const [persistedBill, setPersistedBill] = useState<PersistedBillDetails | null>(() => savedDraft.persistedBill);

  const activeIndex = workflowSteps.findIndex((entry) => entry.key === step);

  const subtotal = useMemo(
    () =>
      items.reduce((total, item) => {
        const itemTotal = toMoney(item.actualPrice) * toMoney(item.quantity) - toMoney(item.discount);
        return total + Math.max(itemTotal, 0);
      }, 0),
    [items]
  );

  const grandTotal = Math.max(subtotal - toMoney(billing.discount) - toMoney(billing.adjustment) + toMoney(billing.tax), 0);
  const remainingAmountDue = Math.max(grandTotal - previousAmountPaid, 0);
  const totalAmountReceived = previousAmountPaid + toMoney(payment.amount);
  const balance = Math.max(grandTotal - totalAmountReceived, 0);
  const billNumber = persistedBill?.billNumber ?? "BILL-DRAFT";
  const repairNumber = persistedBill?.repairNumber ?? "REP-DRAFT";
  const companyName = session?.user.company?.name ?? "RepairHub Service Center";
  const logoUrl = session?.user.company?.logoUrl ?? null;
  const billingHistoryPageCount = Math.max(Math.ceil(billSearchResults.length / billingHistoryPageSize), 1);
  const pagedBillSearchResults = billSearchResults.slice(
    (billingHistoryPage - 1) * billingHistoryPageSize,
    billingHistoryPage * billingHistoryPageSize
  );

  useEffect(() => {
    storage.set<IntakeDraft>(draftStorageKey, {
      step,
      customer,
      repairMeta,
      items,
      draftItem,
      billing,
      payment,
      persistedBill,
      loadedBill,
      previousAmountPaid,
    });
  }, [billing, customer, draftItem, draftStorageKey, items, loadedBill, payment, persistedBill, previousAmountPaid, repairMeta, step]);

  useEffect(() => {
    void getWorkItems()
      .then(setWorkItemOptions)
      .catch((error) => console.error("Unable to load configured repair items.", error));
  }, []);

  const goTo = (nextStep: IntakeStep) => setStep(nextStep);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const startNewCustomer = () => {
    storage.remove(draftStorageKey);
    setCustomer(defaultCustomer);
    setRepairMeta(defaultRepairMeta);
    setItems([]);
    setDraftItem(emptyDraftItem());
    setBilling(defaultBilling);
    setPayment(defaultPayment);
    setPersistedBill(null);
    setLoadedBill(null);
    setPreviousAmountPaid(0);
    setStep("customer");
    navigate("/intake", { replace: true });
  };

  const cancelDraftBill = () => {
    if (window.confirm("Cancel this bill? All unsaved customer, item, billing, and payment details will be discarded.")) {
      startNewCustomer();
    }
  };

  const openBillingHistory = async () => {
    setLoadedBill(null);
    setBillSearchQuery("");
    setBillingHistoryPage(1);
    goTo("billingHistory");
    setIsSearchingBills(true);
    try {
      setBillSearchResults(await searchBills(""));
    } catch (error) {
      console.error("Unable to load recent bills.", error);
      setBillSearchResults([]);
      window.alert("Unable to load billing history. Please check the service and try again.");
    } finally {
      setIsSearchingBills(false);
    }
  };

  const openRepairMaintenance = async () => {
    setIsMenuOpen(false);
    setIsLoadingMaintenance(true);
    try {
      setEmployees(await getEmployees());
      goTo("repairMaintenance");
    } catch (error) {
      console.error("Unable to load repair maintenance.", error);
      window.alert("Unable to load repair maintenance. Please check the service and try again.");
    } finally {
      setIsLoadingMaintenance(false);
    }
  };

  const handleMaintenanceSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = maintenanceSearchQuery.trim();
    if (!query || isLoadingMaintenance) return;

    setIsLoadingMaintenance(true);
    try {
      setMaintenanceBills(await searchMaintenanceBills(query));
      setSelectedRepairItem(null);
      setSelectedJobCard(null);
    } catch (error) {
      console.error("Unable to search repair jobs.", error);
      window.alert("Unable to search repair jobs. Please check the service and try again.");
    } finally {
      setIsLoadingMaintenance(false);
    }
  };

  const openJobCard = async (item: MaintenanceRepairItem) => {
    setSelectedRepairItem(item);
    setIsLoadingMaintenance(true);
    try {
      setSelectedJobCard(await getJobCard(item.repairItemId));
    } catch (error) {
      console.error("Unable to open job card.", error);
      window.alert("Unable to open job card. Please check the service and try again.");
    } finally {
      setIsLoadingMaintenance(false);
    }
  };

  const assignSelectedRepairItem = async () => {
    if (!selectedRepairItem || !selectedEmployeeId) return;

    setIsLoadingMaintenance(true);
    try {
      await assignRepairItem(selectedRepairItem.repairItemId, Number(selectedEmployeeId), assignmentRemarks);
      setAssignmentRemarks("");
      const [updatedBills, updatedJobCard] = await Promise.all([
        maintenanceSearchQuery.trim() ? searchMaintenanceBills(maintenanceSearchQuery.trim()) : Promise.resolve(maintenanceBills),
        getJobCard(selectedRepairItem.repairItemId),
      ]);
      setMaintenanceBills(updatedBills);
      setSelectedJobCard(updatedJobCard);
      const updatedItem = updatedBills.flatMap((bill) => bill.items).find((item) => item.repairItemId === selectedRepairItem.repairItemId);
      if (updatedItem) setSelectedRepairItem(updatedItem);
    } catch (error) {
      console.error("Unable to assign repair item.", error);
      window.alert("Unable to assign repair item. Please check the service and try again.");
    } finally {
      setIsLoadingMaintenance(false);
    }
  };

  const handleBillSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = billSearchQuery.trim();
    if (isSearchingBills) return;

    setIsSearchingBills(true);
    setBillingHistoryPage(1);
    try {
      setBillSearchResults(await searchBills(query));
    } catch (error) {
      console.error("Unable to search bills.", error);
      window.alert("Unable to search billing history. Please check the service and try again.");
    } finally {
      setIsSearchingBills(false);
    }
  };

  const openPreviousBill = async (billId: number) => {
    setIsSearchingBills(true);
    try {
      const bill = await getBillDetail(billId);
      setLoadedBill(bill);
      setPersistedBill({
        billId: bill.billId,
        repairId: bill.repairId,
        customerId: bill.customerId,
        repairNumber: bill.repairNumber,
        billNumber: bill.billNumber,
        paymentStatus: bill.paymentStatus,
      });
      setCustomer(bill.customer);
      setRepairMeta(bill.repairMeta);
      setItems(
        bill.items.map((item, index) => ({
          ...item,
          id: `history-${bill.billId}-${index}`,
          photos: item.photos ?? [],
        })),
      );
      setBilling({
        discount: Number(bill.discount),
        adjustment: Number(bill.adjustment),
        tax: Number(bill.tax),
      });
      setPreviousAmountPaid(Number(bill.amountPaid));
      setPayment({
        paymentMode: "CASH",
        amount: Number(bill.balance),
        referenceNumber: "",
        remarks: "",
      });
      goTo("billing");
    } catch (error) {
      console.error("Unable to open bill.", error);
      window.alert("Unable to open the selected bill. Please check the service and try again.");
    } finally {
      setIsSearchingBills(false);
    }
  };

  const handleCustomerSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\d{10}$/.test(customer.mobile)) {
      window.alert("Mobile number must contain exactly 10 digits.");
      return;
    }
    goTo("items");
  };

  const addItem = () => {
    if (!draftItem.itemName.trim() || !draftItem.category) return;

    setItems((current) => [
      ...current,
      {
        ...draftItem,
        id: crypto.randomUUID(),
        itemName: draftItem.itemName.trim(),
        quantity: Math.max(toMoney(draftItem.quantity), 1),
        basePrice: Math.max(toMoney(draftItem.basePrice), 0),
        actualPrice: Math.max(toMoney(draftItem.actualPrice), 0),
        discount: Math.max(toMoney(draftItem.discount), 0),
        warrantyDays: Math.max(toMoney(draftItem.warrantyDays), 0),
      },
    ]);
    setDraftItem(emptyDraftItem());
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const selectWorkItem = (workItemId: string) => {
    const selected = workItemOptions.find((item) => item.workItemId === workItemId);

    setDraftItem((current) => ({
      ...current,
      workItemId,
      itemName: selected?.itemName ?? "",
      description: selected?.description ?? "",
      basePrice: selected?.defaultPrice ?? 0,
      actualPrice: selected?.defaultPrice ?? 0,
      warrantyDays: selected?.warrantyDays ?? 0,
    }));
  };

  const continueFromItems = () => {
    if (items.length > 0) goTo("billing");
  };

  const continueFromBilling = () => {
    setPayment((current) => ({
      ...current,
      amount: current.amount || remainingAmountDue,
    }));
    goTo("payment");
  };

  const completePayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSavingBill) return;

    setIsSavingBill(true);
    try {
      if (loadedBill && persistedBill) {
        if (toMoney(payment.amount) > 0) {
          const savedPayment = await addBillPayment(persistedBill.billId, payment);
          const updatedBill = {
            ...persistedBill,
            paymentStatus: savedPayment.paymentStatus,
          };
          setPersistedBill(updatedBill);
          setPreviousAmountPaid(Number(savedPayment.amountPaid));
          setPayment((current) => ({
            ...current,
            amount: 0,
          }));
          setLoadedBill((current) =>
            current
              ? {
                  ...current,
                  amountPaid: Number(savedPayment.amountPaid),
                  balance: Number(savedPayment.balance),
                  paymentStatus: savedPayment.paymentStatus,
                }
              : current,
          );
        }
      } else {
        const savedBill = await saveIntakeBill({
          customer,
          repairMeta,
          items,
          billing,
          payment,
          subtotal,
          grandTotal,
          balance,
        });
        setPersistedBill(savedBill);
      }
    } catch (error) {
      console.error("Unable to save bill.", error);
      window.alert("Unable to save bill. Please check the service and try again.");
      return;
    } finally {
      setIsSavingBill(false);
    }

    goTo("final");
  };

  const handlePrint = () => {
    setIsPrinting(true);

    createTemporaryBillLink({
        billNumber,
    }).catch((error) => {
      console.warn("Unable to create temporary bill link before printing.", error);
    });

    window.print();

    window.setTimeout(() => {
      setIsPrinting(false);
    }, 500);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="no-print border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Open navigation menu"
                  aria-expanded={isMenuOpen}
                  onClick={() => setIsMenuOpen((current) => !current)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                {isMenuOpen ? (
                  <nav className="absolute left-0 top-12 z-30 w-56 overflow-hidden rounded-md border bg-card py-2 shadow-soft">
                    {navigationMenuItems.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => {
                          setIsMenuOpen(false);
                          if (item === "Home") {
                            startNewCustomer();
                          } else if (item === "Repair Maintenance") {
                            void openRepairMaintenance();
                          } else if (item === "Billing History") {
                            void openBillingHistory();
                          }
                        }}
                      >
                        {item === "Home" ? <Home className="h-4 w-4" /> : <span className="h-4 w-4" />}
                        {item}
                      </button>
                    ))}
                    <div className="my-2 border-t" />
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium text-destructive hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => {
                        setIsMenuOpen(false);
                        void handleSignOut();
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </nav>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                {logoUrl ? <img src={logoUrl} alt={`${companyName} logo`} className="h-12 w-12 rounded-md object-contain" /> : null}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{companyName}</p>
                  <h1 className="text-2xl font-semibold">New repair bill workflow</h1>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {workflowSteps.map((entry, index) => (
                <div
                  key={entry.key}
                  className={[
                    "rounded-md border px-3 py-2 text-sm",
                    index <= activeIndex ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground",
                  ].join(" ")}
                >
                  {index + 1}. {entry.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0">
          {step === "customer" ? (
            <form className="rounded-lg border bg-card p-5 shadow-soft" onSubmit={handleCustomerSubmit}>
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Customer details</h2>
                <p className="text-sm text-muted-foreground">Maps to the customers table before creating the repair record.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Customer name" htmlFor="customerName">
                  <Input
                    id="customerName"
                    required
                    value={customer.customerName}
                    onChange={(event) => setCustomer((current) => ({ ...current, customerName: event.target.value }))}
                  />
                </FormField>
                <FormField label="Mobile" htmlFor="mobile">
                  <Input
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    required
                    value={customer.mobile}
                    onChange={(event) => {
                      const mobile = event.target.value;
                      if (/^\d{0,10}$/.test(mobile)) {
                        setCustomer((current) => ({ ...current, mobile }));
                      }
                    }}
                  />
                </FormField>
                <FormField label="Email" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    value={customer.email}
                    onChange={(event) => setCustomer((current) => ({ ...current, email: event.target.value }))}
                  />
                </FormField>
              </div>
              <div className="mt-6 flex justify-end">
                <Button type="submit" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Continue to items
                </Button>
              </div>
            </form>
          ) : null}

          {step === "items" ? (
            <section className="space-y-5">
              <div className="rounded-lg border bg-card p-5 shadow-soft">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold">Repair items</h2>
                  <p className="text-sm text-muted-foreground">Add every item the customer brought, including pricing and photos.</p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <FormField label="Repair item" htmlFor="workItemId">
                    <Select id="workItemId" required value={draftItem.workItemId} onChange={(event) => selectWorkItem(event.target.value)}>
                      <option value="">{workItemOptions.length ? "Select item" : "No repair items configured for this shop"}</option>
                      {workItemOptions.map((item) => (
                        <option key={item.workItemId} value={item.workItemId}>
                          {item.itemName} - {currency.format(item.defaultPrice)}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Category" htmlFor="itemCategory">
                    <Select
                      id="itemCategory"
                      required
                      value={draftItem.category}
                      onChange={(event) => setDraftItem((current) => ({ ...current, category: event.target.value }))}
                    >
                      <option value="">Select category</option>
                      <option value="DOMESTIC">Domestic</option>
                      <option value="INDUSTRIAL">Industrial</option>
                    </Select>
                  </FormField>
                  <FormField label="Quantity" htmlFor="quantity">
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      step="1"
                      value={draftItem.quantity}
                      onChange={(event) => setDraftItem((current) => ({ ...current, quantity: Number(event.target.value) }))}
                    />
                  </FormField>
                  <FormField label="Rate" htmlFor="actualPrice">
                    <Input
                      id="actualPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={draftItem.actualPrice}
                      onChange={(event) => setDraftItem((current) => ({ ...current, actualPrice: Number(event.target.value) }))}
                    />
                  </FormField>
                  <FormField className="lg:col-span-2" label="Description / issue" htmlFor="itemDescription">
                    <Textarea
                      id="itemDescription"
                      value={draftItem.description}
                      onChange={(event) => setDraftItem((current) => ({ ...current, description: event.target.value }))}
                    />
                  </FormField>
                  <div className="lg:col-span-2">
                    <FileUpload
                      label="Capture or upload item photo"
                      accept="image/*"
                      capture="environment"
                      multiple
                      onFilesChange={(files) => {
                        void Promise.all(files.map(fileToPhoto)).then((photos) =>
                          setDraftItem((current) => ({
                            ...current,
                            photos,
                          })),
                        );
                      }}
                    />
                  </div>
                </div>
                <div className="mt-5 flex justify-end">
                  <Button type="button" onClick={addItem} leftIcon={<Plus className="h-4 w-4" />}>
                    Add item
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-5 shadow-soft">
                <h3 className="text-base font-semibold">Items added</h3>
                <div className="mt-4 space-y-3">
                  {items.length === 0 ? (
                    <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                      No repair items added yet.
                    </p>
                  ) : (
                    items.map((item) => (
                      <div key={item.id} className="grid gap-3 rounded-md border p-4 md:grid-cols-[1fr_auto]">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{item.itemName}</p>
                            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">Qty {item.quantity}</span>
                            {item.photos.length ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                                <Camera className="h-3 w-3" />
                                {item.photos.length} photo(s)
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{item.serialNo || "No serial number"}</p>
                          <p className="mt-2 text-sm">{item.description || "No issue description entered."}</p>
                        </div>
                        <div className="flex items-center justify-between gap-3 md:flex-col md:items-end">
                          <p className="font-semibold">{currency.format(Math.max(item.actualPrice * item.quantity - item.discount, 0))}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            leftIcon={<Trash2 className="h-4 w-4" />}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <Button type="button" variant="outline" onClick={() => goTo("customer")} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                    Customer
                  </Button>
                  <Button type="button" onClick={continueFromItems} disabled={items.length === 0} rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Continue to billing
                  </Button>
                </div>
              </div>
            </section>
          ) : null}

          {step === "billingHistory" ? (
            <section className="rounded-lg border bg-card p-5 shadow-soft">
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Billing History</h2>
                <p className="text-sm text-muted-foreground">Search by bill number, mobile number, or customer name.</p>
              </div>
              <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleBillSearch}>
                <Input
                  aria-label="Search billing history"
                  placeholder="Bill number, mobile, or customer name"
                  value={billSearchQuery}
                  onChange={(event) => setBillSearchQuery(event.target.value)}
                />
                <Button type="submit" isLoading={isSearchingBills}>
                  Search
                </Button>
              </form>
              <div className="mt-5 space-y-3">
                {billSearchResults.length === 0 ? (
                  <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                    No bills found.
                  </p>
                ) : (
                  pagedBillSearchResults.map((bill) => (
                    <div
                      key={bill.billId}
                      className={`grid gap-3 rounded-md border p-4 ${bill.photoUrl ? "lg:grid-cols-[auto_1fr_auto]" : "lg:grid-cols-[1fr_auto]"}`}
                    >
                      {bill.photoUrl ? (
                        <button
                          type="button"
                          className="h-20 w-28 overflow-hidden rounded-md border bg-muted"
                          onClick={() => void openPreviousBill(bill.billId)}
                        >
                          <img src={bill.photoUrl} alt={bill.photoId ?? bill.billNumber} className="h-full w-full object-cover" />
                        </button>
                      ) : null}
                      <div>
                        <button
                          type="button"
                          className="text-left font-semibold text-primary underline-offset-4 hover:underline"
                          onClick={() => void openPreviousBill(bill.billId)}
                        >
                          {bill.billNumber}
                        </button>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {bill.customerName} {bill.mobile ? `- ${bill.mobile}` : ""}
                        </p>
                        <p className="mt-2 text-sm">
                          Total {currency.format(Number(bill.grandTotal))} · Paid {currency.format(Number(bill.amountPaid))} · Balance{" "}
                          {currency.format(Number(bill.balance))}
                        </p>
                      </div>
                      <Button type="button" variant="outline" onClick={() => void openPreviousBill(bill.billId)}>
                        Open bill
                      </Button>
                    </div>
                  ))
                )}
              </div>
              {billSearchResults.length > billingHistoryPageSize ? (
                <div className="mt-5 flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={billingHistoryPage === 1}
                    onClick={() => setBillingHistoryPage((page) => Math.max(page - 1, 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {billingHistoryPage} of {billingHistoryPageCount}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={billingHistoryPage === billingHistoryPageCount}
                    onClick={() => setBillingHistoryPage((page) => Math.min(page + 1, billingHistoryPageCount))}
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </section>
          ) : null}

          {step === "repairMaintenance" ? (
            <section className="rounded-lg border bg-card p-5 shadow-soft">
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Repair Maintenance</h2>
                <p className="text-sm text-muted-foreground">Assign repair items to technicians and maintain job cards.</p>
              </div>
              <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleMaintenanceSearch}>
                <Input
                  aria-label="Search repair maintenance"
                  placeholder="Bill, repair, mobile, or customer"
                  value={maintenanceSearchQuery}
                  onChange={(event) => setMaintenanceSearchQuery(event.target.value)}
                />
                <Button type="submit" isLoading={isLoadingMaintenance}>
                  Search
                </Button>
              </form>

              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                <div className="space-y-4">
                  {maintenanceBills.length === 0 ? (
                    <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                      Search a bill to assign repair work.
                    </p>
                  ) : (
                    maintenanceBills.map((bill) => (
                      <div key={bill.billId} className="rounded-md border p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{bill.billNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {bill.repairNumber} · {bill.customerName} {bill.mobile ? `- ${bill.mobile}` : ""}
                            </p>
                          </div>
                          <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{bill.paymentStatus}</span>
                        </div>
                        <div className="mt-4 space-y-3">
                          {bill.items.map((item) => (
                            <button
                              key={item.repairItemId}
                              type="button"
                              className={[
                                "grid w-full gap-2 rounded-md border px-3 py-3 text-left md:grid-cols-[1fr_auto]",
                                selectedRepairItem?.repairItemId === item.repairItemId ? "border-primary bg-primary/5" : "hover:bg-muted",
                              ].join(" ")}
                              onClick={() => void openJobCard(item)}
                            >
                              <div>
                                <p className="font-medium">{item.itemName}</p>
                                <p className="text-sm text-muted-foreground">{item.serialNo || item.description || "Repair item"}</p>
                                <p className="mt-1 text-sm">Technician: {item.technicianNames || "-"}</p>
                              </div>
                              <span className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">{item.status}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <aside className="h-fit rounded-md border p-4">
                  <h3 className="text-base font-semibold">Job card</h3>
                  {selectedRepairItem ? (
                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="font-medium">{selectedRepairItem.itemName}</p>
                        <p className="text-sm text-muted-foreground">{selectedRepairItem.serialNo || selectedRepairItem.description || "Repair item"}</p>
                      </div>
                      <div className="grid gap-3">
                        <FormField label="Assign / hand off to" htmlFor="assignEmployee">
                          <Select id="assignEmployee" value={selectedEmployeeId} onChange={(event) => setSelectedEmployeeId(event.target.value)}>
                            <option value="">Select technician</option>
                            {employees.map((employee) => (
                              <option key={employee.employeeId} value={employee.employeeId}>
                                {employee.name}
                              </option>
                            ))}
                          </Select>
                        </FormField>
                        <FormField label="Job card remarks" htmlFor="assignmentRemarks">
                          <Textarea
                            id="assignmentRemarks"
                            value={assignmentRemarks}
                            onChange={(event) => setAssignmentRemarks(event.target.value)}
                          />
                        </FormField>
                        <Button type="button" onClick={() => void assignSelectedRepairItem()} disabled={!selectedEmployeeId} isLoading={isLoadingMaintenance}>
                          Save assignment
                        </Button>
                      </div>

                      {selectedJobCard ? (
                        <div className="space-y-4 text-sm">
                          <div>
                            <p className="font-semibold">Activities</p>
                            <div className="mt-2 space-y-2">
                              {selectedJobCard.activities.length === 0 ? (
                                <p className="text-muted-foreground">No activities recorded yet.</p>
                              ) : (
                                selectedJobCard.activities.map((activity) => (
                                  <div key={activity.activityId} className="rounded-md border px-3 py-2">
                                    <p className="font-medium">
                                      {activity.activityType} · {activity.employeeName}
                                    </p>
                                    <p className="text-muted-foreground">{formatDateTime(activity.startTime)}</p>
                                    {activity.remarks ? <p>{activity.remarks}</p> : null}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">Select a repair item to view or assign its job card.</p>
                  )}
                </aside>
              </div>
            </section>
          ) : null}

          {step === "billing" ? (
            <section className="rounded-lg border bg-card p-5 shadow-soft">
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Billing</h2>
                <p className="text-sm text-muted-foreground">Review item quantities and rates before continuing to payment.</p>
              </div>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 rounded-md border px-4 py-3">
                    <div>
                      <p className="font-medium">{item.itemName}</p>
                      <p className="text-sm text-muted-foreground">{item.serialNo || item.description || "Repair item"}</p>
                    </div>
                    <p className="font-semibold">{currency.format(Math.max(item.actualPrice * item.quantity - item.discount, 0))}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => goTo(loadedBill ? "billingHistory" : "items")}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  {loadedBill ? "Billing History" : "Items"}
                </Button>
                <Button type="button" onClick={continueFromBilling} rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Continue to payment
                </Button>
              </div>
            </section>
          ) : null}

          {step === "payment" ? (
            <form className="rounded-lg border bg-card p-5 shadow-soft" onSubmit={completePayment}>
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Payment</h2>
                <p className="text-sm text-muted-foreground">Record payment mode and amount received.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Payment mode" htmlFor="paymentMode">
                  <Select
                    id="paymentMode"
                    value={payment.paymentMode}
                    onChange={(event) => setPayment((current) => ({ ...current, paymentMode: event.target.value }))}
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank transfer</option>
                  </Select>
                </FormField>
                {loadedBill ? (
                  <FormField label="Previous amount received" htmlFor="previousAmountPaid">
                    <Input id="previousAmountPaid" type="number" value={previousAmountPaid} readOnly />
                  </FormField>
                ) : null}
                <FormField label={loadedBill ? "Amount received now" : "Amount received"} htmlFor="paymentAmount">
                  <Input
                    id="paymentAmount"
                    required
                    type="number"
                    min={loadedBill && remainingAmountDue <= 0 ? "0" : "0.01"}
                    max={remainingAmountDue}
                    step="0.01"
                    value={payment.amount}
                    onChange={(event) => setPayment((current) => ({ ...current, amount: Number(event.target.value) }))}
                  />
                </FormField>
                <FormField label="Payment remarks" htmlFor="paymentRemarks">
                  <Textarea
                    id="paymentRemarks"
                    value={payment.remarks}
                    onChange={(event) => setPayment((current) => ({ ...current, remarks: event.target.value }))}
                  />
                </FormField>
              </div>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <Button type="button" variant="outline" onClick={() => goTo("billing")} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                    Billing
                  </Button>
                  {!loadedBill ? (
                    <Button type="button" variant="destructive" onClick={cancelDraftBill} leftIcon={<X className="h-4 w-4" />}>
                      Cancel bill
                    </Button>
                  ) : null}
                </div>
                <Button type="submit" isLoading={isSavingBill} rightIcon={<CheckCircle2 className="h-4 w-4" />}>
                  {loadedBill ? "Save payment and final bill" : "Complete payment"}
                </Button>
              </div>
            </form>
          ) : null}

          {step === "final" ? (
            <section className="print-root">
              <div className="no-print mb-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={startNewCustomer} leftIcon={<Home className="h-4 w-4" />}>
                  Home / New customer
                </Button>
                <Button type="button" onClick={handlePrint} isLoading={isPrinting} leftIcon={<Printer className="h-4 w-4" />}>
                  Print
                </Button>
              </div>
              <BillPrintLayout
                companyName={companyName}
                logoUrl={logoUrl}
                billNumber={billNumber}
                repairNumber={repairNumber}
                customer={customer}
                items={items}
                subtotal={subtotal}
                grandTotal={grandTotal}
                payment={{ ...payment, amount: totalAmountReceived }}
                balance={balance}
              />
            </section>
          ) : null}
        </section>

        <aside className="no-print h-fit rounded-lg border bg-card p-5 shadow-soft xl:sticky xl:top-6">
          <h2 className="text-base font-semibold">Bill summary</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{currency.format(subtotal)}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between gap-3 text-base font-semibold">
                <span>Grand total</span>
                <span>{currency.format(grandTotal)}</span>
              </div>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Paid</span>
              <span>{currency.format(totalAmountReceived)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Balance</span>
              <span>{currency.format(balance)}</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
