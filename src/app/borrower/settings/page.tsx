"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import ProfilePicture from "@/components/settings/ProfilePicture"
import PersonalInformation from "@/components/settings/PersonalInformation"
import PasswordChange from "@/components/settings/ChangePassword"
import { Settings, User, Lock, Loader2, CheckCircle, AlertTriangle } from "lucide-react"

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
  profileImageUrl: string
}

export default function AdminSettingsPage() {
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    profileImageUrl: "",
  })

  // Fetch user profile on component mount
  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      setErrorMessage("")

      const response = await fetch("/api/settings", {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch profile")
      }

      const result = await response.json()
      const userData = {
        firstName: result.data.first_name || "",
        lastName: result.data.last_name || "",
        email: result.data.email || "",
        phone: result.data.phone || "",
        profileImageUrl: result.data.profile_url || "",
      }

      setProfileData(userData)

      if (userData.profileImageUrl) {
        setProfileImage(userData.profileImageUrl)
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error)
      setErrorMessage(error.message || "Failed to load profile data.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpdate = (imageUrl: string) => {
    setProfileImage(imageUrl || null)
    setProfileData((prev) => ({ ...prev, profileImageUrl: imageUrl }))
  }

  const handleProfileUpdate = (data: ProfileData) => {
    setProfileData(data)
  }

  const handleError = (error: string) => {
    setErrorMessage(error)
    setTimeout(() => setErrorMessage(""), 5000)
  }

  const handleSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(""), 3000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-8xl mx-8 md:mx-16 lg:mx-20 xl:mx-32 py-6 xl:py-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
              <p className="text-sm text-slate-600">Manage your account settings and preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="max-w-8xl mx-8 md:mx-16 lg:mx-20 xl:mx-32 py-6 xl:py-8 ">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3 shadow-sm">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-emerald-800 font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="max-w-8xl mx-8 md:mx-16 lg:mx-20 xl:mx-32 py-6 xl:py-8 pt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 font-medium">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-8xl mx-8 md:mx-16 lg:mx-20 xl:mx-32">
        <div className="space-y-6">
          {/* Profile Picture Section */}
          <Card className="mt-10 gap-0 p-0 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="border-b border-slate-200 px-6 py-4 bg-primary/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Profile Picture</h2>
                  <p className="text-sm text-slate-600">Update your profile photo</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <ProfilePicture profileImage={profileImage} onImageUpdate={handleImageUpdate} onError={handleError} onSuccess={handleSuccess} />
            </div>
          </Card>

          {/* Personal Information Section */}
          <Card className="gap-0 p-0 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="border-b border-slate-200 px-6 py-4 bg-primary/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
                  <p className="text-sm text-slate-600">Update your personal details</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <PersonalInformation profileData={profileData} onUpdate={handleProfileUpdate} onError={handleError} onSuccess={handleSuccess} />
            </div>
          </Card>

          {/* Password Section */}
          <Card className="gap-0 p-0 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="border-b border-slate-200 px-6 py-4 bg-primary/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-50 rounded-lg">
                  <Lock className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
                  <p className="text-sm text-slate-600">Update your password to keep your account secure</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <PasswordChange onSuccess={handleSuccess} />
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
