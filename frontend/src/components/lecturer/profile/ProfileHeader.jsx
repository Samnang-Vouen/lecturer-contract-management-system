import React from "react";
import { Card, CardContent } from "../../ui/Card";
import Button from "../../ui/Button";
import Avatar from "./Avatar";
import StatusBadge from "./StatusBadge";
import OverviewItem from "./OverviewItem";
import { Shield } from "lucide-react";

export default function ProfileHeader({
  profile,
  editMode,
  saving,
  onEdit,
  onSave,
  onCancel,
}) {
  return (
    <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-600 px-4 sm:px-8 py-8 sm:py-10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full">
            <Avatar
              name={
                profile.full_name_english ||
                profile.user_display_name ||
                "Lecturer"
              }
            />
            <div className="text-white text-center sm:text-left min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 break-words">
                {profile.full_name_english || "Unnamed Lecturer"}
              </h1>
              {profile.full_name_khmer && (
                <p className="text-white/85 text-base sm:text-lg mb-3 break-words">
                  {profile.full_name_khmer}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-sm font-medium">
                  <Shield className="w-4 h-4 mr-2" />
                  {profile.position || "Lecturer"}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-sm font-medium">
                  Profile
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
            {editMode ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onCancel}
                  disabled={saving}
                  className="w-full sm:w-auto bg-red-600 text-white hover:bg-red-500 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={onSave}
                  disabled={saving}
                  className="w-full sm:w-auto whitespace-nowrap !bg-white !text-indigo-700 hover:!bg-slate-100 !border-white shadow-none"
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={onEdit}
                className="w-full sm:w-auto whitespace-nowrap hover:bg-blue-500 border-white"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      <CardContent className="px-6 py-6 sm:px-8 border-t border-slate-100">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-[13px]">
          <OverviewItem
            label="Status"
            value={<StatusBadge status={profile.status} />}
          />
          <OverviewItem label="Employee ID" value={profile.employee_id} />
          <OverviewItem
            label="Department"
            value={profile.department_name || "—"}
          />
          <OverviewItem
            label="Join Date"
            value={new Date(profile.join_date).toLocaleDateString()}
          />
        </div>
      </CardContent>
    </Card>
  );
}
