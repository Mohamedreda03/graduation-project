import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "@/services/settings.service";
import { toast } from "sonner";

export const settingKeys = {
  all: ["settings"] as const,
  byKey: (key: string) => [...settingKeys.all, key] as const,
  academic: () => [...settingKeys.all, "academic"] as const,
  attendance: () => [...settingKeys.all, "attendance"] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: settingKeys.all,
    queryFn: () => settingsService.getAll(),
  });
}

export function useSetting(key: string) {
  return useQuery({
    queryKey: settingKeys.byKey(key),
    queryFn: () => settingsService.getByKey(key),
    enabled: !!key,
  });
}

export function useAcademicSettings() {
  return useQuery({
    queryKey: settingKeys.academic(),
    queryFn: () => settingsService.getAcademicSettings(),
  });
}

export function useAttendanceSettings() {
  return useQuery({
    queryKey: settingKeys.attendance(),
    queryFn: () => settingsService.getAttendanceSettings(),
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      key,
      value,
    }: {
      key: string;
      value: string | number | boolean;
    }) => settingsService.update(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingKeys.all });
      toast.success("Setting updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error updating setting");
    },
  });
}

export function useUpdateSettingsBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      settings: Array<{ key: string; value: string | number | boolean }>,
    ) => settingsService.updateBulk(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingKeys.all });
      toast.success("Settings updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error updating settings");
    },
  });
}

export function useResetSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => settingsService.resetToDefaults(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingKeys.all });
      toast.success("Settings reset to defaults");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error resetting settings");
    },
  });
}
