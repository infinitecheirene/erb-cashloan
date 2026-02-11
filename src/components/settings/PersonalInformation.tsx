"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Phone, Loader2, MapPin } from "lucide-react"
import { Button } from "../ui/button"
import { toast } from "sonner"
import type { ProfileData } from "@/types/profile"

interface PersonalInformationProps {
  profileData: ProfileData
  onUpdate: (data: ProfileData) => void
  onError: (error: string) => void
  onSuccess: (message: string) => void
}

export default function PersonalInformation({ profileData, onUpdate, onError, onSuccess }: PersonalInformationProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [tempProfileData, setTempProfileData] = useState<ProfileData>(profileData)

  // Update tempProfileData if parent profileData changes
  useEffect(() => {
    setTempProfileData(profileData)
  }, [profileData])

  const handleSaveProfile = async () => {
    if (!tempProfileData.firstName.trim() || !tempProfileData.lastName.trim()) {
      toast.error("First name and last name are required")
      return
    }

    if (isSaving) return // prevent duplicate clicks

    try {
      setIsSaving(true)

      // Validate phone
      if (!tempProfileData.phone.match(/^[0-9]{11}$/)) {
        throw new Error("Phone number must be exactly 11 digits")
      }

      // Prepare payload
      const payload = {
        first_name: tempProfileData.firstName,
        last_name: tempProfileData.lastName,
        phone: tempProfileData.phone,
        address: tempProfileData.address || "",
      }

      // Send update request
      const response = await fetch("/api/settings/update-contact", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update contact info")
      }

      // Success: update local state
      toast.success("Profile updated successfully")
      onSuccess("Profile updated successfully")
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast.error(error.message || "Failed to update profile")
      onError(error.message || "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Save indicator */}
      {isSaving && (
        <div className="flex items-center gap-2 text-sm text-primary">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Saving...</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Name Fields */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" />
              First Name
            </Label>
            <Input
              value={tempProfileData.firstName}
              onChange={(e) => setTempProfileData({ ...tempProfileData, firstName: e.target.value })}
              placeholder="John"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" />
              Last Name
            </Label>
            <Input
              value={tempProfileData.lastName}
              onChange={(e) => setTempProfileData({ ...tempProfileData, lastName: e.target.value })}
              placeholder="Doe"
            />
          </div>
        </div>

        {/* Email and Phone */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-500" />
              Email Address
            </Label>
            <Input type="email" value={tempProfileData.email} disabled readOnly placeholder="john.doe@example.com" />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-medium flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-500" />
              Phone Number
            </Label>
            <Input
              type="tel"
              value={tempProfileData.phone}
              onChange={(e) => setTempProfileData({ ...tempProfileData, phone: e.target.value.replace(/\D/g, "") })}
              placeholder="09123456789"
              maxLength={11}
            />
            <p className="text-xs text-slate-500">11-digit mobile number</p>
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-500" />
            Address
          </Label>
          <textarea
            value={tempProfileData.address}
            onChange={(e) => setTempProfileData({ ...tempProfileData, address: e.target.value })}
            placeholder="Enter your full address"
            className="w-full border-2 border-slate-300 focus:border-primary focus:ring-primary h-24 p-2 rounded-md"
          />
        </div>

        <Button onClick={handleSaveProfile} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  )
}
