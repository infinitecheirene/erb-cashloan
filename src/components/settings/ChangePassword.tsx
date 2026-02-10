// components/settings/ChangePassword.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Eye, EyeOff, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"

interface PasswordChangeProps {
  onSuccess: (message: string) => void
}

export default function PasswordChange({ onSuccess }: PasswordChangeProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []
    if (password.length < 8) errors.push("At least 8 characters")
    if (!/[A-Z]/.test(password)) errors.push("One uppercase letter")
    if (!/[a-z]/.test(password)) errors.push("One lowercase letter")
    if (!/[0-9]/.test(password)) errors.push("One number")
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("One special character")
    return errors
  }

  const handlePasswordChange = async () => {
    setPasswordSuccess(false)
    setPasswordErrors([])
    const errors: string[] = []

    if (!passwordData.currentPassword) {
      errors.push("Current password is required")
    }

    if (!passwordData.newPassword) {
      errors.push("New password is required")
    } else {
      const validationErrors = validatePassword(passwordData.newPassword)
      errors.push(...validationErrors)
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.push("Passwords do not match")
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.push("New password must be different from current password")
    }

    if (errors.length > 0) {
      setPasswordErrors(errors)
      return
    }

    try {
      setIsSaving(true)

      const response = await fetch('/api/settings/change-password', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
          new_password_confirmation: passwordData.confirmPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to change password')
      }

      setPasswordSuccess(true)
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      onSuccess("Password changed successfully!")
      setTimeout(() => setPasswordSuccess(false), 5000)
    } catch (error: any) {
      console.error('Error changing password:', error)
      setPasswordErrors([error.message || "Failed to change password"])
    } finally {
      setIsSaving(false)
    }
  }

  const handleClear = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
    setPasswordErrors([])
    setPasswordSuccess(false)
  }

  const getPasswordStrength = () => {
    const requirements = [
      passwordData.newPassword.length >= 8,
      /[A-Z]/.test(passwordData.newPassword),
      /[a-z]/.test(passwordData.newPassword),
      /[0-9]/.test(passwordData.newPassword),
      /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword),
    ]
    return requirements.filter(Boolean).length
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {passwordSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-emerald-800 font-semibold">Password changed successfully!</p>
            <p className="text-emerald-700 text-sm">You can now use your new password to log in.</p>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {passwordErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-semibold mb-2">Please fix the following errors:</p>
              <ul className="space-y-1">
                {passwordErrors.map((error, idx) => (
                  <li key={idx} className="text-red-700 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {/* Current Password */}
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" />
            Current Password
          </Label>
          <div className="relative">
            <Input
              type={showPasswords.current ? "text" : "password"}
              className="border-slate-300 focus:border-primary focus:ring-primary bg-white h-11 pr-10"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, currentPassword: e.target.value })
              }
              placeholder="Enter your current password"
            />
            <button
              type="button"
              onClick={() =>
                setShowPasswords({ ...showPasswords, current: !showPasswords.current })
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPasswords.current ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" />
            New Password
          </Label>
          <div className="relative">
            <Input
              type={showPasswords.new ? "text" : "password"}
              className="border-slate-300 focus:border-primary focus:ring-primary bg-white h-11 pr-10"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, newPassword: e.target.value })
              }
              placeholder="Enter your new password"
            />
            <button
              type="button"
              onClick={() =>
                setShowPasswords({ ...showPasswords, new: !showPasswords.new })
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPasswords.new ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Password Requirements */}
          {passwordData.newPassword && (
            <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-700">Password Strength</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 w-6 rounded-full transition-colors ${
                        level <= getPasswordStrength()
                          ? level <= 2
                            ? "bg-red-500"
                            : level <= 4
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                          : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { text: "8+ characters", check: passwordData.newPassword.length >= 8 },
                  { text: "Uppercase letter", check: /[A-Z]/.test(passwordData.newPassword) },
                  { text: "Lowercase letter", check: /[a-z]/.test(passwordData.newPassword) },
                  { text: "Number", check: /[0-9]/.test(passwordData.newPassword) },
                  { text: "Special character", check: /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword) },
                ].map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        req.check ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    >
                      {req.check && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <span className={req.check ? "text-emerald-700" : "text-slate-600"}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label className="text-slate-700 font-medium flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" />
            Confirm New Password
          </Label>
          <div className="relative">
            <Input
              type={showPasswords.confirm ? "text" : "password"}
              className="border-slate-300 focus:border-primary focus:ring-primary bg-white h-11 pr-10"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, confirmPassword: e.target.value })
              }
              placeholder="Confirm your new password"
            />
            <button
              type="button"
              onClick={() =>
                setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPasswords.confirm ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {passwordData.confirmPassword && (
            <p
              className={`text-xs mt-2 flex items-center gap-1.5 ${
                passwordData.newPassword === passwordData.confirmPassword
                  ? "text-emerald-600"
                  : "text-red-600"
              }`}
            >
              {passwordData.newPassword === passwordData.confirmPassword ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  Passwords match
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Passwords do not match
                </>
              )}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleClear}
            className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50 h-11"
            disabled={isSaving}
          >
            Clear
          </Button>
          <Button
            onClick={handlePasswordChange}
            className="flex-1 bg-primary hover:bg-primary/90 text-white h-11"
            disabled={
              !passwordData.currentPassword ||
              !passwordData.newPassword ||
              !passwordData.confirmPassword ||
              isSaving
            }
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Changing...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}