"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { AlertCircle, X, FileText, Camera, Upload, ChevronRight, ChevronLeft, Check } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

interface UploadedFile {
  name: string
  file: File
  type: string
}

const STEPS = [
  { id: 1, name: "Loan Details", description: "Tell us about your loan" },
  { id: 2, name: "Employment", description: "Your employment information" },
  { id: 3, name: "Documents", description: "Upload required documents" },
  { id: 4, name: "Review", description: "Review and submit" },
]

export function LoanApplicationForm({ onSuccess }: { onSuccess: () => void }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    type: "",
    principal_amount: "",
    interest_rate: "5",
    term_months: "12",
    purpose: "",
    employment_status: "",
  })
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [agreements, setAgreements] = useState({
    dataPrivacy: false,
    loanAgreement: false,
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    const files = e.target.files
    if (!files) return

    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      name: file.name,
      file,
      type: fileType,
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])

    // Show success toast
    toast("File uploaded", {
      description: `${newFiles.length} file(s) added successfully`,
    })
  }

  const removeFile = (index: number) => {
    const removedFile = uploadedFiles[index]
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))

    toast("File removed", {
      description: `${removedFile.name} has been removed`,
    })
  }

  // Camera functions
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setShowCamera(true)
    } catch (err) {
      toast.error("Camera Error", {
        description: "Unable to access camera. Please check permissions or upload a photo instead.",
      })
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setShowCamera(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const context = canvas.getContext("2d")
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: "image/jpeg" })
              setUploadedFiles((prev) => [
                ...prev,
                {
                  name: file.name,
                  file,
                  type: "selfie_with_id",
                },
              ])
              stopCamera()

              toast.success("Photo captured", {
                description: "Selfie added successfully",
              })
            }
          },
          "image/jpeg",
          0.95,
        )
      }
    }
  }

  const getRequiredDocuments = () => {
    const { type: loanType, employment_status } = formData

    const baseDocuments = [
      {
        id: "valid_id",
        label: "Valid Government-issued ID",
        required: true,
        allowCamera: false,
        category: "Base Requirements",
      },
      {
        id: "selfie_with_id",
        label: "Selfie holding the ID",
        required: loanType === "personal",
        allowCamera: true,
        category: "Base Requirements",
      },
      {
        id: "proof_of_address",
        label: "Proof of Address (Utility bill, Bank statement, etc.)",
        required: true,
        allowCamera: false,
        category: "Base Requirements",
      },
    ]

    const businessDocuments = [
      { id: "dti_sec", label: "DTI Permit / SEC Registration", required: true, allowCamera: false, category: "Business Documents" },
      {
        id: "business_bank_statement",
        label: "Latest 3-6 months Business Bank Statement",
        required: true,
        allowCamera: false,
        category: "Business Documents",
      },
      { id: "business_photos", label: "Business or Inventory Photos", required: true, allowCamera: true, category: "Business Documents" },
      { id: "business_proof", label: "Proof of Business Existence", required: false, allowCamera: false, category: "Business Documents" },
    ]

    const employedDocuments = [
      { id: "payslip", label: "Latest Payslip", required: true, allowCamera: false, category: "Employment Documents" },
      { id: "coe", label: "Certificate of Employment with Compensation", required: true, allowCamera: false, category: "Employment Documents" },
      {
        id: "personal_bank_statement",
        label: "Latest 3 months Personal Bank Statements",
        required: true,
        allowCamera: false,
        category: "Employment Documents",
      },
    ]

    const selfEmployedDocuments = [
      {
        id: "income_proof",
        label: "Proof of Income (Invoices, Contracts, Client payments)",
        required: true,
        allowCamera: false,
        category: "Self-Employment Documents",
      },
      {
        id: "personal_bank_statement",
        label: "Latest 3-6 months Personal Bank Statements",
        required: true,
        allowCamera: false,
        category: "Self-Employment Documents",
      },
      {
        id: "bir_cert",
        label: "BIR Certificate of Registration (Optional)",
        required: false,
        allowCamera: false,
        category: "Self-Employment Documents",
      },
      {
        id: "portfolio_work",
        label: "Portfolio or Work Samples (Optional)",
        required: false,
        allowCamera: false,
        category: "Self-Employment Documents",
      },
    ]

    const studentDocuments = [
      { id: "school_id", label: "Valid School ID", required: true, allowCamera: false, category: "Student Documents" },
      {
        id: "enrollment_proof",
        label: "Certificate of Registration / Enrollment",
        required: true,
        allowCamera: false,
        category: "Student Documents",
      },
      { id: "grades", label: "Latest Report Card / Transcript of Records", required: true, allowCamera: false, category: "Student Documents" },
      { id: "parent_id", label: "Parent/Guardian Valid ID", required: true, allowCamera: false, category: "Student Documents" },
      { id: "parent_income", label: "Parent/Guardian Proof of Income", required: true, allowCamera: false, category: "Student Documents" },
    ]

    const autoDocuments = [
      { id: "vehicle_details", label: "Vehicle Details (Make, Model, Year)", required: true, allowCamera: false, category: "Auto Loan Documents" },
      { id: "vehicle_quotation", label: "Vehicle Quotation / Proforma Invoice", required: true, allowCamera: false, category: "Auto Loan Documents" },
      { id: "drivers_license", label: "Valid Driver's License", required: true, allowCamera: false, category: "Auto Loan Documents" },
    ]

    const homeDocuments = [
      { id: "property_details", label: "Property Details and Location", required: true, allowCamera: false, category: "Home Loan Documents" },
      {
        id: "property_docs",
        label: "Property Documents (Title, Tax Declaration)",
        required: true,
        allowCamera: false,
        category: "Home Loan Documents",
      },
      {
        id: "property_appraisal",
        label: "Property Appraisal / Market Value Assessment",
        required: true,
        allowCamera: false,
        category: "Home Loan Documents",
      },
      { id: "property_photos", label: "Property Photos", required: true, allowCamera: true, category: "Home Loan Documents" },
    ]

    let documents = [...baseDocuments]

    if (loanType === "student") {
      return [...baseDocuments, ...studentDocuments]
    }

    if (loanType === "auto") {
      documents = [...documents, ...autoDocuments]
    }

    if (loanType === "home") {
      documents = [...documents, ...homeDocuments]
    }

    if (employment_status === "business_owner") {
      documents = [...documents, ...businessDocuments]
    } else if (employment_status === "employed") {
      documents = [...documents, ...employedDocuments]
    } else if (employment_status === "self_employed") {
      documents = [...documents, ...selfEmployedDocuments]
    }

    return documents
  }

  const validateStep = () => {
    setError("")

    if (currentStep === 1) {
      if (!formData.type || !formData.principal_amount || !formData.term_months || !formData.purpose) {
        setError("Please fill in all loan details")
        toast.error("Validation Error", {
          description: "Please fill in all loan details",
        })
        return false
      }
    }

    if (currentStep === 2) {
      if (formData.type !== "student" && !formData.employment_status) {
        setError("Please select your employment status")
        toast.error("Validation Error", {
          description: "Please select your employment status",
        })
        return false
      }
    }

    if (currentStep === 3) {
      const requiredDocs = getRequiredDocuments()
      const uploadedTypes = uploadedFiles.map((f) => f.type)
      const missingDocs = requiredDocs.filter((doc) => doc.required && !uploadedTypes.includes(doc.id))

      if (missingDocs.length > 0) {
        const errorMsg = `Missing required documents: ${missingDocs.map((d) => d.label).join(", ")}`
        setError(errorMsg)
        toast("Missing Documents", {
          description: errorMsg,
        })
        return false
      }
    }

    return true
  }

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
      toast.success("Step completed", {
        description: `Moving to step ${currentStep + 1}`,
      })
    }
  }

  const prevStep = () => {
    setError("")
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!agreements.dataPrivacy || !agreements.loanAgreement) {
      const errorMsg = "Please accept all required agreements"
      setError(errorMsg)
      toast.error("Agreements Required", {
        description: errorMsg,
      })
      return
    }

    setLoading(true)

    // Show loading toast
    toast.success("Submitting Application", {
      description: "Please wait while we process your loan application...",
    })

    try {
      const token = localStorage.getItem("token")
      const formDataToSend = new FormData()

      formDataToSend.append("type", formData.type)
      formDataToSend.append("principal_amount", formData.principal_amount)
      formDataToSend.append("interest_rate", formData.interest_rate)
      formDataToSend.append("term_months", formData.term_months)
      formDataToSend.append("purpose", formData.purpose)
      formDataToSend.append("employment_status", formData.employment_status)

      uploadedFiles.forEach((uploadedFile, index) => {
        formDataToSend.append(`documents[${index}][type]`, uploadedFile.type)
        formDataToSend.append(`documents[${index}][file]`, uploadedFile.file)
      })

      const response = await fetch("/api/loans", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to submit application")
      }

      const data = await response.json()

      // Reset form
      setFormData({
        type: "",
        principal_amount: "",
        interest_rate: "5",
        term_months: "12",
        purpose: "",
        employment_status: "",
      })
      setUploadedFiles([])
      setAgreements({ dataPrivacy: false, loanAgreement: false })
      setCurrentStep(1)

      // Show success toast
      toast.success("Application Submitted!", {
        description: "Your loan application has been submitted successfully. We'll review it and get back to you soon.",
      })

      onSuccess()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit application"
      setError(errorMessage)

      toast.error("Submission Failed",{
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  type DocumentItem = ReturnType<typeof getRequiredDocuments>[number]
  const groupedDocuments = getRequiredDocuments()
    .filter((doc) => doc.required || uploadedFiles.some((f) => f.type === doc.id))
    .reduce(
      (acc, doc) => {
        if (!acc[doc.category]) {
          acc[doc.category] = []
        }
        acc[doc.category].push(doc)
        return acc
      },
      {} as Record<string, DocumentItem[]>,
    )

  return (
    <>
      <Card className="p-6 max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      currentStep > step.id
                        ? "bg-[#1e3a8a] text-white"
                        : currentStep === step.id
                          ? "bg-[#1e3a8a] text-white ring-4 ring-[#1e3a8a]/20"
                          : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-xs font-medium ${currentStep >= step.id ? "text-[#1e3a8a]" : "text-gray-400"}`}>{step.name}</p>
                    <p className="text-xs text-gray-400 hidden sm:block">{step.description}</p>
                  </div>
                </div>
                {index < STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-4 ${currentStep > step.id ? "bg-[#1e3a8a]" : "bg-gray-200"}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Loan Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-[#1e3a8a] mb-2">Loan Information</h3>
                <p className="text-sm text-gray-600">Tell us about the loan you're applying for</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Loan Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleChange("type", value)} required>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select loan type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal Loan</SelectItem>
                      <SelectItem value="auto">Auto Loan</SelectItem>
                      <SelectItem value="home">Home Loan</SelectItem>
                      <SelectItem value="business">Business Loan</SelectItem>
                      <SelectItem value="student">Student Loan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Loan Amount (₱) *</Label>
                  <Input
                    type="number"
                    value={formData.principal_amount}
                    onChange={(e) => handleChange("principal_amount", e.target.value)}
                    placeholder="50,000"
                    min="5000"
                    max="5000000"
                    step="1000"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Term (Months) *</Label>
                  <Select value={formData.term_months} onValueChange={(value) => handleChange("term_months", value)} required>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                      <SelectItem value="18">18 months</SelectItem>
                      <SelectItem value="24">24 months</SelectItem>
                      <SelectItem value="36">36 months</SelectItem>
                      <SelectItem value="48">48 months</SelectItem>
                      <SelectItem value="60">60 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Loan Purpose *</Label>
                <Textarea
                  value={formData.purpose}
                  onChange={(e) => handleChange("purpose", e.target.value)}
                  placeholder="Please describe the purpose of this loan..."
                  className="mt-1 min-h-24"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Employment Status */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-[#1e3a8a] mb-2">Employment Information</h3>
                <p className="text-sm text-gray-600">Tell us about your current employment status</p>
              </div>

              {formData.type !== "student" && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Employment Status *</Label>
                  <Select value={formData.employment_status} onValueChange={(value) => handleChange("employment_status", value)} required>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select your employment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employed">Employed</SelectItem>
                      <SelectItem value="self_employed">Self-Employed (Freelancer/Professional)</SelectItem>
                      <SelectItem value="business_owner">Business Owner (with DTI/SEC)</SelectItem>
                      <SelectItem value="unemployed">Unemployed</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-2 text-xs text-gray-500">This helps us determine which documents you'll need to provide</p>
                </div>
              )}

              {formData.type === "student" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    As a student loan applicant, you'll need to provide student-related documents in the next step.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Document Upload */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-[#1e3a8a] mb-2">Required Documents</h3>
                <p className="text-sm text-gray-600">Please upload all required documents</p>
              </div>

              {Object.entries(groupedDocuments).map(([category, docs]) => (
                <div key={category} className="space-y-3">
                  <h4 className="text-sm font-semibold text-[#1e3a8a] bg-blue-50 px-3 py-2 rounded-md">{category}</h4>
                  {docs.map((doc) => {
                    const docFiles = uploadedFiles.filter((f) => f.type === doc.id)

                    return (
                      <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:border-[#1e3a8a] transition-colors">
                        <Label htmlFor={doc.id} className="block mb-2 text-sm font-medium">
                          {doc.label} {doc.required && <span className="text-red-500">*</span>}
                        </Label>

                        <div className="flex gap-2">
                          {doc.allowCamera && (
                            <Button
                              type="button"
                              onClick={startCamera}
                              variant="outline"
                              className="flex-1 border-[#1e3a8a] text-[#1e3a8a] hover:bg-[#1e3a8a] hover:text-white"
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              Take Photo
                            </Button>
                          )}

                          <Label htmlFor={doc.id} className={`${doc.allowCamera ? "flex-1" : "w-full"}`}>
                            <div className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-[#1e3a8a] hover:bg-blue-50 transition-colors">
                              <Upload className="w-4 h-4 text-[#1e3a8a]" />
                              <span className="text-sm font-medium text-[#1e3a8a]">Choose File</span>
                            </div>
                            <Input
                              id={doc.id}
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => handleFileUpload(e, doc.id)}
                              className="hidden"
                              multiple
                            />
                          </Label>
                        </div>

                        {docFiles.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {docFiles.map((file, index) => {
                              const actualIndex = uploadedFiles.findIndex((f) => f.file === file.file && f.type === file.type)
                              return (
                                <div key={index} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-md">
                                  <div className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span className="text-sm text-green-800">{file.name}</span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(actualIndex)}
                                    className="hover:bg-green-100"
                                  >
                                    <X className="h-4 w-4 text-green-600" />
                                  </Button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-[#1e3a8a] mb-2">Review Your Application</h3>
                <p className="text-sm text-gray-600">Please review your information before submitting</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Loan Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Type:</span> <span className="font-medium">{formData.type}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Amount:</span>{" "}
                      <span className="font-medium">₱{parseFloat(formData.principal_amount).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Term:</span> <span className="font-medium">{formData.term_months} months</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Employment:</span>{" "}
                      <span className="font-medium">{formData.employment_status || "Student"}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-gray-600 text-sm">Purpose:</span>
                    <p className="text-sm mt-1">{formData.purpose}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Documents ({uploadedFiles.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {uploadedFiles.map((file, index) => (
                      <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {file.type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700">Agreements</h4>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="dataPrivacy"
                    checked={agreements.dataPrivacy}
                    onCheckedChange={(checked) => setAgreements((prev) => ({ ...prev, dataPrivacy: checked as boolean }))}
                    className="mt-1"
                  />
                  <Label htmlFor="dataPrivacy" className="text-sm leading-relaxed cursor-pointer">
                    I agree to the <span className="text-[#1e3a8a] underline font-medium">Data Privacy Consent</span> and authorize the processing of
                    my personal information
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="loanAgreement"
                    checked={agreements.loanAgreement}
                    onCheckedChange={(checked) => setAgreements((prev) => ({ ...prev, loanAgreement: checked as boolean }))}
                    className="mt-1"
                  />
                  <Label htmlFor="loanAgreement" className="text-sm leading-relaxed cursor-pointer">
                    I have read and agree to the <span className="text-[#1e3a8a] underline font-medium">Loan Agreement Terms and Conditions</span>
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={prevStep} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
            )}

            <div className="ml-auto">
              {currentStep < STEPS.length ? (
                <Button type="button" onClick={nextStep} className="gap-2 bg-[#1e3a8a] hover:bg-[#1e40af]">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading} className="gap-2 bg-[#1e3a8a] hover:bg-[#1e40af]">
                  {loading ? "Submitting..." : "Submit Application"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>

      {/* Camera Dialog */}
      <Dialog open={showCamera} onOpenChange={stopCamera}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Take Photo</DialogTitle>
            <DialogDescription>Position yourself clearly in the frame and click capture when ready</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-2">
              <Button onClick={capturePhoto} className="flex-1 bg-[#1e3a8a] hover:bg-[#1e40af]">
                <Camera className="w-4 h-4 mr-2" />
                Capture Photo
              </Button>
              <Button onClick={stopCamera} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
