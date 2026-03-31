"use client";

import { useEffect } from "react";
import {
  useAccessibleBranches,
  useAccessibleBusinesses,
  useAccessibleRegisters,
} from "@/features/context/hooks";
import { useCurrentBusiness } from "@/hooks/use-current-business";

export function OperatingSelector() {
  const {
    business_id,
    branch_id,
    register_id,
    setBusinessId,
    setBranchId,
    setRegisterId,
  } = useCurrentBusiness();
  const businessesQuery = useAccessibleBusinesses();
  const branchesQuery = useAccessibleBranches(business_id);
  const registersQuery = useAccessibleRegisters(business_id, branch_id);

  useEffect(() => {
    const businesses = businessesQuery.data ?? [];

    if (businesses.length === 0) {
      return;
    }

    if (!business_id && businesses.length === 1) {
      setBusinessId(businesses[0]!.id);
      return;
    }

    if (business_id && !businesses.some((business) => business.id === business_id)) {
      setBusinessId(businesses.length === 1 ? businesses[0]!.id : "");
    }
  }, [business_id, businessesQuery.data, setBusinessId]);

  useEffect(() => {
    const branches = branchesQuery.data ?? [];

    if (!business_id || branches.length === 0) {
      return;
    }

    if (!branch_id && branches.length === 1) {
      setBranchId(branches[0]!.id);
      return;
    }

    if (branch_id && !branches.some((branch) => branch.id === branch_id)) {
      setBranchId(branches.length === 1 ? branches[0]!.id : "");
    }
  }, [branch_id, branchesQuery.data, business_id, setBranchId]);

  useEffect(() => {
    const registers = registersQuery.data ?? [];

    if (!business_id || !branch_id || registers.length === 0) {
      return;
    }

    if (!register_id && registers.length === 1) {
      setRegisterId(registers[0]!.id);
      return;
    }

    if (
      register_id &&
      !registers.some((register) => register.id === register_id)
    ) {
      setRegisterId(registers.length === 1 ? registers[0]!.id : "");
    }
  }, [branch_id, business_id, register_id, registersQuery.data, setRegisterId]);

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
        <span className="uppercase tracking-[0.2em]">Negocio</span>
        <select
          className="ui-select"
          value={business_id ?? ""}
          onChange={(event) => setBusinessId(event.target.value)}
          disabled={businessesQuery.isLoading}
        >
          <option value="">Selecciona negocio</option>
          {businessesQuery.data?.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
        <span className="uppercase tracking-[0.2em]">Sucursal</span>
        <select
          className="ui-select"
          value={branch_id ?? ""}
          onChange={(event) => setBranchId(event.target.value)}
          disabled={!business_id || branchesQuery.isLoading}
        >
          <option value="">Selecciona sucursal</option>
          {branchesQuery.data?.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
        <span className="uppercase tracking-[0.2em]">Caja</span>
        <select
          className="ui-select"
          value={register_id ?? ""}
          onChange={(event) => setRegisterId(event.target.value)}
          disabled={!business_id || !branch_id || registersQuery.isLoading}
        >
          <option value="">Selecciona caja</option>
          {registersQuery.data?.map((register) => (
            <option key={register.id} value={register.id}>
              {register.name ?? register.code ?? "Caja"}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
