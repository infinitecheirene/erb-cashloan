export interface Payment {
    id: number
    amount: string
    due_date: string
    paid_date?: string
    status: string
    payment_number: number
    loan?: {
        loan_number: string
        id: number
    }
}
