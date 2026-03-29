import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type {
  CreateInventoryBrandPayload,
  CreateInventoryCategoryPayload,
  CreateInventoryEntryPayload,
  CreateInventoryEntryResponse,
  CreateInventoryLocationPayload,
  CreateInventoryProductPayload,
  CreateInventorySupplierPayload,
  CreateInventoryTaxRatePayload,
  DeactivateInventoryProductPayload,
  InventoryAlert,
  InventoryCatalogOption,
  InventoryCatalogs,
  InventoryLocation,
  InventoryLocationOption,
  InventoryMovement,
  InventoryProductDetail,
  InventoryProductListItem,
  InventorySupplierOption,
  InventoryTaxRateOption,
  InventoryTransferPayload,
  InventoryTransferResponse,
  ProductStock,
  SetInventoryLocationActivePayload,
  StockAdjustmentPayload,
  UpdateInventoryLocationPayload,
  UpdateInventoryProductPayload,
} from "./types";

type ApiProductStockLocation = {
  location_id: string;
  location_name: string;
  location_code: string;
  is_default: boolean;
  is_active: boolean;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
};

type ApiProductStock = {
  product_id: string;
  product_name: string;
  track_inventory: boolean;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  location_id: string | null;
  total_quantity?: number;
  total_reserved_quantity?: number;
  total_available_quantity?: number;
  default_location_id?: string | null;
  default_location_name?: string | null;
  locations: ApiProductStockLocation[];
};

type ApiInventoryTransferResponse = {
  transfer_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  from_location_id: string;
  from_location_name: string;
  to_location_id: string;
  to_location_name: string;
  notes: string;
  created_at: string;
};

export const getDefaultInventoryLocation = (params: {
  business_id: string;
  branch_id: string;
}) =>
  apiRequest<InventoryLocation>(apiEndpoints.inventoryDefaultLocation, {
    query: params,
  });

export const listInventoryLocations = (params: {
  business_id: string;
  branch_id: string;
  include_inactive?: boolean;
}) =>
  apiRequest<InventoryLocationOption[]>(apiEndpoints.inventoryLocations, {
    query: params,
  });

export const createInventoryLocation = (
  payload: CreateInventoryLocationPayload,
) =>
  apiRequest<InventoryLocationOption>(apiEndpoints.inventoryLocations, {
    method: "POST",
    body: payload,
  });

export const updateInventoryLocation = (
  locationId: string,
  payload: UpdateInventoryLocationPayload,
) =>
  apiRequest<InventoryLocationOption>(
    apiEndpoints.inventoryLocationDetail(locationId),
    {
      method: "PATCH",
      body: payload,
    },
  );

export const deactivateInventoryLocation = (
  locationId: string,
  payload: SetInventoryLocationActivePayload,
) =>
  apiRequest<InventoryLocationOption>(
    apiEndpoints.inventoryLocationDeactivate(locationId),
    {
      method: "POST",
      body: payload,
    },
  );

export const reactivateInventoryLocation = (
  locationId: string,
  payload: SetInventoryLocationActivePayload,
) =>
  apiRequest<InventoryLocationOption>(
    apiEndpoints.inventoryLocationReactivate(locationId),
    {
      method: "POST",
      body: payload,
    },
  );

export const listInventoryProducts = (params: {
  business_id: string;
  branch_id: string;
  query?: string;
  include_inactive?: boolean;
}) =>
  apiRequest<InventoryProductListItem[]>(apiEndpoints.inventoryProductsList, {
    query: params,
  });

export const getInventoryProductDetail = (
  productId: string,
  params: {
    business_id: string;
    branch_id: string;
  },
) =>
  apiRequest<InventoryProductDetail>(
    apiEndpoints.inventoryProductDetail(productId),
    {
      query: params,
    },
  );

export const getInventoryProductMovements = (
  productId: string,
  params: {
    business_id: string;
    branch_id: string;
    limit?: number;
  },
) =>
  apiRequest<InventoryMovement[]>(
    apiEndpoints.inventoryProductMovements(productId),
    {
      query: params,
    },
  );

export const listInventoryMovements = (params: {
  business_id: string;
  branch_id: string;
  product_id?: string;
  location_id?: string;
  movement_type?: string;
  limit?: number;
}) =>
  apiRequest<InventoryMovement[]>(apiEndpoints.inventoryMovements, {
    query: params,
  });

export const createInventoryProduct = (
  payload: CreateInventoryProductPayload,
) =>
  apiRequest<{
    product_id: string;
    name: string;
    sku: string;
    initial_stock: number;
  }>(apiEndpoints.inventoryCreateProduct, {
    method: "POST",
    body: payload,
  });

export const updateInventoryProduct = (
  productId: string,
  payload: UpdateInventoryProductPayload,
) =>
  apiRequest<InventoryProductDetail>(
    apiEndpoints.inventoryUpdateProduct(productId),
    {
      method: "POST",
      body: payload,
    },
  );

export const deactivateInventoryProduct = (
  productId: string,
  payload: DeactivateInventoryProductPayload,
) =>
  apiRequest<{
    product_id: string;
    name: string;
    is_active: boolean;
  }>(apiEndpoints.inventoryDeactivateProduct(productId), {
    method: "POST",
    body: payload,
  });

export const reactivateInventoryProduct = (
  productId: string,
  payload: DeactivateInventoryProductPayload,
) =>
  apiRequest<{
    product_id: string;
    name: string;
    is_active: boolean;
  }>(apiEndpoints.inventoryReactivateProduct(productId), {
    method: "POST",
    body: payload,
  });

export const getProductStock = (
  productId: string,
  params: {
    business_id: string;
    branch_id: string;
    location_id?: string;
  },
) =>
  apiRequest<ApiProductStock>(apiEndpoints.inventoryProductStock(productId), {
    query: params,
  }).then<ProductStock>((response) => ({
    ...response,
    locations: response.locations.map((location) => ({
      locationId: location.location_id,
      locationName: location.location_name,
      locationCode: location.location_code,
      isDefault: location.is_default,
      isActive: location.is_active,
      quantity: location.quantity,
      reservedQuantity: location.reserved_quantity,
      availableQuantity: location.available_quantity,
    })),
  }));

export const createStockAdjustment = (payload: StockAdjustmentPayload) =>
  apiRequest<{
    product_id: string;
    previous_quantity: number;
    new_quantity: number;
    difference: number;
  }>(apiEndpoints.inventoryStockAdjustments, {
    method: "POST",
    body: payload,
  });

export const createInventoryTransfer = (payload: InventoryTransferPayload) =>
  apiRequest<ApiInventoryTransferResponse>(apiEndpoints.inventoryTransfers, {
    method: "POST",
    body: payload,
  }).then<InventoryTransferResponse>((response) => ({
    transferId: response.transfer_id,
    productId: response.product_id,
    productName: response.product_name,
    quantity: response.quantity,
    fromLocationId: response.from_location_id,
    fromLocationName: response.from_location_name,
    toLocationId: response.to_location_id,
    toLocationName: response.to_location_name,
    notes: response.notes,
    createdAt: response.created_at,
  }));

export const getInventoryCatalogs = (params: {
  business_id: string;
  branch_id: string;
}) =>
  apiRequest<InventoryCatalogs>(apiEndpoints.inventoryCatalogs, {
    query: params,
  });

export const listInventoryAlerts = (params: {
  business_id: string;
  branch_id: string;
  status?: string;
}) =>
  apiRequest<InventoryAlert[]>(apiEndpoints.inventoryAlerts, {
    query: params,
  });

export const resolveInventoryAlert = (
  alertId: string,
  payload: { business_id: string; branch_id: string },
) =>
  apiRequest<InventoryAlert>(apiEndpoints.inventoryAlertResolve(alertId), {
    method: "POST",
    body: payload,
  });

export const dismissInventoryAlert = (
  alertId: string,
  payload: { business_id: string; branch_id: string },
) =>
  apiRequest<InventoryAlert>(apiEndpoints.inventoryAlertDismiss(alertId), {
    method: "POST",
    body: payload,
  });

export const createInventoryCategory = (
  payload: CreateInventoryCategoryPayload,
) =>
  apiRequest<InventoryCatalogOption>(apiEndpoints.inventoryCreateCategory, {
    method: "POST",
    body: payload,
  });

export const createInventoryBrand = (payload: CreateInventoryBrandPayload) =>
  apiRequest<InventoryCatalogOption>(apiEndpoints.inventoryCreateBrand, {
    method: "POST",
    body: payload,
  });

export const createInventoryTaxRate = (
  payload: CreateInventoryTaxRatePayload,
) =>
  apiRequest<InventoryTaxRateOption>(apiEndpoints.inventoryCreateTaxRate, {
    method: "POST",
    body: payload,
  });

export const createInventorySupplier = (
  payload: CreateInventorySupplierPayload,
) =>
  apiRequest<InventorySupplierOption>(apiEndpoints.inventoryCreateSupplier, {
    method: "POST",
    body: payload,
  });

export const createInventoryEntry = (payload: CreateInventoryEntryPayload) =>
  apiRequest<CreateInventoryEntryResponse>(apiEndpoints.inventoryEntries, {
    method: "POST",
    body: payload,
  });
