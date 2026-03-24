import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { showSnackbar } from "../store/slices/uiSlice";
import { apiUtils } from "../services/api";

// Generic hook for API calls
export const useApi = (apiFunction, initialData = null, dependencies = []) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFunction(...args);
      setData(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = apiUtils.formatError(err);
      setError(errorMessage);
      dispatch(
        showSnackbar({
          message: errorMessage,
          severity: "error",
        })
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, dependencies);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
  }, [initialData]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    setData,
  };
};

// Hook for paginated data
export const usePaginatedApi = (apiFunction, initialParams = {}) => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);
  const dispatch = useDispatch();

  const fetchData = useCallback(
    async (newParams = {}) => {
      try {
        setLoading(true);
        setError(null);

        const requestParams = { ...params, ...newParams };
        const response = await apiFunction(requestParams);

        if (response.data.data) {
          setData(response.data.data);
          setPagination(response.data.pagination);
        } else {
          setData(response.data);
        }

        return response.data;
      } catch (err) {
        const errorMessage = apiUtils.formatError(err);
        setError(errorMessage);
        dispatch(
          showSnackbar({
            message: errorMessage,
            severity: "error",
          })
        );
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, params, dispatch]
  );

  const updateParams = useCallback((newParams) => {
    setParams((prev) => ({ ...prev, ...newParams }));
  }, []);

  const nextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      updateParams({ page: pagination.page + 1 });
    }
  }, [pagination.page, pagination.totalPages, updateParams]);

  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      updateParams({ page: pagination.page - 1 });
    }
  }, [pagination.page, updateParams]);

  const goToPage = useCallback(
    (page) => {
      if (page >= 1 && page <= pagination.totalPages) {
        updateParams({ page });
      }
    },
    [pagination.totalPages, updateParams]
  );

  const changePageSize = useCallback(
    (limit) => {
      updateParams({ limit, page: 1 });
    },
    [updateParams]
  );

  useEffect(() => {
    fetchData();
  }, [params]);

  return {
    data,
    pagination,
    loading,
    error,
    params,
    fetchData,
    updateParams,
    nextPage,
    prevPage,
    goToPage,
    changePageSize,
    refresh: () => fetchData(params),
  };
};

// Hook for CRUD operations
export const useCrud = (apiService, entityName = "item") => {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState({
    create: false,
    update: false,
    delete: false,
  });

  const create = useCallback(
    async (data) => {
      try {
        setLoading((prev) => ({ ...prev, create: true }));
        const response = await apiService.create(data);
        dispatch(
          showSnackbar({
            message: `${entityName} created successfully`,
            severity: "success",
          })
        );
        return response.data;
      } catch (err) {
        const errorMessage = apiUtils.formatError(err);
        dispatch(
          showSnackbar({
            message: `Failed to create ${entityName}: ${errorMessage}`,
            severity: "error",
          })
        );
        throw err;
      } finally {
        setLoading((prev) => ({ ...prev, create: false }));
      }
    },
    [apiService, entityName, dispatch]
  );

  const update = useCallback(
    async (id, data) => {
      try {
        setLoading((prev) => ({ ...prev, update: true }));
        const response = await apiService.update(id, data);
        dispatch(
          showSnackbar({
            message: `${entityName} updated successfully`,
            severity: "success",
          })
        );
        return response.data;
      } catch (err) {
        const errorMessage = apiUtils.formatError(err);
        dispatch(
          showSnackbar({
            message: `Failed to update ${entityName}: ${errorMessage}`,
            severity: "error",
          })
        );
        throw err;
      } finally {
        setLoading((prev) => ({ ...prev, update: false }));
      }
    },
    [apiService, entityName, dispatch]
  );

  const remove = useCallback(
    async (id) => {
      try {
        setLoading((prev) => ({ ...prev, delete: true }));
        await apiService.delete(id);
        dispatch(
          showSnackbar({
            message: `${entityName} deleted successfully`,
            severity: "success",
          })
        );
        return true;
      } catch (err) {
        const errorMessage = apiUtils.formatError(err);
        dispatch(
          showSnackbar({
            message: `Failed to delete ${entityName}: ${errorMessage}`,
            severity: "error",
          })
        );
        throw err;
      } finally {
        setLoading((prev) => ({ ...prev, delete: false }));
      }
    },
    [apiService, entityName, dispatch]
  );

  return {
    create,
    update,
    remove,
    loading,
  };
};

// Hook for file downloads
export const useDownload = () => {
  const [downloading, setDownloading] = useState(false);
  const dispatch = useDispatch();

  const download = useCallback(
    async (apiFunction, filename, ...args) => {
      try {
        setDownloading(true);
        const response = await apiFunction(...args);
        apiUtils.downloadFile(response.data, filename);
        dispatch(
          showSnackbar({
            message: "File downloaded successfully",
            severity: "success",
          })
        );
      } catch (err) {
        const errorMessage = apiUtils.formatError(err);
        dispatch(
          showSnackbar({
            message: `Download failed: ${errorMessage}`,
            severity: "error",
          })
        );
        throw err;
      } finally {
        setDownloading(false);
      }
    },
    [dispatch]
  );

  return { download, downloading };
};

// Hook for real-time data with polling
export const usePolling = (
  apiFunction,
  interval = 30000,
  dependencies = []
) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  const fetchData = useCallback(async () => {
    if (!localStorage.getItem("adminToken")) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await apiFunction();
      setData(response.data);
    } catch (err) {
      setError(apiUtils.formatError(err));
    } finally {
      setLoading(false);
    }
  }, dependencies);

  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  useEffect(() => {
    fetchData(); // Initial fetch

    if (isPolling) {
      const intervalId = setInterval(fetchData, interval);
      return () => clearInterval(intervalId);
    }
  }, [fetchData, isPolling, interval]);

  return {
    data,
    loading,
    error,
    isPolling,
    startPolling,
    stopPolling,
    refresh: fetchData,
  };
};

export default useApi;
