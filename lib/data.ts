export type BasketStatus = "Active" | "Pending Approval" | "Draft" | "Rejected"

export type ApproverStatus = "Approved" | "Pending" | "Rejected"

export interface Stock {
  id: string
  ticker: string
  name: string
  sector: string
  weight: number // percentage
  shares: number
  price: number
  marketValue: number
}

export interface Approver {
  id: string
  name: string
  role: string
  department: string
  status: ApproverStatus
  reviewedAt?: string
  comment?: string
}

export interface Basket {
  id: string
  name: string
  description: string
  status: BasketStatus
  createdBy: string
  createdAt: string
  updatedAt: string
  totalValue: number
  stockCount: number
  stocks: Stock[]
  approvers: Approver[]
  riskRating: "Low" | "Medium" | "High"
  category: string
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

export const MOCK_BASKETS: Basket[] = [
  {
    id: "bsk-001",
    name: "US Tech Growth",
    description: "High-growth US technology companies with strong fundamentals and market leadership.",
    status: "Active",
    createdBy: "Sarah Mitchell",
    createdAt: "2024-11-03",
    updatedAt: "2024-12-01",
    totalValue: 48_250_000,
    stockCount: 8,
    riskRating: "High",
    category: "Technology",
    stocks: [
      { id: "s1", ticker: "NVDA", name: "NVIDIA Corporation", sector: "Semiconductors", weight: 22.5, shares: 1200, price: 875.4, marketValue: 10_504_800 },
      { id: "s2", ticker: "MSFT", name: "Microsoft Corporation", sector: "Software", weight: 18.0, shares: 1800, price: 415.2, marketValue: 8_673_600 },
      { id: "s3", ticker: "AAPL", name: "Apple Inc.", sector: "Consumer Electronics", weight: 15.5, shares: 3200, price: 229.0, marketValue: 7_328_000 },
      { id: "s4", ticker: "GOOGL", name: "Alphabet Inc.", sector: "Internet", weight: 14.0, shares: 950, price: 172.5, marketValue: 6_687_500 },
      { id: "s5", ticker: "META", name: "Meta Platforms Inc.", sector: "Social Media", weight: 12.0, shares: 1050, price: 544.0, marketValue: 5_712_000 },
      { id: "s6", ticker: "AMZN", name: "Amazon.com Inc.", sector: "E-Commerce", weight: 8.5, shares: 2100, price: 197.1, marketValue: 4_139_100 },
      { id: "s7", ticker: "CRM", name: "Salesforce Inc.", sector: "Software", weight: 5.5, shares: 1400, price: 274.5, marketValue: 3_843_000 },
      { id: "s8", ticker: "ADBE", name: "Adobe Inc.", sector: "Software", weight: 4.0, shares: 680, price: 480.2, marketValue: 3_265_360 },
    ],
    approvers: [
      { id: "a1", name: "James Thornton", role: "Chief Risk Officer", department: "Risk Management", status: "Approved", reviewedAt: "2024-11-28", comment: "Risk parameters within acceptable limits." },
      { id: "a2", name: "Linda Okafor", role: "Head of Compliance", department: "Compliance", status: "Approved", reviewedAt: "2024-11-29" },
      { id: "a3", name: "David Park", role: "Portfolio Director", department: "Investments", status: "Approved", reviewedAt: "2024-12-01", comment: "Strong basket composition. Approved." },
    ],
  },
  {
    id: "bsk-002",
    name: "Clean Energy Transition",
    description: "Diversified exposure to renewable energy, EV, and energy storage companies.",
    status: "Pending Approval",
    createdBy: "Michael Chen",
    createdAt: "2024-12-10",
    updatedAt: "2024-12-18",
    totalValue: 22_800_000,
    stockCount: 6,
    riskRating: "Medium",
    category: "ESG / Energy",
    stocks: [
      { id: "s9", ticker: "TSLA", name: "Tesla Inc.", sector: "Electric Vehicles", weight: 28.0, shares: 1800, price: 350.8, marketValue: 6_414_400 },
      { id: "s10", ticker: "ENPH", name: "Enphase Energy Inc.", sector: "Solar", weight: 18.0, shares: 4200, price: 97.6, marketValue: 4_099_200 },
      { id: "s11", ticker: "NEE", name: "NextEra Energy Inc.", sector: "Utilities", weight: 16.0, shares: 5200, price: 70.2, marketValue: 3_650_400 },
      { id: "s12", ticker: "FSLR", name: "First Solar Inc.", sector: "Solar", weight: 15.0, shares: 2600, price: 131.5, marketValue: 3_419_000 },
      { id: "s13", ticker: "PLUG", name: "Plug Power Inc.", sector: "Hydrogen", weight: 13.0, shares: 18000, price: 16.4, marketValue: 2_952_000 },
      { id: "s14", ticker: "RIVN", name: "Rivian Automotive", sector: "Electric Vehicles", weight: 10.0, shares: 12500, price: 18.1, marketValue: 2_265_000 },
    ],
    approvers: [
      { id: "a4", name: "James Thornton", role: "Chief Risk Officer", department: "Risk Management", status: "Approved", reviewedAt: "2024-12-15", comment: "Elevated volatility noted. Approved conditionally." },
      { id: "a5", name: "Linda Okafor", role: "Head of Compliance", department: "Compliance", status: "Pending" },
      { id: "a6", name: "David Park", role: "Portfolio Director", department: "Investments", status: "Pending" },
    ],
  },
  {
    id: "bsk-003",
    name: "Dividend Income Core",
    description: "Stable, high-yield dividend stocks across blue-chip US companies.",
    status: "Active",
    createdBy: "Rachel Torres",
    createdAt: "2024-09-15",
    updatedAt: "2024-11-22",
    totalValue: 61_400_000,
    stockCount: 7,
    riskRating: "Low",
    category: "Income",
    stocks: [
      { id: "s15", ticker: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", weight: 20.0, shares: 6800, price: 158.4, marketValue: 10_771_200 },
      { id: "s16", ticker: "PG", name: "Procter & Gamble", sector: "Consumer Staples", weight: 18.0, shares: 5900, price: 167.2, marketValue: 9_864_800 },
      { id: "s17", ticker: "KO", name: "The Coca-Cola Company", sector: "Beverages", weight: 15.0, shares: 14200, price: 62.5, marketValue: 8_875_000 },
      { id: "s18", ticker: "VZ", name: "Verizon Communications", sector: "Telecom", weight: 14.0, shares: 19000, price: 40.3, marketValue: 7_657_000 },
      { id: "s19", ticker: "MCD", name: "McDonald's Corporation", sector: "Restaurants", weight: 13.0, shares: 3100, price: 289.6, marketValue: 8_977_600 },
      { id: "s20", ticker: "XOM", name: "Exxon Mobil Corp.", sector: "Energy", weight: 11.0, shares: 6200, price: 107.8, marketValue: 6_683_600 },
      { id: "s21", ticker: "T", name: "AT&T Inc.", sector: "Telecom", weight: 9.0, shares: 25000, price: 19.5, marketValue: 4_875_000 },
    ],
    approvers: [
      { id: "a7", name: "James Thornton", role: "Chief Risk Officer", department: "Risk Management", status: "Approved", reviewedAt: "2024-09-20" },
      { id: "a8", name: "Linda Okafor", role: "Head of Compliance", department: "Compliance", status: "Approved", reviewedAt: "2024-09-21" },
      { id: "a9", name: "David Park", role: "Portfolio Director", department: "Investments", status: "Approved", reviewedAt: "2024-09-22" },
    ],
  },
  {
    id: "bsk-004",
    name: "Asia Pacific Emerging",
    description: "Exposure to high-growth markets across Southeast Asia and India.",
    status: "Draft",
    createdBy: "Kevin Nakamura",
    createdAt: "2024-12-20",
    updatedAt: "2024-12-20",
    totalValue: 0,
    stockCount: 5,
    riskRating: "High",
    category: "International",
    stocks: [
      { id: "s22", ticker: "BABA", name: "Alibaba Group", sector: "E-Commerce", weight: 25.0, shares: 8000, price: 85.2, marketValue: 681_600 },
      { id: "s23", ticker: "TSM", name: "Taiwan Semiconductor", sector: "Semiconductors", weight: 30.0, shares: 4500, price: 175.4, marketValue: 789_300 },
      { id: "s24", ticker: "INFY", name: "Infosys Limited", sector: "IT Services", weight: 20.0, shares: 14000, price: 21.3, marketValue: 298_200 },
      { id: "s25", ticker: "SE", name: "Sea Limited", sector: "E-Commerce", weight: 15.0, shares: 6200, price: 46.7, marketValue: 289_540 },
      { id: "s26", ticker: "GRAB", name: "Grab Holdings", sector: "Super App", weight: 10.0, shares: 35000, price: 3.8, marketValue: 133_000 },
    ],
    approvers: [
      { id: "a10", name: "James Thornton", role: "Chief Risk Officer", department: "Risk Management", status: "Pending" },
      { id: "a11", name: "Linda Okafor", role: "Head of Compliance", department: "Compliance", status: "Pending" },
      { id: "a12", name: "David Park", role: "Portfolio Director", department: "Investments", status: "Pending" },
    ],
  },
  {
    id: "bsk-005",
    name: "Healthcare Innovation",
    description: "Biotech and medtech companies with breakthrough pipeline drugs and devices.",
    status: "Rejected",
    createdBy: "Amanda Ross",
    createdAt: "2024-10-05",
    updatedAt: "2024-10-28",
    totalValue: 18_600_000,
    stockCount: 6,
    riskRating: "High",
    category: "Healthcare",
    stocks: [
      { id: "s27", ticker: "LLY", name: "Eli Lilly and Company", sector: "Pharmaceuticals", weight: 30.0, shares: 1400, price: 780.5, marketValue: 1_092_700 },
      { id: "s28", ticker: "MRNA", name: "Moderna Inc.", sector: "Biotech", weight: 20.0, shares: 3800, price: 68.4, marketValue: 259_920 },
      { id: "s29", ticker: "ISRG", name: "Intuitive Surgical", sector: "Medical Devices", weight: 18.0, shares: 750, price: 430.2, marketValue: 322_650 },
      { id: "s30", ticker: "REGN", name: "Regeneron Pharma", sector: "Biotech", weight: 15.0, shares: 550, price: 1020.3, marketValue: 561_165 },
      { id: "s31", ticker: "DXCM", name: "DexCom Inc.", sector: "Medical Devices", weight: 10.0, shares: 3200, price: 86.1, marketValue: 275_520 },
      { id: "s32", ticker: "BMRN", name: "BioMarin Pharmaceutical", sector: "Biotech", weight: 7.0, shares: 2600, price: 72.8, marketValue: 189_280 },
    ],
    approvers: [
      { id: "a13", name: "James Thornton", role: "Chief Risk Officer", department: "Risk Management", status: "Rejected", reviewedAt: "2024-10-25", comment: "Concentration risk too high. Biotech volatility exceeds threshold." },
      { id: "a14", name: "Linda Okafor", role: "Head of Compliance", department: "Compliance", status: "Approved", reviewedAt: "2024-10-24" },
      { id: "a15", name: "David Park", role: "Portfolio Director", department: "Investments", status: "Rejected", reviewedAt: "2024-10-28", comment: "Agreed with CRO — revisit weighting strategy." },
    ],
  },
  {
    id: "bsk-006",
    name: "Financial Sector Select",
    description: "Diversified exposure across US banks, insurance, and fintech companies.",
    status: "Active",
    createdBy: "Thomas Wright",
    createdAt: "2024-08-12",
    updatedAt: "2024-11-30",
    totalValue: 35_700_000,
    stockCount: 6,
    riskRating: "Medium",
    category: "Financials",
    stocks: [
      { id: "s33", ticker: "JPM", name: "JPMorgan Chase & Co.", sector: "Banking", weight: 28.0, shares: 4200, price: 228.4, marketValue: 959_280 },
      { id: "s34", ticker: "BAC", name: "Bank of America Corp.", sector: "Banking", weight: 20.0, shares: 18000, price: 40.1, marketValue: 721_800 },
      { id: "s35", ticker: "GS", name: "Goldman Sachs Group", sector: "Investment Banking", weight: 18.0, shares: 1400, price: 540.2, marketValue: 756_280 },
      { id: "s36", ticker: "V", name: "Visa Inc.", sector: "Payments", weight: 16.0, shares: 2200, price: 303.5, marketValue: 667_700 },
      { id: "s37", ticker: "AXP", name: "American Express Co.", sector: "Credit Services", weight: 10.0, shares: 1900, price: 278.6, marketValue: 529_340 },
      { id: "s38", ticker: "BRK.B", name: "Berkshire Hathaway", sector: "Conglomerate", weight: 8.0, shares: 1100, price: 378.2, marketValue: 416_020 },
    ],
    approvers: [
      { id: "a16", name: "James Thornton", role: "Chief Risk Officer", department: "Risk Management", status: "Approved", reviewedAt: "2024-08-18" },
      { id: "a17", name: "Linda Okafor", role: "Head of Compliance", department: "Compliance", status: "Approved", reviewedAt: "2024-08-19" },
      { id: "a18", name: "David Park", role: "Portfolio Director", department: "Investments", status: "Approved", reviewedAt: "2024-08-20" },
    ],
  },
]
