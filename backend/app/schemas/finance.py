from pydantic import BaseModel


class FinanceSummary(BaseModel):
    total_revenue:       float
    total_paid:          float
    insurance_coverage:  float
    outstanding_balance: float
    collection_rate:     float
    total_bills:         int
    avg_bill_amount:     float


class PaymentStatusItem(BaseModel):
    status: str
    count:  int
    amount: float


class RevenueDeptItem(BaseModel):
    department:    str
    bill_count:    int
    total_revenue: float
    total_paid:    float


class InsuranceItem(BaseModel):
    payment_status: str
    count:          int
    total_insured:  float
    avg_insured:    float


class RevenueTrendItem(BaseModel):
    month:     str
    revenue:   float
    collected: float
