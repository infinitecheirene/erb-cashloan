"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CreditCard, Building2, Wallet, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"

interface Payment {
  id: number
  amount: string
  due_date: string
  status: string
  loan?: {
    loan_number: string
    id: number
  }
}

interface PaymentModalProps {
  payment: Payment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function PaymentModal({ payment, open, onOpenChange, onSuccess }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  // Form fields
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  const [bankAccount, setBankAccount] = useState("")
  const [accountName, setAccountName] = useState("")

  const resetForm = () => {
    setCardNumber("")
    setCardName("")
    setExpiryDate("")
    setCvv("")
    setBankAccount("")
    setAccountName("")
    setPaymentMethod("card")
    setError("")
    setSuccess(false)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "")
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned
    return formatted.substring(0, 19) // 16 digits + 3 spaces
  }

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + "/" + cleaned.substring(2, 4)
    }
    return cleaned
  }

  // Helper to safely parse amount
  const formatAmount = (amount?: string | number) => {
    const value = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0)
    return isNaN(value) ? 0 : value.toFixed(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")

      // Validate fields based on payment method
      if (paymentMethod === "card") {
        if (!cardNumber || !cardName || !expiryDate || !cvv) {
          throw new Error("Please fill in all card details")
        }
        if (cardNumber.replace(/\s/g, "").length !== 16) {
          throw new Error("Please enter a valid 16-digit card number")
        }
        if (cvv.length !== 3 && cvv.length !== 4) {
          throw new Error("Please enter a valid CVV")
        }
      } else if (paymentMethod === "bank") {
        if (!bankAccount || !accountName) {
          throw new Error("Please fill in all bank details")
        }
      }

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_id: payment?.id,
          amount: formatAmount(payment?.amount),
          payment_method: paymentMethod,
          payment_details:
            paymentMethod === "card"
              ? {
                  card_number: cardNumber.replace(/\s/g, "").substring(12),
                  card_name: cardName,
                }
              : paymentMethod === "bank"
                ? {
                    account_number: bankAccount.substring(bankAccount.length - 4),
                    account_name: accountName,
                  }
                : {},
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Payment failed")
      }

      setSuccess(true)

      // Wait a moment to show success message
      setTimeout(() => {
        onSuccess()
        handleClose()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!payment) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Make Payment</DialogTitle>
          <DialogDescription>Complete your payment for Loan {payment.loan?.loan_number}</DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground">
              Your payment of ₱{formatAmount(payment.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} has been processed.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Payment Summary */}
            <Card className="p-4 bg-slate-50 border-slate-200">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Loan Number</span>
                  <span className="font-medium">{payment.loan?.loan_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Due Date</span>
                  <span className="font-medium">
                    {new Date(payment.due_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Amount to Pay</span>
                  <span className="text-green-600">₱{parseFloat(payment.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </Card>

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <Label>Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Credit/Debit Card</p>
                      <p className="text-xs text-muted-foreground">Pay with your card</p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                  <RadioGroupItem value="bank" id="bank" />
                  <Label htmlFor="bank" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Building2 className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Bank Transfer</p>
                      <p className="text-xs text-muted-foreground">Transfer from your bank</p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                  <RadioGroupItem value="ewallet" id="ewallet" />
                  <Label htmlFor="ewallet" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Wallet className="h-5 w-5" />
                    <div>
                      <p className="font-medium">E-Wallet</p>
                      <p className="text-xs text-muted-foreground">GCash, PayMaya, etc.</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Payment Details Forms */}
            {paymentMethod === "card" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardName">Cardholder Name</Label>
                  <Input id="cardName" placeholder="John Doe" value={cardName} onChange={(e) => setCardName(e.target.value)} required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                      maxLength={5}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").substring(0, 4))}
                      maxLength={4}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "bank" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input id="accountName" placeholder="John Doe" value={accountName} onChange={(e) => setAccountName(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Account Number</Label>
                  <Input
                    id="bankAccount"
                    placeholder="1234567890"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>

                <Card className="p-3 bg-blue-50 border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Bank Details:</strong>
                    <br />
                    Bank Name: Philippine National Bank
                    <br />
                    Account Name: ERB Cash Loan Inc.
                    <br />
                    Account Number: 1234-5678-9012
                  </p>
                </Card>
              </div>
            )}

            {paymentMethod === "ewallet" && (
              <div className="space-y-4">
                <Card className="p-4 bg-amber-50 border-amber-200">
                  <p className="text-sm text-amber-800">
                    <strong>E-Wallet Payment Instructions:</strong>
                    <br />
                    1. Open your GCash or PayMaya app
                    <br />
                    2. Send ₱{parseFloat(payment.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} to: 0917-123-4567
                    <br />
                    3. Take a screenshot of the confirmation
                    <br />
                    4. Click the button below to confirm payment
                  </p>
                </Card>
              </div>
            )}

            {error && (
              <Card className="p-3 border-destructive/30 bg-destructive/5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ₱${parseFloat(payment.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
