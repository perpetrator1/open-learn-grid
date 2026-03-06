import { create } from "zustand"
import type { FederatedActivity, FederatedInstance, FederatedMaterial } from "@/types"

interface FederationState {
  instances: FederatedInstance[]
  federatedMaterials: FederatedMaterial[]
  activityLog: FederatedActivity[]

  setInstances: (instances: FederatedInstance[]) => void
  upsertInstance: (instance: FederatedInstance) => void
  removeInstance: (id: number) => void

  setFederatedMaterials: (materials: FederatedMaterial[]) => void

  setActivityLog: (log: FederatedActivity[]) => void
  prependActivity: (activity: FederatedActivity) => void
}

export const useFederationStore = create<FederationState>((set) => ({
  instances: [],
  federatedMaterials: [],
  activityLog: [],

  setInstances: (instances) => set({ instances }),

  upsertInstance: (instance) =>
    set((state) => {
      const idx = state.instances.findIndex((i) => i.id === instance.id)
      if (idx >= 0) {
        const updated = [...state.instances]
        updated[idx] = instance
        return { instances: updated }
      }
      return { instances: [instance, ...state.instances] }
    }),

  removeInstance: (id) =>
    set((state) => ({ instances: state.instances.filter((i) => i.id !== id) })),

  setFederatedMaterials: (materials) => set({ federatedMaterials: materials }),

  setActivityLog: (log) => set({ activityLog: log }),

  prependActivity: (activity) =>
    set((state) => ({ activityLog: [activity, ...state.activityLog.slice(0, 99)] })),
}))
