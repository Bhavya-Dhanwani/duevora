import api from "../../../lib/api";

export const reportsApi = {
  trialBalance: async (params) => {
    const response = await api.get("/reports/trial-balance", { params });
    return response.data;
  },

  profitLoss: async (params) => {
    const response = await api.get("/reports/profit-loss", { params });
    return response.data;
  },

  balanceSheet: async (params) => {
    const response = await api.get("/reports/balance-sheet", { params });
    return response.data;
  },

  cashFlow: async (params) => {
    const response = await api.get("/reports/cash-flow", { params });
    return response.data;
  },

  ratios: async (params) => {
    const response = await api.get("/reports/ratios", { params });
    return response.data;
  },
};
